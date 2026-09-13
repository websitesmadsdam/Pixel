import { Adjustments, FilterType, TextOverlay, Watermark, CropArea } from '../types';

/**
 * Cache af indlæste vandmærke-billeder, så drawImageWithState kan tegne dem
 * synkront. Uden cachen ville hver gentegning starte en ny indlæsning, og
 * vandmærket ville nå at blive sprunget over, før billedet var klar.
 */
const watermarkCache = new Map<string, HTMLImageElement>();

function isReady(img: HTMLImageElement | undefined): img is HTMLImageElement {
  return !!img && img.complete && img.naturalWidth > 0;
}

/**
 * Indlæser vandmærke-billeder og lægger dem i cachen. Kald denne og afvent den,
 * før du tegner — både i preview og ved eksport.
 */
export function preloadWatermarks(urls: string[]): Promise<void> {
  return Promise.all(
    urls.map((url) => {
      if (isReady(watermarkCache.get(url))) return Promise.resolve();

      const img = new Image();
      img.crossOrigin = 'anonymous';
      const loaded = new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // en ødelagt URL må ikke blokere tegningen
      });
      img.src = url;
      watermarkCache.set(url, img);
      return loaded;
    }),
  ).then(() => undefined);
}

/**
 * Applies a sharpening convolution kernel to imageData.
 */
export function sharpenImageData(imageData: ImageData, amount: number): ImageData {
  if (amount <= 0) return imageData;

  const w = imageData.width;
  const h = imageData.height;
  const src = imageData.data;
  const dst = new Uint8ClampedArray(src.length);

  // Copy edge pixels
  dst.set(src);

  // Sharpening kernel:
  // [ 0, -1,  0 ]
  // [-1,  5, -1 ]
  // [ 0, -1,  0 ]
  // We can interpolate between original and fully sharpened based on amount (0 to 1)
  const factor = amount / 100;
  const a = -factor;
  const b = 1 + 4 * factor;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      for (let c = 0; c < 3; c++) { // R, G, B
        const top = ((y - 1) * w + x) * 4 + c;
        const left = (y * w + (x - 1)) * 4 + c;
        const center = idx + c;
        const right = (y * w + (x + 1)) * 4 + c;
        const bottom = ((y + 1) * w + x) * 4 + c;

        const val = src[center] * b + (src[top] + src[left] + src[right] + src[bottom]) * a;
        dst[center] = Math.min(255, Math.max(0, val));
      }
      // Keep alpha original
      dst[idx + 3] = src[idx + 3];
    }
  }

  return new ImageData(dst, w, h);
}

/**
 * Creates transparent pixels by removing the background.
 * Uses a corner-based background color analysis with a threshold and feathering.
 * It also detects a "center subject" safe zone to prevent the main subject from disappearing.
 */
export function removeBackgroundAlpha(imageData: ImageData, threshold: number = 30): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;
  const result = new Uint8ClampedArray(data.length);
  result.set(data);

  // Sample the four corners to get the dominant background colors
  const corners = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1]
  ];

  const bgColors: [number, number, number][] = [];
  corners.forEach(([cx, cy]) => {
    const idx = (cy * w + cx) * 4;
    bgColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  });

  // Calculate distances for each pixel to the closest background color
  // Protect the center 50% width and 60% height of the image (subject area)
  const centerX = w / 2;
  const centerY = h / 2;
  const safeRadiusX = w * 0.28;
  const safeRadiusY = h * 0.35;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      // Distance from center
      const dx = (x - centerX) / safeRadiusX;
      const dy = (y - centerY) / safeRadiusY;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);

      // Subject protection factor (0 = full subject protection, 1 = background)
      const subjectProtection = Math.max(0, Math.min(1, (distFromCenter - 0.7) * 2));

      // Calculate minimum color distance to any corner color
      let minColorDist = 765; // Max 3 * 255
      for (const [br, bg, bb] of bgColors) {
        const dR = data[idx] - br;
        const dG = data[idx + 1] - bg;
        const dB = data[idx + 2] - bb;
        // Euclidean-like distance
        const dist = Math.sqrt(dR * dR + dG * dG + dB * dB);
        if (dist < minColorDist) {
          minColorDist = dist;
        }
      }

      // If close to background color and not deep inside the protected center subject zone
      const adjustedThreshold = threshold * (1 + (1 - subjectProtection) * 0.5);
      if (minColorDist < adjustedThreshold) {
        // Linear transparency ramp (feathering)
        const alphaFactor = Math.max(0, Math.min(1, minColorDist / adjustedThreshold));
        const finalAlpha = Math.round(data[idx + 3] * alphaFactor * subjectProtection);
        result[idx + 3] = finalAlpha;
      }
    }
  }

  return new ImageData(result, w, h);
}

