import React, { useState, useRef, useEffect, type ChangeEvent, type MouseEvent } from 'react';
import { 
  Lock, 
  Unlock, 
  Upload, 
  RotateCcw, 
  Download, 
  Trash2, 
  Move, 
  Hand, 
  PenTool, 
  Plus, 
  Minus, 
  Smile, 
  User, 
  Info,
  Check,
  Save,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sparkles,
  Layers,
  X,
  Users,
  Cloud,
  FlipHorizontal,
  FlipVertical
} from 'lucide-react';
import { useLipSync } from '../context/LipSyncContext';
import { useCharacterLayers, PART_PRIMARY_SUBLAYER } from '../context/CharacterLayersContext';
import {
  ORIGINAL_SKELETON_POINTS,
  SKELETON_CONNECTIONS,
  SKELETON_POINT_LABELS,
  scaleSkeletonPoint,
} from '../data/skeletonPoints';
import type { CharacterPartKey, LayerTransform } from '../types';
import CharacterListModal from './CharacterListModal';
import SaveCharacterModal from './SaveCharacterModal';
import CharacterPresetsDrawer from './CharacterPresetsDrawer';
import AnatomicalSkeletonOverlay from './AnatomicalSkeletonOverlay';

interface CharacterEditorProps {
  showSkeleton?: boolean;
  onToggleSkeleton?: () => void;
  isSkeletonFlipped?: boolean;
  onToggleSkeletonFlip?: () => void;
  onNotify?: (msg: string) => void;
}

export interface CharacterPartDef {
  key: CharacterPartKey;
  label: string;
  category: 'head' | 'face' | 'body' | 'limbs';
  icon: string;
  pivot: { x: number; y: number };
  defaultBox: { x: number; y: number; width: number; height: number };
}

export const CHARACTER_PARTS: CharacterPartDef[] = [
  { key: 'hair', label: 'Hair (চুল)', category: 'head', icon: '💇', pivot: { x: 170, y: 75 }, defaultBox: { x: 122, y: 35, width: 98, height: 90 } },
  { key: 'head', label: 'Head (মাথা)', category: 'head', icon: '👤', pivot: { x: 170, y: 120 }, defaultBox: { x: 135, y: 60, width: 75, height: 125 } },
  { key: 'eyebrows', label: 'Eyebrows (ভ্রু)', category: 'face', icon: '〰️', pivot: { x: 170, y: 108 }, defaultBox: { x: 145, y: 102, width: 52, height: 14 } },
  { key: 'eyes', label: 'Eyes (চোখ)', category: 'face', icon: '👁️', pivot: { x: 170, y: 116 }, defaultBox: { x: 154, y: 112, width: 36, height: 12 } },
  { key: 'mouth', label: 'Mouth / Lips (মুখ)', category: 'face', icon: '👄', pivot: { x: 170, y: 146 }, defaultBox: { x: 152, y: 134, width: 38, height: 24 } },
  { key: 'torso', label: 'Torso (শরীর)', category: 'body', icon: '👕', pivot: { x: 165, y: 270 }, defaultBox: { x: 115, y: 195, width: 105, height: 155 } },
  { key: 'armLeft', label: 'Left Arm (সামনের হাত)', category: 'limbs', icon: '💪', pivot: { x: 130, y: 210 }, defaultBox: { x: 105, y: 210, width: 48, height: 130 } },
  { key: 'palmLeft', label: 'Left Palm (সামনের তালু)', category: 'limbs', icon: '🖐️', pivot: { x: 140, y: 405 }, defaultBox: { x: 125, y: 390, width: 32, height: 35 } },
  { key: 'armRight', label: 'Right Arm (পেছনের হাত)', category: 'limbs', icon: '🦾', pivot: { x: 200, y: 218 }, defaultBox: { x: 180, y: 210, width: 55, height: 135 } },
  { key: 'palmRight', label: 'Right Palm (পেছনের তালু)', category: 'limbs', icon: '✊', pivot: { x: 195, y: 412 }, defaultBox: { x: 175, y: 395, width: 35, height: 35 } },
  { key: 'legLeft', label: 'Left Leg (সামনের পা)', category: 'limbs', icon: '👖', pivot: { x: 125, y: 480 }, defaultBox: { x: 95, y: 340, width: 55, height: 285 } },
  { key: 'shoeLeft', label: 'Left Shoe (সামনের জুতো)', category: 'limbs', icon: '👞', pivot: { x: 115, y: 635 }, defaultBox: { x: 75, y: 618, width: 78, height: 38 } },
  { key: 'legRight', label: 'Right Leg (পেছনের পা)', category: 'limbs', icon: '🦿', pivot: { x: 185, y: 480 }, defaultBox: { x: 150, y: 340, width: 58, height: 285 } },
  { key: 'shoeRight', label: 'Right Shoe (পেছনের জুতো)', category: 'limbs', icon: '👞', pivot: { x: 195, y: 635 }, defaultBox: { x: 155, y: 618, width: 75, height: 38 } },
];

