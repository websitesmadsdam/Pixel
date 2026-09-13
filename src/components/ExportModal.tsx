import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, X, FileImage, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ImageState } from '../types';
import {
  drawImageWithState,
  getExportScale,
  getMaxCanvasPixels,
  preloadWatermarks,
} from '../utils/filters';

interface ExportModalProps {
  originalImage: HTMLImageElement;
  imageState: ImageState;
  originalSize: number; // in bytes
  originalName: string;
  onClose: () => void;
}

export default function ExportModal({
  originalImage,
  imageState,
  originalSize,
  originalName,
  onClose,
}: ExportModalProps) {
  const [format, setFormat] = useState<'webp' | 'png' | 'jpeg'>('webp');
  const [quality, setQuality] = useState<number>(80); // 0 - 100
  // Standardfilnavn uden den oprindelige filendelse. Modalen monteres forfra
  // hver gang den åbnes, så en initialiser er nok.
  const [fileName, setFileName] = useState<string>(() => {
    const dotIndex = originalName.lastIndexOf('.');
    const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
    return `${baseName}_myphoto`;
  });

  // Eksport-lærredet lever uden for DOM'en og tegnes i den fulde opløsning
  // (getExportScale), så bl.a. 2x opskalering rent faktisk kommer med.
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Den ønskede opløsning kan være større, end enheden kan tegne (Safari på
  // iPhone/iPad), så eksporten viser og bruger den faktiske skala.
  const wantedScale = imageState.upscale2x ? 2 : 1;
  const exportScale = getExportScale(imageState);
  const isSizeLimited = exportScale < wantedScale;
  const exportWidth = Math.max(1, Math.round(imageState.width * exportScale));
  const exportHeight = Math.max(1, Math.round(imageState.height * exportScale));
  // Rundet ned, så beskeden aldrig lover mere, end enheden kan (16.777.216 px → 16,7)
  const maxMegapixels = (Math.floor(getMaxCanvasPixels() / 1e5) / 10).toFixed(1).replace('.', ',');

  const mimeType =
    format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const qualityParam = format === 'png' ? undefined : quality / 100;

  // Hvilket billede og hvilken tilstand eksport-lærredet sidst blev tegnet ud fra.
  // Skift af format eller kvalitet kræver kun en ny toBlob, ikke en ny tegning —
  // og en tegning i fuld opløsning kan tage over et sekund for store billeder.
  const renderedForRef = useRef<{ image: HTMLImageElement; state: ImageState } | null>(null);

  /** Tegner eksport-lærredet, hvis billedet eller tilstanden er ændret, og returnerer det. */
  const renderExportCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    if (!exportCanvasRef.current) {
      exportCanvasRef.current = document.createElement('canvas');
    }
    const last = renderedForRef.current;
    if (last?.image !== originalImage || last?.state !== imageState) {
      await preloadWatermarks(imageState.watermarks.map((wm) => wm.imageUrl));
      drawImageWithState(exportCanvasRef.current, originalImage, imageState, getExportScale(imageState));
      renderedForRef.current = { image: originalImage, state: imageState };
    }
    return exportCanvasRef.current;
  }, [originalImage, imageState]);

  // Estimatet husker, hvilke indstillinger det blev beregnet ud fra. Så kan
  // "Beregner..." afledes under render i stedet for at blive sat i effekten.
  const [estimate, setEstimate] = useState<{
    image: HTMLImageElement;
    state: ImageState;
    mimeType: string;
    quality: number | undefined;
    size: number | null;
  } | null>(null);

  const isCalculating =
    estimate === null ||
    estimate.image !== originalImage ||
    estimate.state !== imageState ||
    estimate.mimeType !== mimeType ||
    estimate.quality !== qualityParam;
  const exportSize = isCalculating ? null : estimate.size;

  // Beregn den faktiske filstørrelse ud fra eksport-lærredet
  useEffect(() => {
    let cancelled = false;

    // Kort forsinkelse, så sliderbevægelser ikke får UI'et til at hakke
    const timer = setTimeout(async () => {
      const canvas = await renderExportCanvas();
      if (cancelled) return;

      canvas.toBlob(
        (blob) => {
          if (cancelled) return;
          setEstimate({
            image: originalImage,
            state: imageState,
            mimeType,
            quality: qualityParam,
            size: blob ? blob.size : null,
          });
        },
        mimeType,
        qualityParam,
      );
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [originalImage, imageState, mimeType, qualityParam, renderExportCanvas]);

  const handleDownload = async () => {
    const canvas = await renderExportCanvas();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onClose();
      },
      mimeType,
      qualityParam,
    );
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getPercentSavings = () => {
    if (!exportSize || !originalSize) return 0;
    const diff = originalSize - exportSize;
    return Math.round((diff / originalSize) * 100);
  };

  const percentSavings = getPercentSavings();

  return (
    <div id="export-modal-backdrop" className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div id="export-modal-content" className="bg-[#16161A] text-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#2A2A2E] flex flex-col max-h-[90vh] animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2E]">
          <div className="flex items-center gap-2">
            <FileImage className="text-blue-500" size={20} />
            <span className="font-bold text-white text-lg">Eksporter billede</span>
          </div>
          <button 
            id="close-export-modal"
            onClick={onClose} 
            className="p-1 hover:bg-[#2A2A2E] rounded-full transition-colors cursor-pointer text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* File Name */}
          <div className="space-y-2">
            <label id="filename-label" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Filnavn</label>
            <div className="flex rounded-lg border border-[#2A2A2E] overflow-hidden focus-within:border-blue-500 transition-colors">
              <input
                id="export-filename-input"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 text-sm text-white outline-hidden bg-[#0A0A0B]"
                placeholder="Indtast filnavn"
              />
              <span className="bg-[#1D1D22] text-gray-450 text-sm font-medium px-3 py-2 border-l border-[#2A2A2E] select-none">
                .{format}
              </span>
            </div>
          </div>

          {/* Formats */}
          <div className="space-y-2">
            <label id="format-label" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Filformat</label>
            <div className="grid grid-cols-3 gap-2">
              {(['webp', 'png', 'jpeg'] as const).map((fmt) => (
                <button
                  key={fmt}
                  id={`format-btn-${fmt}`}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 px-3 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                    format === fmt
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-xxs'
                      : 'bg-[#1D1D22] text-gray-300 border-[#2A2A2E] hover:bg-[#2A2A2E]'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (JPEG / WebP only) */}
          {format !== 'png' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label id="quality-label" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Kvalitet</label>
                <span id="quality-percent-display" className="text-xs font-mono font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded">
                  {quality}%
                </span>
              </div>
              <input
                id="quality-slider"
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xxs text-gray-500">
                <span>Høj komprimering</span>
                <span>Bedste kvalitet</span>
              </div>
            </div>
          )}

          {/* Savings Estimate Box */}
          <div className="bg-[#0A0A0B] rounded-xl border border-[#2A2A2E] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Opløsning:</span>
              <span id="export-dimensions-display" className="text-xs font-mono font-bold text-blue-400">
                {exportWidth} &times; {exportHeight} px
                {exportScale === 2 && <span className="text-gray-500 font-medium"> (2&times;)</span>}
              </span>
            </div>

            {isSizeLimited && (
              <div
                id="export-size-limit-notice"
                className="flex items-start gap-2 pt-2 border-t border-dashed border-[#2A2A2E] text-xxs text-amber-400 leading-relaxed"
              >
                <AlertTriangle size={14} className="shrink-0 mt-px" />
                <span>
                  Denne enhed kan højst gemme billeder på ca. {maxMegapixels} MP. Billedet
                  gemmes derfor i {exportWidth} &times; {exportHeight} px i stedet for{' '}
                  {imageState.width * wantedScale} &times; {imageState.height * wantedScale} px.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-dashed border-[#2A2A2E]">
              <span className="text-xs text-gray-400 font-medium">Original størrelse:</span>
              <span id="original-size-display" className="text-xs font-mono font-medium text-gray-300">{formatSize(originalSize)}</span>
            </div>
            
            <div className="flex items-center justify-between pt-1 border-t border-dashed border-[#2A2A2E]">
              <span className="text-xs text-gray-400 font-medium">Ny størrelse (Estimat):</span>
              <span id="estimated-size-display" className="text-xs font-mono font-bold text-white">
                {isCalculating ? 'Beregner...' : exportSize ? formatSize(exportSize) : 'N/A'}
              </span>
            </div>

            {/* Savings Badge */}
            {!isCalculating && exportSize !== null && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400 font-medium">Besparelse:</span>
                <span 
                  id="savings-percentage-badge"
                  className={`text-xs font-bold px-2 py-0.5 rounded-sm ${
                    percentSavings > 0 
                      ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-500/20' 
                      : percentSavings < 0 
                        ? 'text-amber-400 bg-amber-950/20 border border-amber-500/20' 
                        : 'text-gray-400 bg-gray-900 border border-gray-800'
                  }`}
                >
                  {percentSavings > 0 
                    ? `${formatSize(originalSize)} -> ${formatSize(exportSize)} (-${percentSavings}%)` 
                    : percentSavings < 0 
                      ? `+${Math.abs(percentSavings)}% (Større)` 
                      : 'Ingen ændring'
                  }
                </span>
              </div>
            )}
          </div>

          {/* GDPR / Safety Notice */}
          <div className="flex items-start gap-2.5 bg-blue-950/20 border border-blue-500/20 rounded-xl p-3 text-xxs text-blue-400">
            <ShieldCheck className="text-blue-500 shrink-0" size={16} />
            <div className="leading-relaxed">
              <strong className="font-semibold block mb-0.5">GDPR og privatliv beskyttet</strong>
              Alle EXIF metadata (såsom GPS-koordinater, dato og kameramodel) fjernes automatisk for at beskytte dit privatliv.
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-[#111115] border-t border-[#2A2A2E] flex items-center justify-end gap-3">
          <button
            id="cancel-export-button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#2A2A2E] rounded-lg transition-colors cursor-pointer"
          >
            Annuller
          </button>
          <button
            id="confirm-download-button"
            onClick={handleDownload}
            disabled={isCalculating}
            className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
              isCalculating ? 'bg-blue-400/55 cursor-not-allowed text-gray-300' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            <Download size={16} />
            Download
          </button>
        </div>

      </div>
    </div>
  );
}
