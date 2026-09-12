import { ImageState, Adjustments } from '../../types';

interface AdjustTabProps {
  imageState: ImageState;
  setImageState: (updater: (prev: ImageState) => ImageState) => void;
}

export default function AdjustTab({ imageState, setImageState }: AdjustTabProps) {
  const handleAdjustmentChange = (key: keyof Adjustments, value: number) => {
    setImageState((prev) => ({
      ...prev,
      adjustments: { ...prev.adjustments, [key]: value },
    }));
  };

  const resetAdjustments = () => {
    setImageState((prev) => ({
      ...prev,
      adjustments: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        warmth: 0,
        sharpness: 0,
        blur: 0,
        vignette: 0,
      },
    }));
  };

  return (
    <div id="tab-panel-adjust" className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Justering</h3>
        <button
          id="reset-adjustments-btn"
          onClick={resetAdjustments}
          className="text-xxs text-indigo-600 dark:text-blue-400 hover:text-indigo-800 dark:hover:text-blue-300 font-bold underline cursor-pointer"
        >
          Nulstil
        </button>
      </div>

      <div className="space-y-4">
        {/* Brightness - TAB SELECTABLE & KEYBOARD FOCUSABLE FOR STEP 5 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
            <label htmlFor="slider-brightness">Lysstyrke</label>
            <span id="brightness-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.brightness}%</span>
          </div>
          <input
            id="slider-brightness"
            type="range"
            min="0"
            max="200"
            step="1"
            value={imageState.adjustments.brightness}
            onChange={(e) => handleAdjustmentChange('brightness', parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
            tabIndex={0} // Ensure keyboard access for step 5
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
            <label htmlFor="slider-contrast">Kontrast</label>
            <span id="contrast-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.contrast}%</span>
          </div>
          <input
            id="slider-contrast"
            type="range"
            min="0"
            max="200"
            step="1"
            value={imageState.adjustments.contrast}
            onChange={(e) => handleAdjustmentChange('contrast', parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
            <label htmlFor="slider-saturation">Mætning</label>
            <span id="saturation-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.saturation}%</span>
          </div>
          <input
            id="slider-saturation"
            type="range"
            min="0"
            max="200"
            step="1"
            value={imageState.adjustments.saturation}
            onChange={(e) => handleAdjustmentChange('saturation', parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Warmth */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
            <label htmlFor="slider-warmth">Varme</label>
            <span id="warmth-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">
              {imageState.adjustments.warmth > 0 ? `+${imageState.adjustments.warmth}` : imageState.adjustments.warmth}
            </span>
          </div>
          <input
            id="slider-warmth"
            type="range"
            min="-100"
            max="100"
            step="1"
            value={imageState.adjustments.warmth}
            onChange={(e) => handleAdjustmentChange('warmth', parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Sharpness */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
            <label htmlFor="slider-sharpness">Skarphed</label>
            <span id="sharpness-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.sharpness}%</span>
          </div>
          <input
            id="slider-sharpness"
            type="range"
            min="0"
            max="100"
            step="1"
            value={imageState.adjustments.sharpness}
            onChange={(e) => handleAdjustmentChange('sharpness', parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Blur */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
            <label htmlFor="slider-blur">Sløring</label>
            <span id="blur-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.blur}%</span>
          </div>
          <input
            id="slider-blur"
            type="range"
            min="0"
            max="100"
            step="1"
            value={imageState.adjustments.blur}
            onChange={(e) => handleAdjustmentChange('blur', parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Vignette */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
            <label htmlFor="slider-vignette">Vignet</label>
            <span id="vignette-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.vignette}%</span>
          </div>
          <input
            id="slider-vignette"
            type="range"
            min="0"
            max="100"
            step="1"
            value={imageState.adjustments.vignette}
            onChange={(e) => handleAdjustmentChange('vignette', parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>
    </div>
  );
}