export default function CharacterEditor({ 
  showSkeleton = false, 
  onToggleSkeleton,
  isSkeletonFlipped = false,
  onToggleSkeletonFlip,
  onNotify 
}: CharacterEditorProps) {
  const { isLipSyncActive, activeLipShape, restingLipShape, isSpeaking } = useLipSync();
  const { 
    customLayersMap, 
    layerTransforms, 
    updateLayerTransform, 
    resetLayerTransform, 
    resetAllLayerTransforms, 
    saveLayerTransforms,
    persistTransformsToFirestore,
    isLayerLocked,
    togglePartLock,
    setPartLock,
    uploadAndReplaceLayer,
    removeLayerImageForPart,
    activeCharacterId,
    activeCharacterName,
    activeModelTheme,
    setActiveModelTheme,
    savedCharacters,
    saveCurrentCharacter,
    isSavingToFirebase,
  } = useCharacterLayers();

  const getCustomImgSrc = (keys: string[]) => {
    for (const key of keys) {
      const item = customLayersMap[key];
      if (item) return item.imgbbUrl || item.dataUrl;
    }
    return null;
  };

  const customArmRight = getCustomImgSrc(['hands-right-arm', 'hands-right-forearm']);
  const customPalmRight = getCustomImgSrc(['palms-right-palm', 'palms-r-palm-strong']);
  const customLegRight = getCustomImgSrc(['legs-right-thigh', 'legs-right-calf']);
  const customShoeRight = getCustomImgSrc(['legs-right-shoe']);
  const customLegLeft = getCustomImgSrc(['legs-left-thigh', 'legs-left-calf']);
  const customShoeLeft = getCustomImgSrc(['legs-left-shoe']);
  const customTorso = getCustomImgSrc(['body-torso-2', 'body-torso-main', 'body-chest']);
  const customHead = getCustomImgSrc(['head-main', 'head-base']);
  const customHair = getCustomImgSrc(['additionals-hair', 'additionals-back-hair']);
  const customEyebrowLeft = getCustomImgSrc(['eyes-left-eyebrow']);
  const customEyebrowRight = getCustomImgSrc(['eyes-right-eyebrow']);
  const customEyeLeft = getCustomImgSrc(['eyes-left-eyeball', 'eyes-eyelids']);
  const customEyeRight = getCustomImgSrc(['eyes-right-eyeball']);
  const customArmLeft = getCustomImgSrc(['hands-left-arm', 'hands-left-forearm']);
  const customPalmLeft = getCustomImgSrc(['palms-left-palm', 'palms-left-palm-closed']);

  // Firebase Character Modals state
  const [isCharacterListOpen, setIsCharacterListOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Toolbar and Tool states
  const [activeTool, setActiveTool] = useState<'pan' | 'pen' | 'face' | 'body'>('pen');
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Top action bar states - start with null so layer controller stays hidden until user clicks a layer
  const [isTransformActive, setIsTransformActive] = useState(false);
  const [selectedPartKey, setSelectedPartKey] = useState<CharacterPartKey | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Direct layer drag on canvas state
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragStartTransform, setDragStartTransform] = useState({ x: 0, y: 0 });

  // 4 Corner Scaling Handle States (Unlimited Zoom-in & Zoom-out)
  const [isScalingCorner, setIsScalingCorner] = useState(false);
  const [activeCornerHandle, setActiveCornerHandle] = useState<string | null>(null);
  const [scaleStartCenter, setScaleStartCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scaleInitialDist, setScaleInitialDist] = useState<number>(1);
  const [scaleStartValue, setScaleStartValue] = useState<number>(1);
  const [isRotatingCorner, setIsRotatingCorner] = useState(false);
  const [rotationStartAngle, setRotationStartAngle] = useState(0);
  const [rotationStartValue, setRotationStartValue] = useState(0);
  const rotationLastAngleRef = useRef(0);
  const rotationAccumulatedRef = useRef(0);
  const groupScaleStartRef = useRef<Record<string, LayerTransform>>({});
  const [groupScaleCenter, setGroupScaleCenter] = useState({ x: 170, y: 340 });
  const [hiddenParts, setHiddenParts] = useState<Partial<Record<CharacterPartKey, boolean>>>({});
  const [isAllLayersSelected, setIsAllLayersSelected] = useState(false);

  // Quick Layer Selector Dropdown visibility
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);

  // Hidden file input for upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (onNotify) onNotify(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const selectedPartDef = selectedPartKey ? CHARACTER_PARTS.find((p) => p.key === selectedPartKey) : null;
  const currentTransform = (selectedPartKey && layerTransforms[selectedPartKey]) || { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false };
  const isCurrentLayerLocked = selectedPartKey ? isLayerLocked(selectedPartKey) : false;

  const getEditablePartKeys = () => CHARACTER_PARTS
    .map((part) => part.key)
    .filter((partKey) => !isLayerLocked(partKey));

  const updateAllLayerTransforms = (updates: Partial<LayerTransform>) => {
    for (const partKey of getEditablePartKeys()) updateLayerTransform(partKey, updates);
    persistTransformsToFirestore();
  };

  const handleToggleAllLayers = () => {
    setIsAllLayersSelected((previous) => !previous);
    setSelectedPartKey(null);
    setIsTransformActive(false);
  };

  const handleAllLayersMove = (dx: number, dy: number) => {
    for (const partKey of getEditablePartKeys()) {
      const transform = layerTransforms[partKey] || { x: 0, y: 0, scale: 1, rotation: 0 };
      updateLayerTransform(partKey, { x: Math.round(transform.x + dx), y: Math.round(transform.y + dy) });
    }
    persistTransformsToFirestore();
  };

  const handleAllLayersScale = (delta: number) => {
    for (const partKey of getEditablePartKeys()) {
      const transform = layerTransforms[partKey] || { x: 0, y: 0, scale: 1, rotation: 0 };
      updateLayerTransform(partKey, { scale: Math.max(0.005, +(transform.scale + delta).toFixed(3)) });
    }
    persistTransformsToFirestore();
  };

  const handleAllLayersRotate = (delta: number) => {
    for (const partKey of getEditablePartKeys()) {
      const transform = layerTransforms[partKey] || { x: 0, y: 0, scale: 1, rotation: 0 };
      updateLayerTransform(partKey, { rotation: transform.rotation + delta });
    }
    persistTransformsToFirestore();
  };

  const handleAllLayersFlip = (axis: 'flipX' | 'flipY') => {
    for (const partKey of getEditablePartKeys()) {
      const transform = layerTransforms[partKey] || { x: 0, y: 0, scale: 1, rotation: 0 };
      updateLayerTransform(partKey, { [axis]: !transform[axis] });
    }
    persistTransformsToFirestore();
  };

  // Layer Horizontal & Vertical Flip Handlers
  const handleFlipX = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedPartKey || isCurrentLayerLocked) return;
    const current = layerTransforms[selectedPartKey] || { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false };
    const nextFlip = !current.flipX;
    updateLayerTransform(selectedPartKey, { flipX: nextFlip });
    persistTransformsToFirestore();
    showToast(`${selectedPartDef?.label || 'Layer'} ${nextFlip ? 'flipped horizontally (Flip X)' : 'unflipped'}`);
  };

  const handleFlipY = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedPartKey || isCurrentLayerLocked) return;
    const current = layerTransforms[selectedPartKey] || { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false };
    const nextFlip = !current.flipY;
    updateLayerTransform(selectedPartKey, { flipY: nextFlip });
    persistTransformsToFirestore();
    showToast(`${selectedPartDef?.label || 'Layer'} ${nextFlip ? 'flipped vertically (Flip Y)' : 'unflipped'}`);
  };

  // Canvas Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.15, 2.0));
    showToast(`Canvas Zoom: ${Math.round(Math.min(zoomLevel + 0.15, 2.0) * 100)}%`);
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.15, 0.4));
    showToast(`Canvas Zoom: ${Math.round(Math.max(zoomLevel - 0.15, 0.4) * 100)}%`);
  };

  const handleResetCanvas = () => {
    setZoomLevel(0.85);
    setPanOffset({ x: 0, y: 0 });
    showToast('Canvas view reset to default center');
  };

  // Save Character layer adjustments - Opens Firebase Save Dialog
  const handleSaveCharacter = () => {
    setIsSaveModalOpen(true);
  };

  // Selected Layer Transform Controls: Move, Zoom (Scale), Rotate
  const handleMoveLayer = (dx: number, dy: number) => {
    if (!selectedPartKey || isCurrentLayerLocked) return;
    updateLayerTransform(selectedPartKey, {
      x: Math.round(currentTransform.x + dx),
      y: Math.round(currentTransform.y + dy),
    });
  };

  const handleScaleLayer = (scaleDelta: number) => {
    if (!selectedPartKey || isCurrentLayerLocked) return;
    // UNLIMITED ZOOMOUT & ZOOMIN: allow down to 0.005 with no upper limit!
    const newScale = Math.max(0.005, +(currentTransform.scale + scaleDelta).toFixed(3));
    updateLayerTransform(selectedPartKey, { scale: newScale });
    showToast(`${selectedPartDef?.label || 'Layer'} Zoom: ${Math.round(newScale * 100)}%`);
  };

  const handleSetScaleDirect = (scaleVal: number) => {
    if (!selectedPartKey || isCurrentLayerLocked) return;
    const newScale = Math.max(0.005, +scaleVal.toFixed(3));
    updateLayerTransform(selectedPartKey, { scale: newScale });
    showToast(`${selectedPartDef?.label || 'Layer'} Zoom: ${Math.round(newScale * 100)}%`);
  };

  // 4 Corner Scale Handle MouseDown (Unlimited Zoom-in & Zoom-out)
  const handleCornerMouseDown = (corner: 'tl' | 'tr' | 'bl' | 'br', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPartKey || isCurrentLayerLocked) return;

    const rectEl = document.getElementById('interactive-bounding-box-rect');
    let centerX = e.clientX;
    let centerY = e.clientY;
    if (rectEl) {
      const b = rectEl.getBoundingClientRect();
      centerX = b.left + b.width / 2;
      centerY = b.top + b.height / 2;
    }

    const dist = Math.max(8, Math.hypot(e.clientX - centerX, e.clientY - centerY));
    if (e.shiftKey) {
      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      rotationLastAngleRef.current = startAngle;
      rotationAccumulatedRef.current = 0;
      setIsRotatingCorner(true);
      setRotationStartAngle(startAngle);
      setRotationStartValue(currentTransform.rotation || 0);
      setActiveCornerHandle(corner);
      setScaleStartCenter({ x: centerX, y: centerY });
      return;
    }
    setIsScalingCorner(true);
    setActiveCornerHandle(corner);
    setScaleStartCenter({ x: centerX, y: centerY });
    setScaleInitialDist(dist);
    setScaleStartValue(currentTransform.scale || 1);
  };

  const handleRotatePointerDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPartKey || isCurrentLayerLocked) return;
    const rectEl = document.getElementById('interactive-bounding-box-rect');
    if (!rectEl) return;
    const bounds = rectEl.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    rotationLastAngleRef.current = startAngle;
    rotationAccumulatedRef.current = 0;
    setIsRotatingCorner(true);
    setRotationStartAngle(startAngle);
    setRotationStartValue(currentTransform.rotation || 0);
    setScaleStartCenter({ x: centerX, y: centerY });
  };

  const handleAllLayersCornerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAllLayersSelected) return;
    const bounds = document.getElementById('all-layers-scale-bounds')?.getBoundingClientRect();
    if (!bounds) return;
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    setGroupScaleCenter({ x: 170, y: 340 });
    setScaleStartCenter({ x: centerX, y: centerY });
    setScaleInitialDist(Math.max(8, Math.hypot(e.clientX - centerX, e.clientY - centerY)));
    groupScaleStartRef.current = Object.fromEntries(
      CHARACTER_PARTS.map((part) => [part.key, layerTransforms[part.key] || { x: 0, y: 0, scale: 1, rotation: 0 }])
    );
    setIsScalingCorner(true);
  };

  const handleRotateLayer = (degDelta: number) => {
    if (!selectedPartKey || isCurrentLayerLocked) return;
    const nextRotation = (currentTransform.rotation + degDelta + 360) % 360;
    updateLayerTransform(selectedPartKey, { rotation: nextRotation });
  };

  const handleResetCurrentLayer = () => {
    if (!selectedPartKey) return;
    resetLayerTransform(selectedPartKey);
    showToast(`Reset ${selectedPartDef?.label || 'layer'} position & zoom`);
  };

  const handleAutoFitLayersToSkeleton = () => {
    resetAllLayerTransforms();
    setHiddenParts({});
    setSelectedPartKey(null);
    setIsTransformActive(false);
    if (!showSkeleton && onToggleSkeleton) onToggleSkeleton();
    showToast('All layers fitted to the skeleton-ready default slots');
  };

  const handleDownload = () => {
    const svgEl = document.getElementById('interactive-character-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'custom-edited-character.svg';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Character exported as SVG');
  };

  const handleUploadClick = () => {
    if (isCurrentLayerLocked) {
      showToast(`⚠️ ${selectedPartDef?.label} is locked! Unlock it first to upload.`);
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Upload replaces old layer completely with new layer
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPartKey) return;
    setHiddenParts((prev) => ({ ...prev, [selectedPartKey]: false }));
    const targetSubId = PART_PRIMARY_SUBLAYER[selectedPartKey] || selectedPartKey;
    showToast(`Uploading new layer for ${selectedPartDef?.label}...`);
    const uploadedUrl = await uploadAndReplaceLayer(targetSubId, file);
    if (uploadedUrl) {
      showToast(`✓ Old layer removed! New ${selectedPartDef?.label} layer uploaded and applied.`);
    }
  };

  const handleDeleteCustomLayer = () => {
    if (!selectedPartKey) return;
    removeLayerImageForPart(selectedPartKey);
    showToast(`✓ Custom layer removed. Restored ${selectedPartDef?.label} to default.`);
  };

  const handleToggleLockCurrentLayer = () => {
    if (!selectedPartKey) return;
    togglePartLock(selectedPartKey);
    const willBeLocked = !isCurrentLayerLocked;
    showToast(willBeLocked ? `🔒 ${selectedPartDef?.label} locked (unclickable)` : `🔓 ${selectedPartDef?.label} unlocked (editable)`);
  };

  const handleToggleLayerVisibility = () => {
    if (!selectedPartKey) return;
    const nextHidden = !hiddenParts[selectedPartKey];
    setHiddenParts((prev) => ({ ...prev, [selectedPartKey]: nextHidden }));
    if (nextHidden) {
      setSelectedPartKey(null);
      setIsTransformActive(false);
    }
    showToast(nextHidden ? `${selectedPartDef?.label || 'Layer'} hidden for this edit` : `${selectedPartDef?.label || 'Layer'} restored`);
  };

  // Canvas Mouse Pan / Drag Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'pan') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning && activeTool === 'pan') {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    } else if (isDraggingLayer && (activeTool === 'pen' || isTransformActive) && selectedPartKey && !isCurrentLayerLocked) {
      const dx = (e.clientX - dragStartPos.x) / zoomLevel;
      const dy = (e.clientY - dragStartPos.y) / zoomLevel;
      updateLayerTransform(selectedPartKey, {
        x: Math.round(dragStartTransform.x + dx),
        y: Math.round(dragStartTransform.y + dy),
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (isDraggingLayer || isScalingCorner || isRotatingCorner) {
      persistTransformsToFirestore();
    }
    setIsDraggingLayer(false);
    setIsScalingCorner(false);
    setIsRotatingCorner(false);
    setActiveCornerHandle(null);
  };

  // Global mouse tracking so dragging corner handles or moving layers works seamlessly outside canvas bounds
  useEffect(() => {
    const handleWindowMouseMove = (e: globalThis.MouseEvent) => {
      if (isRotatingCorner && selectedPartKey && !isCurrentLayerLocked) {
        const angle = Math.atan2(e.clientY - scaleStartCenter.y, e.clientX - scaleStartCenter.x) * (180 / Math.PI);
        let delta = angle - rotationLastAngleRef.current;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        rotationAccumulatedRef.current += delta;
        rotationLastAngleRef.current = angle;
        updateLayerTransform(selectedPartKey, {
          rotation: Math.round(rotationStartValue + rotationAccumulatedRef.current),
        });
      } else if (isScalingCorner && isAllLayersSelected) {
        const currentDist = Math.hypot(e.clientX - scaleStartCenter.x, e.clientY - scaleStartCenter.y);
        const factor = Math.max(0.005, currentDist / scaleInitialDist);
        for (const partKey of getEditablePartKeys()) {
          const start = groupScaleStartRef.current[partKey];
          if (!start) continue;
          updateLayerTransform(partKey, {
            x: Math.round(groupScaleCenter.x + (start.x - groupScaleCenter.x) * factor),
            y: Math.round(groupScaleCenter.y + (start.y - groupScaleCenter.y) * factor),
            scale: Math.max(0.005, +(start.scale * factor).toFixed(3)),
          });
        }
      } else if (isScalingCorner && selectedPartKey && !isCurrentLayerLocked) {
        const currentDist = Math.hypot(e.clientX - scaleStartCenter.x, e.clientY - scaleStartCenter.y);
        const factor = currentDist / scaleInitialDist;
        // Unlimited zoom out (down to 0.005) and unlimited zoom in
        const newScale = Math.max(0.005, +(scaleStartValue * factor).toFixed(3));
        updateLayerTransform(selectedPartKey, { scale: newScale });
      } else if (isDraggingLayer && (activeTool === 'pen' || isTransformActive) && selectedPartKey && !isCurrentLayerLocked) {
        const dx = (e.clientX - dragStartPos.x) / zoomLevel;
        const dy = (e.clientY - dragStartPos.y) / zoomLevel;
        updateLayerTransform(selectedPartKey, {
          x: Math.round(dragStartTransform.x + dx),
          y: Math.round(dragStartTransform.y + dy),
        });
      } else if (isPanning && activeTool === 'pan') {
        setPanOffset({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        });
      }
    };

    const handleWindowMouseUp = () => {
      setIsPanning(false);
      if (isDraggingLayer || isScalingCorner || isRotatingCorner) {
        persistTransformsToFirestore();
      }
      setIsDraggingLayer(false);
      setIsScalingCorner(false);
      setIsRotatingCorner(false);
      setActiveCornerHandle(null);
    };

    if (isScalingCorner || isRotatingCorner || isDraggingLayer || isPanning) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
      };
    }
  }, [
    isScalingCorner,
    isRotatingCorner,
    isAllLayersSelected,
    isDraggingLayer,
    isPanning,
    selectedPartKey,
    isCurrentLayerLocked,
    scaleStartCenter,
    scaleInitialDist,
    scaleStartValue,
    rotationStartAngle,
    rotationStartValue,
    dragStartPos,
    dragStartTransform,
    zoomLevel,
    activeTool,
    isTransformActive,
    updateLayerTransform,
    startPan,
  ]);

  // Selecting a part by clicking directly on the SVG element
  // When locked, layer is completely unclickable!
  const handlePartClick = (partKey: CharacterPartKey, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLayerLocked(partKey)) {
      showToast(`🔒 ${CHARACTER_PARTS.find((p) => p.key === partKey)?.label || 'Layer'} is locked (Unclickable). Click Unlock to edit.`);
      return;
    }
    setSelectedPartKey(partKey);
    setIsTransformActive(true);
    const def = CHARACTER_PARTS.find((p) => p.key === partKey);
    showToast(`Selected ${def?.label || partKey} layer: Ready to Move & Zoom`);
  };

  // Start dragging selected layer directly from canvas
  // Prevent dragging if layer is locked
  const handlePartMouseDown = (partKey: CharacterPartKey, e: React.MouseEvent) => {
    if (isLayerLocked(partKey)) {
      e.stopPropagation();
      return;
    }
    if (activeTool === 'pen' || isTransformActive) {
      e.stopPropagation();
      setSelectedPartKey(partKey);
      setIsDraggingLayer(true);
      setDragStartPos({ x: e.clientX, y: e.clientY });
      const current = layerTransforms[partKey] || { x: 0, y: 0, scale: 1, rotation: 0 };
      setDragStartTransform({ x: current.x, y: current.y });
    }
  };

  // Generate SVG transform string for any character part
  const getTransformAttr = (partKey: CharacterPartKey) => {
    const part = CHARACTER_PARTS.find((p) => p.key === partKey);
    const t = layerTransforms[partKey] || { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false };
    const pivot = part?.pivot || { x: 170, y: 340 };
    const sx = (t.flipX ? -1 : 1) * (t.scale ?? 1);
    const sy = (t.flipY ? -1 : 1) * (t.scale ?? 1);
    return `translate(${t.x}, ${t.y}) translate(${pivot.x}, ${pivot.y}) scale(${sx}, ${sy}) rotate(${t.rotation}) translate(${-pivot.x}, ${-pivot.y})`;
  };

  const getPartClass = (partKey: CharacterPartKey) => {
    const locked = isLayerLocked(partKey);
    const isSelected = selectedPartKey === partKey;
    if (hiddenParts[partKey]) {
      return 'pointer-events-none opacity-0 select-none';
    }
    if (locked) {
      return 'pointer-events-none opacity-85 select-none';
    }
    if (activeTool === 'pen' || isTransformActive) {
      return `cursor-move transition-all duration-75 ${
        isSelected 
          ? 'filter drop-shadow-[0_0_10px_rgba(56,189,248,0.9)] opacity-100' 
          : 'hover:opacity-90 hover:filter hover:drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]'
      }`;
    }
    return 'cursor-pointer transition-opacity hover:opacity-95';
  };

  // Keyboard navigation for nudge / zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSaveCharacter();
        return;
      }

      if (!selectedPartKey || (!isTransformActive && activeTool !== 'pen')) return;

      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleMoveLayer(0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleMoveLayer(0, step);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleMoveLayer(-step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleMoveLayer(step, 0);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleScaleLayer(0.05);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleScaleLayer(-0.05);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPartKey, isTransformActive, activeTool, currentTransform]);

  return (
    <div 
      id="character-editor-workspace"
      className="relative w-full min-h-[640px] flex flex-col items-center justify-between rounded-2xl bg-[#0e1014] border border-white/5 shadow-2xl select-none"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onClick={(e) => {
        // Deselect layer when clicking outside
        if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'editor-canvas-stage') {
          setSelectedPartKey(null);
          setIsTransformActive(false);
        }
      }}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,.svg"
      />

      {/* TOP FLOATING ACTION BAR - Compact, Responsive & Organized ("Gochalo") */}
      <div 
        id="character-action-toolbar"
        className="z-30 mt-2 mx-2 px-2.5 py-1.5 bg-[#171920]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-xl flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-medium text-slate-300 w-[96%] max-w-4xl"
      >
        {/* Left Section: Core Tools & Canvas Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {/* Edit / Pen Tool */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('pen');
              setIsTransformActive(true);
              showToast('Edit Tool active: Click layer on canvas to Move, Zoom or Flip');
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
              activeTool === 'pen'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'hover:bg-white/10 hover:text-white'
            }`}
            title="Edit Tool (Move, Zoom, Flip)"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Edit</span>
          </button>

          <button
            type="button"
            onClick={handleToggleAllLayers}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
              isAllLayersSelected
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'hover:bg-white/10 hover:text-white'
            }`}
            title="Select all character layers for grouped editing"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All Select</span>
          </button>

          {/* Reset Canvas View */}
          <button
            type="button"
            onClick={handleResetCanvas}
            className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Reset Canvas View"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset View</span>
          </button>

          {/* Download SVG */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            title="Download Character SVG"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">SVG</span>
          </button>

          {/* Skeleton Flip Button (Toggle Skeleton Rig Flip) */}
          {onToggleSkeletonFlip && (
            <button
              type="button"
              id="editor-skeleton-flip-btn"
              onClick={onToggleSkeletonFlip}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                isSkeletonFlipped 
                  ? 'bg-blue-600/30 border-blue-500/50 text-blue-300 font-semibold' 
                  : 'hover:bg-white/10 text-slate-300 border-white/5'
              }`}
              title="Flip Skeleton Rig Horizontally (কঙ্কাল ফ্লিপ করুন)"
            >
              <span>⇄</span>
              <span className="hidden sm:inline">Flip Rig</span>
              {isSkeletonFlipped && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </button>
          )}
        </div>

        {/* Middle Section: Contextual Layer Controls (Only when a layer is selected) */}
        <div className="flex items-center gap-1 flex-wrap">
          {selectedPartKey && selectedPartDef ? (
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-lg">
              {/* Selected Part Badge */}
              <span className="flex items-center gap-1 font-semibold text-blue-300 text-[11px] pr-1">
                <span>{selectedPartDef.icon}</span>
                <span className="max-w-[75px] truncate">{selectedPartDef.label.split(' ')[0]}</span>
              </span>

              {/* Lock / Unlock */}
              <button
                type="button"
                onClick={handleToggleLockCurrentLayer}
                className={`p-1 rounded transition-colors ${
                  isCurrentLayerLocked 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'hover:bg-white/10 text-slate-300 hover:text-white'
                }`}
                title={isCurrentLayerLocked ? 'Unlock Layer' : 'Lock Layer (unclickable)'}
              >
                {isCurrentLayerLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
              </button>

              {/* Upload */}
              <button
                type="button"
                disabled={isCurrentLayerLocked}
                onClick={handleUploadClick}
                className={`p-1 rounded transition-colors ${
                  isCurrentLayerLocked ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer'
                }`}
                title="Upload image for this layer"
              >
                <Upload className="w-3 h-3" />
              </button>

              {/* Flip X (Horizontal) */}
              <button
                type="button"
                disabled={isCurrentLayerLocked}
                onClick={handleFlipX}
                className={`p-1 rounded transition-colors border ${
                  currentTransform.flipX 
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' 
                    : 'hover:bg-white/10 text-slate-300 border-transparent hover:text-white'
                } ${isCurrentLayerLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                title="Flip Layer Horizontally (Flip X)"
              >
                <FlipHorizontal className="w-3 h-3" />
              </button>

              {/* Flip Y (Vertical) */}
              <button
                type="button"
                disabled={isCurrentLayerLocked}
                onClick={handleFlipY}
                className={`p-1 rounded transition-colors border ${
                  currentTransform.flipY 
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' 
                    : 'hover:bg-white/10 text-slate-300 border-transparent hover:text-white'
                } ${isCurrentLayerLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                title="Flip Layer Vertically (Flip Y)"
              >
                <FlipVertical className="w-3 h-3" />
              </button>

              {/* Temporarily remove/restore layer from the editor */}
              <button
                type="button"
                disabled={isCurrentLayerLocked}
                onClick={handleToggleLayerVisibility}
                className={`p-1 rounded hover:bg-red-500/20 hover:text-red-300 text-slate-400 transition-colors ${
                  isCurrentLayerLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Remove this layer from the editor temporarily"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              {/* Deselect Layer Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedPartKey(null);
                  setIsTransformActive(false);
                }}
                className="p-1 rounded hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Deselect layer (Faka jaygay click korleo hide hoy)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 italic">
              <Info className="w-3 h-3 text-blue-400/70" />
              <span>Click any layer to move, zoom or flip</span>
            </span>
          )}
        </div>

        {/* Right Section: Preset / Character List & Save */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {/* Character List Button */}
          <button
            type="button"
            onClick={() => setIsCharacterListOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-semibold cursor-pointer shadow-sm transition-all"
            title="Saved Characters List (সব সেভ করা ক্যারেক্টার)"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xs:inline">List</span>
            {savedCharacters.length > 0 && (
              <span className="px-1.5 py-0.2 bg-sky-500 text-white rounded-full text-[10px] font-bold">
                {savedCharacters.length}
              </span>
            )}
          </button>

          {/* Save Character Button */}
          <button
            type="button"
            onClick={handleSaveCharacter}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/30 cursor-pointer transition-all hover:shadow-emerald-500/40"
            title="Save character to Firebase (ক্যারেক্টার সেভ করুন)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            type="button"
            onClick={handleAutoFitLayersToSkeleton}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 font-semibold cursor-pointer transition-all"
            title="Fit all uploaded layers to the default skeleton slots"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto Fit</span>
          </button>
        </div>
      </div>

      {isAllLayersSelected && (
        <div className="z-30 mx-2 mt-1 w-[96%] max-w-4xl rounded-xl border border-cyan-500/30 bg-[#121b24]/95 px-3 py-2 shadow-xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-cyan-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> All Layers Selected
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => handleAllLayersMove(-5, 0)} className="px-2 py-1 rounded bg-white/10 hover:bg-cyan-600 text-slate-200" title="Move all left">←</button>
            <button type="button" onClick={() => handleAllLayersMove(5, 0)} className="px-2 py-1 rounded bg-white/10 hover:bg-cyan-600 text-slate-200" title="Move all right">→</button>
            <button type="button" onClick={() => handleAllLayersMove(0, -5)} className="px-2 py-1 rounded bg-white/10 hover:bg-cyan-600 text-slate-200" title="Move all up">↑</button>
            <button type="button" onClick={() => handleAllLayersMove(0, 5)} className="px-2 py-1 rounded bg-white/10 hover:bg-cyan-600 text-slate-200" title="Move all down">↓</button>
            <button type="button" onClick={() => handleAllLayersScale(-0.05)} className="px-2 py-1 rounded bg-white/10 hover:bg-emerald-600 text-slate-200" title="Scale all down">−</button>
            <button type="button" onClick={() => handleAllLayersScale(0.05)} className="px-2 py-1 rounded bg-white/10 hover:bg-emerald-600 text-slate-200" title="Scale all up">＋</button>
            <button type="button" onClick={() => handleAllLayersRotate(-15)} className="px-2 py-1 rounded bg-white/10 hover:bg-purple-600 text-slate-200" title="Rotate all left">↺</button>
            <button type="button" onClick={() => handleAllLayersRotate(15)} className="px-2 py-1 rounded bg-white/10 hover:bg-purple-600 text-slate-200" title="Rotate all right">↻</button>
            <button type="button" onClick={() => handleAllLayersFlip('flipX')} className="px-2 py-1 rounded bg-white/10 hover:bg-blue-600 text-slate-200" title="Flip all horizontally">⇄ X</button>
            <button type="button" onClick={() => handleAllLayersFlip('flipY')} className="px-2 py-1 rounded bg-white/10 hover:bg-blue-600 text-slate-200" title="Flip all vertically">⇅ Y</button>
            <button type="button" onClick={handleAutoFitLayersToSkeleton} className="px-2 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600 text-cyan-100" title="Fit all layers to skeleton">Auto Fit</button>
            <button type="button" onClick={handleSaveCharacter} className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white" title="Save this character preset">Save Preset</button>
          </div>
        </div>
      )}

      {/* QUICK LAYER SELECTOR BAR (Under top action bar) */}
      <div className="z-25 mt-1 px-2 w-full max-w-2xl flex items-center justify-center gap-1 overflow-x-auto scrollbar-none py-0.5 text-[11px]">
        {CHARACTER_PARTS.map((part) => {
          const isSelected = selectedPartKey === part.key;
          const locked = isLayerLocked(part.key);
          const t = layerTransforms[part.key];
          const hasCustomMod = t && (t.x !== 0 || t.y !== 0 || t.scale !== 1 || t.rotation !== 0);
          return (
            <button
              key={part.key}
              type="button"
              onClick={() => {
                setSelectedPartKey(part.key);
                setIsTransformActive(true);
                if (locked) {
                  showToast(`🔒 ${part.label} is locked (Unclickable on canvas - click Unlock to edit)`);
                } else {
                  showToast(`Selected ${part.label}`);
                }
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap transition-all text-xs ${
                isSelected
                  ? 'bg-blue-600 text-white font-medium ring-2 ring-blue-400/40 shadow-sm'
                  : locked
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/40'
                  : 'bg-[#1a1c22] text-slate-400 hover:text-slate-200 hover:bg-[#252830]'
              }`}
            >
              <span>{part.icon}</span>
              <span>{part.label.split(' ')[0]}</span>
              {locked && <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
              {hasCustomMod && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" title="Customized" />
              )}
            </button>
          );
        })}
      </div>

      {/* LEFT VERTICAL TOOLBAR (Hand, Pen, +, -, Face, Body) */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2">
        {/* Hand Tool (Pan/Move canvas) */}
        <button
          type="button"
          onClick={() => {
            setActiveTool('pan');
            showToast('Pan Tool: Drag canvas to navigate');
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${
            activeTool === 'pan'
              ? 'bg-[#3b82f6] text-white shadow-blue-500/30 ring-2 ring-blue-400/50'
              : 'bg-[#22252c] text-slate-300 hover:text-white hover:bg-[#2b2f38]'
          }`}
          title="Pan Canvas (Hand tool)"
        >
          <Hand className="w-4 h-4" />
        </button>

        {/* Edit / Pen tool */}
        <button
          type="button"
          onClick={() => {
            setActiveTool('pen');
            setIsTransformActive(true);
            showToast('Edit Tool: Select and transform any layer');
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${
            activeTool === 'pen'
              ? 'bg-[#3b82f6] text-white shadow-blue-500/30 ring-2 ring-blue-400/50'
              : 'bg-[#22252c] text-slate-300 hover:text-white hover:bg-[#2b2f38]'
          }`}
          title="Edit / Pen tool (Move, Zoom, Rotate any Layer)"
        >
          <PenTool className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-[#22252c] text-slate-300 hover:text-white hover:bg-[#2b2f38] shadow-lg transition-all"
          title="Canvas Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-[#22252c] text-slate-300 hover:text-white hover:bg-[#2b2f38] shadow-lg transition-all"
          title="Canvas Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Face / Expression Tool */}
        <button
          type="button"
          onClick={() => {
            setActiveTool('pen');
            setSelectedPartKey('head');
            setIsTransformActive(true);
            showToast('Face layer selected: Ready to adjust');
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${
            selectedPartKey === 'head' || selectedPartKey === 'mouth' || selectedPartKey === 'eyes'
              ? 'bg-[#3b82f6] text-white shadow-blue-500/30'
              : 'bg-[#22252c] text-slate-300 hover:text-white hover:bg-[#2b2f38]'
          }`}
          title="Face & Head Layers"
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* Full Body / Torso Pose Tool */}
        <button
          type="button"
          onClick={() => {
            setActiveTool('pen');
            setSelectedPartKey('torso');
            setIsTransformActive(true);
            showToast('Torso / Body layer selected');
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${
            selectedPartKey === 'torso'
              ? 'bg-[#3b82f6] text-white shadow-blue-500/30'
              : 'bg-[#22252c] text-slate-300 hover:text-white hover:bg-[#2b2f38]'
          }`}
          title="Body / Torso Layer"
        >
          <User className="w-4 h-4" />
        </button>
      </div>

      {/* MAIN INTERACTIVE CANVAS: The Standing Character Model */}
      <div 
        id="editor-canvas-stage"
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'editor-canvas-stage') {
            setSelectedPartKey(null);
            setIsTransformActive(false);
          }
        }}
        className="w-full h-full min-h-[460px] flex items-center justify-center overflow-hidden cursor-default"
      >
        <div 
          className="transition-transform duration-75 ease-out flex items-center justify-center"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        >
          {/* Standing Pose Character */}
          <svg 
            id="interactive-character-svg"
            viewBox="0 0 340 680" 
            width="260" 
            height="520"
            className="overflow-visible filter drop-shadow-2xl"
          >
            <defs>
              <linearGradient id="editSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={
                  activeModelTheme === 'indian_woman' ? '#d49b6e' :
                  activeModelTheme === 'indian_man' ? '#c68a5c' : '#f9d3bb'
                }/>
                <stop offset="100%" stopColor={
                  activeModelTheme === 'indian_woman' ? '#b5764d' :
                  activeModelTheme === 'indian_man' ? '#aa693d' : '#e5b191'
                }/>
              </linearGradient>
              <linearGradient id="editShirt" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={
                  activeModelTheme === 'indian_woman' ? '#db2777' :
                  activeModelTheme === 'indian_man' ? '#ea580c' : '#a7cfee'
                }/>
                <stop offset="100%" stopColor={
                  activeModelTheme === 'indian_woman' ? '#be185d' :
                  activeModelTheme === 'indian_man' ? '#c2410c' : '#78a4dc'
                }/>
              </linearGradient>
              <linearGradient id="editPants" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={
                  activeModelTheme === 'indian_woman' ? '#e11d48' :
                  activeModelTheme === 'indian_man' ? '#fef3c7' : '#433e38'
                }/>
                <stop offset="100%" stopColor={
                  activeModelTheme === 'indian_woman' ? '#9f1239' :
                  activeModelTheme === 'indian_man' ? '#ded1bc' : '#2c2824'
                }/>
              </linearGradient>
              <linearGradient id="editPantsBack" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={
                  activeModelTheme === 'indian_woman' ? '#be123c' :
                  activeModelTheme === 'indian_man' ? '#ebd5b3' : '#37322d'
                }/>
                <stop offset="100%" stopColor={
                  activeModelTheme === 'indian_woman' ? '#881337' :
                  activeModelTheme === 'indian_man' ? '#caa97e' : '#221e1a'
                }/>
              </linearGradient>
              <linearGradient id="editShoes" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={
                  activeModelTheme === 'indian_woman' ? '#831843' :
                  activeModelTheme === 'indian_man' ? '#78350f' : '#2a231e'
                }/>
                <stop offset="100%" stopColor={
                  activeModelTheme === 'indian_woman' ? '#500724' :
                  activeModelTheme === 'indian_man' ? '#451a03' : '#17120f'
                }/>
              </linearGradient>
            </defs>

            {/* Clickable background to deselect active layer */}
            <rect
              id="canvas-empty-click-area"
              x="-1000"
              y="-1000"
              width="3000"
              height="3000"
              fill="transparent"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPartKey(null);
                setIsTransformActive(false);
              }}
              className="cursor-default"
            />

            {/* 1. BACK / RIGHT ARM & HAND (Behind torso) */}
            <g 
              id="layer-arm-right"
              transform={getTransformAttr('armRight')}
              onClick={(e) => handlePartClick('armRight', e)}
              onMouseDown={(e) => handlePartMouseDown('armRight', e)}
              className={getPartClass('armRight')}
            >
              {customArmRight ? (
                <image 
                  href={customArmRight} 
                  x="180" 
                  y="210" 
                  width="55" 
                  height="135" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <>
                  {/* Upper arm */}
                  <path d="M 205,215 C 224,250 230,290 226,335 C 220,340 206,338 202,330 C 206,290 204,250 192,225 Z" fill="#6a96c8" stroke="#486f9c" strokeWidth="2.5" />
                  {/* Forearm */}
                  <path d="M 224,330 C 220,365 212,395 200,415 C 192,420 182,410 185,398 C 195,380 202,355 204,330 Z" fill="url(#editSkin)" stroke="#a1694b" strokeWidth="2" />
                </>
              )}
            </g>

            {/* 2. BACK / RIGHT PALM */}
            <g
              id="layer-palm-right"
              transform={getTransformAttr('palmRight')}
              onClick={(e) => handlePartClick('palmRight', e)}
              onMouseDown={(e) => handlePartMouseDown('palmRight', e)}
              className={getPartClass('palmRight')}
            >
              {customPalmRight ? (
                <image 
                  href={customPalmRight} 
                  x="175" 
                  y="395" 
                  width="35" 
                  height="35" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <path d="M 194,402 C 204,404 208,416 202,425 C 196,432 184,430 180,422 C 178,414 185,404 194,402 Z" fill="#696560" stroke="#3d3a36" strokeWidth="2" />
              )}
            </g>

            {/* 3. BACK / RIGHT LEG (Behind) */}
            <g 
              id="layer-leg-right"
              transform={getTransformAttr('legRight')}
              onClick={(e) => handlePartClick('legRight', e)}
              onMouseDown={(e) => handlePartMouseDown('legRight', e)}
              className={getPartClass('legRight')}
            >
              {customLegRight ? (
                <image 
                  href={customLegRight} 
                  x="150" 
                  y="340" 
                  width="55" 
                  height="200" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <>
                  {/* Thigh */}
                  <path d="M 175,345 C 185,410 192,480 195,540 C 178,545 160,544 156,536 C 152,480 150,410 152,345 Z" fill="url(#editPantsBack)" stroke="#1a1816" strokeWidth="2.5" />
                  {/* Calf */}
                  <path d="M 195,536 C 200,570 205,605 208,632 C 190,636 174,636 170,628 C 166,600 160,570 156,536 Z" fill="url(#editPantsBack)" stroke="#1a1816" strokeWidth="2.5" />
                </>
              )}
            </g>

            {/* 4. BACK / RIGHT SHOE */}
            <g
              id="layer-shoe-right"
              transform={getTransformAttr('shoeRight')}
              onClick={(e) => handlePartClick('shoeRight', e)}
              onMouseDown={(e) => handlePartMouseDown('shoeRight', e)}
              className={getPartClass('shoeRight')}
            >
              {customShoeRight ? (
                <image 
                  href={customShoeRight} 
                  x="155" 
                  y="618" 
                  width="75" 
                  height="38" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <path d="M 170,624 C 185,628 214,628 226,640 C 230,648 222,654 204,654 L 158,654 C 150,654 154,640 170,624 Z" fill="url(#editShoes)" stroke="#110e0c" strokeWidth="2" />
              )}
            </g>

            {/* 5. FRONT / LEFT LEG */}
            <g 
              id="layer-leg-left"
              transform={getTransformAttr('legLeft')}
              onClick={(e) => handlePartClick('legLeft', e)}
              onMouseDown={(e) => handlePartMouseDown('legLeft', e)}
              className={getPartClass('legLeft')}
            >
              {customLegLeft ? (
                <image 
                  href={customLegLeft} 
                  x="100" 
                  y="340" 
                  width="50" 
                  height="200" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <>
                  {/* Thigh */}
                  <path d="M 138,345 C 142,410 144,480 142,540 C 124,544 105,540 106,532 C 112,476 116,410 120,345 Z" fill="url(#editPants)" stroke="#1a1816" strokeWidth="2.5" />
                  {/* Calf */}
                  <path d="M 142,536 C 138,570 134,605 128,632 C 110,636 94,632 94,624 C 100,596 104,568 106,536 Z" fill="url(#editPants)" stroke="#1a1816" strokeWidth="2.5" />
                </>
              )}
            </g>

            {/* 6. FRONT / LEFT SHOE */}
            <g
              id="layer-shoe-left"
              transform={getTransformAttr('shoeLeft')}
              onClick={(e) => handlePartClick('shoeLeft', e)}
              onMouseDown={(e) => handlePartMouseDown('shoeLeft', e)}
              className={getPartClass('shoeLeft')}
            >
              {customShoeLeft ? (
                <image 
                  href={customShoeLeft} 
                  x="75" 
                  y="618" 
                  width="78" 
                  height="38" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <path d="M 94,624 C 110,628 138,628 150,640 C 154,648 146,654 128,654 L 80,654 C 72,654 76,640 94,624 Z" fill="url(#editShoes)" stroke="#110e0c" strokeWidth="2" />
              )}
            </g>

            {/* 7. MAIN TORSO */}
            <g 
              id="layer-torso"
              transform={getTransformAttr('torso')}
              onClick={(e) => handlePartClick('torso', e)}
              onMouseDown={(e) => handlePartMouseDown('torso', e)}
              className={getPartClass('torso')}
            >
              {customTorso ? (
                <image 
                  href={customTorso} 
                  x="110" 
                  y="195" 
                  width="115" 
                  height="155" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <>
                  {/* Shirt */}
                  <path 
                    d="M 126,205 
                       C 142,202 196,202 210,205 
                       C 224,222 226,280 216,345 
                       C 192,349 144,349 122,345 
                       C 114,280 114,222 126,205 Z" 
                    fill="url(#editShirt)" 
                    stroke="#537dae" 
                    strokeWidth="2.8" 
                  />
                  {/* Collar */}
                  <path d="M 146,197 L 164,220 L 170,199 L 178,220 L 192,197 Z" fill="#b9dcfa" stroke="#537dae" strokeWidth="2" />
                  {/* Placket line & buttons */}
                  <line x1="168" y1="215" x2="168" y2="338" stroke="#537dae" strokeWidth="2" />
                  <circle cx="168" cy="235" r="2.2" fill="#fff" />
                  <circle cx="168" cy="262" r="2.2" fill="#fff" />
                  <circle cx="168" cy="290" r="2.2" fill="#fff" />
                  <circle cx="168" cy="318" r="2.2" fill="#fff" />

                  {/* Belt */}
                  <rect x="124" y="337" width="94" height="12" fill="#2b2622" stroke="#171513" strokeWidth="1.5" />
                  <rect x="160" y="335" width="18" height="16" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
                  <rect x="164" y="339" width="10" height="8" fill="#334155" />
                </>
              )}
            </g>

            {/* 8. HEAD BASE & NECK */}
            <g 
              id="layer-head"
              transform={getTransformAttr('head')}
              onClick={(e) => handlePartClick('head', e)}
              onMouseDown={(e) => handlePartMouseDown('head', e)}
              className={getPartClass('head')}
            >
              {customHead ? (
                <image 
                  href={customHead} 
                  x="130" 
                  y="55" 
                  width="80" 
                  height="120" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <>
                  {/* Neck */}
                  <path d="M 152,176 L 152,202 L 182,202 L 182,176 Z" fill="url(#editSkin)" stroke="#9e6648" strokeWidth="2" />
                  
                  {/* Head Base */}
                  <path 
                    d="M 140,96 
                       C 140,64 196,64 202,96 
                       C 208,120 204,156 195,168 
                       C 182,184 164,184 149,172 
                       C 138,160 135,124 140,96 Z" 
                    fill="url(#editSkin)" 
                    stroke="#9e6648" 
                    strokeWidth="2.5" 
                  />

                  {/* Nose */}
                  <path d="M 170,116 L 166,130 L 174,132" fill="none" stroke="#b07452" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Indian Woman Accents: Forehead Bindi & Earrings */}
                  {activeModelTheme === 'indian_woman' && (
                    <>
                      <circle cx="170" cy="108" r="3.2" fill="#dc2626" stroke="#fef08a" strokeWidth="0.8" />
                      <circle cx="137" cy="132" r="3.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
                      <circle cx="203" cy="132" r="3.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
                    </>
                  )}

                  {/* Indian Man Accents: Classic Mustache */}
                  {activeModelTheme === 'indian_man' && (
                    <path d="M 154,142 Q 170,147 186,142 Q 170,154 154,142 Z" fill="#1c1917" stroke="#000" strokeWidth="0.5" />
                  )}
                </>
              )}
            </g>

            {/* 9. HAIR */}
            <g
              id="layer-hair"
              transform={getTransformAttr('hair')}
              onClick={(e) => handlePartClick('hair', e)}
              onMouseDown={(e) => handlePartMouseDown('hair', e)}
              className={getPartClass('hair')}
            >
              {customHair ? (
                <image 
                  href={customHair} 
                  x="122" 
                  y="32" 
                  width="98" 
                  height="90" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <>
                  <path 
                    d="M 134,100 
                       C 134,64 160,44 190,48 
                       C 214,52 214,80 208,96 
                       C 204,84 196,72 176,70 
                       C 156,70 142,84 138,104 Z" 
                    fill="#1c1917" 
                    stroke="#000" 
                    strokeWidth="2" 
                  />
                  <path d="M 198,92 C 204,96 208,112 200,124 L 196,116" fill="#1c1917" />
                  
                  {/* Indian Woman Long Flowing Hair strands */}
                  {activeModelTheme === 'indian_woman' && (
                    <>
                      <path d="M 134,100 C 126,140 126,200 134,240 C 138,230 138,180 142,130 Z" fill="#1c1917" />
                      <path d="M 204,100 C 212,140 212,200 204,240 C 200,230 200,180 196,130 Z" fill="#1c1917" />
                    </>
                  )}
                </>
              )}
            </g>

            {/* 10. EYEBROWS */}
            <g
              id="layer-eyebrows"
              transform={getTransformAttr('eyebrows')}
              onClick={(e) => handlePartClick('eyebrows', e)}
              onMouseDown={(e) => handlePartMouseDown('eyebrows', e)}
              className={getPartClass('eyebrows')}
            >
              {customEyebrowLeft ? (
                <image 
                  href={customEyebrowLeft} 
                  x="145" 
                  y="102" 
                  width="24" 
                  height="12" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <path d="M 148,108 Q 160,104 166,110" fill="none" stroke="#24160d" strokeWidth="2.5" strokeLinecap="round" />
              )}
              {customEyebrowRight ? (
                <image 
                  href={customEyebrowRight} 
                  x="175" 
                  y="102" 
                  width="24" 
                  height="12" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <path d="M 178,108 Q 186,104 194,110" fill="none" stroke="#24160d" strokeWidth="2.5" strokeLinecap="round" />
              )}
            </g>

            {/* 11. EYES */}
            <g
              id="layer-eyes"
              transform={getTransformAttr('eyes')}
              onClick={(e) => handlePartClick('eyes', e)}
              onMouseDown={(e) => handlePartMouseDown('eyes', e)}
              className={getPartClass('eyes')}
            >
              {customEyeLeft ? (
                <image 
                  href={customEyeLeft} 
                  x="154" 
                  y="112" 
                  width="10" 
                  height="10" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <>
                  <circle cx="158" cy="116" r="3.2" fill="#24160d" />
                  <circle cx="159" cy="115" r="1.1" fill="#fff" />
                </>
              )}
              {customEyeRight ? (
                <image 
                  href={customEyeRight} 
                  x="180" 
                  y="112" 
                  width="10" 
                  height="10" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <>
                  <circle cx="184" cy="116" r="3.2" fill="#24160d" />
                  <circle cx="185" cy="115" r="1.1" fill="#fff" />
                </>
              )}
            </g>

            {/* 12. MOUTH / DYNAMIC LIP SYNC / QUIET MOUTH */}
            <g
              id="layer-mouth"
              transform={getTransformAttr('mouth')}
              onClick={(e) => handlePartClick('mouth', e)}
              onMouseDown={(e) => handlePartMouseDown('mouth', e)}
              className={getPartClass('mouth')}
            >
              {isSpeaking ? (
                <image 
                  href={activeLipShape.svgUrl} 
                  x="154" 
                  y="136" 
                  width="34" 
                  height="20" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <image 
                  href={restingLipShape?.svgUrl || '/assets/lips/lip-x.svg'} 
                  x="154" 
                  y="136" 
                  width="34" 
                  height="20" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              )}
            </g>

            {/* 13. FRONT / LEFT ARM */}
            <g 
              id="layer-arm-left"
              transform={getTransformAttr('armLeft')}
              onClick={(e) => handlePartClick('armLeft', e)}
              onMouseDown={(e) => handlePartMouseDown('armLeft', e)}
              className={getPartClass('armLeft')}
            >
              {customArmLeft ? (
                <image 
                  href={customArmLeft} 
                  x="105" 
                  y="210" 
                  width="45" 
                  height="120" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <>
                  {/* Upper arm (Sleeve) */}
                  <path d="M 126,210 C 112,250 108,290 112,330 C 120,336 134,332 136,324 C 132,290 134,250 144,220 Z" fill="url(#editShirt)" stroke="#537dae" strokeWidth="2.5" />
                  {/* Forearm */}
                  <path d="M 114,324 C 116,356 126,384 138,404 C 146,412 158,400 154,388 C 142,370 134,344 132,320 Z" fill="url(#editSkin)" stroke="#9e6648" strokeWidth="2" />
                </>
              )}
            </g>

            {/* 14. FRONT / LEFT PALM */}
            <g
              id="layer-palm-left"
              transform={getTransformAttr('palmLeft')}
              onClick={(e) => handlePartClick('palmLeft', e)}
              onMouseDown={(e) => handlePartMouseDown('palmLeft', e)}
              className={getPartClass('palmLeft')}
            >
              {customPalmLeft ? (
                <image 
                  href={customPalmLeft} 
                  x="125" 
                  y="390" 
                  width="34" 
                  height="34" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <path d="M 138,396 C 146,396 150,404 148,416 C 144,424 134,424 130,418 C 128,410 132,398 138,396 Z" fill="url(#editSkin)" stroke="#9e6648" strokeWidth="2" />
              )}
            </g>

            {/* INTERACTIVE BOUNDING BOX FOR SELECTED LAYER (Drag to move, 4 corner handles to scale) */}
            {selectedPartDef && (activeTool === 'pen' || isTransformActive) && (
              <g transform={getTransformAttr(selectedPartKey)}>
                {/* Bounding box drag rect */}
                <rect 
                  id="interactive-bounding-box-rect"
                  x={selectedPartDef.defaultBox.x - 6} 
                  y={selectedPartDef.defaultBox.y - 6} 
                  width={selectedPartDef.defaultBox.width + 12} 
                  height={selectedPartDef.defaultBox.height + 12} 
                  fill={isCurrentLayerLocked ? "rgba(239, 68, 68, 0.06)" : "rgba(56, 189, 248, 0.08)"} 
                  stroke={isCurrentLayerLocked ? "#ef4444" : "#38bdf8"} 
                  strokeWidth="2" 
                  strokeDasharray="5 4" 
                  rx="6"
                  className={isCurrentLayerLocked ? "cursor-not-allowed pointer-events-auto" : "cursor-move pointer-events-auto"}
                  onMouseDown={(e) => handlePartMouseDown(selectedPartKey, e)}
                />

                {/* Layer Name & Zoom readout badge */}
                <g className="pointer-events-none select-none">
                  <rect
                    x={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width / 2 - 55}
                    y={selectedPartDef.defaultBox.y - 28}
                    width="110"
                    height="20"
                    rx="5"
                    fill="rgba(15, 23, 42, 0.92)"
                    stroke="#38bdf8"
                    strokeWidth="1"
                  />
                  <text
                    x={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width / 2}
                    y={selectedPartDef.defaultBox.y - 14}
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {Math.round((currentTransform.scale || 1) * 100)}% • Corner Zoom
                  </text>
                </g>

                {/* Visible rotation pointer: drag the cyan handle to rotate 0-360 degrees */}
                {!isCurrentLayerLocked && (
                  <g
                    id="handle-rotate"
                    className="cursor-grab pointer-events-auto"
                    onMouseDown={handleRotatePointerDown}
                  >
                    <line
                      x1={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width / 2}
                      y1={selectedPartDef.defaultBox.y - 6}
                      x2={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width / 2}
                      y2={selectedPartDef.defaultBox.y - 34}
                      stroke="#a855f7"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                    />
                    <circle
                      cx={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width / 2}
                      cy={selectedPartDef.defaultBox.y - 42}
                      r="10"
                      fill="#1e1335"
                      stroke="#c084fc"
                      strokeWidth="2.5"
                    />
                    <path
                      d={`M ${selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width / 2 - 4} ${selectedPartDef.defaultBox.y - 42} a 5 5 0 1 1 5 5`}
                      fill="none"
                      stroke="#f5d0fe"
                      strokeWidth="1.8"
                    />
                    <text
                      x={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width / 2 + 14}
                      y={selectedPartDef.defaultBox.y - 38}
                      fill="#e9d5ff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      Rotate
                    </text>
                  </g>
                )}

                {/* 4 CORNER SCALE HANDLES (Unlimited Zoom-in & Zoom-out by dragging) */}
                {!isCurrentLayerLocked && (
                  <>
                    {/* Top-Left Corner Handle */}
                    <g 
                      id="handle-tl"
                      className="cursor-nwse-resize pointer-events-auto group"
                      onMouseDown={(e) => handleCornerMouseDown('tl', e)}
                    >
                      <circle 
                        cx={selectedPartDef.defaultBox.x - 6} 
                        cy={selectedPartDef.defaultBox.y - 6} 
                        r="14" 
                        fill="transparent" 
                      />
                      <circle 
                        cx={selectedPartDef.defaultBox.x - 6} 
                        cy={selectedPartDef.defaultBox.y - 6} 
                        r={activeCornerHandle === 'tl' ? "7.5" : "5.5"} 
                        fill="#ffffff" 
                        stroke="#0284c7" 
                        strokeWidth="2.5" 
                      />
                      <circle 
                        cx={selectedPartDef.defaultBox.x - 6} 
                        cy={selectedPartDef.defaultBox.y - 6} 
                        r="2" 
                        fill="#0284c7" 
                      />
                    </g>

                    {/* Top-Right Corner Handle */}
                    <g 
                      id="handle-tr"
                      className="cursor-nesw-resize pointer-events-auto group"
                      onMouseDown={(e) => handleCornerMouseDown('tr', e)}
                    >
                      <circle 
                        cx={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width + 6} 
                        cy={selectedPartDef.defaultBox.y - 6} 
                        r="14" 
                        fill="transparent" 
                      />
                      <circle 
                        cx={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width + 6} 
                        cy={selectedPartDef.defaultBox.y - 6} 
                        r={activeCornerHandle === 'tr' ? "7.5" : "5.5"} 
                        fill="#ffffff" 
                        stroke="#0284c7" 
                        strokeWidth="2.5" 
                      />
                      <circle 
                        cx={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width + 6} 
                        cy={selectedPartDef.defaultBox.y - 6} 
                        r="2" 
                        fill="#0284c7" 
                      />
                    </g>

                    {/* Bottom-Left Corner Handle */}
                    <g 
                      id="handle-bl"
                      className="cursor-nesw-resize pointer-events-auto group"
                      onMouseDown={(e) => handleCornerMouseDown('bl', e)}
                    >
                      <circle 
                        cx={selectedPartDef.defaultBox.x - 6} 
                        cy={selectedPartDef.defaultBox.y + selectedPartDef.defaultBox.height + 6} 
                        r="14" 
                        fill="transparent" 
                      />
                      <circle 
                        cx={selectedPartDef.defaultBox.x - 6} 
                        cy={selectedPartDef.defaultBox.y + selectedPartDef.defaultBox.height + 6} 
                        r={activeCornerHandle === 'bl' ? "7.5" : "5.5"} 
                        fill="#ffffff" 
                        stroke="#0284c7" 
                        strokeWidth="2.5" 
                      />
                      <circle 
                        cx={selectedPartDef.defaultBox.x - 6} 
                        cy={selectedPartDef.defaultBox.y + selectedPartDef.defaultBox.height + 6} 
                        r="2" 
                        fill="#0284c7" 
                      />
                    </g>

                    {/* Bottom-Right Corner Handle */}
                    <g 
                      id="handle-br"
                      className="cursor-nwse-resize pointer-events-auto group"
                      onMouseDown={(e) => handleCornerMouseDown('br', e)}
                    >
                      <circle 
                        cx={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width + 6} 
                        cy={selectedPartDef.defaultBox.y + selectedPartDef.defaultBox.height + 6} 
                        r="14" 
                        fill="transparent" 
                      />
                      <circle 
                        cx={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width + 6} 
                        cy={selectedPartDef.defaultBox.y + selectedPartDef.defaultBox.height + 6} 
                        r={activeCornerHandle === 'br' ? "7.5" : "5.5"} 
                        fill="#ffffff" 
                        stroke="#0284c7" 
                        strokeWidth="2.5" 
                      />
                      <circle 
                        cx={selectedPartDef.defaultBox.x + selectedPartDef.defaultBox.width + 6} 
                        cy={selectedPartDef.defaultBox.y + selectedPartDef.defaultBox.height + 6} 
                        r="2" 
                        fill="#0284c7" 
                      />
                    </g>
                  </>
                )}

                {/* Pivot Center Anchor */}
                <circle cx={selectedPartDef.pivot.x} cy={selectedPartDef.pivot.y} r="5" fill="#f43f5e" stroke="#fff" strokeWidth="2" className="pointer-events-none" />
              </g>
            )}

            {/* SKELETON MODE OVERLAY ON EDITOR CHARACTER */}
            {showSkeleton && (
              <>
              <g 
                opacity="0"
                className="pointer-events-none animate-in fade-in duration-200"
                transform={isSkeletonFlipped ? "translate(340, 0) scale(-1, 1)" : undefined}
              >
                <line x1="170" y1="116" x2="168" y2="190" stroke="#38bdf8" strokeWidth="3" strokeDasharray="4 3" />
                <line x1="168" y1="190" x2="166" y2="340" stroke="#38bdf8" strokeWidth="4" />
                <line x1="130" y1="210" x2="200" y2="218" stroke="#38bdf8" strokeWidth="3" />
                <line x1="130" y1="210" x2="124" y2="324" stroke="#34d399" strokeWidth="3.5" />
                <line x1="124" y1="324" x2="140" y2="408" stroke="#34d399" strokeWidth="3" />
                <line x1="200" y1="218" x2="216" y2="330" stroke="#34d399" strokeWidth="3.5" />
                <line x1="216" y1="330" x2="194" y2="414" stroke="#34d399" strokeWidth="3" />
                <line x1="138" y1="345" x2="180" y2="345" stroke="#38bdf8" strokeWidth="3.5" />
                <line x1="138" y1="345" x2="140" y2="536" stroke="#f43f5e" strokeWidth="3.5" />
                <line x1="140" y1="536" x2="114" y2="640" stroke="#f43f5e" strokeWidth="3" />
                <line x1="180" y1="345" x2="194" y2="536" stroke="#f43f5e" strokeWidth="3.5" />
                <line x1="194" y1="536" x2="190" y2="640" stroke="#f43f5e" strokeWidth="3" />

                <circle cx="170" cy="116" r="6" fill="#38bdf8" stroke="#fff" strokeWidth="2" />
                <circle cx="168" cy="190" r="4.5" fill="#38bdf8" stroke="#fff" strokeWidth="2" />
                <circle cx="130" cy="210" r="5" fill="#34d399" stroke="#fff" strokeWidth="2" />
                <circle cx="200" cy="218" r="5" fill="#34d399" stroke="#fff" strokeWidth="2" />
                <circle cx="124" cy="324" r="4.5" fill="#34d399" stroke="#fff" strokeWidth="2" />
                <circle cx="216" cy="330" r="4.5" fill="#34d399" stroke="#fff" strokeWidth="2" />
                <circle cx="140" cy="408" r="4" fill="#34d399" stroke="#fff" strokeWidth="2" />
                <circle cx="194" cy="414" r="4" fill="#34d399" stroke="#fff" strokeWidth="2" />
                <circle cx="166" cy="340" r="5" fill="#38bdf8" stroke="#fff" strokeWidth="2" />
                <circle cx="138" cy="345" r="5" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                <circle cx="180" cy="345" r="5" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                <circle cx="140" cy="536" r="4.5" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                <circle cx="194" cy="536" r="4.5" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                <circle cx="114" cy="640" r="4" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                <circle cx="190" cy="640" r="4" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                <g fontSize="8" fontFamily="sans-serif" fontWeight="600" fill="#e0f2fe" stroke="#0e1014" strokeWidth="2" paintOrder="stroke">
                  <text x="178" y="113">0 Head</text>
                  <text x="178" y="188">1 Neck</text>
                  <text x="122" y="204" textAnchor="end">2 L Shoulder</text>
                  <text x="208" y="212">3 R Shoulder</text>
                  <text x="116" y="320" textAnchor="end">4 L Elbow</text>
                  <text x="222" y="326">5 R Elbow</text>
                  <text x="132" y="404" textAnchor="end">6 L Wrist</text>
                  <text x="202" y="410">7 R Wrist</text>
                  <text x="132" y="425" textAnchor="end">8 L Hand</text>
                  <text x="202" y="431">9 R Hand</text>
                  <text x="174" y="300">10 Spine</text>
                  <text x="132" y="365" textAnchor="end">11 L Hip</text>
                  <text x="186" y="365">12 R Hip</text>
                  <text x="132" y="530" textAnchor="end">13 L Knee</text>
                  <text x="200" y="530">14 R Knee</text>
                  <text x="108" y="634" textAnchor="end">15 L Ankle</text>
                  <text x="196" y="634">16 R Ankle</text>
                  <text x="106" y="660" textAnchor="end">17 L Foot</text>
                  <text x="198" y="660">18 R Foot</text>
                </g>
              </g>
              <g
                opacity="0"
                className="pointer-events-none animate-in fade-in duration-200"
                transform={isSkeletonFlipped ? "translate(340, 0) scale(-1, 1)" : undefined}
              >
                {SKELETON_CONNECTIONS.map(([fromName, toName]) => {
                  const from = scaleSkeletonPoint(ORIGINAL_SKELETON_POINTS[fromName], 340, 680);
                  const to = scaleSkeletonPoint(ORIGINAL_SKELETON_POINTS[toName], 340, 680);
                  const isArm = fromName.includes('Shoulder') || fromName.includes('Elbow') || fromName.includes('Wrist');
                  const isLeg = fromName.includes('Hip') || fromName.includes('Knee') || fromName.includes('Ankle');
                  return (
                    <line
                      key={`${fromName}-${toName}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={isArm ? '#34d399' : isLeg ? '#f43f5e' : '#22d3ee'}
                      strokeWidth={isArm || isLeg ? '3.5' : '3'}
                      strokeLinecap="round"
                    />
                  );
                })}
                {Object.entries(ORIGINAL_SKELETON_POINTS).map(([name, point]) => {
                  const scaled = scaleSkeletonPoint(point, 340, 680);
                  return (
                    <g key={name}>
                      <circle cx={scaled.x} cy={scaled.y} r="5" fill="#0e1014" stroke="#67e8f9" strokeWidth="2.5" />
                      <circle cx={scaled.x} cy={scaled.y} r="1.8" fill="#67e8f9" />
                    </g>
                  );
                })}
                <g fontSize="8" fontFamily="sans-serif" fontWeight="600" fill="#e0f2fe" stroke="#0e1014" strokeWidth="2" paintOrder="stroke">
                  {Object.entries(ORIGINAL_SKELETON_POINTS).map(([name, point]) => {
                    const scaled = scaleSkeletonPoint(point, 340, 680);
                    return <text key={`label-${name}`} x={scaled.x + 7} y={scaled.y - 5}>{SKELETON_POINT_LABELS[name as keyof typeof SKELETON_POINT_LABELS]}</text>;
                  })}
                </g>
              </g>
              </>
            )}
            {showSkeleton && (
              <AnatomicalSkeletonOverlay scaleX={1.0625} scaleY={0.85} />
            )}

            {isAllLayersSelected && (
              <g id="all-layers-selection-overlay" className="pointer-events-none">
                {CHARACTER_PARTS.map((part) => {
                  if (hiddenParts[part.key]) return null;
                  const box = part.defaultBox;
                  const corners = [
                    [box.x - 5, box.y - 5],
                    [box.x + box.width + 5, box.y - 5],
                    [box.x - 5, box.y + box.height + 5],
                    [box.x + box.width + 5, box.y + box.height + 5],
                  ];
                  return (
                    <g key={`all-select-${part.key}`}>
                      <rect
                        x={box.x - 5}
                        y={box.y - 5}
                        width={box.width + 10}
                        height={box.height + 10}
                        rx="5"
                        fill="rgba(34, 211, 238, 0.035)"
                        stroke="#22d3ee"
                        strokeWidth="1.5"
                        strokeDasharray="5 4"
                      />
                      {corners.map(([x, y], index) => (
                        <rect
                          key={`${part.key}-corner-${index}`}
                          x={x - 3}
                          y={y - 3}
                          width="6"
                          height="6"
                          rx="1"
                          fill="#0e1014"
                          stroke="#67e8f9"
                          strokeWidth="1.5"
                        />
                      ))}
                    </g>
                  );
                })}
                <rect
                  id="all-layers-scale-bounds"
                  x="55"
                  y="25"
                  width="230"
                  height="630"
                  fill="transparent"
                  stroke="#67e8f9"
                  strokeWidth="2"
                  strokeDasharray="8 5"
                  className="pointer-events-none"
                />
                {[[55, 25], [285, 25], [55, 655], [285, 655]].map(([x, y], index) => (
                  <g
                    key={`group-scale-${index}`}
                    className="pointer-events-auto cursor-nwse-resize"
                    onMouseDown={handleAllLayersCornerMouseDown}
                  >
                    <circle cx={x} cy={y} r="14" fill="transparent" />
                    <rect x={x - 7} y={y - 7} width="14" height="14" rx="2" fill="#082f49" stroke="#67e8f9" strokeWidth="2.5" />
                    <circle cx={x} cy={y} r="2" fill="#cffafe" />
                  </g>
                ))}
                <rect x="132" y="18" width="76" height="18" rx="5" fill="#083344" stroke="#22d3ee" strokeWidth="1.5" />
                <text x="170" y="30" textAnchor="middle" fill="#cffafe" fontSize="9" fontWeight="bold">ALL LAYERS</text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* FLOATING TRANSFORM & CUSTOM LAYER CONTROLLER (Move, Zoom In/Out, Rotate, Flip, Save) */}
      {selectedPartKey && selectedPartDef && isTransformActive && (
        <div 
          id="custom-layer-transform-dock"
          className="z-35 mb-2 mx-3 w-[95%] max-w-2xl bg-[#16181f]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Header Row: Layer info & Action buttons */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-base">{selectedPartDef.icon}</span>
              <span className="font-semibold text-white tracking-wide">
                {selectedPartDef.label}
              </span>
              <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                Pos: ({currentTransform.x > 0 ? `+${currentTransform.x}` : currentTransform.x}px, {currentTransform.y > 0 ? `+${currentTransform.y}` : currentTransform.y}px) • Zoom: {Math.round(currentTransform.scale * 100)}%
                {currentTransform.flipX && ' • FlipX'}
                {currentTransform.flipY && ' • FlipY'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Flip X button */}
              <button
                type="button"
                onClick={handleFlipX}
                disabled={isCurrentLayerLocked}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                  currentTransform.flipX 
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/40' 
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-transparent'
                } ${isCurrentLayerLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                title="Flip Layer Horizontally"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Flip X</span>
              </button>

              {/* Flip Y button */}
              <button
                type="button"
                onClick={handleFlipY}
                disabled={isCurrentLayerLocked}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                  currentTransform.flipY 
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/40' 
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-transparent'
                } ${isCurrentLayerLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                title="Flip Layer Vertically"
              >
                <FlipVertical className="w-3.5 h-3.5" />
                <span>Flip Y</span>
              </button>

              {/* Lock / Unlock Toggle Button in Dock */}
              <button
                type="button"
                onClick={handleToggleLockCurrentLayer}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  isCurrentLayerLocked
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title={isCurrentLayerLocked ? 'Unlock this layer to edit' : 'Lock this layer (unclickable)'}
              >
                {isCurrentLayerLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                <span className="hidden xs:inline">{isCurrentLayerLocked ? 'Locked' : 'Lock'}</span>
              </button>

              {/* Upload image for layer */}
              <button
                type="button"
                disabled={isCurrentLayerLocked}
                onClick={handleUploadClick}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  isCurrentLayerLocked
                    ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer'
                }`}
                title="Upload image for this layer (মুছে নতুন লেয়ার যুক্ত হবে)"
              >
                <Upload className="w-3 h-3" />
                <span className="hidden xs:inline">Upload</span>
              </button>

              {/* Reset Layer Transform */}
              <button
                type="button"
                disabled={isCurrentLayerLocked}
                onClick={handleResetCurrentLayer}
                className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
                  isCurrentLayerLocked 
                    ? 'opacity-40 cursor-not-allowed text-slate-500 bg-white/5' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer'
                }`}
                title="Reset this layer transform"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={handleToggleLayerVisibility}
                className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
                  hiddenParts[selectedPartKey]
                    ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
                    : 'bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
                }`}
                title={hiddenParts[selectedPartKey] ? 'Restore this layer for the current edit' : 'Temporarily hide this layer'}
              >
                {hiddenParts[selectedPartKey] ? 'Restore' : 'Hide'}
              </button>

              {/* Close Dock Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedPartKey(null);
                  setIsTransformActive(false);
                }}
                className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Hide controls (ফাঁকা জায়গায় ক্লিক করলেও হাইড হবে)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Locked Notification Bar */}
          {isCurrentLayerLocked && (
            <div className="bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] px-3 py-1.5 rounded-xl flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>{selectedPartDef.label}</strong> লেয়ার লক করা রয়েছে (ক্যানভাসে unclickable)। এডিট করতে Unlock ক্লিক করুন।
                </span>
              </span>
              <button
                type="button"
                onClick={handleToggleLockCurrentLayer}
                className="ml-2 px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[10px] rounded cursor-pointer shrink-0 transition-colors"
              >
                Unlock
              </button>
            </div>
          )}

          {/* Controls Grid: Move, Zoom In / Zoom Out, Rotate */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300 items-center ${
            isCurrentLayerLocked ? 'opacity-40 pointer-events-none select-none' : ''
          }`}>
            {/* 1. MOVE CONTROLS */}
            <div className="bg-[#1e2028] p-2 rounded-xl border border-white/5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Move className="w-3 h-3 text-blue-400" />
                  <span>Move (স্থানান্তর)</span>
                </span>
                <span className="text-[10px]">Drag or Arrow keys</span>
              </div>
              
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveLayer(-5, 0)}
                  className="w-7 h-7 rounded bg-white/5 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                  title="Move Left (←)"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveLayer(0, -5)}
                    className="w-7 h-7 rounded bg-white/5 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                    title="Move Up (↑)"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveLayer(0, 5)}
                    className="w-7 h-7 rounded bg-white/5 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                    title="Move Down (↓)"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleMoveLayer(5, 0)}
                  className="w-7 h-7 rounded bg-white/5 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                  title="Move Right (→)"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. ZOOM IN / ZOOM OUT (SCALE) CONTROLS */}
            <div className="bg-[#1e2028] p-2 rounded-xl border border-white/5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-emerald-400" />
                  <span>Layer Zoom (জুম ইন/আউট)</span>
                </span>
                <span className="text-emerald-400 font-mono font-semibold">
                  {Math.round(currentTransform.scale * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleScaleLayer(-0.1)}
                  className="w-7 h-7 rounded bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="Zoom Out Layer (-)"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <input 
                  type="range" 
                  min="0.005" 
                  max="10.0" 
                  step="0.005"
                  value={currentTransform.scale}
                  onChange={(e) => handleSetScaleDirect(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  title="Drag to resize this layer"
                />

                <button
                  type="button"
                  onClick={() => handleScaleLayer(0.1)}
                  className="w-7 h-7 rounded bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="Zoom In Layer (+)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick scale presets */}
              <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
                {[0.75, 1.0, 1.25, 1.5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSetScaleDirect(preset)}
                    className={`px-1.5 py-0.5 rounded transition-colors ${
                      Math.abs(currentTransform.scale - preset) < 0.04
                        ? 'bg-blue-600/80 text-white font-semibold'
                        : 'bg-white/5 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    {Math.round(preset * 100)}%
                  </button>
                ))}
              </div>
            </div>

            {/* 3. ROTATION CONTROLS */}
            <div className="bg-[#1e2028] p-2 rounded-xl border border-white/5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3 h-3 text-purple-400" />
                  <span>Rotate (ঘোরান)</span>
                </span>
                <span className="text-purple-400 font-mono font-semibold">
                  {Math.round(((currentTransform.rotation % 360) + 360) % 360)}°
                </span>
              </div>

              <div className="flex items-center gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => handleRotateLayer(-15)}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                  title="Rotate -15°"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>-15°</span>
                </button>

                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  step="1"
                  value={((currentTransform.rotation % 360) + 360) % 360}
                  onChange={(e) => {
                    updateLayerTransform(selectedPartKey, { rotation: parseInt(e.target.value, 10) % 360 });
                    persistTransformsToFirestore();
                  }}
                  className="w-full accent-purple-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  title="Drag to rotate this layer precisely"
                />

                <button
                  type="button"
                  onClick={() => handleRotateLayer(15)}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                  title="Rotate +15°"
                >
                  <span>+15°</span>
                  <RotateCw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM FOOTER: Facing Issue Help & Reset All Layers */}
      <div className="z-30 mb-2 px-4 w-full flex items-center justify-between text-slate-400 text-xs">
        <button
          type="button"
          onClick={() => showToast('Click on any character part with the Edit/Pen Tool to move, zoom in/out, or rotate it. Then click Save Character.')}
          className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
        >
          <Info className="w-4 h-4 text-blue-400" />
          <span>Facing Issue? Pen Tool allows free custom layer editing & saving</span>
        </button>

        <button
          type="button"
          onClick={() => {
            resetAllLayerTransforms();
            showToast('All character layer positions and scales reset to default');
          }}
          className="hover:text-red-300 text-slate-400 text-[11px] transition-colors"
          title="Reset all customized layer positions"
        >
          Reset All Layers Layout
        </button>
      </div>

      {/* BOTTOM CHARACTER PRESETS & MODELS GALLERY DRAWER */}
      <div className="w-full px-3 pt-1 pb-3">
        <CharacterPresetsDrawer />
      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="absolute top-16 z-50 bg-[#1e2026]/95 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/10 shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Firebase Character List Modal */}
      <CharacterListModal
        isOpen={isCharacterListOpen}
        onClose={() => setIsCharacterListOpen(false)}
        onSelectCharacter={(char) => {
          showToast(`✓ Loaded character "${char.name}"`);
        }}
      />

      {/* Firebase Save Character Modal */}
      <SaveCharacterModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSaved={(name) => {
          showToast(`✓ Saved "${name}" to Firebase!`);
        }}
      />
    </div>
  );
}
