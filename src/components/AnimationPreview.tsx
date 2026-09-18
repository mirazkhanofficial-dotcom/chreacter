import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Minus, 
  Plus, 
  Check, 
  Download,
  Sparkles,
  Mic,
  Volume2,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Maximize2,
  Upload,
} from 'lucide-react';
import { useLipSync, type LipShape, type AnimationMode } from '../context/LipSyncContext';
import { useCharacterLayers } from '../context/CharacterLayersContext';
import { readUploadedImage } from '../utils/imageUtils';
import {
  ORIGINAL_SKELETON_POINTS,
  SKELETON_CONNECTIONS,
  SKELETON_POINT_LABELS,
  scaleSkeletonPoint,
} from '../data/skeletonPoints';
import AnatomicalSkeletonOverlay from './AnatomicalSkeletonOverlay';

interface AnimationPreviewProps {
  skeletonMode?: boolean;
  onToggleSkeleton?: () => void;
  isSkeletonFlipped?: boolean;
  onToggleSkeletonFlip?: () => void;
  onSave?: () => void;
}

const ANIMATION_MODES: AnimationMode[] = ['Idle', 'Talking', 'Walk', 'Run', 'Wave'];

export default function AnimationPreview({ 
  skeletonMode = false,
  onToggleSkeleton,
  isSkeletonFlipped = false,
  onToggleSkeletonFlip,
  onSave 
}: AnimationPreviewProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Zoom & Pan state for viewport (jedike icche move kora jabe, zoom out kora jabe)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  const previewFileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetLipIdForUpload, setTargetLipIdForUpload] = useState<string | null>(null);

  const { 
    currentMode, 
    setCurrentMode, 
    isSpeaking, 
    isLipSyncActive, 
    toggleLipSync, 
    activeLipShape, 
    restingLipShape, 
    speed, 
    setSpeed, 
    lipShapes, 
    currentLipId, 
    replaceLipShape, 
    resetToDefaultLips, 
  } = useLipSync();

  const { customLayersMap, layerTransforms, uploadAndReplaceLayer, activeCharacterName, activeModelTheme } = useCharacterLayers();

  const currentIndex = ANIMATION_MODES.indexOf(currentMode);

  const handlePrevAnim = () => {
    const prevIndex = currentIndex <= 0 ? ANIMATION_MODES.length - 1 : currentIndex - 1;
    setCurrentMode(ANIMATION_MODES[prevIndex]);
  };

  const handleNextAnim = () => {
    const nextIndex = currentIndex >= ANIMATION_MODES.length - 1 ? 0 : currentIndex + 1;
    setCurrentMode(ANIMATION_MODES[nextIndex]);
  };

  const handleSave = () => {
    setShowSaveToast(true);
    if (onSave) onSave();
    setTimeout(() => {
      setShowSaveToast(false);
    }, 2800);
  };

  // Zoom In / Zoom Out / Reset handlers
  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => Math.min(Math.round((prev + 0.2) * 100) / 100, 3.0));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Allow zooming way out down to 0.25 (25%) so user can zoom out freely
    setZoom((prev) => Math.max(Math.round((prev - 0.2) * 100) / 100, 0.25));
  };

  const handleResetPanZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Pointer Drag to Move/Pan in any direction freely
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, [role="button"]')) return;

    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setIsDraggingCanvas(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCanvas) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingCanvas) {
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDraggingCanvas(false);
    }
  };

  // Mouse wheel to zoom smoothly
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((prev) => {
      const next = Math.round((prev + zoomStep) * 100) / 100;
      return Math.min(Math.max(next, 0.25), 3.0);
    });
  };

  const handleDirectLipUpload = (lipId: string) => {
    setTargetLipIdForUpload(lipId);
    if (previewFileInputRef.current) {
      previewFileInputRef.current.value = '';
      previewFileInputRef.current.click();
    }
  };

  const onPreviewFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetLipIdForUpload) return;
    try {
      const { dataUrl, name, width, height } = await readUploadedImage(file);
      // 1. Immediately replace lip shape in LipSyncContext so talking animation continues with new lip
      replaceLipShape(targetLipIdForUpload, dataUrl, name);
      // 2. Upload to ImgBB cloud storage and persist in CharacterLayersContext
      uploadAndReplaceLayer(targetLipIdForUpload, file, {
        name,
        dataUrl,
        width,
        height,
        uploadedAt: Date.now()
      });
    } catch (err) {
      console.error('Failed to replace lip from preview', err);
    }
  };

  return (
    <div className="w-full flex flex-col items-end gap-3.5 select-none">
      {/* Animation Preview Card */}
      <div 
        id="animation-preview-card"
        className="w-full max-w-[390px] bg-[#16171b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300"
      >
        {/* Card Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-[#1a1b20]">
          <div className="flex items-center gap-2.5">
            <h3 className="text-white text-[15px] font-medium tracking-tight">Animation Preview</h3>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeCharacterName || 'Live Character'}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Preview' : 'Minimize Preview'}
          >
            {isCollapsed ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </button>
        </div>

        {/* Card Body */}
        {!isCollapsed && (
          <div className="p-4 flex flex-col items-center">
            {/* Hidden file input for quick lip replacement in preview */}
            <input
              ref={previewFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={onPreviewFileChosen}
            />

            {/* Viewport Canvas with Zoom and Pan Interaction (Drag anywhere to move, Wheel/Buttons to zoom) */}
            <div 
              id="animation-preview-canvas-viewport"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              className={`relative w-full h-[380px] flex items-center justify-center overflow-hidden rounded-xl bg-[#121316] border border-white/5 select-none touch-none ${
                isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* Spatial grid background dots to make pan/zoom visually evident */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                  backgroundPosition: `${pan.x % 22}px ${pan.y % 22}px`,
                }}
              />

              {/* Subtle radial glow in background */}
              <div className="absolute inset-0 bg-radial from-slate-800/20 via-transparent to-transparent pointer-events-none" />

              {/* Animated Character Stage with Free Pan and Zoom */}
              <div 
                id="preview-character-stage-transform"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) ${isFlipped ? 'scaleX(-1)' : 'scaleX(1)'}`,
                  transformOrigin: 'center center',
                  transition: isDraggingCanvas ? 'none' : 'transform 0.08s ease-out',
                }}
                className="relative flex items-center justify-center pointer-events-none select-none"
              >
                <CharacterRig 
                  mode={currentMode} 
                  showSkeleton={skeletonMode}
                  isSkeletonFlipped={isSkeletonFlipped}
                  activeLipShape={activeLipShape}
                  restingLipShape={restingLipShape}
                  isSpeaking={isSpeaking}
                  customLayersMap={customLayersMap}
                  layerTransforms={layerTransforms}
                  activeModelTheme={activeModelTheme}
                />
              </div>

              {/* Floating Zoom & Pan Controls (Top Right) */}
              <div 
                id="preview-viewport-controls"
                className="absolute top-3 right-3 flex items-center gap-1 bg-[#1a1c23]/90 backdrop-blur-md border border-white/10 rounded-lg p-1 shadow-xl z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  id="preview-zoom-out-btn"
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-md transition active:scale-90 cursor-pointer"
                  title="Zoom Out (Zoom out kora jabe)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                
                <button
                  type="button"
                  id="preview-zoom-reset-btn"
                  onClick={handleResetPanZoom}
                  className="px-1.5 py-0.5 text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded transition cursor-pointer min-w-[42px] text-center"
                  title="Click to reset zoom & pan (100%)"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <button
                  type="button"
                  id="preview-zoom-in-btn"
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-md transition active:scale-90 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-3.5 bg-white/15 mx-0.5" />

                <button
                  type="button"
                  id="preview-pan-reset-btn"
                  onClick={handleResetPanZoom}
                  className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-md transition active:scale-90 cursor-pointer"
                  title="Reset Position to Center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Move & Zoom Guidance Badge (Bottom Right) */}
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm border border-white/5 rounded-md pointer-events-none text-[10px] text-slate-400">
                <Move className="w-3 h-3 text-slate-400" />
                <span>Drag to pan • Wheel to zoom</span>
              </div>

              {/* Mode indicator overlay in preview */}
              {currentMode === 'Talking' ? (
                <div className="absolute top-3 left-3 bg-[#1e2026]/95 backdrop-blur-md border border-emerald-500/40 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-bounce" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-emerald-400 leading-tight">
                      Talking Mode (Speaking)
                    </span>
                    <span className="text-[10px] text-slate-300">
                      Lip: <strong className="text-white">{activeLipShape.name}</strong>
                    </span>
                  </div>
                </div>
              ) : currentMode === 'Idle' ? (
                <div className="absolute top-3 left-3 bg-[#1e2026]/85 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-md animate-in fade-in duration-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-[11px] font-medium text-slate-300">
                    Idle • <strong className="text-slate-400 font-normal">Silent (Cup Thakbe)</strong>
                  </span>
                </div>
              ) : (
                <div className="absolute top-3 left-3 bg-[#1e2026]/85 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-[11px] font-medium text-slate-300">
                    {currentMode} Mode
                  </span>
                </div>
              )}
            </div>

            {/* Quick Animation Mode Tabs (Idle, Talking, Walk, Run, Wave) */}
            <div className="w-full mt-3 grid grid-cols-5 gap-1 p-1 bg-[#121316] border border-white/5 rounded-xl">
              {ANIMATION_MODES.map((anim) => {
                const isCurrent = currentMode === anim;
                return (
                  <button
                    key={anim}
                    type="button"
                    id={`anim-tab-${anim.toLowerCase()}`}
                    onClick={() => setCurrentMode(anim)}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-medium transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                      isCurrent 
                        ? anim === 'Talking'
                          ? 'bg-emerald-600 text-white font-semibold shadow-md ring-1 ring-emerald-400/50'
                          : 'bg-[#2b2e37] text-white font-semibold shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xs">
                      {anim === 'Idle' && '😴'}
                      {anim === 'Talking' && '🗣️'}
                      {anim === 'Walk' && '🚶'}
                      {anim === 'Run' && '🏃'}
                      {anim === 'Wave' && '👋'}
                    </span>
                    <span className="truncate w-full text-center">
                      {anim}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Animation Selector Bar */}
            <div className="w-full mt-2 px-3 py-2 bg-[#121316] border border-white/5 rounded-xl flex items-center justify-between">
              <button
                type="button"
                id="prev-animation-btn"
                onClick={handlePrevAnim}
                className="w-9 h-9 rounded-lg bg-[#212329] hover:bg-[#2b2e37] active:scale-95 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                title="Previous Animation"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center">
                <span className="text-white font-semibold text-[15px] tracking-wide flex items-center gap-1.5">
                  {currentMode === 'Talking' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  {currentMode}
                </span>
                <span className="text-[11px] text-slate-400">
                  {currentMode === 'Idle' && 'Silent • Mouth Closed (Cup)'}
                  {currentMode === 'Talking' && 'Speaking • Lip Sync Active'}
                  {currentMode === 'Walk' && 'Walking Cycle'}
                  {currentMode === 'Run' && 'Running Stride'}
                  {currentMode === 'Wave' && 'Hand Waving'}
                </span>
              </div>

              <button
                type="button"
                id="next-animation-btn"
                onClick={handleNextAnim}
                className="w-9 h-9 rounded-lg bg-[#212329] hover:bg-[#2b2e37] active:scale-95 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                title="Next Animation"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Pill Controls Stacked Right Below the Card */}
      <div className="flex flex-col items-end gap-2.5 w-full max-w-[390px]">
        {/* Lip Sync Loop Toggle Pill */}
        <div 
          id="lipsync-toggle"
          onClick={toggleLipSync}
          className="cursor-pointer bg-[#1a1b20] hover:bg-[#202228] border border-white/10 rounded-full py-2 px-4 flex items-center justify-between gap-3 shadow-lg transition-colors w-full"
        >
          <div className="flex items-center gap-2 text-slate-300">
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-slate-200">Lipsing Loop</span>
              <span className="text-[10px] text-slate-400">
                {currentMode === 'Talking' 
                  ? (isLipSyncActive ? 'Active in Talking mode' : 'Muted') 
                  : 'Idle (Silent • Cup Thakbe)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            {isLipSyncActive && (
              <div 
                className="flex items-center bg-[#252830] rounded-full p-0.5 text-[10px] text-slate-300"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSpeed('slow')}
                  className={`px-1.5 py-0.5 rounded-full transition-colors ${speed === 'slow' ? 'bg-blue-600 text-white font-semibold' : 'hover:text-white'}`}
                >
                  0.7x
                </button>
                <button
                  type="button"
                  onClick={() => setSpeed('normal')}
                  className={`px-1.5 py-0.5 rounded-full transition-colors ${speed === 'normal' ? 'bg-blue-600 text-white font-semibold' : 'hover:text-white'}`}
                >
                  1x
                </button>
                <button
                  type="button"
                  onClick={() => setSpeed('fast')}
                  className={`px-1.5 py-0.5 rounded-full transition-colors ${speed === 'fast' ? 'bg-blue-600 text-white font-semibold' : 'hover:text-white'}`}
                >
                  1.5x
                </button>
              </div>
            )}

            {/* Toggle Switch */}
            <div 
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                isLipSyncActive ? 'bg-emerald-600' : 'bg-[#2b2d35]'
              }`}
            >
              <div 
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  isLipSyncActive ? 'translate-x-5 bg-white' : 'translate-x-0 bg-slate-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Live Talking Phonemes Loop Strip (Shows continuous cycling lip shapes and allows quick replacement) */}
        {currentMode === 'Talking' && (
          <div 
            id="talking-lips-loop-strip"
            className="w-full bg-[#16171b] border border-emerald-500/30 rounded-2xl p-3 shadow-lg flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Talking Lip Shapes in Loop
              </span>
              <span className="text-[10px] text-slate-400">
                Click any lip to replace & continue talking
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {lipShapes.slice(0, 5).map((shape) => {
                const isCurrent = isSpeaking && currentLipId === shape.id;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => handleDirectLipUpload(shape.id)}
                    className={`relative p-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/40 shadow-md scale-105'
                        : 'bg-[#1a1b20] hover:bg-[#202228] border-white/5 hover:border-white/20'
                    }`}
                    title={`Lip Shape ${shape.name}${shape.isCustom ? ' (Replaced)' : ''}. Click to replace image.`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center p-0.5">
                      <img 
                        src={shape.svgUrl} 
                        alt={shape.name} 
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] font-bold text-slate-200">
                        {shape.name}
                      </span>
                      {shape.isCustom && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Replaced" />
                      )}
                    </div>

                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Skeleton Mode Toggle Pill */}
        <div 
          id="skeleton-mode-toggle"
          onClick={onToggleSkeleton}
          className="cursor-pointer bg-[#1a1b20] hover:bg-[#202228] border border-white/10 rounded-full py-2 px-4 flex items-center gap-3.5 shadow-lg transition-colors"
        >
          {/* Skeleton Icon */}
          <div className="flex items-center text-slate-300">
            <svg 
              className="w-4 h-4" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="4" r="2" />
              <path d="M12 6v6" />
              <path d="M8 8h8" />
              <path d="M8 8l-2 5" />
              <path d="M16 8l2 5" />
              <path d="M9 17l3-5 3 5" />
              <path d="M9 17v4" />
              <path d="M15 17v4" />
              <circle cx="6" cy="13" r="1.5" />
              <circle cx="18" cy="13" r="1.5" />
              <circle cx="9" cy="21" r="1.5" />
              <circle cx="15" cy="21" r="1.5" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-slate-200">Skeleton Mode</span>

          {/* Toggle Switch */}
          <div 
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
              skeletonMode ? 'bg-blue-600' : 'bg-[#2b2d35]'
            }`}
          >
            <div 
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                skeletonMode ? 'translate-x-5 bg-white' : 'translate-x-0 bg-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Skeleton Flip Toggle Button */}
        {skeletonMode && onToggleSkeletonFlip && (
          <button
            type="button"
            id="skeleton-flip-btn"
            onClick={onToggleSkeletonFlip}
            className={`px-3 py-2 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-lg ${
              isSkeletonFlipped 
                ? 'bg-blue-600/30 border-blue-500/50 text-blue-300' 
                : 'bg-[#1a1b20] hover:bg-[#202228] border-white/10 text-slate-300'
            }`}
            title="Flip Skeleton Horizontally (কঙ্কাল ফ্লিপ করুন)"
          >
            <span>⇄</span>
            <span>Flip Skeleton</span>
            {isSkeletonFlipped && <span className="text-[10px] text-blue-400 font-bold">• Flipped</span>}
          </button>
        )}

        {/* Flip Toggle Pill */}
        <div 
          id="flip-toggle"
          onClick={() => setIsFlipped(!isFlipped)}
          className="cursor-pointer bg-[#1a1b20] hover:bg-[#202228] border border-white/10 rounded-full py-2 px-4 flex items-center gap-3.5 shadow-lg transition-colors"
        >
          {/* Reflect / Flip icon */}
          <div className="flex items-center text-slate-300">
            <svg 
              className="w-4 h-4" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" />
              <polygon points="4,18 10,18 10,6" fill="currentColor" fillOpacity="0.4" />
              <polygon points="20,18 14,18 14,6" fill="currentColor" fillOpacity="0.8" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-slate-200">Flip</span>

          {/* Toggle Switch */}
          <div 
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
              isFlipped ? 'bg-blue-600' : 'bg-[#2b2d35]'
            }`}
          >
            <div 
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                isFlipped ? 'translate-x-5 bg-white' : 'translate-x-0 bg-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Save Character Action Button */}
        <div className="pt-2">
          <button
            type="button"
            id="save-character-btn"
            onClick={handleSave}
            className="px-8 py-3 rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] active:scale-95 text-white font-medium text-[15px] shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            Save Character
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e2026] text-white px-5 py-3.5 rounded-xl border border-blue-500/40 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Character Saved Successfully</p>
            <p className="text-xs text-slate-400">All character parts & rig state stored</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * High-quality Vector Character Rig with Idle/Talking/Walk/Run/Wave Keyframe Animations
 * and Optional Interactive Skeleton Overlay
 */
function CharacterRig({ 
  mode, 
  showSkeleton,
  isSkeletonFlipped = false,
  activeLipShape,
  restingLipShape,
  isSpeaking = false,
  customLayersMap = {},
  layerTransforms = {},
  activeModelTheme = 'default'
}: { 
  mode: AnimationMode; 
  showSkeleton: boolean;
  isSkeletonFlipped?: boolean;
  activeLipShape?: LipShape;
  restingLipShape?: LipShape;
  isSpeaking?: boolean;
  customLayersMap?: Record<string, any>;
  layerTransforms?: Record<string, any>;
  activeModelTheme?: 'default' | 'indian_man' | 'indian_woman';
}) {
  const getCustomImgSrc = (keys: string[]) => {
    for (const key of keys) {
      const item = customLayersMap[key];
      if (item) return item.imgbbUrl || item.dataUrl;
    }
    return null;
  };

  const customArmRight = getCustomImgSrc(['hands-right-arm', 'hands-right-forearm']);
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

  // Convert editor layer transforms (340x680 coordinate space) to preview rig coordinate space (240x340)
  const getTransformAttr = (partKey: string, pivotX: number, pivotY: number) => {
    const t = layerTransforms?.[partKey];
    if (!t) return undefined;
    const sx = 0.70;
    const sy = 0.50;
    const tx = (t.x || 0) * sx;
    const ty = (t.y || 0) * sy;
    const flipX = t.flipX ? -1 : 1;
    const flipY = t.flipY ? -1 : 1;
    const scaleX = (t.scale ?? 1) * flipX;
    const scaleY = (t.scale ?? 1) * flipY;
    const rot = t.rotation ?? 0;
    if (tx === 0 && ty === 0 && scaleX === 1 && scaleY === 1 && rot === 0) return undefined;
    return `translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) translate(${pivotX}, ${pivotY}) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}) rotate(${rot.toFixed(1)}) translate(${-pivotX}, ${-pivotY})`;
  };

  return (
    <div className={`relative w-[240px] h-[340px] flex items-center justify-center ${mode === 'Walk' ? 'anim-walk-directional-body' : ''}`}>
      {/* Keyframe Styles for fluid rigging */}
      <style>{`
        /* Walk Animations */
        @keyframes walk-head {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(-1deg); }
        }
        @keyframes walk-torso {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-3px) rotate(1deg); }
        }
        @keyframes walk-leg-left {
          0% { transform: rotate(24deg); }
          50% { transform: rotate(-22deg); }
          100% { transform: rotate(24deg); }
        }
        @keyframes walk-leg-right {
          0% { transform: rotate(-22deg); }
          50% { transform: rotate(24deg); }
          100% { transform: rotate(-22deg); }
        }
        @keyframes walk-arm-left {
          0% { transform: rotate(-20deg); }
          50% { transform: rotate(24deg); }
          100% { transform: rotate(-20deg); }
        }
        @keyframes walk-arm-right {
          0% { transform: rotate(24deg); }
          50% { transform: rotate(-20deg); }
          100% { transform: rotate(24deg); }
        }
        @keyframes walk-skeleton-follow {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-3px) rotate(1deg); }
        }
        @keyframes walk-directional-body {
          0%, 100% { transform: translateX(-5px) translateY(1px); }
          50% { transform: translateX(5px) translateY(-2px); }
        }

        /* Run Animations */
        @keyframes run-torso {
          0%, 100% { transform: translateY(0px) rotate(6deg); }
          50% { transform: translateY(-8px) rotate(4deg); }
        }
        @keyframes run-leg-left {
          0% { transform: rotate(38deg); }
          50% { transform: rotate(-35deg); }
          100% { transform: rotate(38deg); }
        }
        @keyframes run-leg-right {
          0% { transform: rotate(-35deg); }
          50% { transform: rotate(38deg); }
          100% { transform: rotate(-35deg); }
        }
        @keyframes run-arm-left {
          0% { transform: rotate(-35deg); }
          50% { transform: rotate(38deg); }
          100% { transform: rotate(-35deg); }
        }
        @keyframes run-arm-right {
          0% { transform: rotate(38deg); }
          50% { transform: rotate(-35deg); }
          100% { transform: rotate(38deg); }
        }

        /* Idle Animations - calm breathing, quiet */
        @keyframes idle-breathe {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-2px) scale(1.008); }
        }
        @keyframes idle-arm {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2deg); }
        }

        /* Talking Animations - expressive head tilt & conversational arm gesturing */
        @keyframes talk-head {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(2deg); }
          50% { transform: translateY(-1px) rotate(-1.5deg); }
          75% { transform: translateY(-3.5px) rotate(1.2deg); }
        }
        @keyframes talk-torso {
          0%, 100% { transform: translateY(0px) scale(1); }
          35% { transform: translateY(-2px) scale(1.006); }
          70% { transform: translateY(0.5px) scale(0.998); }
        }
        @keyframes talk-arm-gesturing {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-16deg) translateY(-3px); }
          55% { transform: rotate(12deg) translateY(-4px); }
          80% { transform: rotate(-6deg) translateY(-1px); }
        }
        @keyframes talk-arm-secondary {
          0%, 100% { transform: rotate(0deg); }
          35% { transform: rotate(6deg) translateY(-1px); }
          75% { transform: rotate(-4deg); }
        }

        /* Wave Animation */
        @keyframes wave-hand {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(20deg); }
        }

        .anim-walk-head { animation: walk-head 1s ease-in-out infinite; }
        .anim-walk-torso { animation: walk-torso 1s ease-in-out infinite; }
        .anim-walk-leg-l { transform-origin: 105px 175px; animation: walk-leg-left 1s ease-in-out infinite; }
        .anim-walk-leg-r { transform-origin: 125px 175px; animation: walk-leg-right 1s ease-in-out infinite; }
        .anim-walk-arm-l { transform-origin: 90px 105px; animation: walk-arm-left 1s ease-in-out infinite; }
        .anim-walk-arm-r { transform-origin: 145px 105px; animation: walk-arm-right 1s ease-in-out infinite; }
        .anim-walk-skeleton { transform-origin: 120px 170px; animation: walk-skeleton-follow 1s ease-in-out infinite; }
        .anim-walk-directional-body { animation: walk-directional-body 1s ease-in-out infinite; }

        .anim-run-torso { animation: run-torso 0.65s ease-in-out infinite; }
        .anim-run-leg-l { transform-origin: 105px 175px; animation: run-leg-left 0.65s ease-in-out infinite; }
        .anim-run-leg-r { transform-origin: 125px 175px; animation: run-leg-right 0.65s ease-in-out infinite; }
        .anim-run-arm-l { transform-origin: 90px 105px; animation: run-arm-left 0.65s ease-in-out infinite; }
        .anim-run-arm-r { transform-origin: 145px 105px; animation: run-arm-right 0.65s ease-in-out infinite; }

        .anim-idle-body { animation: idle-breathe 2.4s ease-in-out infinite; }
        .anim-idle-arm-l { transform-origin: 90px 105px; animation: idle-arm 2.4s ease-in-out infinite; }
        .anim-idle-arm-r { transform-origin: 145px 105px; animation: idle-arm 2.4s ease-in-out infinite reverse; }

        .anim-talk-head { transform-origin: 120px 85px; animation: talk-head 1.8s ease-in-out infinite; }
        .anim-talk-torso { animation: talk-torso 1.8s ease-in-out infinite; }
        .anim-talk-arm-l { transform-origin: 96px 105px; animation: talk-arm-gesturing 1.8s ease-in-out infinite; }
        .anim-talk-arm-r { transform-origin: 140px 105px; animation: talk-arm-secondary 1.8s ease-in-out infinite; }

        .anim-wave-arm { transform-origin: 145px 105px; animation: wave-hand 0.8s ease-in-out infinite; }
      `}</style>

      {/* SVG Character Model matching the user's uploaded screenshot */}
      <svg 
        viewBox="0 0 240 340" 
        className="w-full h-full drop-shadow-md overflow-visible"
      >
        <defs>
          <linearGradient id="charSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={
              activeModelTheme === 'indian_woman' ? '#d49b6e' :
              activeModelTheme === 'indian_man' ? '#c68a5c' : '#f8cfb4'
            }/>
            <stop offset="100%" stopColor={
              activeModelTheme === 'indian_woman' ? '#b5764d' :
              activeModelTheme === 'indian_man' ? '#aa693d' : '#e2ab8a'
            }/>
          </linearGradient>
          <linearGradient id="charShirt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={
              activeModelTheme === 'indian_woman' ? '#db2777' :
              activeModelTheme === 'indian_man' ? '#ea580c' : '#9fc8eb'
            }/>
            <stop offset="100%" stopColor={
              activeModelTheme === 'indian_woman' ? '#be185d' :
              activeModelTheme === 'indian_man' ? '#c2410c' : '#7eabe0'
            }/>
          </linearGradient>
          <linearGradient id="charPants" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={
              activeModelTheme === 'indian_woman' ? '#e11d48' :
              activeModelTheme === 'indian_man' ? '#fef3c7' : '#46423c'
            }/>
            <stop offset="100%" stopColor={
              activeModelTheme === 'indian_woman' ? '#9f1239' :
              activeModelTheme === 'indian_man' ? '#ded1bc' : '#322f2b'
            }/>
          </linearGradient>
          <linearGradient id="charPantsRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={
              activeModelTheme === 'indian_woman' ? '#be123c' :
              activeModelTheme === 'indian_man' ? '#ebd5b3' : '#3a3732'
            }/>
            <stop offset="100%" stopColor={
              activeModelTheme === 'indian_woman' ? '#881337' :
              activeModelTheme === 'indian_man' ? '#caa97e' : '#282522'
            }/>
          </linearGradient>
          <linearGradient id="charShoes" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={
              activeModelTheme === 'indian_woman' ? '#831843' :
              activeModelTheme === 'indian_man' ? '#78350f' : '#2c2520'
            }/>
            <stop offset="100%" stopColor={
              activeModelTheme === 'indian_woman' ? '#500724' :
              activeModelTheme === 'indian_man' ? '#451a03' : '#181411'
            }/>
          </linearGradient>
        </defs>

        {/* BACK / RIGHT ARM (Background layer) */}
        <g 
          className={
            mode === 'Walk' ? 'anim-walk-arm-r' : 
            mode === 'Run' ? 'anim-run-arm-r' : 
            mode === 'Wave' ? 'anim-wave-arm' : 
            mode === 'Talking' ? 'anim-talk-arm-r' : 'anim-idle-arm-r'
          }
        >
          <g transform={getTransformAttr('armRight', 145, 105)}>
            {customArmRight ? (
              <image 
                href={customArmRight} 
                x="120" 
                y="95" 
                width="48" 
                height="115" 
                preserveAspectRatio="xMidYMid meet" 
              />
            ) : mode === 'Wave' ? (
              /* Waving Raised Arm */
              <g>
                <path d="M 142,105 C 160,85 175,65 185,45 C 188,40 196,44 194,50 C 182,75 165,100 148,115 Z" fill="url(#charShirt)" stroke="#5d88bc" strokeWidth="1.5" />
                opacity="0"
                {/* Hand waving */}
                <path d="M 185,42 C 192,30 205,32 202,42 C 200,48 190,52 186,48 Z" fill="url(#charSkin)" stroke="#9e6648" strokeWidth="1.2" />
              </g>
            ) : (
              /* Relaxed/Walking/Talking Back Arm */
              <g>
                {/* Upper arm */}
                <path d="M 140,105 C 150,125 152,145 150,165 C 146,168 138,166 137,162 C 140,145 138,125 132,110 Z" fill="#6d99cc" stroke="#486f9c" strokeWidth="1.5" />
                {/* Forearm & hand */}
                <path d="M 148,162 C 147,178 142,192 136,202 C 132,206 126,200 128,194 C 134,185 138,172 139,160 Z" fill="#e2ab8a" stroke="#9e6648" strokeWidth="1.2" />
                {/* Closed hand */}
                <circle cx="132" cy="204" r="5" fill="#e2ab8a" stroke="#9e6648" strokeWidth="1.2" />
              </g>
            )}
          </g>
        </g>

        {/* BACK / RIGHT LEG (Behind torso) */}
        <g className={mode === 'Walk' ? 'anim-walk-leg-r' : mode === 'Run' ? 'anim-run-leg-r' : ''}>
          <g transform={getTransformAttr('legRight', 125, 175)}>
            {customLegRight ? (
              <image 
                href={customLegRight} 
                x="108" 
                y="172" 
                width="46" 
                height="150" 
                preserveAspectRatio="xMidYMid meet" 
              />
            ) : (
              <>
                {/* Thigh */}
                <path d="M 120,172 C 126,205 132,240 135,270 C 126,272 116,272 114,268 C 112,240 110,205 110,172 Z" fill="url(#charPantsRight)" stroke="#22201d" strokeWidth="1.5" />
                {/* Calf */}
                <path d="M 135,268 C 138,285 142,302 144,316 C 134,318 126,318 124,314 C 122,300 118,285 116,268 Z" fill="url(#charPantsRight)" stroke="#22201d" strokeWidth="1.5" />
              </>
            )}

            {/* Right Shoe */}
            <g transform={getTransformAttr('shoeRight', 135, 320)}>
              {customShoeRight ? (
                <image 
                  href={customShoeRight} 
                  x="114" 
                  y="310" 
                  width="44" 
                  height="22" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <path d="M 124,312 C 132,314 148,314 154,320 C 156,325 152,328 142,328 L 118,328 C 114,328 116,320 124,312 Z" fill="url(#charShoes)" stroke="#110e0c" strokeWidth="1.2" />
              )}
            </g>
          </g>
        </g>

        {/* FRONT / LEFT LEG */}
        <g className={mode === 'Walk' ? 'anim-walk-leg-l' : mode === 'Run' ? 'anim-run-leg-l' : ''}>
          <g transform={getTransformAttr('legLeft', 105, 175)}>
            {customLegLeft ? (
              <image 
                href={customLegLeft} 
                x="76" 
                y="172" 
                width="44" 
                height="150" 
                preserveAspectRatio="xMidYMid meet" 
              />
            ) : (
              <>
                {/* Thigh */}
                <path d="M 102,172 C 104,205 106,240 104,270 C 95,272 85,270 86,266 C 90,238 92,205 94,172 Z" fill="url(#charPants)" stroke="#22201d" strokeWidth="1.5" />
                {/* Calf */}
                <path d="M 104,268 C 102,285 100,302 96,316 C 86,318 78,316 78,312 C 82,298 84,284 86,268 Z" fill="url(#charPants)" stroke="#22201d" strokeWidth="1.5" />
              </>
            )}

            {/* Left Shoe */}
            <g transform={getTransformAttr('shoeLeft', 90, 320)}>
              {customShoeLeft ? (
                <image 
                  href={customShoeLeft} 
                  x="66" 
                  y="310" 
                  width="44" 
                  height="22" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <path d="M 78,312 C 86,314 102,314 108,320 C 110,325 106,328 96,328 L 70,328 C 66,328 68,320 78,312 Z" fill="url(#charShoes)" stroke="#110e0c" strokeWidth="1.2" />
              )}
            </g>
          </g>
        </g>

        {/* MAIN TORSO (Light Blue Button-up shirt & Belt) */}
        <g className={mode === 'Walk' ? 'anim-walk-torso' : mode === 'Run' ? 'anim-run-torso' : mode === 'Talking' ? 'anim-talk-torso' : 'anim-idle-body'}>
          <g transform={getTransformAttr('torso', 120, 140)}>
            {customTorso ? (
              <image 
                href={customTorso} 
                x="84" 
                y="96" 
                width="70" 
                height="82" 
                preserveAspectRatio="xMidYMid meet" 
              />
            ) : (
              <>
                {/* Shirt Main Body */}
                <path 
                  d="M 96,102 
                     C 105,100 135,100 144,102 
                     C 152,110 154,140 148,172 
                     C 135,174 105,174 92,172 
                     C 88,140 88,110 96,102 Z" 
                  fill="url(#charShirt)" 
                  stroke="#5d88bc" 
                  strokeWidth="1.8" 
                />

                {/* Collar */}
                <path d="M 108,98 L 118,110 L 122,99 L 126,110 L 134,98 Z" fill="#b9dcfa" stroke="#5d88bc" strokeWidth="1.2" />
                {/* Placket line & buttons */}
                <line x1="120" y1="108" x2="120" y2="168" stroke="#5d88bc" strokeWidth="1.2" />
                <circle cx="120" cy="118" r="1.2" fill="#fff" />
                <circle cx="120" cy="132" r="1.2" fill="#fff" />
                <circle cx="120" cy="146" r="1.2" fill="#fff" />
                <circle cx="120" cy="160" r="1.2" fill="#fff" />

                {/* Belt */}
                <rect x="94" y="168" width="52" height="6" fill="#2b2622" stroke="#171513" strokeWidth="1" />
                <rect x="115" y="167" width="10" height="8" rx="1" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                <rect x="117" y="169" width="6" height="4" fill="#334155" />
              </>
            )}
          </g>

          {/* HEAD & NECK */}
          <g className={mode === 'Walk' ? 'anim-walk-head' : mode === 'Talking' ? 'anim-talk-head' : ''}>
            <g transform={getTransformAttr('head', 120, 85)}>
              {customHead ? (
                <image 
                  href={customHead} 
                  x="96" 
                  y="30" 
                  width="50" 
                  height="72" 
                  preserveAspectRatio="xMidYMid meet" 
                />
              ) : (
                <>
                  {/* Neck */}
                  <path d="M 112,88 L 112,100 L 128,100 L 128,88 Z" fill="url(#charSkin)" stroke="#9e6648" strokeWidth="1.2" />
                  
                  {/* Head Silhouette */}
                  <path 
                    d="M 105,48 
                       C 105,32 135,32 138,48 
                       C 142,60 140,78 135,84 
                       C 128,92 118,92 110,86 
                       C 104,80 102,62 105,48 Z" 
                    fill="url(#charSkin)" 
                    stroke="#9e6648" 
                    strokeWidth="1.5" 
                  />
                  {/* Nose */}
                  <path d="M 120,58 L 118,65 L 122,66" fill="none" stroke="#b07452" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Indian Woman Bindi & Earrings */}
                  {activeModelTheme === 'indian_woman' && (
                    <>
                      <circle cx="120" cy="53" r="1.8" fill="#dc2626" stroke="#fef08a" strokeWidth="0.4" />
                      <circle cx="103" cy="65" r="1.8" fill="#f59e0b" stroke="#b45309" strokeWidth="0.4" />
                      <circle cx="137" cy="65" r="1.8" fill="#f59e0b" stroke="#b45309" strokeWidth="0.4" />
                    </>
                  )}

                  {/* Indian Man Mustache */}
                  {activeModelTheme === 'indian_man' && (
                    <path d="M 111,66 Q 120,69 129,66 Q 120,72 111,66 Z" fill="#1c1917" stroke="#000" strokeWidth="0.3" />
                  )}
                </>
              )}

              {/* Hair */}
              <g transform={getTransformAttr('hair', 120, 45)}>
                {customHair ? (
                  <image 
                    href={customHair} 
                    x="94" 
                    y="18" 
                    width="54" 
                    height="48" 
                    preserveAspectRatio="xMidYMid meet" 
                  />
                ) : (
                  <>
                    <path 
                      d="M 102,50 
                         C 102,32 115,22 132,24 
                         C 145,26 145,40 142,48 
                         C 140,42 135,36 124,35 
                         C 114,35 106,42 104,52 Z" 
                      fill="#1c1917" 
                      stroke="#000" 
                      strokeWidth="1.2" 
                    />
                    {/* Sideburn & Hair volume */}
                    <path d="M 136,46 C 140,48 142,56 138,62 L 135,58" fill="#1c1917" />
                    
                    {/* Indian Woman Long Side Hair */}
                    {activeModelTheme === 'indian_woman' && (
                      <>
                        <path d="M 102,50 C 98,70 98,100 102,120 C 104,115 104,90 106,65 Z" fill="#1c1917" />
                        <path d="M 137,50 C 141,70 141,100 137,120 C 135,115 135,90 133,65 Z" fill="#1c1917" />
                      </>
                    )}
                  </>
                )}
              </g>

              {customEyebrowLeft && (
                <g transform={getTransformAttr('eyebrows', 120, 56)}>
                  <image
                    href={customEyebrowLeft}
                    x="105"
                    y="53"
                    width="9"
                    height="5"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
              )}
              {customEyebrowRight && (
                <g transform={getTransformAttr('eyebrows', 120, 56)}>
                  <image
                    href={customEyebrowRight}
                    x="125"
                    y="53"
                    width="9"
                    height="5"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
              )}

              {/* Face details (eyes, eyebrows, smile/mouth) */}
              {!customHead && (
                <>
                  {/* Eyebrows */}
                  <path d="M 109,54 Q 115,52 118,55" fill="none" stroke="#24160d" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 124,54 Q 128,52 132,55" fill="none" stroke="#24160d" strokeWidth="1.5" strokeLinecap="round" />
                  
                  {/* Eyes */}
                  <circle cx="114" cy="58" r="1.8" fill="#24160d" />
                  <circle cx="127" cy="58" r="1.8" fill="#24160d" />
                  <circle cx="114.5" cy="57.5" r="0.6" fill="#fff" />
                  <circle cx="127.5" cy="57.5" r="0.6" fill="#fff" />
                </>
              )}

              {customEyeLeft && (
                <g transform={getTransformAttr('eyes', 114, 58)}>
                  <image
                    href={customEyeLeft}
                    x="110"
                    y="55"
                    width="7"
                    height="7"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
              )}
              {customEyeRight && (
                <g transform={getTransformAttr('eyes', 127, 58)}>
                  <image
                    href={customEyeRight}
                    x="124"
                    y="55"
                    width="7"
                    height="7"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
              )}

              {/* Mouth: speaks dynamically in Talking mode when isSpeaking is true; quiet closed mouth (restingLipShape) in Idle or other modes */}
              <g transform={getTransformAttr('mouth', 120, 72)}>
                {mode === 'Talking' && isSpeaking && activeLipShape ? (
                  <g id="preview-rig-talking-lipsync">
                    <image 
                      href={activeLipShape.svgUrl} 
                      x="110" 
                      y="67" 
                      width="22" 
                      height="13" 
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </g>
                ) : (
                  /* Idle or quiet non-talking: cup thakbe (mouth closed / silent) with customizable resting lip */
                  <g id="preview-rig-idle-quiet-lips">
                    <image 
                      href={restingLipShape?.svgUrl || "/assets/lips/lip-x.svg"} 
                      x="110" 
                      y="67" 
                      width="22" 
                      height="13" 
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </g>
                )}
              </g>
            </g>
          </g>
        </g>

        {/* FRONT / LEFT ARM */}
        <g 
          className={
            mode === 'Walk' ? 'anim-walk-arm-l' : 
            mode === 'Run' ? 'anim-run-arm-l' : 
            mode === 'Talking' ? 'anim-talk-arm-l' : 'anim-idle-arm-l'
          }
        >
          <g transform={getTransformAttr('armLeft', 90, 105)}>
            {customArmLeft ? (
              <image 
                href={customArmLeft} 
                x="76" 
                y="95" 
                width="46" 
                height="115" 
                preserveAspectRatio="xMidYMid meet" 
              />
            ) : (
              <>
                {/* Upper arm (Shirt sleeve) */}
                <path d="M 96,105 C 88,125 86,145 88,165 C 92,168 100,166 101,162 C 98,145 100,125 106,110 Z" fill="url(#charShirt)" stroke="#5d88bc" strokeWidth="1.5" />
                {/* Forearm & hand */}
                <path d="M 90,162 C 91,178 96,192 102,202 C 106,206 112,200 110,194 C 104,185 100,172 99,160 Z" fill="url(#charSkin)" stroke="#9e6648" strokeWidth="1.2" />
                {/* Hand */}
                <circle cx="106" cy="204" r="5" fill="url(#charSkin)" stroke="#9e6648" strokeWidth="1.2" />
              </>
            )}
          </g>
        </g>

        {/* SKELETON MODE OVERLAY (When enabled) */}
        {showSkeleton && (
          <>
          <g 
            opacity="0"
            className="animate-in fade-in duration-200"
            transform={isSkeletonFlipped ? "translate(240, 0) scale(-1, 1)" : undefined}
          >
            <g opacity="0.2" stroke="#67e8f9" strokeWidth="8" strokeLinecap="round">
              <line x1="120" y1="94" x2="120" y2="170" />
              <line x1="96" y1="108" x2="92" y2="162" />
              <line x1="92" y1="162" x2="106" y2="204" />
              <line x1="142" y1="108" x2="148" y2="162" />
              <line x1="148" y1="162" x2="132" y2="204" />
              <line x1="100" y1="172" x2="96" y2="268" />
              <line x1="96" y1="268" x2="90" y2="322" />
              <line x1="125" y1="172" x2="130" y2="268" />
              <line x1="130" y1="268" x2="138" y2="322" />
            </g>

            <g fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="120" cy="84" r="27" strokeDasharray="4 3" />
              <line x1="100" y1="172" x2="125" y2="172" />
              <line x1="90" y1="322" x2="78" y2="329" />
              <line x1="138" y1="322" x2="150" y2="329" />
            </g>

            {/* Bones Lines */}
            {/* Spine & Neck */}
            <line x1="120" y1="58" x2="120" y2="94" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3 2" />
            <line x1="120" y1="94" x2="118" y2="170" stroke="#38bdf8" strokeWidth="3" />
            {/* Shoulder line */}
            <line x1="96" y1="108" x2="142" y2="108" stroke="#38bdf8" strokeWidth="2" />
            {/* Left Arm Bone */}
            <line x1="96" y1="108" x2="92" y2="162" stroke="#34d399" strokeWidth="2.5" />
            <line x1="92" y1="162" x2="106" y2="204" stroke="#34d399" strokeWidth="2" />
            {/* Right Arm Bone */}
            <line x1="142" y1="108" x2="148" y2="162" stroke="#34d399" strokeWidth="2.5" />
            <line x1="148" y1="162" x2="132" y2="204" stroke="#34d399" strokeWidth="2" />
            {/* Hip line */}
            <line x1="100" y1="172" x2="130" y2="172" stroke="#38bdf8" strokeWidth="2.5" />
            {/* Left Leg Bone */}
            <line x1="100" y1="172" x2="96" y2="268" stroke="#f43f5e" strokeWidth="2.5" />
            <line x1="96" y1="268" x2="90" y2="322" stroke="#f43f5e" strokeWidth="2" />
            {/* Right Leg Bone */}
            <line x1="125" y1="172" x2="130" y2="268" stroke="#f43f5e" strokeWidth="2.5" />
            <line x1="130" y1="268" x2="138" y2="322" stroke="#f43f5e" strokeWidth="2" />

            {/* Joint Nodes */}
            <circle cx="120" cy="58" r="4" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />
            <circle cx="120" cy="94" r="3" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />
            <circle cx="96" cy="108" r="3.5" fill="#34d399" stroke="#fff" strokeWidth="1.5" />
            <circle cx="142" cy="108" r="3.5" fill="#34d399" stroke="#fff" strokeWidth="1.5" />
            <circle cx="92" cy="162" r="3" fill="#34d399" stroke="#fff" strokeWidth="1.5" />
            <circle cx="148" cy="162" r="3" fill="#34d399" stroke="#fff" strokeWidth="1.5" />
            <circle cx="106" cy="204" r="3" fill="#34d399" stroke="#fff" strokeWidth="1.5" />
            <circle cx="132" cy="204" r="3" fill="#34d399" stroke="#fff" strokeWidth="1.5" />
            <circle cx="100" cy="172" r="3.5" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
            <circle cx="125" cy="172" r="3.5" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
            <circle cx="96" cy="268" r="3" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
            <circle cx="130" cy="268" r="3" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
            <circle cx="90" cy="322" r="3" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
            <circle cx="138" cy="322" r="3" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
          </g>

          <g
            opacity="0"
            className={`animate-in fade-in duration-200 ${mode === 'Walk' ? 'anim-walk-skeleton' : ''}`}
            transform={isSkeletonFlipped ? "translate(240, 0) scale(-1, 1)" : undefined}
          >
            <g opacity="0.22" stroke="#67e8f9" strokeWidth="8" strokeLinecap="round">
              <line x1="120" y1="94" x2="120" y2="170" />
              <line x1="96" y1="108" x2="92" y2="162" />
              <line x1="92" y1="162" x2="106" y2="204" />
              <line x1="142" y1="108" x2="148" y2="162" />
              <line x1="148" y1="162" x2="132" y2="204" />
              <line x1="100" y1="172" x2="96" y2="268" />
              <line x1="96" y1="268" x2="90" y2="322" />
              <line x1="125" y1="172" x2="130" y2="268" />
              <line x1="130" y1="268" x2="138" y2="322" />
            </g>

            <g fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="120" cy="84" r="27" strokeDasharray="4 3" />
              <line x1="120" y1="111" x2="120" y2="120" />
              <line x1="96" y1="108" x2="142" y2="108" />
              <line x1="100" y1="172" x2="125" y2="172" />
              <line x1="120" y1="120" x2="120" y2="170" strokeDasharray="5 3" />
              <line x1="90" y1="322" x2="78" y2="329" />
              <line x1="138" y1="322" x2="150" y2="329" />
            </g>

            <g fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round">
              <line x1="96" y1="108" x2="92" y2="162" />
              <line x1="92" y1="162" x2="106" y2="204" />
              <line x1="142" y1="108" x2="148" y2="162" />
              <line x1="148" y1="162" x2="132" y2="204" />
            </g>

            <g fill="#0e1014" stroke="#67e8f9" strokeWidth="2">
              <circle cx="120" cy="84" r="5" />
              <circle cx="120" cy="120" r="4" />
              <circle cx="96" cy="108" r="5" />
              <circle cx="142" cy="108" r="5" />
              <circle cx="92" cy="162" r="4" />
              <circle cx="148" cy="162" r="4" />
              <circle cx="106" cy="204" r="4" />
              <circle cx="132" cy="204" r="4" />
              <circle cx="100" cy="172" r="5" />
              <circle cx="125" cy="172" r="5" />
              <circle cx="96" cy="268" r="4" />
              <circle cx="130" cy="268" r="4" />
              <circle cx="90" cy="322" r="4" />
              <circle cx="138" cy="322" r="4" />
            </g>

            <g fill="#67e8f9">
              <circle cx="120" cy="84" r="2" />
              <circle cx="120" cy="120" r="1.7" />
              <circle cx="96" cy="108" r="2" />
              <circle cx="142" cy="108" r="2" />
              <circle cx="100" cy="172" r="2" />
              <circle cx="125" cy="172" r="2" />
            </g>
            <g fontSize="4.5" fontFamily="sans-serif" fontWeight="600" fill="#e0f2fe" stroke="#0e1014" strokeWidth="1.2" paintOrder="stroke">
              <text x="128" y="82">0 Head</text>
              <text x="128" y="123">1 Neck</text>
              <text x="92" y="104" textAnchor="end">2 L Shoulder</text>
              <text x="148" y="104">3 R Shoulder</text>
              <text x="88" y="160" textAnchor="end">4 L Elbow</text>
              <text x="152" y="160">5 R Elbow</text>
              <text x="102" y="202" textAnchor="end">6 L Wrist</text>
              <text x="136" y="202">7 R Wrist</text>
              <text x="102" y="212" textAnchor="end">8 L Hand</text>
              <text x="136" y="212">9 R Hand</text>
              <text x="126" y="145">10 Spine</text>
              <text x="96" y="184" textAnchor="end">11 L Hip</text>
              <text x="130" y="184">12 R Hip</text>
              <text x="94" y="264" textAnchor="end">13 L Knee</text>
              <text x="134" y="264">14 R Knee</text>
              <text x="84" y="318" textAnchor="end">15 L Ankle</text>
              <text x="144" y="318">16 R Ankle</text>
              <text x="82" y="336" textAnchor="end">17 L Foot</text>
              <text x="146" y="336">18 R Foot</text>
            </g>
          </g>
          <g
            className="animate-in fade-in duration-200"
            transform={isSkeletonFlipped ? "translate(240, 0) scale(-1, 1)" : undefined}
          >
            {SKELETON_CONNECTIONS.map(([fromName, toName]) => {
              const from = scaleSkeletonPoint(ORIGINAL_SKELETON_POINTS[fromName], 240, 340);
              const to = scaleSkeletonPoint(ORIGINAL_SKELETON_POINTS[toName], 240, 340);
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
                  strokeWidth={isArm || isLeg ? '2.2' : '2'}
                  strokeLinecap="round"
                />
              );
            })}
            {Object.entries(ORIGINAL_SKELETON_POINTS).map(([name, point]) => {
              const scaled = scaleSkeletonPoint(point, 240, 340);
              return (
                <g key={name}>
                  <circle cx={scaled.x} cy={scaled.y} r="3.5" fill="#0e1014" stroke="#67e8f9" strokeWidth="1.7" />
                  <circle cx={scaled.x} cy={scaled.y} r="1.2" fill="#67e8f9" />
                </g>
              );
            })}
            <g fontSize="4.5" fontFamily="sans-serif" fontWeight="600" fill="#e0f2fe" stroke="#0e1014" strokeWidth="1.1" paintOrder="stroke">
              {Object.entries(ORIGINAL_SKELETON_POINTS).map(([name, point]) => {
                const scaled = scaleSkeletonPoint(point, 240, 340);
                return <text key={`label-${name}`} x={scaled.x + 4} y={scaled.y - 3}>{SKELETON_POINT_LABELS[name as keyof typeof SKELETON_POINT_LABELS]}</text>;
              })}
            </g>
          </g>
          </>
        )}
        {showSkeleton && (
          <g
            className={mode === 'Walk' ? 'anim-walk-skeleton' : ''}
            transform={isSkeletonFlipped ? 'translate(240 0) scale(-1 1)' : undefined}
          >
            <AnatomicalSkeletonOverlay scaleX={0.75} scaleY={0.425} />
          </g>
        )}
      </svg>
    </div>
  );
}
