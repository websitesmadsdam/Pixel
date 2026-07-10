import React, { useState, useEffect } from 'react';
import { Download, X, FileImage, ShieldCheck } from 'lucide-react';

interface ExportModalProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  originalSize: number; // in bytes
  originalName: string;
  onClose: () => void;
}

export default function ExportModal({
  canvasRef,
  originalSize,
  originalName,
  onClose,
}: ExportModalProps) {
  const [format, setFormat] = useState<'webp' | 'png' | 'jpeg'>('webp');
  const [quality, setQuality] = useState<number>(80); // 0 - 100
  const [exportSize, setExportSize] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  // Set default filename without original extension
  useEffect(() => {
    const dotIndex = originalName.lastIndexOf('.');
    const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
    setFileName(`${baseName}_pixel`);
  }, [originalName]);

  // Dynamically calculate actual export size in bytes using canvas.toBlob
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsCalculating(true);
    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const qualityParam = format === 'png' ? undefined : quality / 100;

    // Run in short timeout to prevent UI stutter
    const timer = setTimeout(() => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setExportSize(blob.size);
          }
          setIsCalculating(false);
        },
        mimeType,
        qualityParam
      );
    }, 150);

    return () => clearTimeout(timer);
  }, [format, quality, canvasRef]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const qualityParam = format === 'png' ? undefined : quality / 100;

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
      qualityParam
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
