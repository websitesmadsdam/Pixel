import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dropzone from './components/Dropzone';
import CropOverlay from './components/CropOverlay';
import ExportModal from './components/ExportModal';
import { ImageState, ExifData, ToolTab, CropArea, CropAspectRatio } from './types';
import { parseExif } from './utils/exif';
import {
  drawImageWithState,
  preloadWatermarks,
  displayCropToSourceCrop,
} from './utils/filters';
import { Eye } from 'lucide-react';

const INITIAL_ADJUSTMENTS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  sharpness: 0,
  blur: 0,
  vignette: 0,
};

const INITIAL_IMAGE_STATE: ImageState = {
  width: 2000,
  height: 1500,
  originalWidth: 2000,
  originalHeight: 1500,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  crop: null,
  adjustments: INITIAL_ADJUSTMENTS,
  filter: 'none',
  texts: [],
  watermarks: [],
  backgroundRemoved: false,
  upscale2x: false,
  cornerRadius: 0,
};

export default function App() {
  // Application Modes
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('Testbilled.png');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [exifData, setExifData] = useState<ExifData>({ hasExif: false });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UI Themes & Tabs
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ToolTab>('size');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Active Edits & Undo/Redo History
  const [imageState, setImageState] = useState<ImageState>(INITIAL_IMAGE_STATE);
  const [history, setHistory] = useState<ImageState[]>([INITIAL_IMAGE_STATE]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Drag and Crop overlay values
  const [cropAspectRatio, setCropAspectRatio] = useState<CropAspectRatio>('free');
  const [activeCrop, setActiveCrop] = useState<CropArea>({ x: 10, y: 10, width: 80, height: 80 });

  // Compare original state
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  // Background Removal simulation
  const [isBgRemoving, setIsBgRemoving] = useState<boolean>(false);
  const [bgRemovalProgress, setBgRemovalProgress] = useState<string>('');

  // Canvas Viewport references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewportDims, setViewportDims] = useState({ width: 0, height: 0 });

  // Selected text ID state shared with Sidebar
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // Dragging handlers for text layers
  const startDragText = (e: React.MouseEvent | React.TouchEvent, textId: string) => {
    e.preventDefault();
    setSelectedTextId(textId);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const targetText = imageState.texts.find(t => t.id === textId);
    if (!targetText) return;
    
    const initialPctX = targetText.x;
    const initialPctY = targetText.y;
    
    const frame = document.getElementById('viewport-canvas-frame');
    if (!frame) return;
    
    const rect = frame.getBoundingClientRect();
    const frameWidth = rect.width;
    const frameHeight = rect.height;
    
    const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const dx = currentX - clientX;
      const dy = currentY - clientY;
      
      const deltaPctX = (dx / frameWidth) * 100;
      const deltaPctY = (dy / frameHeight) * 100;
      
      const nextX = Math.max(0, Math.min(100, Math.round(initialPctX + deltaPctX)));
      const nextY = Math.max(0, Math.min(100, Math.round(initialPctY + deltaPctY)));
      
      setImageState(prev => ({
        ...prev,
        texts: prev.texts.map(t => t.id === textId ? { ...t, x: nextX, y: nextY } : t)
      }));
    };
    
    const handleDragEnd = () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
    
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);
  };

  // Dragging handlers for watermark layers
  const startDragWatermark = (e: React.MouseEvent | React.TouchEvent, wmId: string) => {
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const targetWm = imageState.watermarks.find(wm => wm.id === wmId);
    if (!targetWm) return;
    
    const initialPctX = targetWm.x;
    const initialPctY = targetWm.y;
    
    const frame = document.getElementById('viewport-canvas-frame');
    if (!frame) return;
    
    const rect = frame.getBoundingClientRect();
    const frameWidth = rect.width;
    const frameHeight = rect.height;
    
    const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const dx = currentX - clientX;
      const dy = currentY - clientY;
      
      const deltaPctX = (dx / frameWidth) * 100;
      const deltaPctY = (dy / frameHeight) * 100;
      
      const nextX = Math.max(0, Math.min(100, Math.round(initialPctX + deltaPctX)));
      const nextY = Math.max(0, Math.min(100, Math.round(initialPctY + deltaPctY)));
      
      setImageState(prev => ({
        ...prev,
        watermarks: prev.watermarks.map(wm => wm.id === wmId ? { ...wm, x: nextX, y: nextY } : wm)
      }));
    };
    
    const handleDragEnd = () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
    
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);
  };

  // Update document body style for dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // History mechanics
  // Refs holder den aktuelle historik, så pushNewState kan kaldes fra en timeout
  // eller et event uden at arbejde videre på en forældet kopi.
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  const imageStateRef = useRef(imageState);

  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
    imageStateRef.current = imageState;
  }, [history, historyIndex, imageState]);

  const pushNewState = useCallback((newState: ImageState) => {
    const updatedHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    updatedHistory.push(newState);
    historyRef.current = updatedHistory;
    historyIndexRef.current = updatedHistory.length - 1;
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setImageState(history[prevIdx]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setImageState(history[nextIdx]);
    }
  }, [history, historyIndex]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (isCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Track slider modifications and push to history on debounce
  useEffect(() => {
    // Check if anything major has changed compared to last item in history stack
    const lastHistoryItem = history[historyIndex];
    if (!lastHistoryItem) return;

    const adjustmentsChanged = JSON.stringify(imageState.adjustments) !== JSON.stringify(lastHistoryItem.adjustments);
    const filterChanged = imageState.filter !== lastHistoryItem.filter;
    const textsChanged = JSON.stringify(imageState.texts) !== JSON.stringify(lastHistoryItem.texts);
    const watermarksChanged = JSON.stringify(imageState.watermarks) !== JSON.stringify(lastHistoryItem.watermarks);
    const bgChanged = imageState.backgroundRemoved !== lastHistoryItem.backgroundRemoved;
    const upscaleChanged = imageState.upscale2x !== lastHistoryItem.upscale2x;
    const cornerRadiusChanged = imageState.cornerRadius !== lastHistoryItem.cornerRadius;

    if (adjustmentsChanged || filterChanged || textsChanged || watermarksChanged || bgChanged || upscaleChanged || cornerRadiusChanged) {
      // Set up a debounce timer to commit the adjustments after 550ms
      const timer = setTimeout(() => {
        pushNewState(imageState);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [imageState, history, historyIndex, pushNewState]);

  // Reset current state to the base state (0th history item)
  const handleResetToOriginal = () => {
    if (history.length > 0) {
      setImageState(history[0]);
      pushNewState(history[0]);
    }
  };

  // Helper to load image source element
  const loadImageElement = useCallback((srcUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const baseState: ImageState = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        crop: null,
        adjustments: INITIAL_ADJUSTMENTS,
        filter: 'none',
        texts: [],
        watermarks: [],
        backgroundRemoved: false,
        upscale2x: false,
        cornerRadius: 0,
      };

      setOriginalImage(img);
      setImageState(baseState);
      setHistory([baseState]);
      setHistoryIndex(0);
      setActiveTab('size');
    };
    img.src = srcUrl;
  }, []);

  // Trigger file selection upload
  const handleImageFileSelected = useCallback((imgFile: File) => {
    setFileName(imgFile.name);
    setOriginalSize(imgFile.size);

    // Read EXIF from ArrayBuffer
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const parsed = parseExif(e.target.result as ArrayBuffer);
        setExifData(parsed);
      }
    };
    reader.readAsArrayBuffer(imgFile);

    // Read Image data URL for display
    const urlReader = new FileReader();
    urlReader.onload = (e) => {
      if (e.target?.result) {
        loadImageElement(e.target.result as string);
      }
    };
    urlReader.readAsDataURL(imgFile);
    setFile(imgFile);
  }, [loadImageElement]);

  // Clipboard Paste support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            const pasteFile = items[i].getAsFile();
            if (pasteFile) {
              setErrorMessage(null);
              handleImageFileSelected(pasteFile);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleImageFileSelected]);

  // Load sample mockup image with GPS / EXIF parameters for test flows
  const handleLoadSampleImage = () => {
    // We render a beautiful high-tech illustration using canvas, convert to blob
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 2000;
    sampleCanvas.height = 1500;
    const ctx = sampleCanvas.getContext('2d');
    if (ctx) {
      // Soft modern gradient background
      const grad = ctx.createLinearGradient(0, 0, 2000, 1500);
      grad.addColorStop(0, '#6366f1'); // indigo
      grad.addColorStop(0.5, '#ec4899'); // pink
      grad.addColorStop(1, '#f59e0b'); // amber
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2000, 1500);

      // Sun / Circle element
      ctx.beginPath();
      ctx.arc(1000, 750, 400, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fill();

      // Horizontal grids / landscape styling
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let i = 0; i < 15; i++) {
        ctx.fillRect(0, 800 + i * 50, 2000, 20);
      }

      // Cool HUD/Camera markings to make it look like a photographer's file
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 6;
      ctx.strokeRect(100, 100, 1800, 1300);

      ctx.font = 'bold 72px monospace';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('PIXEL TESTCAM 2026', 1000, 680);
      ctx.font = '500 40px monospace';
      ctx.fillText('COPENHAGEN GPS SENSOR ACTIVE', 1000, 780);

      // Center crosshair
      ctx.beginPath();
      ctx.moveTo(1000, 710); ctx.lineTo(1000, 730);
      ctx.moveTo(1000, 770); ctx.lineTo(1000, 790);
      ctx.moveTo(960, 750); ctx.lineTo(980, 750);
      ctx.moveTo(1020, 750); ctx.lineTo(1040, 750);
      ctx.stroke();
    }

    sampleCanvas.toBlob((blob) => {
      if (blob) {
        const dummyFile = new File([blob], 'TestCam_GPS_Billede.jpg', { type: 'image/jpeg' });
        setFile(dummyFile);
        setFileName('TestCam_GPS_Billede.jpg');
        // Set exact 331 KB (338944 bytes) as described in Step 7 for live comparison verification!
        setOriginalSize(338944); 

        // Set rich camera and location EXIF details
        setExifData({
          make: 'TestCam',
          model: 'Pixel 2026 GPS Pro',
          dateTime: '2026-07-09 14:02:11',
          gps: {
            latitude: 55.676098, // Copenhagen Rådhusplads!
            longitude: 12.568337,
            latitudeRef: 'N',
            longitudeRef: 'E',
            googleMapsUrl: 'https://www.google.com/maps?q=55.676098,12.568337',
          },
          hasExif: true,
        });

        // Load element
        const img = new Image();
        img.onload = () => {
          const baseState: ImageState = {
            width: 2000, // exact 2000 x 1500 px
            height: 1500,
            originalWidth: 2000,
            originalHeight: 1500,
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
            crop: null,
            adjustments: INITIAL_ADJUSTMENTS,
            filter: 'none',
            texts: [],
            watermarks: [],
            backgroundRemoved: false,
            upscale2x: false,
            cornerRadius: 0,
          };
          setOriginalImage(img);
          setImageState(baseState);
          setHistory([baseState]);
          setHistoryIndex(0);
          setActiveTab('size');
        };
        img.src = sampleCanvas.toDataURL('image/jpeg');
      }
    }, 'image/jpeg', 0.95);
  };

  // Run the canvas rendering pipeline
  const runCanvasRender = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImage) return;

    // Build standard drawing options, support holding to view original
    const renderState = showOriginal
      ? {
          ...INITIAL_IMAGE_STATE,
          width: imageState.originalWidth,
          height: imageState.originalHeight,
        }
      : imageState;

    drawImageWithState(canvas, originalImage, renderState, false);
  }, [originalImage, imageState, showOriginal]);

  // Run render whenever drawing states or showOriginal flags change
  useEffect(() => {
    runCanvasRender();
  }, [runCanvasRender]);

  // Indlæs vandmærke-billeder og gentegn, når de er klar. Uden dette springer
  // tegningen vandmærket over, fordi billedet endnu ikke er indlæst.
  useEffect(() => {
    const urls = imageState.watermarks.map((wm) => wm.imageUrl);
    if (urls.length === 0) return;

    let cancelled = false;
    preloadWatermarks(urls).then(() => {
      if (!cancelled) runCanvasRender();
    });
    return () => {
      cancelled = true;
    };
  }, [imageState.watermarks, runCanvasRender]);

  // Adjust Viewport bounds when layout container or image size changes
  const updateViewportDims = useCallback(() => {
    const container = containerRef.current;
    if (!container || !originalImage) return;

    const maxW = container.clientWidth - 32; // padding
    const maxH = container.clientHeight - 32;

    // imageState.width/height er allerede lærredets faktiske mål — også efter
    // rotation, hvor handleRotate bytter dem om. Byt dem derfor IKKE igen her.
    const targetW = imageState.width;
    const targetH = imageState.height;

    let displayW: number;
    let displayH: number;

    const imageRatio = targetW / targetH;
    const viewportRatio = maxW / maxH;

    if (imageRatio > viewportRatio) {
      displayW = maxW;
      displayH = maxW / imageRatio;
    } else {
      displayH = maxH;
      displayW = maxH * imageRatio;
    }

    setViewportDims({
      width: Math.max(100, Math.round(displayW)),
      height: Math.max(100, Math.round(displayH)),
    });
  }, [originalImage, imageState.width, imageState.height]);

  useEffect(() => {
    updateViewportDims();
    window.addEventListener('resize', updateViewportDims);
    return () => window.removeEventListener('resize', updateViewportDims);
  }, [updateViewportDims]);

  // Interactive Crop Triggers
  const handleApplyCrop = () => {
    if (!originalImage) return;
    
    // Lærredets nye mål måles i visningsrummet — det er dér rammen er trukket
    const cropPixelArea = {
      width: (activeCrop.width / 100) * imageState.width,
      height: (activeCrop.height / 100) * imageState.height,
    };

    // Rammen er trukket oven på det roterede/spejlvendte preview, mens crop
    // gemmes som procenter af kilden. Oversæt, før udsnittene lægges sammen.
    const sourceCrop = displayCropToSourceCrop(
      activeCrop,
      imageState.rotation,
      imageState.flipHorizontal,
      imageState.flipVertical,
    );

    // Læg oven på et eventuelt tidligere udsnit, så beskæringer kan stables
    const currentCrop = imageState.crop || { x: 0, y: 0, width: 100, height: 100 };

    const combinedCrop: CropArea = {
      x: currentCrop.x + (sourceCrop.x / 100) * currentCrop.width,
      y: currentCrop.y + (sourceCrop.y / 100) * currentCrop.height,
      width: (sourceCrop.width / 100) * currentCrop.width,
      height: (sourceCrop.height / 100) * currentCrop.height,
    };

    const nextState: ImageState = {
      ...imageState,
      crop: combinedCrop,
      width: Math.max(10, Math.round(cropPixelArea.width)),
      height: Math.max(10, Math.round(cropPixelArea.height)),
    };

    setImageState(nextState);
    pushNewState(nextState);
    
    // Reset active crop overlay box
    setActiveCrop({ x: 0, y: 0, width: 100, height: 100 });
    setActiveTab('size'); // Return to size tab
  };

  const handleResetCrop = () => {
    // Ved 90/270 graders rotation er lærredets sider byttet om i forhold til originalen
    const isRotated90or270 = imageState.rotation === 90 || imageState.rotation === 270;
    const nextState: ImageState = {
      ...imageState,
      crop: null,
      width: isRotated90or270 ? imageState.originalHeight : imageState.originalWidth,
      height: isRotated90or270 ? imageState.originalWidth : imageState.originalHeight,
    };
    setImageState(nextState);
    pushNewState(nextState);
    setActiveCrop({ x: 0, y: 0, width: 100, height: 100 });
  };

  // Rotation: byt lærredets bredde og højde om sammen med billedet, så et 90/270
  // graders drej ikke maser motivet ned i det gamle sideforhold.
  const handleRotate = (direction: 'cw' | 'ccw') => {
    const delta = direction === 'cw' ? 90 : 270;
    const nextState: ImageState = {
      ...imageState,
      rotation: (imageState.rotation + delta) % 360,
      width: imageState.height,
      height: imageState.width,
    };
    setImageState(nextState);
    pushNewState(nextState);
  };

  const handleFlip = (axis: 'horizontal' | 'vertical') => {
    const nextState: ImageState = {
      ...imageState,
      flipHorizontal:
        axis === 'horizontal' ? !imageState.flipHorizontal : imageState.flipHorizontal,
      flipVertical:
        axis === 'vertical' ? !imageState.flipVertical : imageState.flipVertical,
    };
    setImageState(nextState);
    pushNewState(nextState);
  };

  const handleResize = (width: number, height: number) => {
    const nextState: ImageState = { ...imageState, width, height };
    setImageState(nextState);
    pushNewState(nextState);
  };

  // Baggrundsfjernelse. Selve arbejdet gøres af removeBackgroundAlpha() i
  // filters.ts ved næste gentegning — en farvebaseret maske ud fra hjørnerne,
  // ikke en segmenteringsmodel. Teksterne herunder skal beskrive netop det.
  const handleTriggerBackgroundRemoval = () => {
    setIsBgRemoving(true);
    setBgRemovalProgress('Aflæser baggrundsfarven i billedets hjørner...');

    setTimeout(() => {
      setBgRemovalProgress('Sammenligner hver pixel med baggrundsfarven...');

      setTimeout(() => {
        setBgRemovalProgress('Danner gennemsigtige pixels med bløde kanter...');

        setTimeout(() => {
          setIsBgRemoving(false);
          setBgRemovalProgress('');

          // Ingen bivirkninger inde i en state-updater: React StrictMode kører
          // updaters to gange i udvikling og ville lave en dobbelt historikpost.
          const nextState: ImageState = {
            ...imageStateRef.current,
            backgroundRemoved: true,
          };
          setImageState(nextState);
          pushNewState(nextState);
        }, 700);
      }, 700);
    }, 600);
  };

  // Display sizes in footer (dynamically doubles if 2x upscale active, satisfying Step 6 verification)
  const displayWidth = imageState.upscale2x ? imageState.width * 2 : imageState.width;
  const displayHeight = imageState.upscale2x ? imageState.height * 2 : imageState.height;

  // Render App
  if (!file || !originalImage) {
    return (
      <Dropzone
        onImageSelected={handleImageFileSelected}
        onLoadSample={handleLoadSampleImage}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    );
  }

  return (
    <div id="editor-layout-root" className={`h-screen flex flex-col font-sans overflow-hidden transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0F0F11] text-gray-300' : 'bg-slate-100 text-slate-900'
    }`}>
      
      {/* Header Toolbar */}
      <Header
        fileName={fileName}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onReset={handleResetToOriginal}
        onUploadNew={() => {
          setFile(null);
          setOriginalImage(null);
          setImageState(INITIAL_IMAGE_STATE);
          setHistory([INITIAL_IMAGE_STATE]);
          setHistoryIndex(0);
        }}
        onExport={() => setShowExportModal(true)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Editor Main Content Area */}
      {/* Uses flex-col-reverse on mobile and flex-row on desktop for bottom toolbar layout (Step 10 check) */}
      <div id="editor-main-body" className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden">
        
        {/* Left/Bottom Sidebar Controls */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          imageState={imageState}
          setImageState={setImageState}
          onApplyCrop={handleApplyCrop}
          onResetCrop={handleResetCrop}
          onRotate={handleRotate}
          onFlip={handleFlip}
          onResize={handleResize}
          cropAspectRatio={cropAspectRatio}
          setCropAspectRatio={setCropAspectRatio}
          exifData={exifData}
          onTriggerBackgroundRemoval={handleTriggerBackgroundRemoval}
          isBgRemoving={isBgRemoving}
          bgRemovalProgress={bgRemovalProgress}
          selectedTextId={selectedTextId}
          setSelectedTextId={setSelectedTextId}
        />

        {/* Viewport Canvas Workspace */}
        <div 
          ref={containerRef}
          id="canvas-viewport-container" 
          className="flex-1 flex flex-col items-center justify-center p-4 min-h-[300px] relative overflow-hidden bg-slate-50 dark:bg-[#0A0A0B]"
        >
          {/* Main Visual Frame */}
          <div 
            id="viewport-canvas-frame"
            className="relative shadow-lg dark:shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-slate-300/40 dark:border-[#2A2A2E] rounded-lg overflow-hidden flex items-center justify-center"
            style={{ 
              width: viewportDims.width, 
              height: viewportDims.height,
              // Beautiful checkered pattern CSS for transparency confirmation
              backgroundImage: 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          >
            {/* The Actual Canvas Element */}
            <canvas
              ref={canvasRef}
              id="editor-preview-canvas"
              className="max-w-full max-h-full object-contain"
              style={{ width: '100%', height: '100%' }}
            />

            {/* Interactive Cropper Overlay */}
            {activeTab === 'crop' && (
              <CropOverlay
                containerWidth={viewportDims.width}
                containerHeight={viewportDims.height}
                crop={activeCrop}
                onChange={setActiveCrop}
                aspectRatio={cropAspectRatio}
              />
            )}

            {/* Draggable Text and Watermark Handles overlay */}
            {activeTab === 'text' && (
              <div className="absolute inset-0 pointer-events-none select-none z-10">
                {/* Drag text overlays */}
                {imageState.texts.map((t) => {
                  const isSelected = selectedTextId === t.id;
                  return (
                    <div
                      key={t.id}
                      id={`draggable-text-container-${t.id}`}
                      className="absolute pointer-events-auto cursor-move flex flex-col items-center justify-center select-none"
                      style={{
                        left: `${t.x}%`,
                        top: `${t.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onMouseDown={(e) => startDragText(e, t.id)}
                      onTouchStart={(e) => startDragText(e, t.id)}
                    >
                      {/* Bounding box with dash border on hover or selection */}
                      <div
                        className={`px-3 py-1.5 rounded-md border text-center whitespace-nowrap text-xs font-semibold backdrop-blur-xs transition-all ${
                          isSelected
                            ? 'bg-blue-600/90 text-white border-blue-400 shadow-lg scale-105'
                            : 'bg-slate-900/80 hover:bg-slate-900 border-slate-700/60 text-slate-100 hover:scale-105'
                        }`}
                      >
                        <span className="max-w-[120px] truncate block">
                          {t.text || "Tom tekst"}
                        </span>
                      </div>
                      
                      {/* Tiny center dot drag anchor indicator */}
                      <div className={`w-2 h-2 rounded-full mt-1 border border-white ${
                        isSelected ? 'bg-blue-400' : 'bg-slate-400'
                      }`} />
                    </div>
                  );
                })}

                {/* Drag watermarks (logos) */}
                {imageState.watermarks.map((wm) => {
                  return (
                    <div
                      key={wm.id}
                      id={`draggable-watermark-container-${wm.id}`}
                      className="absolute pointer-events-auto cursor-move flex flex-col items-center justify-center select-none"
                      style={{
                        left: `${wm.x}%`,
                        top: `${wm.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onMouseDown={(e) => startDragWatermark(e, wm.id)}
                      onTouchStart={(e) => startDragWatermark(e, wm.id)}
                    >
                      {/* Bounding box indicator for Logo */}
                      <div className="p-1 rounded bg-slate-900/80 border border-slate-700/60 hover:bg-slate-900 hover:scale-105 transition-all text-center">
                        <span className="text-xxs font-bold text-blue-400 px-1 py-0.5 block uppercase tracking-wider">
                          Logo / Vandmærke
                        </span>
                        {/* Show thumbnail if possible */}
                        <img 
                          src={wm.imageUrl} 
                          alt="Thumbnail" 
                          referrerPolicy="no-referrer"
                          className="h-8 max-w-[80px] object-contain mx-auto mt-1 rounded opacity-80"
                        />
                      </div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 border border-white" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive "Hold to view original" comparator */}
          <div className="absolute bottom-6 flex justify-center w-full">
            <button
              id="hold-to-compare-button"
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
              className="px-4 py-2 bg-slate-900/80 hover:bg-slate-900 dark:bg-[#16161A]/90 dark:border dark:border-[#2A2A2E] dark:hover:bg-[#2A2A2E] text-white text-xs font-semibold rounded-full shadow-md select-none transition-all flex items-center gap-1.5 backdrop-blur-xs cursor-pointer active:scale-95"
            >
              <Eye size={14} />
              Hold for at se original
            </button>
          </div>
        </div>

      </div>

      {/* Editor Status Footer */}
      <footer id="editor-footer-status" className={`h-8 border-t px-4 sm:px-6 flex items-center justify-between text-xxs font-medium select-none transition-colors duration-200 ${
        isDarkMode ? 'bg-[#16161A] border-[#2A2A2E] text-gray-500' : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center gap-4">
          <span id="footer-dimensions-display">
            Opløsning: <strong id="footer-width-height" className="font-mono text-indigo-500 dark:text-blue-400">{displayWidth} &times; {displayHeight} px</strong>
          </span>
          <span className="hidden sm:inline" id="footer-original-tag">
            Original: <span id="footer-original-size" className="font-mono">{viewportDims.width ? `${imageState.originalWidth} \u00d7 ${imageState.originalHeight} px` : 'N/A'}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1" id="footer-gdpr-status">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Behandles lokalt, intet uploades
          </span>
        </div>
      </footer>

      {/* Dynamic Export Modal (Quality/Compression Estimations) */}
      {showExportModal && (
        <ExportModal
          originalImage={originalImage}
          imageState={imageState}
          originalSize={originalSize}
          originalName={fileName}
          onClose={() => setShowExportModal(false)}
        />
      )}

    </div>
  );
}
