import React, { useState } from 'react';
import {
  Users,
  Cloud,
  Plus,
  Save,
  Sparkles,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useCharacterLayers } from '../context/CharacterLayersContext';
import CharacterListModal from './CharacterListModal';
import SaveCharacterModal from './SaveCharacterModal';

export default function AppHeader() {
  const {
    activeCharacterId,
    activeCharacterName,
    savedCharacters,
    startNewCharacter,
  } = useCharacterLayers();

  const [isListOpen, setIsListOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);

  return (
    <>
      <header
        id="app-header-navigation"
        className="w-full bg-[#15171e]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-xl"
      >
        {/* Left: App Title & Cloud Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">2D Character Animator & Rig</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10.5px] font-medium">
                <Cloud className="w-3 h-3" />
                <span>Firebase Connected</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Active Character:</span>
              <span className="font-semibold text-sky-400">{activeCharacterName}</span>
              {activeCharacterId && (
                <span className="text-[10px] bg-sky-500/10 text-sky-300 px-1.5 py-0.2 rounded border border-sky-500/20">
                  Firebase Synced
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Character Management Actions */}
        <div className="flex items-center gap-2">
          {/* New Character Button */}
          <button
            type="button"
            onClick={startNewCharacter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-colors"
            title="Start new fresh character"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Character</span>
          </button>

          {/* Character List Button */}
          <button
            type="button"
            onClick={() => setIsListOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-all shadow-sm shadow-sky-500/10"
            title="Open saved characters list (ক্যারেক্টার লিস্ট)"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Character List</span>
            <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-white text-[10px] font-bold">
              {savedCharacters.length}
            </span>
          </button>

          {/* Save Character Button */}
          <button
            type="button"
            onClick={() => setIsSaveOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            title="Save character to Firebase (ক্যারেক্টার সেভ করুন)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Character</span>
          </button>
        </div>
      </header>

      {/* Modals */}
      <CharacterListModal isOpen={isListOpen} onClose={() => setIsListOpen(false)} />
      <SaveCharacterModal isOpen={isSaveOpen} onClose={() => setIsSaveOpen(false)} />
    </>
  );
}
