import { Info } from 'lucide-react';
import { ImageState } from '../../types';

interface UpscaleTabProps {
  imageState: ImageState;
  setImageState: (updater: (prev: ImageState) => ImageState) => void;
}

export default function UpscaleTab({ imageState, setImageState }: UpscaleTabProps) {
  return (
    <div id="tab-panel-upscale" className="space-y-5">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Opskalering</h3>
      <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
        Forstørrer billedet til dobbelt opløsning ved eksport. Det giver flere pixels, men ikke flere detaljer — brug det, når en tjeneste kræver en bestemt minimumsstørrelse.
      </p>

      <label id="upscale-2x-label" className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-150 dark:border-[#2A2A2E] rounded-xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-[#16161A]/50 transition-colors select-none">
        <input
          id="upscale-2x-checkbox"
          type="checkbox"
          checked={imageState.upscale2x}
          onChange={(e) => setImageState(prev => ({ ...prev, upscale2x: e.target.checked }))}
          className="mt-0.5 rounded border-slate-300 dark:border-[#2A2A2E] text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 cursor-pointer"
        />
        <div>
          <span className="text-xs font-bold text-slate-800 dark:text-white block">Dobbelt opløsning (2×)</span>
          <span className="text-xxs text-slate-400 dark:text-gray-400 block mt-0.5 leading-relaxed">
            {imageState.width} &times; {imageState.height} px &rarr; <span className="text-blue-600 dark:text-blue-400 font-bold font-mono">{imageState.width * 2} &times; {imageState.height * 2} px</span> ved eksport. Browserens egen billedskalering bruges — billedet bliver større, men ikke skarpere.
          </span>
        </div>
      </label>

      {imageState.upscale2x && (
        <div id="upscale-status-badge" className="p-3 bg-indigo-50 dark:bg-blue-950/20 text-indigo-800 dark:text-blue-400 border border-indigo-100 dark:border-blue-500/30 rounded-lg text-xxs flex items-start gap-2 leading-relaxed">
          <Info size={16} className="text-indigo-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <span>
            <strong>Aktiv:</strong> Billedet vil automatisk blive opskaleret til dobbelt størrelse, når du henter den færdige fil. Preview-footeren afspejler denne ændring.
          </span>
        </div>
      )}
    </div>
  );
}
