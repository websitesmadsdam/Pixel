import { Sparkles } from 'lucide-react';
import { ImageState } from '../../types';

interface BackgroundTabProps {
  imageState: ImageState;
  setImageState: (updater: (prev: ImageState) => ImageState) => void;
  onTriggerBackgroundRemoval: () => void;
  isBgRemoving: boolean;
  bgRemovalProgress: string;
}

export default function BackgroundTab({
  imageState,
  setImageState,
  onTriggerBackgroundRemoval,
  isBgRemoving,
  bgRemovalProgress,
}: BackgroundTabProps) {
  return (
    <div id="tab-panel-background" className="space-y-5">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Fjern ensfarvet baggrund</h3>
      <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
        myPhoto aflæser farven i billedets fire hjørner og gør de pixels gennemsigtige, der ligner den. Det virker bedst på en ensartet baggrund — fx et produktfoto eller et portræt mod en væg. Et motiv i rodede omgivelser bliver ikke fritlagt korrekt. Alt sker lokalt i din browser.
      </p>

      {isBgRemoving ? (
        <div id="bg-removing-spinner-box" className="p-5 bg-indigo-50 dark:bg-blue-950/20 border border-indigo-100 dark:border-blue-500/30 rounded-xl space-y-4 flex flex-col items-center text-center">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 dark:border-[#2A2A2E] border-t-indigo-600 dark:border-t-blue-500"></div>
            <Sparkles size={16} className="absolute text-amber-500 animate-pulse" />
          </div>
          <div className="space-y-1">
            <span id="bg-removal-loading-title" className="text-xs font-bold text-slate-800 dark:text-white">Behandler billedet...</span>
            <p id="bg-removal-status-detail" className="text-xxs text-indigo-700 dark:text-blue-400 animate-pulse">{bgRemovalProgress}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            id="trigger-bg-removal-btn"
            onClick={onTriggerBackgroundRemoval}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-300" />
            {imageState.backgroundRemoved ? 'Opdater fritlægning' : 'Fjern baggrund nu'}
          </button>

          {imageState.backgroundRemoved && (
            <div id="bg-removal-active-controls" className="p-4 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#2A2A2E] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-white">Fritlægning aktiv</span>
                <button
                  id="disable-bg-removal-btn"
                  onClick={() => setImageState(prev => ({ ...prev, backgroundRemoved: false }))}
                  className="text-xxs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-bold underline cursor-pointer"
                >
                  Gendan baggrund
                </button>
              </div>

              <p className="text-xxs text-slate-400 dark:text-gray-450">
                Brug gittermønsteret i previewet to at verificere gennemsigtige pixels.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
