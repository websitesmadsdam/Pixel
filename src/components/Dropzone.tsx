import React, { useRef } from 'react';
import { 
  Upload, 
  Maximize2, 
  FileArchive, 
  RefreshCw, 
  Crop, 
  Sliders, 
  Type, 
  Sparkles, 
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface DropzoneProps {
  onImageSelected: (file: File) => void;
  onLoadSample: () => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
}

export default function Dropzone({ 
  onImageSelected, 
  onLoadSample, 
  errorMessage,
  setErrorMessage
}: DropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      // Step 2 Verification requirement: "Upload af tekstfil -> afvist med pæn fejlbesked"
      setErrorMessage('Den uploadede fil er ikke et gyldigt billede. myPhoto understøtter kun billedfiler (JPEG, PNG, WebP, GIF, AVIF, BMP, SVG).');
      return;
    }
    onImageSelected(file);
  };

  return (
    <div id="dropzone-container" className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0F0F11] text-slate-900 dark:text-gray-300 py-12 px-4 sm:px-6">
      <div className="max-w-4xl w-full text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="grid grid-cols-2 gap-1 w-8 h-8">
            <div className="bg-amber-500 rounded-sm"></div>
            <div className="bg-red-500 rounded-sm"></div>
            <div className="bg-indigo-500 rounded-sm"></div>
            <div className="bg-emerald-500 rounded-sm"></div>
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">myPhoto</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Gratis billedværktøj, der kører 100% i din browser
        </h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
          🔒 Dine billeder bliver på din computer og uploades aldrig til nogen server. Smertefrit og GDPR-sikkert.
        </p>
      </div>

      {/* Main Upload Box */}
      <div 
        id="upload-dropzone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="w-full max-w-xl bg-white dark:bg-[#16161A] rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#2A2A2E] hover:border-indigo-500 dark:hover:border-blue-500 transition-colors duration-250 p-8 sm:p-12 text-center shadow-md dark:shadow-none relative"
      >
        <input 
          id="file-input-field"
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-[#2A2A2E] text-indigo-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <Upload size={32} />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1">
            Slip et billede her
          </h2>
          <p className="text-slate-400 dark:text-gray-500 text-xs sm:text-sm mb-6">
            eller indsæt med <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#2A2A2E] rounded text-xs">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#2A2A2E] rounded text-xs">Cmd+V</kbd>
          </p>

          <button
            id="select-file-button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            Vælg billede
          </button>

          <p className="text-slate-400 dark:text-gray-500 text-xxs sm:text-xs mt-4">
            JPG, PNG, WebP, GIF, AVIF, BMP eller SVG
          </p>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#2A2A2E] w-full flex justify-center">
            <button
              id="load-sample-button"
              onClick={onLoadSample}
              className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-500 animate-pulse" />
              Prøv med et testbillede (med EXIF & GPS)
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div id="error-message-box" className="mt-6 max-w-xl w-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={18} />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-200 text-sm">Fejl ved indlæsning</h3>
            <p className="text-red-700 dark:text-red-400 text-xs mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Grid of features */}
      <div className="max-w-4xl w-full mt-16">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500 text-center mb-8">
          DET KAN DU MED MYPHOTO
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#16161A] p-5 rounded-xl border border-slate-150 dark:border-[#2A2A2E] shadow-xs dark:shadow-none flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-[#2A2A2E] text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <Maximize2 size={20} />
            </div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-white mb-1">Skaler og tilpas</h4>
            <p className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed">Eksakte pixels, procent eller færdige formater til sociale medier.</p>
          </div>

          <div className="bg-white dark:bg-[#16161A] p-5 rounded-xl border border-slate-150 dark:border-[#2A2A2E] shadow-xs dark:shadow-none flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-[#2A2A2E] text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
              <FileArchive size={20} />
            </div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-white mb-1">Komprimer</h4>
            <p className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed">Skru på kvaliteten og se filstørrelsen falde med det samme lokalt.</p>
          </div>

          <div className="bg-white dark:bg-[#16161A] p-5 rounded-xl border border-slate-150 dark:border-[#2A2A2E] shadow-xs dark:shadow-none flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#2A2A2E] text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <RefreshCw size={20} />
            </div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-white mb-1">Konverter</h4>
            <p className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed">PNG, JPG og WebP frem og tilbage med ét enkelt klik.</p>
          </div>

          <div className="bg-white dark:bg-[#16161A] p-5 rounded-xl border border-slate-150 dark:border-[#2A2A2E] shadow-xs dark:shadow-none flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-[#2A2A2E] text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Crop size={20} />
            </div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-white mb-1">Beskær og rotér</h4>
            <p className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed">Frihånd eller faste forhold som 1:1 og 16:9. Spejl og rotér frit.</p>
          </div>

          <div className="bg-white dark:bg-[#16161A] p-5 rounded-xl border border-slate-150 dark:border-[#2A2A2E] shadow-xs dark:shadow-none flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-[#2A2A2E] text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
              <Sliders size={20} />
            </div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-white mb-1">Justér og filtrér</h4>
            <p className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed">Lys, kontrast, mætning, skarphed og smukke stemningsfiltre.</p>
          </div>

          <div className="bg-white dark:bg-[#16161A] p-5 rounded-xl border border-slate-150 dark:border-[#2A2A2E] shadow-xs dark:shadow-none flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-[#2A2A2E] text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3">
              <Type size={20} />
            </div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-white mb-1">Tekst og vandmærke</h4>
            <p className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed">Læg tekst eller dit logo ovenpå, f.eks. som copyright-mærke.</p>
          </div>

          <div className="bg-white dark:bg-[#16161A] p-5 rounded-xl border border-slate-150 dark:border-[#2A2A2E] shadow-xs dark:shadow-none flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-[#2A2A2E] text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <Sparkles size={20} />
            </div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-white mb-1">Fjern baggrund</h4>
            <p className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed">Fritlæg motivet direkte i browseren, uden upload til ekstern server.</p>
          </div>

          <div className="bg-white dark:bg-[#16161A] p-5 rounded-xl border border-slate-150 dark:border-[#2A2A2E] shadow-xs dark:shadow-none flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#2A2A2E] text-slate-600 dark:text-gray-400 flex items-center justify-center mb-3">
              <EyeOff size={20} />
            </div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-white mb-1">Fjern metadata</h4>
            <p className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed">GPS-position, kameradata og tidsstempler fjernes automatisk ved download.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
