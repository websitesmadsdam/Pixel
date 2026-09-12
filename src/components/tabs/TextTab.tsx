import React, { useState } from 'react';
import { Layers, Trash2 } from 'lucide-react';
import { ImageState, TextOverlay } from '../../types';

interface TextTabProps {
  imageState: ImageState;
  setImageState: (updater: (prev: ImageState) => ImageState) => void;
  selectedTextId: string | null;
  setSelectedTextId: (id: string | null) => void;
}

export default function TextTab({
  imageState,
  setImageState,
  selectedTextId,
  setSelectedTextId,
}: TextTabProps) {
  const [newText, setNewText] = useState<string>('');

  const handleAddText = () => {
    if (!newText.trim()) return;
    const added: TextOverlay = {
      id: Math.random().toString(36).substring(2, 9),
      text: newText,
      x: 50,
      y: 50,
      fontSize: 48,
      color: '#FFFFFF',
      fontFamily: 'Inter',
      opacity: 1,
    };
    setImageState((prev) => ({ ...prev, texts: [...prev.texts, added] }));
    setSelectedTextId(added.id);
    setNewText('');
  };

  const handleTextChange = (id: string, updates: Partial<TextOverlay>) => {
    setImageState((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const handleDeleteText = (id: string) => {
    setImageState((prev) => ({ ...prev, texts: prev.texts.filter((t) => t.id !== id) }));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      setImageState((prev) => ({
        ...prev,
        watermarks: [
          {
            id: Math.random().toString(36).substring(2, 9),
            imageUrl: event.target!.result as string,
            x: 80,
            y: 80,
            width: 15,
            opacity: 0.7,
          },
        ],
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeWatermark = () => {
    setImageState((prev) => ({ ...prev, watermarks: [] }));
  };

  return (
    <div id="tab-panel-text" className="space-y-5">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Tilføj tekst og logo</h3>

      {/* Sub-tabs for Text vs Watermark */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Ny tekst</span>
        <div className="flex gap-2">
          <input
            id="add-text-input"
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
            placeholder="Skriv tekst her..."
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#2A2A2E] rounded-lg focus:outline-hidden focus:border-indigo-500 dark:focus:border-blue-500 dark:text-white"
          />
          <button
            id="add-text-btn"
            onClick={handleAddText}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
          >
            Tilføj
          </button>
        </div>
      </div>

      {/* List of active texts with parameters */}
      {imageState.texts.length > 0 && (
        <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-[#2A2A2E]">
          <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Rediger tekstlag</span>
          
          <div className="space-y-3">
            {imageState.texts.map((t) => {
              const isEditingThis = selectedTextId === t.id;
              return (
                <div 
                  key={t.id} 
                  id={`text-layer-${t.id}`}
                  className={`p-3 rounded-lg border transition-all ${
                    isEditingThis ? 'bg-indigo-50/50 dark:bg-blue-600/10 border-indigo-200 dark:border-blue-500/30' : 'bg-slate-50 dark:bg-[#0A0A0B] border-slate-150 dark:border-[#2A2A2E]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <button
                      onClick={() => setSelectedTextId(isEditingThis ? null : t.id)}
                      className="text-xs font-bold text-slate-800 dark:text-white truncate text-left focus:outline-hidden flex-1"
                    >
                      &ldquo;{t.text}&rdquo;
                    </button>
                    <button
                      id={`delete-text-${t.id}`}
                      onClick={() => handleDeleteText(t.id)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 rounded-sm cursor-pointer shrink-0 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {isEditingThis && (
                    <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-[#2A2A2E]">
                      {/* Font Family */}
                      <div className="space-y-1">
                        <label id={`text-font-label-${t.id}`} className="text-xxs font-medium text-slate-400 dark:text-gray-400">Skrifttype</label>
                        <select
                          id={`text-font-select-${t.id}`}
                          value={t.fontFamily}
                          onChange={(e) => handleTextChange(t.id, { fontFamily: e.target.value })}
                          className="w-full px-2 py-1 bg-white dark:bg-[#16161A] border border-slate-200 dark:border-[#2A2A2E] rounded text-xs dark:text-white"
                        >
                          <option value="Inter">Inter (Sans)</option>
                          <option value="Space Grotesk">Space Grotesk (Tech)</option>
                          <option value="JetBrains Mono">JetBrains Mono (Mono)</option>
                          <option value="Playfair Display">Playfair Display (Serif)</option>
                        </select>
                      </div>

                      {/* Font Size slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xxs font-medium text-slate-500 dark:text-gray-400">
                          <span>Størrelse</span>
                          <span className="font-bold">{t.fontSize} px</span>
                        </div>
                        <input
                          id={`text-size-slider-${t.id}`}
                          type="range"
                          min="12"
                          max="150"
                          value={t.fontSize}
                          onChange={(e) => handleTextChange(t.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full h-1 bg-slate-200 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>

                      {/* Opacity slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xxs font-medium text-slate-500 dark:text-gray-400">
                          <span>Gennemsigtighed</span>
                          <span className="font-bold">{Math.round(t.opacity * 100)}%</span>
                        </div>
                        <input
                          id={`text-opacity-slider-${t.id}`}
                          type="range"
                          min="10"
                          max="100"
                          value={t.opacity * 100}
                          onChange={(e) => handleTextChange(t.id, { opacity: parseInt(e.target.value) / 100 })}
                          className="w-full h-1 bg-slate-200 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>

                      {/* Position X percentage */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-xxs font-medium text-slate-500 dark:text-gray-400 block">Vandret (%)</span>
                          <input
                            id={`text-x-input-${t.id}`}
                            type="number"
                            min="0"
                            max="100"
                            value={t.x}
                            onChange={(e) => handleTextChange(t.id, { x: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                            className="w-full px-2 py-1 bg-white dark:bg-[#16161A] border border-slate-200 dark:border-[#2A2A2E] rounded text-xs font-mono dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xxs font-medium text-slate-500 dark:text-gray-400 block">Lodret (%)</span>
                          <input
                            id={`text-y-input-${t.id}`}
                            type="number"
                            min="0"
                            max="100"
                            value={t.y}
                            onChange={(e) => handleTextChange(t.id, { y: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                            className="w-full px-2 py-1 bg-white dark:bg-[#16161A] border border-slate-200 dark:border-[#2A2A2E] rounded text-xs font-mono dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Color presets */}
                      <div className="space-y-1">
                        <span className="text-xxs font-medium text-slate-400 dark:text-gray-400 block">Farve</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['#FFFFFF', '#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1'].map((c) => (
                            <button
                              key={c}
                              id={`text-color-swatch-${t.id}-${c}`}
                              onClick={() => handleTextChange(t.id, { color: c })}
                              className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                                t.color === c ? 'border-blue-500 scale-110 shadow-xxs' : 'border-slate-300 dark:border-[#2A2A2E]'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WATERMARK SECTION */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-[#2A2A2E]">
        <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Tilføj logo / vandmærke</span>
        
        {imageState.watermarks.length === 0 ? (
          <div>
            <label 
              id="logo-watermark-upload-label"
              className="flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-[#2A2A2E] rounded-lg p-4 bg-slate-50 dark:bg-[#0A0A0B] hover:bg-slate-100/50 dark:hover:bg-[#16161A]/50 cursor-pointer transition-colors"
            >
              <Layers className="text-slate-400 mb-1.5" size={18} />
              <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Klik for at uploade logo-billede</span>
              <input
                id="logo-watermark-file-input"
                type="file"
                accept="image/*"
                onChange={handleWatermarkUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div id="watermark-settings-box" className="p-3 bg-indigo-50/50 dark:bg-[#0A0A0B] border border-indigo-100 dark:border-[#2A2A2E] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-white">Logo-indstillinger</span>
              <button
                id="remove-watermark-btn"
                onClick={removeWatermark}
                className="text-xxs text-red-600 hover:text-red-800 dark:text-red-400 font-bold underline cursor-pointer"
              >
                Fjern logo
              </button>
            </div>

            {/* Logo Width */}
            <div className="space-y-1">
              <div className="flex justify-between text-xxs font-medium text-slate-500 dark:text-gray-400">
                <span>Bredde</span>
                <span className="font-bold">{imageState.watermarks[0].width}%</span>
              </div>
              <input
                id="watermark-width-slider"
                type="range"
                min="5"
                max="50"
                value={imageState.watermarks[0].width}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setImageState(prev => ({
                    ...prev,
                    watermarks: prev.watermarks.map(wm => ({ ...wm, width: val }))
                  }));
                }}
                className="w-full h-1 bg-slate-200 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Logo Opacity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xxs font-medium text-slate-500 dark:text-gray-400">
                <span>Gennemsigtighed</span>
                <span className="font-bold">{Math.round(imageState.watermarks[0].opacity * 100)}%</span>
              </div>
              <input
                id="watermark-opacity-slider"
                type="range"
                min="10"
                max="100"
                value={imageState.watermarks[0].opacity * 100}
                onChange={(e) => {
                  const val = parseInt(e.target.value) / 100;
                  setImageState(prev => ({
                    ...prev,
                    watermarks: prev.watermarks.map(wm => ({ ...wm, opacity: val }))
                  }));
                }}
                className="w-full h-1 bg-slate-200 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-xxs font-medium text-slate-500 dark:text-gray-400 block">Vandret (%)</span>
                <input
                  id="watermark-x-input"
                  type="number"
                  min="0"
                  max="100"
                  value={imageState.watermarks[0].x}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                    setImageState(prev => ({
                      ...prev,
                      watermarks: prev.watermarks.map(wm => ({ ...wm, x: val }))
                    }));
                  }}
                  className="w-full px-2 py-1 bg-white dark:bg-[#16161A] border border-slate-200 dark:border-[#2A2A2E] rounded text-xs font-mono dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xxs font-medium text-slate-500 dark:text-gray-400 block">Lodret (%)</span>
                <input
                  id="watermark-y-input"
                  type="number"
                  min="0"
                  max="100"
                  value={imageState.watermarks[0].y}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                    setImageState(prev => ({
                      ...prev,
                      watermarks: prev.watermarks.map(wm => ({ ...wm, y: val }))
                    }));
                  }}
                  className="w-full px-2 py-1 bg-white dark:bg-[#16161A] border border-slate-200 dark:border-[#2A2A2E] rounded text-xs font-mono dark:text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
