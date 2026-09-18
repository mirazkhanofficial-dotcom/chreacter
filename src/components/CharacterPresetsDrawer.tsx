import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Save, 
  Trash2, 
  Check, 
  X, 
  Edit3, 
  Layers, 
  RefreshCw,
  User,
  Heart
} from 'lucide-react';
import { useCharacterLayers } from '../context/CharacterLayersContext';
import type { SavedCharacter } from '../types';

interface CharacterPresetsDrawerProps {
  onOpenStateChange?: (isOpen: boolean) => void;
}

export default function CharacterPresetsDrawer({ onOpenStateChange }: CharacterPresetsDrawerProps) {
  const {
    presetCharacters,
    savedCharacters,
    activeCharacterId,
    activeCharacterName,
    activeModelTheme,
    loadSavedCharacter,
    saveCurrentCharacter,
    saveAsNewCharacter,
    deleteSavedCharacter,
    isSavingToFirebase,
    isLoadingCharacters,
    refreshCharactersList,
  } = useCharacterLayers();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'presets' | 'saved'>('all');
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const toggleDrawer = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (onOpenStateChange) onOpenStateChange(nextState);
  };

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  // Filter characters by tab
  const displayedCharacters = (() => {
    if (activeTab === 'presets') return presetCharacters;
    if (activeTab === 'saved') return savedCharacters;
    // 'all' -> Preset models first, then saved characters
    const savedFiltered = savedCharacters.filter((sc) => !presetCharacters.some((p) => p.id === sc.id));
    return [...presetCharacters, ...savedFiltered];
  })();

  const handleSelectCharacter = (char: SavedCharacter) => {
    loadSavedCharacter(char);
    showToast(`Loaded "${char.name}"! You can now edit, update, or save as new.`);
  };

  const handleQuickUpdate = async (char: SavedCharacter) => {
    const res = await saveCurrentCharacter(char.name);
    if (res.success) {
      showToast(res.message);
    }
  };

  const handleConfirmSaveAsNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    const res = await saveAsNewCharacter(newCharName.trim());
    if (res.success) {
      showToast(res.message);
      setSaveAsModalOpen(false);
      setNewCharName('');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const success = await deleteSavedCharacter(id);
    if (success) {
      showToast(`Character "${name}" deleted`);
      setConfirmDeleteId(null);
    }
  };

  return (
    <>
      {/* PERSISTENT FLOATING PRESETS BOTTOM BUTTON */}
      <div className="w-full flex flex-col items-center justify-center my-2">
        <button
          id="bottom-presets-toggle-btn"
          onClick={toggleDrawer}
          className={`group flex items-center gap-3 px-5 py-2.5 rounded-xl border font-medium text-sm transition-all duration-200 shadow-xl ${
            isOpen 
              ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/20' 
              : 'bg-[#181b22] hover:bg-[#20242e] border-slate-700/80 hover:border-blue-500/60 text-slate-200 hover:text-white'
          }`}
          title="Click to view all character presets and saved characters"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-semibold">Character Presets & Models</span>
          </div>

          <span className="bg-slate-800/90 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">
            {presetCharacters.length + savedCharacters.length} Models
          </span>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700 text-xs text-slate-300">
            <span className="text-slate-400">Active:</span>
            <span className="text-blue-300 font-medium truncate max-w-[130px]">{activeCharacterName}</span>
          </div>

          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-white" />
          )}
        </button>
      </div>

      {/* EXPANDABLE BOTTOM SHELF / DRAWER */}
      {isOpen && (
        <div 
          id="character-presets-bottom-drawer"
          className="w-full mt-2 bg-[#12141a]/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  Character Models & Presets
                  <span className="text-xs font-normal text-slate-400">
                    (Edit Indian models or any custom character)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select any character to edit in real time, update original or save as a new model
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="presets-drawer-save-as-new-btn"
                onClick={() => {
                  setNewCharName(`${activeCharacterName} (Copy)`);
                  setSaveAsModalOpen(true);
                }}
                disabled={isSavingToFirebase}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-medium transition-colors"
                title="Save current character under a new name"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save As New</span>
              </button>

              <button
                id="presets-drawer-update-current-btn"
                onClick={() => handleQuickUpdate({ name: activeCharacterName } as any)}
                disabled={isSavingToFirebase}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-blue-500/20"
                title="Update currently selected character in Firebase"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingToFirebase ? 'Updating...' : 'Update Original'}</span>
              </button>

              <button
                onClick={refreshCharactersList}
                disabled={isLoadingCharacters}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                title="Refresh character list from cloud"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCharacters ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={toggleDrawer}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 pt-3 pb-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              All Characters ({presetCharacters.length + savedCharacters.length})
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'presets'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              <span>🇮🇳 Indian & Preset Models ({presetCharacters.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              My Saved Characters ({savedCharacters.length})
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-h-[360px] overflow-y-auto pr-1">
            {displayedCharacters.map((char) => {
              const isActive = activeCharacterId === char.id;
              const isPreset = char.isPreset || char.id.startsWith('preset-');
              const isIndianMan = char.modelTheme === 'indian_man' || char.id === 'preset-indian-man';
              const isIndianWoman = char.modelTheme === 'indian_woman' || char.id === 'preset-indian-woman';

              return (
                <div
                  key={char.id}
                  id={`preset-card-${char.id}`}
                  className={`group relative rounded-xl border p-3 flex flex-col justify-between transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400/50'
                      : 'bg-[#181b22] hover:bg-[#1f232d] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header with badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isIndianMan && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-medium">
                          🇮🇳 Indian Man
                        </span>
                      )}
                      {isIndianWoman && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md font-medium">
                          🇮🇳 Indian Woman
                        </span>
                      )}
                      {isPreset && !isIndianMan && !isIndianWoman && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md font-medium">
                          Preset Model
                        </span>
                      )}
                      {!isPreset && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-medium">
                          Custom Saved
                        </span>
                      )}
                    </div>

                    {isActive && (
                      <span className="flex items-center gap-1 text-[10px] bg-blue-500 text-white font-semibold px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  {/* Character Avatar Visual Representation */}
                  <div className="my-2 p-3 bg-[#0d0f14] rounded-lg border border-slate-800/80 flex items-center justify-center relative overflow-hidden h-[95px]">
                    <svg viewBox="0 0 100 130" className="h-full w-auto">
                      {/* Stylized Character Figure representation */}
                      <circle 
                        cx="50" 
                        cy="30" 
                        r="18" 
                        fill={isIndianWoman ? '#d49b6e' : isIndianMan ? '#c68a5c' : '#f9d3bb'} 
                      />
                      {/* Hair */}
                      <path 
                        d={
                          isIndianWoman 
                            ? "M 32,32 C 30,10 70,10 68,32 C 72,55 64,68 62,75 C 60,65 62,40 60,35 C 50,32 38,35 38,40 C 36,55 34,68 32,75 Z"
                            : "M 32,30 C 32,14 68,14 68,30 C 68,22 32,22 32,30 Z"
                        }
                        fill="#1c1917" 
                      />
                      {/* Bindi for Indian Woman */}
                      {isIndianWoman && (
                        <circle cx="50" cy="28" r="2" fill="#dc2626" />
                      )}
                      {/* Mustache for Indian Man */}
                      {isIndianMan && (
                        <path d="M 44,36 Q 50,38 56,36 Q 50,41 44,36 Z" fill="#1c1917" />
                      )}
                      {/* Torso */}
                      <rect 
                        x="34" 
                        y="52" 
                        width="32" 
                        height="42" 
                        rx="4"
                        fill={
                          isIndianWoman 
                            ? '#db2777' 
                            : isIndianMan 
                            ? '#ea580c' 
                            : '#78a4dc'
                        } 
                      />
                      {/* Legs */}
                      <rect 
                        x="36" 
                        y="94" 
                        width="12" 
                        height="34" 
                        rx="2"
                        fill={isIndianWoman ? '#9f1239' : isIndianMan ? '#fef3c7' : '#322f2b'} 
                      />
                      <rect 
                        x="52" 
                        y="94" 
                        width="12" 
                        height="34" 
                        rx="2"
                        fill={isIndianWoman ? '#9f1239' : isIndianMan ? '#fef3c7' : '#282522'} 
                      />
                    </svg>
                  </div>

                  {/* Character Name & Info */}
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-white truncate">{char.name}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {char.description || (isPreset ? 'Default model ready for editing' : 'Custom user character with layer transforms & styles')}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-slate-800/80">
                    <button
                      id={`load-char-${char.id}`}
                      onClick={() => handleSelectCharacter(char)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:bg-blue-600/50' 
                          : 'bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isActive ? 'Editing' : 'Load & Edit'}</span>
                    </button>

                    {/* Delete button (only for non-preset characters) */}
                    {!isPreset && (
                      confirmDeleteId === char.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(char.id, char.name)}
                            className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors text-xs"
                            title="Confirm delete"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(char.id)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-800/50 transition-colors"
                          title="Delete saved character"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SAVE AS NEW CHARACTER MODAL DIALOG */}
      {saveAsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#181b22] border border-slate-700 rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Save As New Character</span>
              </div>
              <button
                onClick={() => setSaveAsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveAsNew} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Character Name
                </label>
                <input
                  type="text"
                  required
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="e.g. My Indian Hero, Priya Modified, etc."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl text-white text-sm outline-none transition-colors"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  This will save a separate new character to Firebase without overwriting your original model.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveAsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingToFirebase || !newCharName.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingToFirebase ? 'Saving...' : 'Save Character'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEEDBACK TOAST */}
      {statusToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e2026] text-white px-4 py-2.5 rounded-xl border border-blue-500/40 shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{statusToast}</span>
        </div>
      )}
    </>
  );
}
