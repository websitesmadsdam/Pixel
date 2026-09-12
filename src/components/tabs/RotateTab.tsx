import { RotateCw } from 'lucide-react';
import { ImageState } from '../../types';

interface RotateTabProps {
  imageState: ImageState;
  onRotate: (direction: 'cw' | 'ccw') => void;
  onFlip: (axis: 'horizontal' | 'vertical') => void;
}

export default function RotateTab({ imageState, onRotate, onFlip }: RotateTabProps) {
  return (
    <div id="tab-panel-rotate" className="space-y-5">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Beskær og rotér</h3>
      <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
        Drej dit billede i 90-graders intervaller eller spejlvend det vandret eller lodret.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          id="rotate-right-btn"
          onClick={() => onRotate('cw')}
          className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-[#2A2A2E] dark:border-[#2A2A2E] dark:text-gray-300 dark:hover:bg-[#34343A] rounded-lg text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCw size={18} />
          Drej 90°
        </button>
        <button
          id="rotate-left-btn"
          onClick={() => onRotate('ccw')}
          className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-[#2A2A2E] dark:border-[#2A2A2E] dark:text-gray-300 dark:hover:bg-[#34343A] rounded-lg text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCw size={18} className="transform -scale-x-100" />
          Drej -90°
        </button>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2A2A2E]">
        <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Spejlvend</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="flip-horizontal-btn"
            onClick={() => onFlip('horizontal')}
            className={`py-2 px-3 border text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center ${
              imageState.flipHorizontal
                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-blue-600/20 dark:border-blue-500/50 dark:text-blue-400 shadow-xxs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#2A2A2E] dark:border-[#2A2A2E] dark:text-gray-300 dark:hover:bg-[#34343A]'
            }`}
          >
            Vandret (H)
          </button>
          <button
            id="flip-vertical-btn"
            onClick={() => onFlip('vertical')}
            className={`py-2 px-3 border text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center ${
              imageState.flipVertical
                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-blue-600/20 dark:border-blue-500/50 dark:text-blue-400 shadow-xxs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#2A2A2E] dark:border-[#2A2A2E] dark:text-gray-300 dark:hover:bg-[#34343A]'
            }`}
          >
            Lodret (V)
          </button>
        </div>
      </div>
    </div>
  );
}