/**
 * Oversætter et udsnit markeret på det viste (roterede/spejlvendte) billede til
 * kildebilledets eget koordinatsystem.
 *
 * Beskæringsrammen tegnes oven på preview'et, mens `ImageState.crop` er procenter
 * af kilden. Uden denne oversættelse rammer udsnittet et andet sted end markeret,
 * så snart billedet er roteret eller spejlvendt.
 *
 * Begge rum er normaliserede enhedskvadrater, så lærredets bredde og højde går ud
 * med hinanden i regnestykket og indgår ikke.
 */
export function displayCropToSourceCrop(
  displayCrop: CropArea,
  rotation: number,
  flipHorizontal: boolean,
  flipVertical: boolean,
): CropArea {
  const step = (((Math.round(rotation / 90) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
  const cos = [1, 0, -1, 0][step];
  const sin = [0, 1, 0, -1][step];
  const signH = flipHorizontal ? -1 : 1;
  const signV = flipVertical ? -1 : 1;

  const corners: Array<[number, number]> = [
    [displayCrop.x, displayCrop.y],
    [displayCrop.x + displayCrop.width, displayCrop.y],
    [displayCrop.x, displayCrop.y + displayCrop.height],
    [displayCrop.x + displayCrop.width, displayCrop.y + displayCrop.height],
  ];

  const us: number[] = [];
  const vs: number[] = [];

  for (const [px, py] of corners) {
    // Centrér om (0,0) og ophæv spejlvendingen
    const a = signH * (px / 100 - 0.5);
    const b = signV * (py / 100 - 0.5);
    // Ophæv rotationen
    us.push(a * cos + b * sin + 0.5);
    vs.push(-a * sin + b * cos + 0.5);
  }

  const clamp = (n: number) => Math.max(0, Math.min(100, n * 100));
  const x = clamp(Math.min(...us));
  const y = clamp(Math.min(...vs));

  return {
    x,
    y,
    width: clamp(Math.max(...us)) - x,
    height: clamp(Math.max(...vs)) - y,
  };
}

/**
 * Builds the CSS-compliant filter string for canvas 2D context.
 * `scale` er lærredets pixels pr. billedpixel — sløring er i pixels og skal
 * skalere med, ellers ser den kraftigere ud i det nedskalerede preview.
 */
export function getFilterString(adjustments: Adjustments, filter: FilterType, scale: number = 1): string {
  const parts: string[] = [];

  // Core adjustments
  if (adjustments.brightness !== 100) {
    parts.push(`brightness(${adjustments.brightness}%)`);
  }
  if (adjustments.contrast !== 100) {
    parts.push(`contrast(${adjustments.contrast}%)`);
  }
  if (adjustments.saturation !== 100) {
    parts.push(`saturate(${adjustments.saturation}%)`);
  }
  if (adjustments.blur > 0) {
    parts.push(`blur(${adjustments.blur * 0.15 * scale}px)`);
  }

  // Built-in presets
  switch (filter) {
    case 'mono':
      parts.push('grayscale(100%) contrast(125%)');
      break;
    case 'sepia':
      parts.push('sepia(100%) brightness(95%) contrast(95%)');
      break;
    case 'faded':
      parts.push('brightness(102%) contrast(85%) saturate(80%)');
      break;
    case 'pop':
      parts.push('saturate(145%) contrast(110%)');
      break;
  }

  return parts.join(' ') || 'none';
}

/**
 * Største lærred i pixels, som Safari på iPhone/iPad kan tegne (4096 × 4096). Over
 * grænsen giver WebKit et tomt lærred uden fejl — og alle browsere på iOS bruger
 * WebKit. Andre platforme har grænser langt over, hvad appen realistisk bruger.
 */
export const IOS_MAX_CANVAS_PIXELS = 16_777_216;

export function getMaxCanvasPixels(): number {
  const ua = navigator.userAgent;
  // iPadOS udgiver sig for at være en Mac, men har touch
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return isIOS ? IOS_MAX_CANVAS_PIXELS : Infinity;
}

/**
 * Eksportens skala: fuld opløsning, dobbelt ved "Dobbelt opløsning (2×)" — men
 * aldrig større, end enheden kan tegne. Et 48 MP-foto eller et 12 MP-foto med 2×
 * ville ellers give en tom fil på iPhone.
 */
export function getExportScale(
  state: { upscale2x: boolean; width: number; height: number },
  maxPixels: number = getMaxCanvasPixels(),
): number {
  const wanted = state.upscale2x ? 2 : 1;
  // 0,1 % margin, så afrunding af bredde og højde ikke skubber over grænsen
  const fit = Math.sqrt(maxPixels / (state.width * state.height)) * 0.999;
  return Math.min(wanted, fit);
}

/**
 * Preview'ets skala: så få pixels som skærmen kan vise, aldrig mere end fuld
 * opløsning. Et 24 MP-billede med skarphed og baggrundsfjernelse tager ~1,7 s at
 * tegne i fuld opløsning, men ~0,1 s i 1600 px (målt 13-09-2026).
 */
export function getPreviewScale(
  state: { width: number; height: number },
  displayWidth: number,
  displayHeight: number,
  devicePixelRatio: number,
): number {
  const fit = Math.max(
    (displayWidth * devicePixelRatio) / state.width,
    (displayHeight * devicePixelRatio) / state.height,
  );
  return Math.min(1, fit);
}

/**
 * Renders an editing state onto a target canvas.
 *
 * `scale` er lærredets pixels pr. pixel i `state.width`/`state.height`. Alt, der
 * måles i pixels (tekststørrelse, sløring), ganges med den, så preview og eksport
 * ser ens ud. Brug `getExportScale()` ved eksport og `getPreviewScale()` i preview.
 */
export function drawImageWithState(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  state: {
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
    crop: CropArea | null;
    adjustments: Adjustments;
    filter: FilterType;
    texts: TextOverlay[];
    watermarks: Watermark[];
    backgroundRemoved: boolean;
    upscale2x: boolean;
    width: number;
    height: number;
    cornerRadius: number;
  },
  scale: number = 1,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Determine base canvas dimensions
  const renderWidth = Math.max(1, Math.round(state.width * scale));
  const renderHeight = Math.max(1, Math.round(state.height * scale));

  canvas.width = renderWidth;
  canvas.height = renderHeight;

  ctx.clearRect(0, 0, renderWidth, renderHeight);

  // 2. Set up context transforms (rotation/flip)
  ctx.save();

  // Draw centered
  ctx.translate(renderWidth / 2, renderHeight / 2);

  if (state.flipHorizontal) {
    ctx.scale(-1, 1);
  }
  if (state.flipVertical) {
    ctx.scale(1, -1);
  }

  const rad = (state.rotation * Math.PI) / 180;
  ctx.rotate(rad);

  // Swap width/height back for drawing coordinates if rotated 90 or 270 deg
  const isRotated90or270 = state.rotation === 90 || state.rotation === 270;
  const drawWidth = isRotated90or270 ? renderHeight : renderWidth;
  const drawHeight = isRotated90or270 ? renderWidth : renderHeight;

  // 3. Set CSS filters
  ctx.filter = getFilterString(state.adjustments, state.filter, scale);

  // 4. Draw image (including cropping coordinates if active)
  if (state.crop) {
    // Percent coordinates on the original image
    const sourceX = (state.crop.x / 100) * image.naturalWidth;
    const sourceY = (state.crop.y / 100) * image.naturalHeight;
    const sourceW = (state.crop.width / 100) * image.naturalWidth;
    const sourceH = (state.crop.height / 100) * image.naturalHeight;

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
  } else {
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
  }

  ctx.restore();

  // 5. Apply pixel-level canvas effects (Sharpness, Background Removal)
  if (state.adjustments.sharpness > 0 || state.backgroundRemoved) {
    try {
      let imgData = ctx.getImageData(0, 0, renderWidth, renderHeight);

      if (state.backgroundRemoved) {
        // Auto remove background based on background similarity
        imgData = removeBackgroundAlpha(imgData, 45);
      }

      if (state.adjustments.sharpness > 0) {
        imgData = sharpenImageData(imgData, state.adjustments.sharpness);
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn("Could not execute pixel-level canvas filter (CORS or canvas tainted):", e);
    }
  }

  // 6. Warmth overlay
  if (state.adjustments.warmth !== 0) {
    ctx.save();
    ctx.globalCompositeOperation = state.adjustments.warmth > 0 ? 'color' : 'difference';
    // Draw an amber tone for warmth, or a blue tone for cool
    const opacity = Math.abs(state.adjustments.warmth) / 300; // max 0.33 opacity
    if (state.adjustments.warmth > 0) {
      ctx.fillStyle = `rgba(255, 140, 0, ${opacity})`;
    } else {
      ctx.fillStyle = `rgba(0, 100, 255, ${opacity})`;
    }
    ctx.fillRect(0, 0, renderWidth, renderHeight);
    ctx.restore();
  }

  // 7. Vignette effect
  if (state.adjustments.vignette > 0) {
    ctx.save();
    const cx = renderWidth / 2;
    const cy = renderHeight / 2;
    const outerRadius = Math.sqrt(cx * cx + cy * cy);
    const grad = ctx.createRadialGradient(cx, cy, outerRadius * 0.4, cx, cy, outerRadius);

    const vignetteIntensity = state.adjustments.vignette / 110; // max ~0.9 opacity at corners
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${vignetteIntensity})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, renderWidth, renderHeight);
    ctx.restore();
  }

  // 8. Draw watermarks
  state.watermarks.forEach((watermark) => {
    // Hentes fra cachen — kald preloadWatermarks() før tegning
    const wmImg = watermarkCache.get(watermark.imageUrl);
    if (!isReady(wmImg)) return;

    ctx.save();
    ctx.globalAlpha = watermark.opacity;
    const wmWidth = (watermark.width / 100) * renderWidth;
    const wmHeight = (wmImg.naturalHeight / wmImg.naturalWidth) * wmWidth;
    const wmx = (watermark.x / 100) * renderWidth - wmWidth / 2;
    const wmy = (watermark.y / 100) * renderHeight - wmHeight / 2;
    ctx.drawImage(wmImg, wmx, wmy, wmWidth, wmHeight);
    ctx.restore();
  });

  // 9. Draw text overlays
  state.texts.forEach((text) => {
    ctx.save();
    ctx.globalAlpha = text.opacity;
    
    // text.fontSize er i billedpixels; lærredet kan være skaleret op eller ned
    const proportionalFontSize = text.fontSize * scale;

    ctx.font = `bold ${proportionalFontSize}px ${text.fontFamily || 'sans-serif'}`;
    ctx.fillStyle = text.color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const tx = (text.x / 100) * renderWidth;
    const ty = (text.y / 100) * renderHeight;

    ctx.fillText(text.text, tx, ty);
    ctx.restore();
  });

  // 10. Corner rounding mask (globalCompositeOperation 'destination-in' trims everything outside)
  if (state.cornerRadius && state.cornerRadius > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = '#000000';
    
    const minDim = Math.min(renderWidth, renderHeight);
    const r = (state.cornerRadius / 100) * minDim;
    
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(renderWidth, 0, renderWidth, renderHeight, r);
    ctx.arcTo(renderWidth, renderHeight, 0, renderHeight, r);
    ctx.arcTo(0, renderHeight, 0, 0, r);
    ctx.arcTo(0, 0, renderWidth, 0, r);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}
