import { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import {
  Layers,
  Minus,
  Plus,
  Smile,
  Eye,
  Bean,
  Hand,
  Shirt,
  Footprints,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Lock,
  Unlock,
  Trash2,
  Sparkles,
  RotateCcw,
  Cloud,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { LayerItem, LayerImageData, LayerSubItem } from '../types';
import { downloadPngImage, readUploadedImage } from '../utils/imageUtils';
import { useLipSync } from '../context/LipSyncContext';
import { useCharacterLayers } from '../context/CharacterLayersContext';

export const INITIAL_LAYERS: LayerItem[] = [
  {
    id: 'head',
    label: 'Head',
    icon: Smile,
    subLayers: [
      {
        id: 'head-main',
        label: 'Head',
        isLocked: false,
        image: {
          dataUrl: '/default-head.svg',
          name: 'Head',
          width: 311,
          height: 401,
        },
      },
    ],
  },
  {
    id: 'eyes',
    label: 'Eyes',
    icon: Eye,
    subLayers: [
      {
        id: 'eyes-left-eyebrow',
        label: 'Left Eyebrow',
        isLocked: false,
        image: {
          dataUrl: '/assets/eyes/left-eyebrow.svg',
          name: 'Left Eyebrow',
          width: 100,
          height: 27,
        },
      },
      {
        id: 'eyes-right-eyebrow',
        label: 'Right Eyebrow',
        isLocked: false,
        image: {
          dataUrl: '/assets/eyes/right-eyebrow.svg',
          name: 'Right Eyebrow',
          width: 63,
          height: 29,
        },
      },
      {
        id: 'eyes-left-eyeball',
        label: 'Left Eyeball',
        isLocked: false,
        image: {
          dataUrl: '/assets/eyes/left-eyeball.svg',
          name: 'Left Eyeball',
          width: 29,
          height: 34,
        },
      },
      {
        id: 'eyes-right-eyeball',
        label: 'Right Eyeball',
        isLocked: false,
        image: {
          dataUrl: '/assets/eyes/right-eyeball.svg',
          name: 'Right Eyeball',
          width: 29,
          height: 28,
        },
      },
      {
        id: 'eyes-white',
        label: 'White',
        isLocked: false,
        image: {
          dataUrl: '/assets/eyes/white.svg',
          name: 'White',
          width: 150,
          height: 38,
        },
      },
      {
        id: 'eyes-eyelids',
        label: 'Eyelids',
        isLocked: false,
        image: {
          dataUrl: '/assets/eyes/eyelids.svg',
          name: 'Eyelids',
          width: 159,
          height: 46,
        },
      },
    ],
  },
  {
    id: 'lips',
    label: 'Lips',
    icon: Bean,
    subLayers: [
      {
        id: 'lips-a',
        label: 'Lips/A',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-a.svg',
          name: 'Lips/A',
          width: 151,
          height: 67,
        },
      },
      {
        id: 'lips-b',
        label: 'Lips/B',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-b.svg',
          name: 'Lips/B',
          width: 148,
          height: 88,
        },
      },
      {
        id: 'lips-c',
        label: 'Lips/C',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-c.svg',
          name: 'Lips/C',
          width: 92,
          height: 97,
        },
      },
      {
        id: 'lips-d',
        label: 'Lips/D',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-d.svg',
          name: 'Lips/D',
          width: 152,
          height: 98,
        },
      },
      {
        id: 'lips-e',
        label: 'Lips/E',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-e.svg',
          name: 'Lips/E',
          width: 46,
          height: 82,
        },
      },
      {
        id: 'lips-x',
        label: 'Lips/X',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-x.svg',
          name: 'Lips/X',
          width: 150,
          height: 54,
        },
      },
      {
        id: 'lips-ab',
        label: 'Lips/A_B',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-ab.svg',
          name: 'Lips/A_B',
          width: 130,
          height: 74,
        },
      },
      {
        id: 'lips-ac',
        label: 'Lips/A_C',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-ac.svg',
          name: 'Lips/A_C',
          width: 134,
          height: 94,
        },
      },
      {
        id: 'lips-adn',
        label: 'Lips/A_D_N',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-adn.svg',
          name: 'Lips/A_D_N',
          width: 132,
          height: 94,
        },
      },
      {
        id: 'lips-ad',
        label: 'Lips/A_D',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-ad.svg',
          name: 'Lips/A_D',
          width: 129,
          height: 106,
        },
      },
      {
        id: 'lips-ae',
        label: 'Lips/A_E',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-ae.svg',
          name: 'Lips/A_E',
          width: 111,
          height: 108,
        },
      },
      {
        id: 'lips-af',
        label: 'Lips/A_F',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-af.svg',
          name: 'Lips/A_F',
          width: 130,
          height: 80,
        },
      },
      {
        id: 'lips-ax',
        label: 'Lips/A_X',
        isLocked: false,
        image: {
          dataUrl: '/assets/lips/lip-ax.svg',
          name: 'Lips/A_X',
          width: 112,
          height: 46,
        },
      },
    ],
  },
  {
    id: 'hands',
    label: 'Hands',
    icon: Hand,
    subLayers: [
      {
        id: 'hands-right-arm',
        label: 'Right Arm',
        isLocked: false,
        image: {
          dataUrl: '/assets/hands/right-arm.svg',
          name: 'Right Arm',
          width: 184,
          height: 500,
        },
      },
      {
        id: 'hands-left-arm',
        label: 'Left Arm',
        isLocked: false,
        image: {
          dataUrl: '/assets/hands/left-arm.svg',
          name: 'Left Arm',
          width: 199,
          height: 493,
        },
      },
      {
        id: 'hands-left-forearm',
        label: 'Left Forearm',
        isLocked: false,
        image: {
          dataUrl: '/assets/hands/left-forearm.svg',
          name: 'Left Forearm',
          width: 161,
          height: 505,
        },
      },
      {
        id: 'hands-right-forearm',
        label: 'Right Forearm',
        isLocked: false,
        image: {
          dataUrl: '/assets/hands/right-forearm.svg',
          name: 'Right Forearm',
          width: 156,
          height: 449,
        },
      },
    ],
  },
  {
    id: 'palms',
    label: 'Palms',
    icon: Hand,
    subLayers: [
      {
        id: 'palms-left-palm',
        label: 'Left Palm',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/left-palm.svg',
          name: 'Left Palm',
          width: 143,
          height: 236,
        },
      },
      {
        id: 'palms-left-palm-closed',
        label: 'Left Palm Closed',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/left-palm-closed.svg',
          name: 'Left Palm Closed',
          width: 141,
          height: 162,
        },
      },
      {
        id: 'palms-palm-1',
        label: 'Palm 1',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-1.svg',
          name: 'Palm 1',
          width: 250,
          height: 98,
        },
      },
      {
        id: 'palms-palm-2',
        label: 'Palm 2',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-2.svg',
          name: 'Palm 2',
          width: 93,
          height: 234,
        },
      },
      {
        id: 'palms-palm-4',
        label: 'Palm 4',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-4.svg',
          name: 'Palm 4',
          width: 132,
          height: 230,
        },
      },
      {
        id: 'palms-palm-7',
        label: 'Palm 7',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-7.svg',
          name: 'Palm 7',
          width: 123,
          height: 243,
        },
      },
      {
        id: 'palms-palm-8',
        label: 'Palm 8',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-8.svg',
          name: 'Palm 8',
          width: 153,
          height: 224,
        },
      },
      {
        id: 'palms-palm-9',
        label: 'Palm 9',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-9.svg',
          name: 'Palm 9',
          width: 132,
          height: 243,
        },
      },
      {
        id: 'palms-palm-10',
        label: 'Palm 10',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-10.svg',
          name: 'Palm 10',
          width: 196,
          height: 177,
        },
      },
      {
        id: 'palms-palm-11',
        label: 'Palm 11',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-11.svg',
          name: 'Palm 11',
          width: 141,
          height: 264,
        },
      },
      {
        id: 'palms-palm-13',
        label: 'Palm 13',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-13.svg',
          name: 'Palm 13',
          width: 119,
          height: 232,
        },
      },
      {
        id: 'palms-palm-14',
        label: 'Palm 14',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-14.svg',
          name: 'Palm 14',
          width: 147,
          height: 160,
        },
      },
      {
        id: 'palms-palm-mobile',
        label: 'Palm Mobile',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-mobile.svg',
          name: 'Palm Mobile',
          width: 221,
          height: 190,
        },
      },
      {
        id: 'palms-palm-3',
        label: 'Palm 3',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-3.svg',
          name: 'Palm 3',
          width: 132,
          height: 209,
        },
      },
      {
        id: 'palms-palm-5',
        label: 'Palm 5',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-5.svg',
          name: 'Palm 5',
          width: 248,
          height: 169,
        },
      },
      {
        id: 'palms-palm-6',
        label: 'Palm 6',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-6.svg',
          name: 'Palm 6',
          width: 123,
          height: 181,
        },
      },
      {
        id: 'palms-palm-10-2',
        label: 'Palm 10 2',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-10-2.svg',
          name: 'Palm 10 2',
          width: 196,
          height: 177,
        },
      },
      {
        id: 'palms-palm-12',
        label: 'Palm 12',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-12.svg',
          name: 'Palm 12',
          width: 133,
          height: 188,
        },
      },
      {
        id: 'palms-palm-point',
        label: 'Palm Point',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-point.svg',
          name: 'Palm Point',
          width: 98,
          height: 237,
        },
      },
      {
        id: 'palms-palm-think',
        label: 'Palm Think',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/palm-think.svg',
          name: 'Palm Think',
          width: 115,
          height: 235,
        },
      },
      {
        id: 'palms-right-palm',
        label: 'Right Palm',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/right-palm.svg',
          name: 'Right Palm',
          width: 119,
          height: 225,
        },
      },
      {
        id: 'palms-r-palm-strong',
        label: 'R Palm Strong',
        isLocked: false,
        image: {
          dataUrl: '/assets/palms/r-palm-strong.svg',
          name: 'R Palm Strong',
          width: 128,
          height: 171,
        },
      },
    ],
  },
  {
    id: 'body',
    label: 'Body',
    icon: Shirt,
    subLayers: [
      {
        id: 'body-torso-2',
        label: 'TORSO 2',
        isLocked: false,
        image: {
          dataUrl: '/assets/body/torso-2.svg',
          name: 'TORSO 2',
          width: 816,
          height: 1530,
        },
      },
    ],
  },
  {
    id: 'legs',
    label: 'Legs',
    icon: Footprints,
    subLayers: [
      {
        id: 'legs-left-thigh',
        label: 'Left Thigh',
        isLocked: false,
        image: {
          dataUrl: '/assets/legs/left-thigh.svg',
          name: 'Left Thigh',
          width: 305,
          height: 698,
        },
      },
      {
        id: 'legs-right-thigh',
        label: 'Right Thigh',
        isLocked: false,
        image: {
          dataUrl: '/assets/legs/right-thigh.svg',
          name: 'Right Thigh',
          width: 239,
          height: 708,
        },
      },
      {
        id: 'legs-left-calf',
        label: 'Left Calf',
        isLocked: false,
        image: {
          dataUrl: '/assets/legs/left-calf.svg',
          name: 'Left Calf',
          width: 225,
          height: 602,
        },
      },
      {
        id: 'legs-right-calf',
        label: 'Right Calf',
        isLocked: false,
        image: {
          dataUrl: '/assets/legs/right-calf.svg',
          name: 'Right Calf',
          width: 191,
          height: 613,
        },
      },
      {
        id: 'legs-left-shoe',
        label: 'Left Shoe',
        isLocked: false,
        image: {
          dataUrl: '/assets/legs/left-shoe.svg',
          name: 'Left Shoe',
          width: 324,
          height: 228,
        },
      },
      {
        id: 'legs-right-shoe',
        label: 'Right Shoe',
        isLocked: false,
        image: {
          dataUrl: '/assets/legs/right-shoe.svg',
          name: 'Right Shoe',
          width: 336,
          height: 212,
        },
      },
    ],
  },
  {
    id: 'additionals',
    label: 'Additionals',
    icon: Hand,
    subLayers: [
      {
        id: 'additionals-back-hair',
        label: 'Back Hair',
        isLocked: false,
        image: {
          dataUrl: '/assets/additionals/back-hair.svg',
          name: 'Back Hair',
          width: 350,
          height: 600,
        },
      },
      {
        id: 'additionals-l-props',
        label: 'L Props',
        isLocked: false,
        image: {
          dataUrl: '/assets/additionals/l-props.svg',
          name: 'L Props',
          width: 500,
          height: 500,
        },
      },
      {
        id: 'additionals-r-props',
        label: 'R Props',
        isLocked: false,
        image: {
          dataUrl: '/assets/additionals/r-props.svg',
          name: 'R Props',
          width: 500,
          height: 500,
        },
      },
      {
        id: 'additionals-hair',
        label: 'Hair',
        isLocked: false,
        image: {
          dataUrl: '/assets/additionals/hair.svg',
          name: 'Hair',
          width: 400,
          height: 400,
        },
      },
      {
        id: 'additionals-beard',
        label: 'Beard',
        isLocked: false,
        image: {
          dataUrl: '/assets/additionals/beard.svg',
          name: 'Beard',
          width: 200,
          height: 150,
        },
      },
    ],
  },
];

