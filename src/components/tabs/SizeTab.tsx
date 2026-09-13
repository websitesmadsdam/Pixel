import { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { ImageState } from '../../types';

interface SizeTabProps {
  imageState: ImageState;
  onResize: (width: number, height: number) => void;
}

export default function SizeTab({ imageState, onResize }: SizeTabProps) {
  const [resizeWidth, setResizeWidth] = useState<string>(imageState.width.toString());
  const [resizeHeight, setResizeHeight] = useState<string>(imageState.height.toString());
  const [maintainRatio, setMaintainRatio] = useState<boolean>(true);
  const [resizeError, setResizeError] = useState<string | null>(null);

  // Når lærredets mål ændrer sig udefra (undo, rotation, beskæring), følger
  // felterne med. Justeres under render i stedet for i en effekt, så der ikke
  // først tegnes en gang med de gamle værdier.
  const [syncedDims, setSyncedDims] = useState({ w: imageState.width, h: imageState.height });
  if (syncedDims.w !== imageState.width || syncedDims.h !== imageState.height) {
    setSyncedDims({ w: imageState.width, h: imageState.height });
    setResizeWidth(imageState.width.toString());
    setResizeHeight(imageState.height.toString());
  }

  const handleWidthChange = (val: string) => {
    setResizeWidth(val);
    setResizeError(null);
    const parsedWidth = parseInt(val);
    if (!isNaN(parsedWidth) && parsedWidth > 0 && maintainRatio) {
      // Brug lærredets aktuelle sideforhold — originalens er forkert efter rotation
      const ratio = imageState.width / imageState.height;
      setResizeHeight(Math.round(parsedWidth / ratio).toString());
    }
  };

  const handleHeightChange = (val: string) => {
    setResizeHeight(val);
    setResizeError(null);
    const parsedHeight = parseInt(val);
    if (!isNaN(parsedHeight) && parsedHeight > 0 && maintainRatio) {
      const ratio = imageState.width / imageState.height;
      setResizeWidth(Math.round(parsedHeight * ratio).toString());
    }
  };

  const applyResize = () => {
    const w = parseInt(resizeWidth);
    const h = parseInt(resizeHeight);

    // Ugyldige værdier afvises frem for at blive klampet til 1x1 px
    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0) {
      setResizeError('Bredde og højde skal være større end 0 pixels.');
      return;
    }

    onResize(w, h);
  };

  const applyPresetFormat = (targetW: number, targetH: number) => {
    setResizeError(null);
    setResizeWidth(targetW.toString());
    setResizeHeight(targetH.toString());
    onResize(targetW, targetH);
  };

  const applyPercentResize = (factor: number) => {
    setResizeError(null);
    // Skalér ud fra lærredets aktuelle mål, ikke originalens — ellers går
    // rotation og tidligere beskæring tabt ved procentskalering
    const targetW = Math.round(imageState.width * factor);
    const targetH = Math.round(imageState.height * factor);
    setResizeWidth(targetW.toString());
    setResizeHeight(targetH.toString());
    onResize(targetW, targetH);
  };

  return (
    <div id="tab-panel-size" className="space-y-5">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Skaler og tilpas</h3>
      <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
        Billedets nuværende opløsning: <span className="font-mono font-bold text-indigo-600 dark:text-blue-400">{imageState.width} &times; {imageState.height} px</span>
      </p>

      {/* Error message */}
      {resizeError && (
        <div id="resize-error-alert" className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-lg text-xs flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{resizeError}</span>
        </div>
      )}

      {/* Exact Pixels Form */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Eksakte pixels</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="resize-width-input" className="text-xxs font-medium text-slate-400 dark:text-gray-400">Bredde</label>
            <input
              id="resize-width-input"
              type="number"
              value={resizeWidth}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#2A2A2E] rounded-lg focus:outline-hidden focus:border-indigo-500 dark:focus:border-blue-500 font-mono dark:text-white"
              min="1"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="resize-height-input" className="text-xxs font-medium text-slate-400 dark:text-gray-400">Højde</label>
            <input
              id="resize-height-input"
              type="number"
              value={resizeHeight}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#2A2A2E] rounded-lg focus:outline-hidden focus:border-indigo-500 dark:focus:border-blue-500 font-mono dark:text-white"
              min="1"
            />
          </div>
        </div>

        {/* Maintain aspect ratio checkbox */}
        <label id="bevar-forhold-label" className="flex items-center gap-2 cursor-pointer py-1 select-none">
          <input
            id="bevar-forhold-checkbox"
            type="checkbox"
            checked={maintainRatio}
            onChange={(e) => setMaintainRatio(e.target.checked)}
            className="rounded border-slate-300 dark:border-[#2A2A2E] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">Bevar forhold</span>
        </label>

        <button
          id="apply-resize-btn"
          onClick={applyResize}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Check size={14} />
          Anvend størrelse
        </button>
      </div>

      {/* Percentages */}
      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2A2A2E]">
        <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Procent</span>
        <div className="grid grid-cols-3 gap-2">
          {[0.25, 0.50, 0.75].map((factor) => (
            <button
              key={factor}
              id={`percent-resize-${factor * 100}`}
              onClick={() => applyPercentResize(factor)}
              className="py-1.5 px-3 bg-slate-50 dark:bg-[#2A2A2E] border border-slate-200 dark:border-[#2A2A2E] hover:bg-slate-100 dark:hover:bg-[#34343A] text-slate-600 dark:text-gray-300 rounded-lg text-xs font-medium font-mono transition-colors cursor-pointer"
            >
              {factor * 100}%
            </button>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2A2A2E]">
        <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Færdige formater</span>
        <div className="space-y-2">
          {[
            { name: 'Facebook-opslag', w: 1200, h: 630 },
            { name: 'Instagram kvadrat', w: 1080, h: 1080 },
            { name: 'LinkedIn-cover', w: 1584, h: 396 },
            { name: 'Twitter-post (16:9)', w: 1600, h: 900 }
          ].map((preset) => (
            <button
              key={preset.name}
              id={`preset-size-${preset.name.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => applyPresetFormat(preset.w, preset.h)}
              className="w-full text-left px-3 py-2 bg-slate-50 dark:bg-[#1C1C21] hover:bg-slate-100 dark:hover:bg-[#25252B] border border-slate-150 dark:border-[#2A2A2E] rounded-lg flex items-center justify-between text-xs text-slate-600 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <span className="font-medium text-slate-700 dark:text-gray-300">{preset.name}</span>
              <span className="font-mono text-xxs text-indigo-500 dark:text-blue-400">{preset.w} &times; {preset.h} px</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
