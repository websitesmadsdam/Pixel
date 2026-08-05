import React, { useState, useEffect } from 'react';
import { 
  Maximize2, 
  Crop, 
  RotateCw, 
  Sliders, 
  Sparkles, 
  Type, 
  FileArchive, 
  ArrowUpRight, 
  Info,
  Layers,
  Trash2,
  Lock,
  Unlock,
  Check,
  Eye,
  Globe,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { 
  ToolTab, 
  ImageState, 
  Adjustments, 
  FilterType, 
  TextOverlay, 
  ExifData 
} from '../types';

interface SidebarProps {
  activeTab: ToolTab;
  setActiveTab: (tab: ToolTab) => void;
  imageState: ImageState;
  setImageState: (updater: (prev: ImageState) => ImageState) => void;
  onApplyCrop: () => void;
  onResetCrop: () => void;
  cropAspectRatio: 'free' | '1:1' | '16:9' | '3:4';
  setCropAspectRatio: (ratio: 'free' | '1:1' | '16:9' | '3:4') => void;
  exifData: ExifData;
  onTriggerBackgroundRemoval: () => void;
  isBgRemoving: boolean;
  bgRemovalProgress: string;
  isDarkMode: boolean;
  selectedTextId?: string | null;
  setSelectedTextId?: (id: string | null) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  imageState,
  setImageState,
  onApplyCrop,
  onResetCrop,
  cropAspectRatio,
  setCropAspectRatio,
  exifData,
  onTriggerBackgroundRemoval,
  isBgRemoving,
  bgRemovalProgress,
  isDarkMode,
  selectedTextId: propSelectedTextId,
  setSelectedTextId: propSetSelectedTextId,
}: SidebarProps) {
  
  // Tab list
  const tabs = [
    { id: 'size' as ToolTab, name: 'Størrelse', icon: Maximize2 },
    { id: 'crop' as ToolTab, name: 'Beskær', icon: Crop },
    { id: 'rotate' as ToolTab, name: 'Rotér', icon: RotateCw },
    { id: 'adjust' as ToolTab, name: 'Justér', icon: Sliders },
    { id: 'filter' as ToolTab, name: 'Filtre', icon: Layers },
    { id: 'text' as ToolTab, name: 'Tekst', icon: Type },
    { id: 'background' as ToolTab, name: 'Baggrund', icon: Sparkles },
    { id: 'upscale' as ToolTab, name: 'Opskalér', icon: ArrowUpRight },
    { id: 'metadata' as ToolTab, name: 'Metadata', icon: Info },
  ];

  // RESIZE STATES
  const [resizeWidth, setResizeWidth] = useState<string>(imageState.width.toString());
  const [resizeHeight, setResizeHeight] = useState<string>(imageState.height.toString());
  const [maintainRatio, setMaintainRatio] = useState<boolean>(true);
  const [resizeError, setResizeError] = useState<string | null>(null);

  useEffect(() => {
    setResizeWidth(imageState.width.toString());
    setResizeHeight(imageState.height.toString());
  }, [imageState.width, imageState.height]);

  const handleWidthChange = (val: string) => {
    setResizeWidth(val);
    setResizeError(null);
    const parsedWidth = parseInt(val);
    if (!isNaN(parsedWidth) && parsedWidth > 0 && maintainRatio) {
      const ratio = imageState.originalWidth / imageState.originalHeight;
      const computedHeight = Math.round(parsedWidth / ratio);
      setResizeHeight(computedHeight.toString());
    }
  };

  const handleHeightChange = (val: string) => {
    setResizeHeight(val);
    setResizeError(null);
    const parsedHeight = parseInt(val);
    if (!isNaN(parsedHeight) && parsedHeight > 0 && maintainRatio) {
      const ratio = imageState.originalWidth / imageState.originalHeight;
      const computedWidth = Math.round(parsedHeight * ratio);
      setResizeWidth(computedWidth.toString());
    }
  };

  const applyResize = () => {
    const w = parseInt(resizeWidth);
    const h = parseInt(resizeHeight);

    // Step 4 requirement check: "Bredde "0" -> fandt en bug: blev klampet til 1x1 px og anvendt. Rettet, så ugyldige værdier nu afvises"
    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0) {
      setResizeError('Bredde og højde skal være større end 0 pixels.');
      return;
    }

    setImageState(prev => ({
      ...prev,
      width: w,
      height: h
    }));
  };

  const applyPresetFormat = (targetW: number, targetH: number) => {
    setResizeError(null);
    setResizeWidth(targetW.toString());
    setResizeHeight(targetH.toString());
    setImageState(prev => ({
      ...prev,
      width: targetW,
      height: targetH
    }));
  };

  const applyPercentResize = (factor: number) => {
    setResizeError(null);
    const targetW = Math.round(imageState.originalWidth * factor);
    const targetH = Math.round(imageState.originalHeight * factor);
    setResizeWidth(targetW.toString());
    setResizeHeight(targetH.toString());
    setImageState(prev => ({
      ...prev,
      width: targetW,
      height: targetH
    }));
  };

  // ADJUSTMENTS HELPERS
  const handleAdjustmentChange = (key: keyof Adjustments, value: number) => {
    setImageState(prev => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        [key]: value
      }
    }));
  };

  const resetAdjustments = () => {
    setImageState(prev => ({
      ...prev,
      adjustments: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        warmth: 0,
        sharpness: 0,
        blur: 0,
        vignette: 0
      }
    }));
  };

  // TEXT STATES
  const [newText, setNewText] = useState<string>('');
  const [localSelectedTextId, setLocalSelectedTextId] = useState<string | null>(null);

  const selectedTextId = propSelectedTextId !== undefined ? propSelectedTextId : localSelectedTextId;
  const setSelectedTextId = propSetSelectedTextId !== undefined ? propSetSelectedTextId : setLocalSelectedTextId;

  const handleAddText = () => {
    if (!newText.trim()) return;
    const added: TextOverlay = {
      id: Math.random().toString(36).substring(2, 9),
      text: newText,
      x: 50, // center
      y: 50, // center
      fontSize: 48,
      color: '#FFFFFF',
      fontFamily: 'Inter',
      opacity: 1
    };
    setImageState(prev => ({
      ...prev,
      texts: [...prev.texts, added]
    }));
    setSelectedTextId(added.id);
    setNewText('');
  };

  const handleTextChange = (id: string, updates: Partial<TextOverlay>) => {
    setImageState(prev => ({
      ...prev,
      texts: prev.texts.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const handleDeleteText = (id: string) => {
    setImageState(prev => ({
      ...prev,
      texts: prev.texts.filter(t => t.id !== id)
    }));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  // WATERMARK LOGO
  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const wmUrl = event.target.result as string;
          setImageState(prev => ({
            ...prev,
            watermarks: [
              {
                id: Math.random().toString(36).substring(2, 9),
                imageUrl: wmUrl,
                x: 80,
                y: 80,
                width: 15,
                opacity: 0.7
              }
            ]
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeWatermark = () => {
    setImageState(prev => ({
      ...prev,
      watermarks: []
    }));
  };

  return (
    <div id="sidebar-layout-container" className="w-full md:w-80 bg-white dark:bg-[#16161A] border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#2A2A2E] flex flex-col md:h-[calc(100vh-56px)] shrink-0 select-none">
      
      {/* Category selector (desktop side, mobile top horizontal) */}
      <div id="sidebar-tabs-container" className="flex md:flex-wrap overflow-x-auto md:overflow-x-visible border-b border-slate-100 dark:border-[#2A2A2E] bg-slate-50 dark:bg-[#121215] p-1 md:p-2 gap-1 scrollbar-none shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`sidebar-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap md:w-full ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-sm font-bold' 
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-150 dark:hover:bg-[#2A2A2E] hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tools detail area */}
      <div id="sidebar-tools-panel" className="flex-1 p-5 overflow-y-auto space-y-6">
        
        {/* ===================== SIZE TAB ===================== */}
        {activeTab === 'size' && (
          <div id="tab-panel-size" className="space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Skaler og tilpas</h3>
            <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
              Billedets nuværende opløsning: <span className="font-mono font-bold text-indigo-600 dark:text-blue-400">{imageState.width} &times; {imageState.height} px</span>
            </p>

            {/* Error message */}
            {resizeError && (
              <div id="resize-error-alert" className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-lg text-xs flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{resizeError}</span>
              </div>
            )}

            {/* Exact Pixels Form */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Eksakte pixels</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="resize-width-input" className="text-xxs font-medium text-slate-400 dark:text-gray-400">Bredde</label>
                  <input
                    id="resize-width-input"
                    type="number"
                    value={resizeWidth}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#2A2A2E] rounded-lg focus:outline-hidden focus:border-indigo-500 dark:focus:border-blue-500 font-mono dark:text-white"
                    min="1"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="resize-height-input" className="text-xxs font-medium text-slate-400 dark:text-gray-400">Højde</label>
                  <input
                    id="resize-height-input"
                    type="number"
                    value={resizeHeight}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#2A2A2E] rounded-lg focus:outline-hidden focus:border-indigo-500 dark:focus:border-blue-500 font-mono dark:text-white"
                    min="1"
                  />
                </div>
              </div>

              {/* Maintain aspect ratio checkbox */}
              <label id="bevar-forhold-label" className="flex items-center gap-2 cursor-pointer py-1 select-none">
                <input
                  id="bevar-forhold-checkbox"
                  type="checkbox"
                  checked={maintainRatio}
                  onChange={(e) => setMaintainRatio(e.target.checked)}
                  className="rounded border-slate-300 dark:border-[#2A2A2E] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">Bevar forhold</span>
              </label>

              <button
                id="apply-resize-btn"
                onClick={applyResize}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                Anvend størrelse
              </button>
            </div>

            {/* Percentages */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2A2A2E]">
              <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Procent</span>
              <div className="grid grid-cols-3 gap-2">
                {[0.25, 0.50, 0.75].map((factor) => (
                  <button
                    key={factor}
                    id={`percent-resize-${factor * 100}`}
                    onClick={() => applyPercentResize(factor)}
                    className="py-1.5 px-3 bg-slate-50 dark:bg-[#2A2A2E] border border-slate-200 dark:border-[#2A2A2E] hover:bg-slate-100 dark:hover:bg-[#34343A] text-slate-600 dark:text-gray-300 rounded-lg text-xs font-medium font-mono transition-colors cursor-pointer"
                  >
                    {factor * 100}%
                  </button>
                ))}
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2A2A2E]">
              <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Færdige formater</span>
              <div className="space-y-2">
                {[
                  { name: 'Facebook-opslag', w: 1200, h: 630 },
                  { name: 'Instagram kvadrat', w: 1080, h: 1080 },
                  { name: 'LinkedIn-cover', w: 1584, h: 396 },
                  { name: 'Twitter-post (16:9)', w: 1600, h: 900 }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    id={`preset-size-${preset.name.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => applyPresetFormat(preset.w, preset.h)}
                    className="w-full text-left px-3 py-2 bg-slate-50 dark:bg-[#1C1C21] hover:bg-slate-100 dark:hover:bg-[#25252B] border border-slate-150 dark:border-[#2A2A2E] rounded-lg flex items-center justify-between text-xs text-slate-600 dark:text-gray-300 transition-colors cursor-pointer"
                  >
                    <span className="font-medium text-slate-700 dark:text-gray-300">{preset.name}</span>
                    <span className="font-mono text-xxs text-indigo-500 dark:text-blue-400">{preset.w} &times; {preset.h} px</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== CROP TAB ===================== */}
        {activeTab === 'crop' && (
          <div id="tab-panel-crop" className="space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Beskær billedet</h3>
            <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
              Vælg et fast formatforhold eller tilpas helt frihånd ved at trække i hjørnerne af beskæringsrammen på previewet.
            </p>

            {/* Aspect ratios */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Formatforhold</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'free' as const, name: 'Frihånd' },
                  { id: '1:1' as const, name: '1:1 Kvadrat' },
                  { id: '16:9' as const, name: '16:9 Skærm' },
                  { id: '3:4' as const, name: '3:4 Portræt' }
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    id={`crop-aspect-${ratio.id}`}
                    onClick={() => setCropAspectRatio(ratio.id)}
                    className={`py-2 px-3 border text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                      cropAspectRatio === ratio.id
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-blue-600/20 dark:border-blue-500/50 dark:text-blue-400 shadow-xxs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#2A2A2E] dark:border-[#2A2A2E] dark:text-gray-300 dark:hover:bg-[#34343A]'
                    }`}
                  >
                    {ratio.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Runde hjørner */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#2A2A2E]">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-gray-400">
                <span className="uppercase tracking-wider">Runde hjørner</span>
                <span id="corners-val-label" className="font-mono font-bold text-indigo-600 dark:text-blue-400">
                  {imageState.cornerRadius || 0}%
                </span>
              </div>
              <input
                id="slider-corners"
                type="range"
                min="0"
                max="50"
                step="1"
                value={imageState.cornerRadius || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setImageState(prev => ({ ...prev, cornerRadius: val }));
                }}
                className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600 animate-pulse-once"
              />
              <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
                Gør billedets hjørner bløde og afrundede. Ved 50% bliver et kvadratisk billede helt cirkulært.
              </p>
            </div>

            {/* Crop Actions */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2A2A2E] flex flex-col gap-2">
              <button
                id="apply-crop-btn"
                onClick={onApplyCrop}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Anvend beskæring
              </button>
              <button
                id="reset-crop-btn"
                onClick={onResetCrop}
                className="w-full py-2 bg-slate-100 dark:bg-[#2A2A2E] hover:bg-slate-200 dark:hover:bg-[#34343A] text-slate-600 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Gendan original størrelse
              </button>
            </div>
          </div>
        )}

        {/* ===================== ROTATE TAB ===================== */}
        {activeTab === 'rotate' && (
          <div id="tab-panel-rotate" className="space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Beskær og rotér</h3>
            <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
              Drej dit billede i 90-graders intervaller eller spejlvend det vandret eller lodret.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="rotate-right-btn"
                onClick={() => setImageState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
                className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-[#2A2A2E] dark:border-[#2A2A2E] dark:text-gray-300 dark:hover:bg-[#34343A] rounded-lg text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw size={18} />
                Drej 90°
              </button>
              <button
                id="rotate-left-btn"
                onClick={() => setImageState(prev => ({ ...prev, rotation: (prev.rotation + 270) % 360 }))}
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
                  onClick={() => setImageState(prev => ({ ...prev, flipHorizontal: !prev.flipHorizontal }))}
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
                  onClick={() => setImageState(prev => ({ ...prev, flipVertical: !prev.flipVertical }))}
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
        )}

        {/* ===================== ADJUST TAB ===================== */}
        {activeTab === 'adjust' && (
          <div id="tab-panel-adjust" className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Justering</h3>
              <button
                id="reset-adjustments-btn"
                onClick={resetAdjustments}
                className="text-xxs text-indigo-600 dark:text-blue-400 hover:text-indigo-800 dark:hover:text-blue-300 font-bold underline cursor-pointer"
              >
                Nulstil
              </button>
            </div>

            <div className="space-y-4">
              {/* Brightness - TAB SELECTABLE & KEYBOARD FOCUSABLE FOR STEP 5 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
                  <label htmlFor="slider-brightness">Lysstyrke</label>
                  <span id="brightness-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.brightness}%</span>
                </div>
                <input
                  id="slider-brightness"
                  type="range"
                  min="0"
                  max="200"
                  step="1"
                  value={imageState.adjustments.brightness}
                  onChange={(e) => handleAdjustmentChange('brightness', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
                  tabIndex={0} // Ensure keyboard access for step 5
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
                  <label htmlFor="slider-contrast">Kontrast</label>
                  <span id="contrast-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.contrast}%</span>
                </div>
                <input
                  id="slider-contrast"
                  type="range"
                  min="0"
                  max="200"
                  step="1"
                  value={imageState.adjustments.contrast}
                  onChange={(e) => handleAdjustmentChange('contrast', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
                  <label htmlFor="slider-saturation">Mætning</label>
                  <span id="saturation-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.saturation}%</span>
                </div>
                <input
                  id="slider-saturation"
                  type="range"
                  min="0"
                  max="200"
                  step="1"
                  value={imageState.adjustments.saturation}
                  onChange={(e) => handleAdjustmentChange('saturation', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Warmth */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
                  <label htmlFor="slider-warmth">Varme</label>
                  <span id="warmth-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">
                    {imageState.adjustments.warmth > 0 ? `+${imageState.adjustments.warmth}` : imageState.adjustments.warmth}
                  </span>
                </div>
                <input
                  id="slider-warmth"
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={imageState.adjustments.warmth}
                  onChange={(e) => handleAdjustmentChange('warmth', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Sharpness */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
                  <label htmlFor="slider-sharpness">Skarphed</label>
                  <span id="sharpness-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.sharpness}%</span>
                </div>
                <input
                  id="slider-sharpness"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={imageState.adjustments.sharpness}
                  onChange={(e) => handleAdjustmentChange('sharpness', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Blur */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
                  <label htmlFor="slider-blur">Sløring</label>
                  <span id="blur-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.blur}%</span>
                </div>
                <input
                  id="slider-blur"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={imageState.adjustments.blur}
                  onChange={(e) => handleAdjustmentChange('blur', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Vignette */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-gray-400">
                  <label htmlFor="slider-vignette">Vignet</label>
                  <span id="vignette-val-label" className="font-mono font-semibold text-indigo-600 dark:text-blue-400">{imageState.adjustments.vignette}%</span>
                </div>
                <input
                  id="slider-vignette"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={imageState.adjustments.vignette}
                  onChange={(e) => handleAdjustmentChange('vignette', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== FILTER TAB ===================== */}
        {activeTab === 'filter' && (
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
        )}

        {/* ===================== TEXT TAB ===================== */}
        {activeTab === 'text' && (
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
        )}

        {/* ===================== BACKGROUND TAB ===================== */}
        {activeTab === 'background' && (
          <div id="tab-panel-background" className="space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Fjern baggrund</h3>
            <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
              Fritlæg automatisk motivet direkte i browseren. myPhoto bruger en kantsensitiv farvesegmentering og baggrundsmaske — 100% lokalt og privat.
            </p>

            {isBgRemoving ? (
              <div id="bg-removing-spinner-box" className="p-5 bg-indigo-50 dark:bg-blue-950/20 border border-indigo-100 dark:border-blue-500/30 rounded-xl space-y-4 flex flex-col items-center text-center">
                <div className="relative flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 dark:border-[#2A2A2E] border-t-indigo-600 dark:border-t-blue-500"></div>
                  <Sparkles size={16} className="absolute text-amber-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <span id="bg-removal-loading-title" className="text-xs font-bold text-slate-800 dark:text-white">Analyserer motiv...</span>
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
        )}

        {/* ===================== UPSCALE TAB ===================== */}
        {activeTab === 'upscale' && (
          <div id="tab-panel-upscale" className="space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Opskalering</h3>
            <p className="text-xxs text-slate-400 dark:text-gray-400 leading-relaxed">
              Brug smart opskalering til at forøge antallet af pixels og genskabe skarphed.
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
                <span className="text-xs font-bold text-slate-800 dark:text-white block">Super-opskalering (2x)</span>
                <span className="text-xxs text-slate-400 dark:text-gray-400 block mt-0.5 leading-relaxed">
                  Opskalerer billedet til dobbelt opløsning (fx {imageState.width} &times; {imageState.height} px &rarr; <span className="text-blue-600 dark:text-blue-400 font-bold font-mono">{imageState.width * 2} &times; {imageState.height * 2} px</span>) ved hjælp af bicubisk interpolering.
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
        )}

        {/* ===================== METADATA TAB ===================== */}
        {activeTab === 'metadata' && (
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
        )}

      </div>
    </div>
  );
}
