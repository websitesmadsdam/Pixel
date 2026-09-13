import { ImageState, CropAspectRatio } from '../../types';

interface CropTabProps {
  imageState: ImageState;
  setImageState: (updater: (prev: ImageState) => ImageState) => void;
  cropAspectRatio: CropAspectRatio;
  setCropAspectRatio: (ratio: CropAspectRatio) => void;
  onApplyCrop: () => void;
  onResetCrop: () => void;
}

export default function CropTab({
  imageState,
  setImageState,
  cropAspectRatio,
  setCropAspectRatio,
  onApplyCrop,
  onResetCrop,
}: CropTabProps) {
  return (
    <div id="tab-panel-crop" className="space-y-5">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Beskær billedet</h3>
      <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
        Vælg et fast formatforhold eller tilpas helt frihånd ved at trække i hjørnerne af beskæringsrammen på previewet.
      </p>

      {/* Aspect ratios */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Formatforhold</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'free' as const, name: 'Frihånd' },
            { id: '1:1' as const, name: '1:1 Kvadrat' },
            { id: '16:9' as const, name: '16:9 Skærm' },
            { id: '3:4' as const, name: '3:4 Portræt' }
          ].map((ratio) => (
            <button
              key={ratio.id}
              id={`crop-aspect-${ratio.id}`}
              onClick={() => setCropAspectRatio(ratio.id)}
              className={`py-2 px-3 border text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                cropAspectRatio === ratio.id
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-blue-600/20 dark:border-blue-500/50 dark:text-blue-400 shadow-xxs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#2A2A2E] dark:border-[#2A2A2E] dark:text-gray-300 dark:hover:bg-[#34343A]'
              }`}
            >
              {ratio.name}
            </button>
          ))}
        </div>
      </div>

      {/* Runde hjørner */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#2A2A2E]">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-gray-400">
          <span className="uppercase tracking-wider">Runde hjørner</span>
          <span id="corners-val-label" className="font-mono font-bold text-indigo-600 dark:text-blue-400">
            {imageState.cornerRadius || 0}%
          </span>
        </div>
        <input
          id="slider-corners"
          type="range"
          min="0"
          max="50"
          step="1"
          value={imageState.cornerRadius || 0}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0;
            setImageState(prev => ({ ...prev, cornerRadius: val }));
          }}
          className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600 animate-pulse-once"
        />
        <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
          Gør billedets hjørner bløde og afrundede. Ved 50% bliver et kvadratisk billede helt cirkulært.
        </p>
      </div>

      {/* Crop Actions */}
      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2A2A2E] flex flex-col gap-2">
        <button
          id="apply-crop-btn"
          onClick={onApplyCrop}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          Anvend beskæring
        </button>
        <button
          id="reset-crop-btn"
          onClick={onResetCrop}
          className="w-full py-2 bg-slate-100 dark:bg-[#2A2A2E] hover:bg-slate-200 dark:hover:bg-[#34343A] text-slate-600 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
        >
          Gendan original størrelse
        </button>
      </div>
    </div>
  );
}
