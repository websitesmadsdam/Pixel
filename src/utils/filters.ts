import { Adjustments, FilterType, TextOverlay, Watermark, CropArea } from '../types';

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
 * Builds the CSS-compliant filter string for canvas 2D context.
 */
export function getFilterString(adjustments: Adjustments, filter: FilterType): string {
  let parts: string[] = [];

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
    parts.push(`blur(${adjustments.blur * 0.15}px)`);
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
 * Renders an editing state onto a target canvas.
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
  },
  // If true, renders at the full requested resolution. If false, fits in the layout
  isExporting: boolean = false
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Determine base canvas dimensions
  let renderWidth = state.width;
  let renderHeight = state.height;

  // If upscaling by 2x is active and we are exporting
  if (state.upscale2x && isExporting) {
    renderWidth *= 2;
    renderHeight *= 2;
  }

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
  ctx.filter = getFilterString(state.adjustments, state.filter);

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
    // watermarks have URL, opacity, width percent, x, y percentages
    const wmImg = new Image();
    wmImg.crossOrigin = 'anonymous';
    wmImg.src = watermark.imageUrl;
    if (wmImg.complete) {
      ctx.save();
      ctx.globalAlpha = watermark.opacity;
      const wmWidth = (watermark.width / 100) * renderWidth;
      const wmHeight = (wmImg.naturalHeight / wmImg.naturalWidth) * wmWidth;
      const wmx = (watermark.x / 100) * renderWidth - wmWidth / 2;
      const wmy = (watermark.y / 100) * renderHeight - wmHeight / 2;
      ctx.drawImage(wmImg, wmx, wmy, wmWidth, wmHeight);
      ctx.restore();
    }
  });

  // 9. Draw text overlays
  state.texts.forEach((text) => {
    ctx.save();
    ctx.globalAlpha = text.opacity;
    
    // Calculate font size proportional to original height if exporting, or keep scale
    const scaleFactor = isExporting ? (state.upscale2x ? 2 : 1) : 1;
    // But text.fontSize is set relative to viewport. Let's make sure it scales with canvas resolution!
    // We can save size as a percentage of height or absolute. Let's say text.fontSize is absolute at viewport, 
    // and we scale it proportionally to canvas size relative to some base, say 600px.
    const proportionalFontSize = text.fontSize * scaleFactor;

    ctx.font = `bold ${proportionalFontSize}px ${text.fontFamily || 'sans-serif'}`;
    ctx.fillStyle = text.color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const tx = (text.x / 100) * renderWidth;
    const ty = (text.y / 100) * renderHeight;

    ctx.fillText(text.text, tx, ty);
    ctx.restore();
  });
}
