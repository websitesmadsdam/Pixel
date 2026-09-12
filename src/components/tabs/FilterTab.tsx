import { ImageState, FilterType } from '../../types';

interface FilterTabProps {
  imageState: ImageState;
  setImageState: (updater: (prev: ImageState) => ImageState) => void;
}

export default function FilterTab({ imageState, setImageState }: FilterTabProps) {
  return (
    <div id="tab-panel-filter" className="space-y-5">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Vælg et stemningsfilter</h3>
      <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
        Giv dit billede en hurtig stemningsmæssig opgradering med et af vores håndlavede filtre.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'none' as FilterType, name: 'Normal', desc: 'Ingen ændring' },
          { id: 'mono' as FilterType, name: 'Sort/hvid', desc: 'Klassisk sølv' },
          { id: 'sepia' as FilterType, name: 'Sepia', desc: 'Varm retro' },
          { id: 'faded' as FilterType, name: 'Falmet', desc: 'Analog film' },
          { id: 'pop' as FilterType, name: 'Pop', desc: 'Vibrerende farver' }
        ].map((filt) => {
          const isSelected = imageState.filter === filt.id;
          return (
            <button
              key={filt.id}
              id={`filter-preset-${filt.id}`}
              onClick={() => setImageState(prev => ({ ...prev, filter: filt.id }))}
              className={`p-3 border rounded-xl text-left transition-all flex flex-col justify-between h-20 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-800 dark:bg-blue-600/20 dark:border-blue-500/50 dark:text-blue-400 shadow-xxs'
                  : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50 dark:bg-[#2A2A2E] dark:border-[#2A2A2E] dark:text-gray-300 dark:hover:bg-[#34343A]'
              }`}
            >
              <span className="font-bold text-xs">{filt.name}</span>
              <span className="text-xxs opacity-80">{filt.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
