import React, { useState, useEffect, useRef } from 'react';
import { CropArea } from '../types';

interface CropOverlayProps {
  containerWidth: number;
  containerHeight: number;
  crop: CropArea;
  onChange: (crop: CropArea) => void;
  aspectRatio: 'free' | '1:1' | '16:9' | '3:4';
}

export default function CropOverlay({
  containerWidth,
  containerHeight,
  crop,
  onChange,
  aspectRatio,
}: CropOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragType, setDragType] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });

  // Update crop aspect ratio when it changes from props
  useEffect(() => {
    if (aspectRatio === 'free') return;
    
    let targetRatio = 1;
    if (aspectRatio === '1:1') targetRatio = 1;
    if (aspectRatio === '16:9') targetRatio = 16 / 9;
    if (aspectRatio === '3:4') targetRatio = 3 / 4;

    // Adjust crop height/width to match ratio
    const currentImgRatio = containerWidth / containerHeight;
    let newWidth = crop.width;
    let newHeight = (crop.width * currentImgRatio) / targetRatio;

    if (newHeight > 100) {
      newHeight = crop.height;
      newWidth = (crop.height * targetRatio) / currentImgRatio;
    }

    // Centered crop
    const newX = Math.max(0, (100 - newWidth) / 2);
    const newY = Math.max(0, (100 - newHeight) / 2);

    onChange({
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    });
  }, [aspectRatio, containerWidth, containerHeight]);

  const handleMouseDown = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragType(type);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartCrop({ ...crop });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragType || !overlayRef.current) return;

      const dx = ((e.clientX - startPos.x) / containerWidth) * 100;
      const dy = ((e.clientY - startPos.y) / containerHeight) * 100;

      let nX = startCrop.x;
      let nY = startCrop.y;
      let nW = startCrop.width;
      let nH = startCrop.height;

      const imgRatio = containerWidth / containerHeight;
      let targetRatio = 1;
      if (aspectRatio === '1:1') targetRatio = 1;
      if (aspectRatio === '16:9') targetRatio = 16 / 9;
      if (aspectRatio === '3:4') targetRatio = 3 / 4;

      if (dragType === 'move') {
        nX = Math.max(0, Math.min(100 - nW, startCrop.x + dx));
        nY = Math.max(0, Math.min(100 - nH, startCrop.y + dy));
      } else {
        // Corner resizing
        if (dragType.includes('e')) {
          nW = Math.max(10, Math.min(100 - startCrop.x, startCrop.width + dx));
        }
        if (dragType.includes('w')) {
          const maxDx = startCrop.width - 10;
          const clampedDx = Math.max(-startCrop.x, Math.min(maxDx, dx));
          nX = startCrop.x + clampedDx;
          nW = startCrop.width - clampedDx;
        }
        if (dragType.includes('s')) {
          nH = Math.max(10, Math.min(100 - startCrop.y, startCrop.height + dy));
        }
        if (dragType.includes('n')) {
          const maxDy = startCrop.height - 10;
          const clampedDy = Math.max(-startCrop.y, Math.min(maxDy, dy));
          nY = startCrop.y + clampedDy;
          nH = startCrop.height - clampedDy;
        }

        // Apply aspect ratio constraints if active
        if (aspectRatio !== 'free') {
          if (dragType === 'se' || dragType === 'e' || dragType === 's') {
            nH = (nW * imgRatio) / targetRatio;
            if (nY + nH > 100) {
              nH = 100 - nY;
              nW = (nH * targetRatio) / imgRatio;
            }
          } else if (dragType === 'sw' || dragType === 'w') {
            nH = (nW * imgRatio) / targetRatio;
            if (nY + nH > 100) {
              nH = 100 - nY;
              const diffW = (nH * targetRatio) / imgRatio - nW;
              nX = Math.max(0, nX - diffW);
              nW = (nH * targetRatio) / imgRatio;
            }
          } else if (dragType === 'ne' || dragType === 'n') {
            nW = (nH * targetRatio) / imgRatio;
            if (nX + nW > 100) {
              nW = 100 - nX;
              const diffH = (nW * imgRatio) / targetRatio - nH;
              nY = Math.max(0, nY - diffH);
              nH = (nW * imgRatio) / targetRatio;
            }
          } else if (dragType === 'nw') {
            // Both are moving
            nH = (nW * imgRatio) / targetRatio;
            if (nX < 0 || nY < 0) {
              // revert or limit
            }
          }
        }
      }

      // Final clamp verification
      nX = Math.max(0, Math.min(100, nX));
      nY = Math.max(0, Math.min(100, nY));
      nW = Math.max(10, Math.min(100 - nX, nW));
      nH = Math.max(10, Math.min(100 - nY, nH));

      onChange({
        x: Math.round(nX),
        y: Math.round(nY),
        width: Math.round(nW),
        height: Math.round(nH),
      });
    };

    const handleMouseUp = () => {
      setDragType(null);
    };

    if (dragType) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragType, startPos, startCrop, containerWidth, containerHeight, aspectRatio, onChange]);

  // Convert percentages to style coordinates
  const style = {
    left: `${crop.x}%`,
    top: `${crop.y}%`,
    width: `${crop.width}%`,
    height: `${crop.height}%`,
  };

  return (
    <div
      ref={overlayRef}
      id="crop-overlay-root"
      className="absolute inset-0 select-none overflow-hidden"
      style={{ width: containerWidth, height: containerHeight }}
    >
      {/* Semi-transparent dark curtains */}
      <div className="absolute bg-black/60 top-0 left-0 right-0" style={{ height: `${crop.y}%` }} />
      <div className="absolute bg-black/60 bottom-0 left-0 right-0" style={{ height: `${100 - crop.y - crop.height}%` }} />
      <div
        className="absolute bg-black/60 left-0"
        style={{ top: `${crop.y}%`, height: `${crop.height}%`, width: `${crop.x}%` }}
      />
      <div
        className="absolute bg-black/60 right-0"
        style={{ top: `${crop.y}%`, height: `${crop.height}%`, width: `${100 - crop.x - crop.width}%` }}
      />

      {/* Active cropping bounding box */}
      <div
        id="crop-bounding-box"
        className="absolute border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] cursor-move flex flex-col justify-between"
        style={style}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* Rule of Thirds Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-evenly pointer-events-none">
          <div className="border-b border-white/30 w-full h-0" />
          <div className="border-b border-white/30 w-full h-0" />
        </div>
        <div className="absolute inset-0 flex justify-evenly pointer-events-none">
          <div className="border-r border-white/30 h-full w-0" />
          <div className="border-r border-white/30 h-full w-0" />
        </div>

        {/* Resize Handles (8 directions) */}
        {/* Corners */}
        <div
          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-slate-900 rounded-sm cursor-nwse-resize z-10"
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
        />
        <div
          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-slate-900 rounded-sm cursor-nesw-resize z-10"
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
        />
        <div
          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-slate-900 rounded-sm cursor-nesw-resize z-10"
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
        />
        <div
          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-slate-900 rounded-sm cursor-nwse-resize z-10"
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        />

        {/* Mid-edges */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -left-1 w-2.5 h-5 bg-white border border-slate-900 rounded-sm cursor-w-resize z-10"
          onMouseDown={(e) => handleMouseDown(e, 'w')}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -right-1 w-2.5 h-5 bg-white border border-slate-900 rounded-sm cursor-e-resize z-10"
          onMouseDown={(e) => handleMouseDown(e, 'e')}
        />
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-2.5 bg-white border border-slate-900 rounded-sm cursor-n-resize z-10"
          onMouseDown={(e) => handleMouseDown(e, 'n')}
        />
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-2.5 bg-white border border-slate-900 rounded-sm cursor-s-resize z-10"
          onMouseDown={(e) => handleMouseDown(e, 's')}
        />
      </div>
    </div>
  );
}
