import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

export interface LayerImageData {
  dataUrl: string;
  name: string;
  width: number;
  height: number;
  firebaseUrl?: string;
  isSavedInFirestore?: boolean;
  imgbbUrl?: string;
  imgbbThumbUrl?: string;
  imgbbDeleteUrl?: string;
  isUploadingToImgbb?: boolean;
  uploadError?: string;
  isCustom?: boolean;
}

export interface LayerSubItem {
  id: string;
  label: string;
  image?: LayerImageData | null;
  isLocked?: boolean;
}

export interface LayerItem {
  id: string;
  label: string;
  icon: ComponentType<LucideProps>;
  subLayers: LayerSubItem[];
}

export interface LayerTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipX?: boolean;
  flipY?: boolean;
}

export type CharacterPartKey =
  | 'head'
  | 'hair'
  | 'eyebrows'
  | 'eyes'
  | 'mouth'
  | 'torso'
  | 'armLeft'
  | 'palmLeft'
  | 'armRight'
  | 'palmRight'
  | 'legLeft'
  | 'shoeLeft'
  | 'legRight'
  | 'shoeRight';

export type CharacterModelTheme = 'default' | 'indian_man' | 'indian_woman';

export interface SavedCharacter {
  id: string;
  name: string;
  thumbnailUrl?: string;
  createdAt: number;
  updatedAt: number;
  layerTransforms: Record<string, LayerTransform>;
  customLayersMap?: Record<string, LayerImageData>;
  lockedParts?: Record<string, boolean>;
  restingLipShapeId?: string;
  modelTheme?: CharacterModelTheme;
  isPreset?: boolean;
  description?: string;
}


