import React from 'react';
import { 
  Undo2, 
  Redo2, 
  RotateCcw, 
  Upload, 
  Download,
  Moon,
  Sun
} from 'lucide-react';

interface HeaderProps {
  fileName: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onReset: () => void;
  onUploadNew: () => void;
  onExport: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
}

export default function Header({
  fileName,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onReset,
  onUploadNew,
  onExport,
  isDarkMode,
  setIsDarkMode,
}: HeaderProps) {
  return (
    <header id="header-toolbar" className={`h-14 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 select-none transition-colors duration-200 ${
      isDarkMode ? 'bg-[#16161A] border-[#2A2A2E] text-white' : 'bg-white border-slate-200 text-slate-850'
    }`}>
      
      {/* Logo & Filename */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex gap-1.5 shrink-0 items-center">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center shadow-md">
            <span className="text-white text-[10px] font-bold font-mono">MP</span>
          </div>
          <span className="font-bold tracking-tight text-sm hidden sm:inline">myPhoto</span>
        </div>
        
        {/* Divider */}
        <div className="h-4 w-px bg-slate-200 dark:bg-[#2A2A2E] hidden sm:block" />

        {/* Filename */}
        <span 
          id="current-filename" 
          className={`text-xs font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs ${
            isDarkMode ? 'text-gray-400' : 'text-slate-600'
          }`}
          title={fileName}
        >
          {fileName}
        </span>
      </div>

      {/* Undo, Redo, Reset Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo */}
        <button
          id="undo-action-button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Fortryd (Ctrl+Z)"
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            canUndo 
              ? isDarkMode ? 'text-white hover:bg-[#2A2A2E]' : 'text-slate-700 hover:bg-slate-100' 
              : 'text-slate-300 dark:text-[#4A4A4F] cursor-not-allowed'
          }`}
        >
          <Undo2 size={16} />
        </button>

        {/* Redo */}
        <button
          id="redo-action-button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Gendan (Ctrl+Y)"
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            canRedo 
              ? isDarkMode ? 'text-white hover:bg-[#2A2A2E]' : 'text-slate-700 hover:bg-slate-100' 
              : 'text-slate-300 dark:text-[#4A4A4F] cursor-not-allowed'
          }`}
        >
          <Redo2 size={16} />
        </button>

        {/* Reset */}
        <button
          id="reset-original-button"
          onClick={onReset}
          title="Tilbage til originalen"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
            isDarkMode 
              ? 'text-gray-300 hover:text-white hover:bg-[#2A2A2E]' 
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <RotateCcw size={14} />
          <span className="hidden md:inline">Tilbage til originalen</span>
        </button>
      </div>

      {/* Upload New & Export */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          id="theme-toggle-button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? 'Skift til lyst tema' : 'Skift til mørkt tema'}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDarkMode ? 'text-amber-400 hover:bg-[#2A2A2E]' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* New image upload trigger */}
        <button
          id="upload-new-image-btn"
          onClick={onUploadNew}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
            isDarkMode 
              ? 'border-[#2A2A2E] text-gray-300 hover:text-white hover:bg-[#2A2A2E]' 
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Upload size={14} />
          <span className="hidden sm:inline">Nyt billede</span>
        </button>

        {/* Export button */}
        <button
          id="export-image-btn"
          onClick={onExport}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Download size={14} />
          <span>Eksporter</span>
        </button>
      </div>

    </header>
  );
}
