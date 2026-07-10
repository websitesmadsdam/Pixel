export interface Adjustments {
  brightness: number; // 0 - 200 (default 100)
  contrast: number; // 0 - 200 (default 100)
  saturation: number; // 0 - 200 (default 100)
  warmth: number; // -100 to 100 (default 0)
  sharpness: number; // 0 - 100 (default 0)
  blur: number; // 0 - 100 (default 0)
  vignette: number; // 0 - 100 (default 0)
}

export type FilterType = 'none' | 'mono' | 'sepia' | 'faded' | 'pop';

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  fontSize: number; // px
  color: string;
  fontFamily: string;
  opacity: number; // 0 - 1
}

export interface Watermark {
  id: string;
  imageUrl: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage of image width
  opacity: number; // 0 - 1
}

export interface CropArea {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
}

export interface ImageState {
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
  crop: CropArea | null;
  adjustments: Adjustments;
  filter: FilterType;
  texts: TextOverlay[];
  watermarks: Watermark[];
  backgroundRemoved: boolean;
  upscale2x: boolean;
}

export interface ExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  gps?: {
    latitude: number;
    longitude: number;
    latitudeRef?: string;
    longitudeRef?: string;
    googleMapsUrl: string;
  };
  hasExif: boolean;
}

export type ToolTab =
  | 'size'
  | 'crop'
  | 'rotate'
  | 'adjust'
  | 'filter'
  | 'text'
  | 'watermark'
  | 'background'
  | 'upscale'
  | 'metadata';
