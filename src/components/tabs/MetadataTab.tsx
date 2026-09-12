import { Globe, Info, MapPin } from 'lucide-react';
import { ExifData } from '../../types';

interface MetadataTabProps {
  exifData: ExifData;
}

export default function MetadataTab({ exifData }: MetadataTabProps) {
  return (
    <div id="tab-panel-metadata" className="space-y-5">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Billedets metadata (EXIF)</h3>

      {exifData.hasExif ? (
        <div id="exif-data-box" className="space-y-4">
          <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 rounded-lg text-xxs">
            <div className="px-1.5 py-0.5 bg-amber-500 text-white font-bold rounded-xs shrink-0 select-none">
              Personlig
            </div>
            <span className="font-medium leading-normal">Kameradata og lokalitetsdata registreret på filen!</span>
          </div>

          <div className="space-y-3 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#2A2A2E] rounded-xl p-4">
            {exifData.make && (
              <div className="flex justify-between items-start text-xs border-b border-slate-200/50 dark:border-[#2A2A2E]/50 pb-2">
                <span className="text-slate-400 dark:text-gray-400 font-medium">Kameraproducent:</span>
                <span id="exif-make-display" className="text-slate-700 dark:text-white font-bold text-right">{exifData.make}</span>
              </div>
            )}
            {exifData.model && (
              <div className="flex justify-between items-start text-xs border-b border-slate-200/50 dark:border-[#2A2A2E]/50 pb-2">
                <span className="text-slate-400 dark:text-gray-400 font-medium">Kameramodel:</span>
                <span id="exif-model-display" className="text-slate-700 dark:text-white font-bold text-right">{exifData.model}</span>
              </div>
            )}
            {exifData.dateTime && (
              <div className="flex justify-between items-start text-xs border-b border-slate-200/50 dark:border-[#2A2A2E]/50 pb-2">
                <span className="text-slate-400 dark:text-gray-400 font-medium">Optagelsesdato:</span>
                <span id="exif-date-display" className="text-slate-700 dark:text-white font-bold text-right font-mono text-xxs">{exifData.dateTime}</span>
              </div>
            )}
            
            {exifData.gps && (
              <div id="exif-gps-info" className="space-y-2 pt-1">
                <span className="text-xxs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">GPS-Lokation</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-350 bg-white dark:bg-[#16161A] border border-slate-150 dark:border-[#2A2A2E] p-2.5 rounded-lg">
                  <MapPin size={14} className="text-blue-500 shrink-0" />
                  <span id="exif-coords-display" className="font-mono text-xxs">
                    {exifData.gps.latitude.toFixed(5)}, {exifData.gps.longitude.toFixed(5)} ({exifData.gps.latitudeRef}, {exifData.gps.longitudeRef})
                  </span>
                </div>
                
                <a
                  id="exif-maps-link"
                  href={exifData.gps.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-semibold underline cursor-pointer"
                >
                  <Globe size={14} />
                  Se på Google Maps
                </a>
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-lg text-xxs leading-relaxed">
            🔒 <strong>GDPR-Sikkerhed:</strong> myPhoto sletter alle disse personlige oplysninger automatisk ved eksport, så du roligt kan dele dit billede på nettet bagefter.
          </div>
        </div>
      ) : (
        <div id="no-exif-metadata-box" className="text-center py-6 px-4 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-150 dark:border-[#2A2A2E] rounded-xl">
          <Info className="mx-auto text-slate-300 dark:text-gray-500 mb-2" size={24} />
          <span className="text-xs font-bold text-slate-700 dark:text-white block mb-1">Ingen følsom EXIF fundet</span>
          <p className="text-xxs text-slate-400 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
            Dette billede indeholder ingen indlejret GPS, kamera-id eller tidsstempel metadata, eller filformatet understøtter det ikke.
          </p>
        </div>
      )}
    </div>
  );
}