export default function LayerPanel() {
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});
  const [activeUploadSubLayerId, setActiveUploadSubLayerId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);

  // Global Character Layers & ImgBB Cloud Sync
  const {
    layers,
    uploadAndReplaceLayer,
    removeLayerImage,
    toggleLayerLock,
    totalImgbbHosted,
    isUploadingAny,
    uploadStatusMessage,
    resetAllLayers,
  } = useCharacterLayers();

  // Lip Sync context integration for dynamic talking loop replacement
  const {
    currentLipId,
    isSpeaking,
    lipShapes,
    resetToDefaultLips,
  } = useLipSync();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const batchLipsInputRef = useRef<HTMLInputElement | null>(null);

  const toggleAllLayers = () => {
    setIsLayersOpen((prev) => !prev);
  };

  const toggleLayerAccordion = (id: string) => {
    setExpandedLayers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDownload = async (imgData: LayerImageData) => {
    const fileName = `${imgData.name || 'Image'} (${imgData.width}×${imgData.height}).png`;
    await downloadPngImage(imgData.dataUrl, fileName, imgData.width, imgData.height);
  };

  const triggerUpload = (subLayerId: string) => {
    setActiveUploadSubLayerId(subLayerId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadSubLayerId) return;
    await uploadAndReplaceLayer(activeUploadSubLayerId, file);
  };

  const handleDrop = async (e: DragEvent, subLayerId: string) => {
    e.preventDefault();
    setIsDraggingOver(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadAndReplaceLayer(subLayerId, file);
  };

  // Batch upload or add new lips directly into talking loop with ImgBB cloud storage
  const handleBatchAddOrReplaceLips = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cleanName = file.name.toLowerCase().replace(/[^a-z0-9_]/g, '');

      // Check if file name matches any existing lip shape (e.g. lip-a, a, lip-b, b, etc.)
      const lipsCategory = layers.find((c) => c.id === 'lips');
      const existingMatch = lipsCategory?.subLayers.find((s) => {
        const sLabel = s.label.toLowerCase().replace(/[^a-z0-9_]/g, '');
        const sId = s.id.toLowerCase().replace(/[^a-z0-9_]/g, '');
        return (
          cleanName === sLabel ||
          cleanName === sId ||
          cleanName.includes(sLabel) ||
          sId.includes(cleanName)
        );
      });

      const targetSubId = existingMatch ? existingMatch.id : (lipsCategory?.subLayers[i % (lipsCategory.subLayers.length || 1)]?.id || 'lips-a');
      await uploadAndReplaceLayer(targetSubId, file);
    }
  };

  const toggleLock = (subLayerId: string) => {
    toggleLayerLock(subLayerId);
  };

  const handleDeleteImage = (subLayerId: string) => {
    removeLayerImage(subLayerId);
  };

  return (
    <section
      id="layers-section"
      className="w-full select-none"
      aria-label="Layers Navigation"
    >
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Hidden File Input for Batch Adding or Replacing Lips */}
      <input
        ref={batchLipsInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleBatchAddOrReplaceLips}
      />

      {/* Layers Header Toggle Button */}
      <button
        id="layers-toggle-header"
        type="button"
        onClick={toggleAllLayers}
        className="w-full flex items-center justify-between py-2.5 px-1 mb-2 text-slate-100 hover:text-white transition-colors duration-150 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg"
        aria-expanded={isLayersOpen}
        aria-controls="layers-list"
      >
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-slate-100" strokeWidth={2.2} />
          <span className="font-semibold text-[17px] tracking-tight text-white">
            Layers
          </span>
        </div>

        <div
          id="layers-toggle-icon"
          className="p-1 rounded text-slate-300 group-hover:text-white transition-colors"
        >
          {isLayersOpen ? (
            <Minus className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <Plus className="w-4 h-4 stroke-[2.5]" />
          )}
        </div>
      </button>

      {/* Firestore Cloud Sync Status Card */}
      <div 
        id="firestore-cloud-status-card"
        className="mb-3 px-3 py-2.5 rounded-xl bg-[#121620] border border-amber-500/25 flex items-center justify-between gap-2 shadow-sm"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            {isUploadingAny ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-slate-100 flex items-center gap-1.5">
                Firestore Cloud Storage
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded-md font-mono">
                Realtime
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {uploadStatusMessage || (
                totalImgbbHosted > 0 
                  ? `${totalImgbbHosted} custom layers synced in Firestore & live` 
                  : 'Fast Firestore storage • Instant 0ms layer replacement without reload'
              )}
            </p>
          </div>
        </div>

        {totalImgbbHosted > 0 && (
          <button
            type="button"
            onClick={resetAllLayers}
            className="px-2 py-1 text-[11px] text-slate-300 hover:text-rose-400 bg-white/5 hover:bg-white/10 rounded-md transition flex items-center gap-1 shrink-0 cursor-pointer"
            title="Reset all custom layers back to defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Collapsible Layer Categories */}
      <AnimatePresence initial={false}>
        {isLayersOpen && (
          <motion.div
            id="layers-list"
            key="layers-list-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden flex flex-col gap-2.5"
          >
            {layers.map((category) => {
              const Icon = category.icon;
              const isExpanded = !!expandedLayers[category.id];

              return (
                <div
                  key={category.id}
                  id={`layer-card-${category.id}`}
                  className={`w-full rounded-2xl border transition-all duration-150 ${
                    isExpanded
                      ? 'bg-[#15171d] border-[#252834] p-2.5 sm:p-3 shadow-lg'
                      : 'bg-[#121316] hover:bg-[#181a20] border-[#22242c] hover:border-[#2f323c]'
                  }`}
                >
                  {/* Category Header Row (Accordion Trigger) */}
                  <button
                    id={`layer-btn-${category.id}`}
                    type="button"
                    onClick={() => toggleLayerAccordion(category.id)}
                    className={`w-full flex items-center justify-between text-left cursor-pointer transition-colors ${
                      isExpanded
                        ? 'p-1 mb-2.5 text-white'
                        : 'px-4 py-3.5 text-slate-100'
                    } focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg`}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className="w-5 h-5 text-slate-200"
                        strokeWidth={2}
                      />
                      <span className="text-[15px] font-medium text-slate-100 tracking-normal">
                        {category.label}
                      </span>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-300 stroke-[2.2]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 stroke-[2.2]" />
                    )}
                  </button>

                  {/* Expanded Sub-Layers List */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        id={`layer-expanded-${category.id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="overflow-hidden flex flex-col gap-2"
                      >
                        {/* Lips Category Helper & Action Header */}
                        {category.id === 'lips' && (
                          <div 
                            id="lips-sync-helper-card"
                            className="bg-[#171a23] border border-emerald-500/30 rounded-xl p-3 mb-1 flex flex-col gap-2 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <span className="text-[13px] font-semibold text-emerald-300">
                                  Dynamic Lip Sync Replacement
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => batchLipsInputRef.current?.click()}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11.5px] font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow"
                                  title="Add new lips or upload multiple lips to replace them"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Add / Replace Lips</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={resetToDefaultLips}
                                  className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition"
                                  title="Reset lips to default"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-normal">
                              Ager lips er jaygay new lips upload/drop korlei replace hoye continue talking animation loop e cholbe.
                            </p>
                          </div>
                        )}

                        {category.subLayers.map((subItem) => {
                          const hasImage = !!subItem.image;
                          const isLipCategory = category.id === 'lips';
                          const isCurrentSpeakingLip = isLipCategory && isSpeaking && currentLipId === subItem.id;
                          const isLipCustomReplaced = isLipCategory && lipShapes.some((l) => l.id === subItem.id && l.isCustom);

                          return (
                            <div
                              key={subItem.id}
                              id={`layer-image-row-${subItem.id}`}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setIsDraggingOver(subItem.id);
                              }}
                              onDragLeave={() => setIsDraggingOver(null)}
                              onDrop={(e) => handleDrop(e, subItem.id)}
                              className={`w-full bg-[#0d0e12] border rounded-xl px-3 py-2.5 flex items-center justify-between transition-all ${
                                isCurrentSpeakingLip
                                  ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40'
                                  : isDraggingOver === subItem.id
                                  ? 'border-sky-500 bg-sky-950/20'
                                  : 'border-[#20222a] hover:border-[#2a2d38]'
                              }`}
                            >
                              {/* Left: Thumbnail (blank or showing image) & Label with dimensions */}
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div
                                  id={`layer-thumb-${subItem.id}`}
                                  onClick={() => {
                                    if (!hasImage) triggerUpload(subItem.id);
                                  }}
                                  className={`w-11 h-11 flex items-center justify-center overflow-hidden shrink-0 rounded-lg ${
                                    !hasImage
                                      ? 'cursor-pointer hover:bg-white/5 transition-colors'
                                      : ''
                                  }`}
                                  title={
                                    hasImage && subItem.image
                                      ? subItem.image.name
                                      : 'Click to upload image'
                                  }
                                >
                                  {hasImage && subItem.image ? (
                                    <img
                                      src={subItem.image.dataUrl}
                                      alt={subItem.image.name}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-contain p-0.5"
                                    />
                                  ) : (
                                    /* Blank image show box */
                                    <div className="w-full h-full" />
                                  )}
                                </div>

                                <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5 min-w-0">
                                  <span
                                    id={`layer-info-${subItem.id}`}
                                    className="text-[13.5px] font-medium text-slate-200 tracking-normal"
                                    title={
                                      hasImage && subItem.image
                                        ? `${subItem.image.name} (${subItem.image.width}×${subItem.image.height})`
                                        : subItem.label
                                    }
                                  >
                                    {hasImage && subItem.image
                                      ? subItem.image.name
                                      : subItem.label}
                                  </span>

                                  {hasImage && subItem.image && (
                                    <span className="text-[12px] text-slate-300 font-normal">
                                      ({subItem.image.width}×{subItem.image.height})
                                    </span>
                                  )}

                                  {/* ImgBB Uploading State */}
                                  {subItem.image?.isUploadingToImgbb && (
                                    <span className="text-[10px] px-1.5 py-0.5 font-medium rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                      <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                                      Uploading ImgBB...
                                    </span>
                                  )}

                                  {/* ImgBB Hosted Badge with clickable link */}
                                  {subItem.image?.imgbbUrl && (
                                    <a
                                      href={subItem.image.imgbbUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[10px] px-1.5 py-0.5 font-medium rounded-full bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 transition"
                                      title={`ImgBB Hosted URL: ${subItem.image.imgbbUrl}`}
                                    >
                                      <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                                      <span>ImgBB</span>
                                      <ExternalLink className="w-2 h-2 opacity-70" />
                                    </a>
                                  )}

                                  {/* Live on Character Indicator if replaced */}
                                  {subItem.image && (
                                    <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                                      <CheckCircle2 className="w-2.5 h-2.5 text-sky-400" />
                                      Live
                                    </span>
                                  )}

                                  {/* Custom Replaced Lip Tag */}
                                  {isLipCustomReplaced && (
                                    <span className="text-[10px] px-1.5 py-0.5 font-medium rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                                      Replaced
                                    </span>
                                  )}

                                  {/* Live Speaking Indicator in Talking Mode */}
                                  {isCurrentSpeakingLip && (
                                    <span className="text-[10px] px-1.5 py-0.5 font-semibold rounded bg-emerald-500 text-black flex items-center gap-1 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                                      Speaking
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right: Actions (Download, Upload, Lock, Delete) */}
                              <div
                                id={`layer-actions-${subItem.id}`}
                                className="flex items-center gap-3 pl-1 shrink-0 text-slate-400"
                              >
                                {/* 1. Download Button */}
                                <button
                                  id={`btn-download-${subItem.id}`}
                                  type="button"
                                  disabled={!hasImage}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (subItem.image) handleDownload(subItem.image);
                                  }}
                                  title={hasImage ? 'Download PNG' : 'No image to download'}
                                  className={`p-1 transition-colors rounded ${
                                    hasImage
                                      ? 'hover:text-white cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-400'
                                      : 'opacity-30 cursor-not-allowed text-slate-600'
                                  }`}
                                >
                                  <Download className="w-4 h-4 stroke-[2]" />
                                </button>

                                {/* 2. Upload Button */}
                                <button
                                  id={`btn-upload-${subItem.id}`}
                                  type="button"
                                  disabled={subItem.isLocked}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!subItem.isLocked) triggerUpload(subItem.id);
                                  }}
                                  title={subItem.isLocked ? 'Layer is locked (Unlock to replace layer)' : 'Upload & Replace Layer (old layer removed, new layer added)'}
                                  className={`p-1 transition-colors rounded ${
                                    subItem.isLocked
                                      ? 'opacity-30 cursor-not-allowed text-slate-600'
                                      : 'hover:text-white cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-400'
                                  }`}
                                >
                                  <Upload className="w-4 h-4 stroke-[2]" />
                                </button>

                                {/* 3. Lock / Unlock Button */}
                                <button
                                  id={`btn-lock-${subItem.id}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLock(subItem.id);
                                  }}
                                  title={subItem.isLocked ? 'Unlock Layer (আনলক করতে ক্লিক করুন)' : 'Lock Layer (লক করলে ক্যানভাসে unclickable থাকবে)'}
                                  className={`p-1 transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 rounded ${
                                    subItem.isLocked
                                      ? 'text-amber-400 hover:text-amber-300'
                                      : 'hover:text-white'
                                  }`}
                                >
                                  {subItem.isLocked ? (
                                    <Lock className="w-4 h-4 stroke-[2]" />
                                  ) : (
                                    <Unlock className="w-4 h-4 stroke-[2]" />
                                  )}
                                </button>

                                {/* 4. Trash / Delete Button */}
                                <button
                                  id={`btn-delete-${subItem.id}`}
                                  type="button"
                                  disabled={subItem.isLocked}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!subItem.isLocked) handleDeleteImage(subItem.id);
                                  }}
                                  title={subItem.isLocked ? 'Layer is locked (Unlock to delete)' : 'Delete custom layer & restore default'}
                                  className={`p-1 transition-colors rounded ${
                                    subItem.isLocked
                                      ? 'opacity-30 cursor-not-allowed text-slate-600'
                                      : 'hover:text-rose-400 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-400'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4 stroke-[2]" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
