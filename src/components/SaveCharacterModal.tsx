import React, { useState, useEffect } from 'react';
import { X, Save, Cloud, Check, Loader2, Sparkles, Copy } from 'lucide-react';
import { useCharacterLayers } from '../context/CharacterLayersContext';

interface SaveCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (name: string) => void;
}

export default function SaveCharacterModal({ isOpen, onClose, onSaved }: SaveCharacterModalProps) {
  const {
    activeCharacterId,
    activeCharacterName,
    saveCurrentCharacter,
    isSavingToFirebase,
  } = useCharacterLayers();

  const [charName, setCharName] = useState(activeCharacterName || 'My Character');
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCharName(activeCharacterName || 'My Character');
      setSaveAsNew(false);
      setSaveStatus('idle');
      setStatusText('');
    }
  }, [isOpen, activeCharacterName]);

  if (!isOpen) return null;

  const handleSave = async (forceNewCopy = false) => {
    const trimmed = charName.trim() || 'Custom Character';
    setSaveStatus('saving');
    setStatusText('Saving character data to Firebase...');

    try {
      const res = await saveCurrentCharacter(forceNewCopy ? `${trimmed} (Copy)` : trimmed);
      if (res.success) {
        setSaveStatus('success');
        setStatusText(res.message);
        if (onSaved) onSaved(trimmed);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setSaveStatus('error');
        setStatusText(res.message || 'Failed to save');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setStatusText(err?.message || 'Error occurred while saving to Firebase');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#15171e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#191c24]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Save Character to Firebase</h2>
              <p className="text-xs text-slate-400">Firebase Firestore Cloud Sync</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Character Name (ক্যারেক্টারের নাম)
            </label>
            <input
              type="text"
              value={charName}
              onChange={(e) => setCharName(e.target.value)}
              placeholder="e.g. Cartoon Boy 1, Office Worker..."
              className="w-full px-3.5 py-2.5 bg-[#1e222d] border border-white/10 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave(false);
                }
              }}
            />
          </div>

          {activeCharacterId && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>Existing Character: <strong>{activeCharacterName}</strong></span>
              </div>
              <span className="text-[11px] text-slate-400">Will update in Firebase</span>
            </div>
          )}

          {/* Status Message */}
          {statusText && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                saveStatus === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : saveStatus === 'error'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}
            >
              {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              {saveStatus === 'success' && <Check className="w-4 h-4 shrink-0 text-emerald-400" />}
              <span>{statusText}</span>
            </div>
          )}

          {/* Hint */}
          <p className="text-[11px] text-slate-400 leading-relaxed">
            সেভ করার পর ক্যারেক্টারটি সরাসরি Firebase Firestore এ জমা হবে। ক্যারেক্টার লিস্ট থেকে পরবর্তীতে যেকোনো সময় এটি এডিট করা যাবে।
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#191c24] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSavingToFirebase}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            Cancel
          </button>

          {activeCharacterId && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSavingToFirebase || saveStatus === 'saving'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-medium transition-all"
              title="Save as a new separate character in Firebase"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Save as New Copy</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSavingToFirebase || saveStatus === 'saving'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Firebase...</span>
              </>
            ) : saveStatus === 'success' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{activeCharacterId ? 'Update in Firebase' : 'Save to Firebase'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
