import {
  Maximize2,
  Crop,
  RotateCw,
  Sliders,
  Sparkles,
  Type,
  ArrowUpRight,
  Info,
  Layers,
} from 'lucide-react';
import { ToolTab, ImageState, ExifData, CropAspectRatio } from '../types';

import SizeTab from './tabs/SizeTab';
import CropTab from './tabs/CropTab';
import RotateTab from './tabs/RotateTab';
import AdjustTab from './tabs/AdjustTab';
import FilterTab from './tabs/FilterTab';
import TextTab from './tabs/TextTab';
import BackgroundTab from './tabs/BackgroundTab';
import UpscaleTab from './tabs/UpscaleTab';
import MetadataTab from './tabs/MetadataTab';

interface SidebarProps {
  activeTab: ToolTab;
  setActiveTab: (tab: ToolTab) => void;
  imageState: ImageState;
  setImageState: (updater: (prev: ImageState) => ImageState) => void;
  onApplyCrop: () => void;
  onResetCrop: () => void;
  onRotate: (direction: 'cw' | 'ccw') => void;
  onFlip: (axis: 'horizontal' | 'vertical') => void;
  onResize: (width: number, height: number) => void;
  cropAspectRatio: CropAspectRatio;
  setCropAspectRatio: (ratio: CropAspectRatio) => void;
  exifData: ExifData;
  onTriggerBackgroundRemoval: () => void;
  isBgRemoving: boolean;
  bgRemovalProgress: string;
  selectedTextId: string | null;
  setSelectedTextId: (id: string | null) => void;
}

const TABS: Array<{ id: ToolTab; name: string; icon: typeof Maximize2 }> = [
  { id: 'size', name: 'Størrelse', icon: Maximize2 },
  { id: 'crop', name: 'Beskær', icon: Crop },
  { id: 'rotate', name: 'Rotér', icon: RotateCw },
  { id: 'adjust', name: 'Justér', icon: Sliders },
  { id: 'filter', name: 'Filtre', icon: Layers },
  { id: 'text', name: 'Tekst', icon: Type },
  { id: 'background', name: 'Baggrund', icon: Sparkles },
  { id: 'upscale', name: 'Opskalér', icon: ArrowUpRight },
  { id: 'metadata', name: 'Metadata', icon: Info },
];

/**
 * Værktøjspanelet. Sidebar ejer kun fanevalget — hver fanes indhold og dens egen
 * lokale tilstand ligger i sin egen fil under ./tabs/.
 */
export default function Sidebar({
  activeTab,
  setActiveTab,
  imageState,
  setImageState,
  onApplyCrop,
  onResetCrop,
  onRotate,
  onFlip,
  onResize,
  cropAspectRatio,
  setCropAspectRatio,
  exifData,
  onTriggerBackgroundRemoval,
  isBgRemoving,
  bgRemovalProgress,
  selectedTextId,
  setSelectedTextId,
}: SidebarProps) {
  return (
    <div
      id="sidebar-layout-container"
      className="w-full md:w-80 bg-white dark:bg-[#16161A] border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#2A2A2E] flex flex-col md:h-[calc(100vh-56px)] shrink-0 select-none"
    >
      {/* Fanevælger — lodret på desktop, vandret og scrollbar på mobil */}
      <div
        id="sidebar-tabs-container"
        className="flex md:flex-wrap overflow-x-auto md:overflow-x-visible border-b border-slate-100 dark:border-[#2A2A2E] bg-slate-50 dark:bg-[#121215] p-1 md:p-2 gap-1 scrollbar-none shrink-0"
      >
        {TABS.map((tab) => {
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

      {/* Den valgte fanes indhold */}
      <div id="sidebar-tools-panel" className="flex-1 p-5 overflow-y-auto space-y-6">
        {activeTab === 'size' && <SizeTab imageState={imageState} onResize={onResize} />}

        {activeTab === 'crop' && (
          <CropTab
            imageState={imageState}
            setImageState={setImageState}
            cropAspectRatio={cropAspectRatio}
            setCropAspectRatio={setCropAspectRatio}
            onApplyCrop={onApplyCrop}
            onResetCrop={onResetCrop}
          />
        )}

        {activeTab === 'rotate' && (
          <RotateTab imageState={imageState} onRotate={onRotate} onFlip={onFlip} />
        )}

        {activeTab === 'adjust' && (
          <AdjustTab imageState={imageState} setImageState={setImageState} />
        )}

        {activeTab === 'filter' && (
          <FilterTab imageState={imageState} setImageState={setImageState} />
        )}

        {activeTab === 'text' && (
          <TextTab
            imageState={imageState}
            setImageState={setImageState}
            selectedTextId={selectedTextId}
            setSelectedTextId={setSelectedTextId}
          />
        )}

        {activeTab === 'background' && (
          <BackgroundTab
            imageState={imageState}
            setImageState={setImageState}
            onTriggerBackgroundRemoval={onTriggerBackgroundRemoval}
            isBgRemoving={isBgRemoving}
            bgRemovalProgress={bgRemovalProgress}
          />
        )}

        {activeTab === 'upscale' && (
          <UpscaleTab imageState={imageState} setImageState={setImageState} />
        )}

        {activeTab === 'metadata' && <MetadataTab exifData={exifData} />}
      </div>
    </div>
  );
}
