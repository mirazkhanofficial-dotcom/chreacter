import React, { useState } from 'react';
import {
  X,
  Users,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Check,
  Sparkles,
  Cloud,
  Layers,
  Calendar,
} from 'lucide-react';
import { useCharacterLayers } from '../context/CharacterLayersContext';
import type { SavedCharacter } from '../types';

interface CharacterListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCharacter?: (char: SavedCharacter) => void;
}

export default function CharacterListModal({ isOpen, onClose, onSelectCharacter }: CharacterListModalProps) {
  const {
    savedCharacters,
    activeCharacterId,
    loadSavedCharacter,
    deleteSavedCharacter,
    startNewCharacter,
    refreshCharactersList,
    isLoadingCharacters,
  } = useCharacterLayers();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (char: SavedCharacter) => {
    loadSavedCharacter(char);
    if (onSelectCharacter) onSelectCharacter(char);
    onClose();
  };

  const handleCreateNew = () => {
    startNewCharacter();
    onClose();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    await deleteSavedCharacter(id);
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#15171e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#191c24]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Character List (ক্যারেক্টার লিস্ট)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {savedCharacters.length} Saved
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span>Firebase Firestore & Cloud Database Synced</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshCharactersList}
              disabled={isLoadingCharacters}
              title="Refresh from Firebase"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCharacters ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-all shadow-sm shadow-sky-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoadingCharacters && savedCharacters.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-sm">Connecting to Firebase & fetching characters...</p>
            </div>
          ) : savedCharacters.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">এখনো কোনো ক্যারেক্টার সেভ করা হয়নি</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                ক্যানভাসে ক্যারেক্টার ইচ্ছামতো এডিট করে "Save Character" বাটনে ক্লিক করুন। সেটি সরাসরি Firebase এ সেভ হয়ে এই লিস্টে জমা হবে।
              </p>
              <button
                type="button"
                onClick={handleCreateNew}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ক্যারেক্টার তৈরি ও এডিট করুন</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedCharacters.map((char) => {
                const isActive = activeCharacterId === char.id;
                const customLayerCount = char.customLayersMap ? Object.keys(char.customLayersMap).length : 0;
                const isConfirming = confirmDeleteId === char.id;
                const isDeleting = deletingId === char.id;

                return (
                  <div
                    key={char.id}
                    onClick={() => handleSelect(char)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                      isActive
                        ? 'bg-sky-500/10 border-sky-500/40 ring-1 ring-sky-500/30 shadow-lg shadow-sky-500/5'
                        : 'bg-[#1a1d26] border-white/5 hover:border-white/20 hover:bg-[#202430]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isActive
                              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                              : 'bg-white/10 text-slate-200 group-hover:bg-white/15'
                          }`}>
                            {char.name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                              <span>{char.name}</span>
                              {isActive && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                  <Check className="w-2.5 h-2.5" /> Active
                                </span>
                              )}
                            </h4>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{formatDate(char.updatedAt)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Delete button or confirmation */}
                        {isConfirming ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={(e) => handleDelete(char.id, e)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold"
                            >
                              {isDeleting ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="px-1.5 py-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(char.id);
                            }}
                            title="Delete character"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-60 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Character Details & Badges */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {customLayerCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                            <Layers className="w-3 h-3" />
                            <span>{customLayerCount} Custom Layers</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-white/5 text-slate-400 px-2 py-0.5 rounded">
                            Standard Layers
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                          <Cloud className="w-3 h-3" />
                          <span>Firebase Cloud</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        {isActive ? 'Currently loaded in editor' : 'Click to edit in canvas'}
                      </span>
                      <div className="flex items-center gap-1 text-sky-400 font-medium text-xs group-hover:translate-x-0.5 transition-transform">
                        <Edit3 className="w-3 h-3" />
                        <span>{isActive ? 'Editing' : 'Load & Edit'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#191c24] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>যেকোনো সময় এডিট করে আবার Save করলে Firebase-এ স্বয়ংক্রিয়ভাবে আপডেট হবে।</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
