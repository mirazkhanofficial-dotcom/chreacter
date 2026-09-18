import React, { createContext, useContext, useState, useEffect } from 'react';

export type AnimationMode = 'Idle' | 'Talking' | 'Walk' | 'Run' | 'Wave';

export interface LipShape {
  id: string;
  name: string;
  label: string;
  svgUrl: string;
  isCustom?: boolean;
}

export const LIP_PHONEMES: LipShape[] = [
  { id: 'lips-x', name: 'Rest / Neutral (X)', label: 'X', svgUrl: '/assets/lips/lip-x.svg' },
  { id: 'lips-a', name: 'Ah / Open (A)', label: 'A', svgUrl: '/assets/lips/lip-a.svg' },
  { id: 'lips-b', name: 'M / B / P (B)', label: 'B', svgUrl: '/assets/lips/lip-b.svg' },
  { id: 'lips-c', name: 'Ee / S (C)', label: 'C', svgUrl: '/assets/lips/lip-c.svg' },
  { id: 'lips-d', name: 'Wide Open (D)', label: 'D', svgUrl: '/assets/lips/lip-d.svg' },
  { id: 'lips-e', name: 'Oh / O (E)', label: 'E', svgUrl: '/assets/lips/lip-e.svg' },
  { id: 'lips-ab', name: 'A_B Blend', label: 'A_B', svgUrl: '/assets/lips/lip-ab.svg' },
  { id: 'lips-ac', name: 'A_C Blend', label: 'A_C', svgUrl: '/assets/lips/lip-ac.svg' },
  { id: 'lips-ad', name: 'A_D Blend', label: 'A_D', svgUrl: '/assets/lips/lip-ad.svg' },
  { id: 'lips-adn', name: 'A_D_N Blend', label: 'A_D_N', svgUrl: '/assets/lips/lip-adn.svg' },
  { id: 'lips-ae', name: 'A_E Blend', label: 'A_E', svgUrl: '/assets/lips/lip-ae.svg' },
  { id: 'lips-af', name: 'F / V (A_F)', label: 'A_F', svgUrl: '/assets/lips/lip-af.svg' },
  { id: 'lips-ax', name: 'A_X Rest', label: 'A_X', svgUrl: '/assets/lips/lip-ax.svg' },
];

// Natural speech rhythm phoneme loop sequence (phonetic speech simulation)
// e.g. Rest -> A -> D -> C -> E -> B -> F -> A -> X
export const SPEECH_LOOP_SEQUENCE = [
  'lips-x',
  'lips-a',
  'lips-d',
  'lips-c',
  'lips-ae',
  'lips-e',
  'lips-b',
  'lips-af',
  'lips-ad',
  'lips-ac',
  'lips-a',
  'lips-ax',
];

interface LipSyncContextType {
  isLipSyncActive: boolean;
  setIsLipSyncActive: (active: boolean) => void;
  lipShapes: LipShape[];
  activeLipShape: LipShape;
  restingLipShape: LipShape;
  currentLipId: string;
  setCurrentLipId: (id: string) => void;
  speed: 'slow' | 'normal' | 'fast';
  setSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  toggleLipSync: () => void;
  currentMode: AnimationMode;
  setCurrentMode: (mode: AnimationMode) => void;
  isSpeaking: boolean;
  replaceLipShape: (id: string, newSvgUrl: string, name?: string) => void;
  addNewLipShape: (shape: { name: string; svgUrl: string; label?: string; id?: string }) => string;
  removeLipShape: (id: string) => void;
  resetToDefaultLips: () => void;
  speechSequence: string[];
}

const LipSyncContext = createContext<LipSyncContextType | undefined>(undefined);

export function LipSyncProvider({ children }: { children: React.ReactNode }) {
  const [currentMode, setCurrentMode] = useState<AnimationMode>('Idle');
  const [isLipSyncActive, setIsLipSyncActive] = useState<boolean>(true);
  const [lipShapes, setLipShapes] = useState<LipShape[]>(LIP_PHONEMES);
  const [speechSequence, setSpeechSequence] = useState<string[]>(SPEECH_LOOP_SEQUENCE);
  const [currentLipId, setCurrentLipId] = useState<string>('lips-x');
  const [sequenceIndex, setSequenceIndex] = useState<number>(0);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // Speaking occurs only when in 'Talking' animation mode and lip sync is enabled
  const isSpeaking = isLipSyncActive && currentMode === 'Talking';

  const toggleLipSync = () => {
    setIsLipSyncActive((prev) => !prev);
  };

  /**
   * Replaces an existing lip shape's graphic with a newly uploaded or custom graphic.
   * Seamlessly updates the active talking animation in real-time.
   */
  const replaceLipShape = (id: string, newSvgUrl: string, name?: string) => {
    setLipShapes((prev) => {
      const exists = prev.some((l) => l.id === id);
      if (exists) {
        return prev.map((l) => {
          if (l.id === id) {
            return {
              ...l,
              svgUrl: newSvgUrl,
              name: name || l.name,
              isCustom: true,
            };
          }
          return l;
        });
      } else {
        const newLip: LipShape = {
          id,
          name: name || `Lip ${id}`,
          label: name?.slice(0, 4) || 'NEW',
          svgUrl: newSvgUrl,
          isCustom: true,
        };
        return [...prev, newLip];
      }
    });

    // Ensure it's included in speech loop sequence
    setSpeechSequence((prev) => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
  };

  /**
   * Adds a brand new lip shape and adds it into the speaking cycle
   */
  const addNewLipShape = (shape: { name: string; svgUrl: string; label?: string; id?: string }) => {
    const newId = shape.id || `lips-custom-${Date.now()}`;
    const newLip: LipShape = {
      id: newId,
      name: shape.name || 'New Custom Lip',
      label: shape.label || (shape.name ? shape.name.slice(0, 3).toUpperCase() : 'LIP'),
      svgUrl: shape.svgUrl,
      isCustom: true,
    };

    setLipShapes((prev) => [...prev, newLip]);
    setSpeechSequence((prev) => [...prev, newId]);
    return newId;
  };

  /**
   * Remove or reset a specific lip shape
   */
  const removeLipShape = (id: string) => {
    const defaultOne = LIP_PHONEMES.find((l) => l.id === id);
    if (defaultOne) {
      setLipShapes((prev) =>
        prev.map((l) => (l.id === id ? { ...defaultOne, isCustom: false } : l))
      );
    } else {
      setLipShapes((prev) => prev.filter((l) => l.id !== id));
      setSpeechSequence((prev) => prev.filter((item) => item !== id));
    }
  };

  /**
   * Reset all lips back to original SVGs
   */
  const resetToDefaultLips = () => {
    setLipShapes(LIP_PHONEMES);
    setSpeechSequence(SPEECH_LOOP_SEQUENCE);
    setCurrentLipId('lips-x');
  };

  useEffect(() => {
    // When in Idle (or not speaking), mouth remains closed/silent (chup thakbe)
    if (!isSpeaking) {
      setCurrentLipId('lips-x'); // return to neutral resting mouth (lip-x)
      return;
    }

    const intervalTime = speed === 'fast' ? 120 : speed === 'slow' ? 240 : 160;

    const timer = setInterval(() => {
      setSequenceIndex((prev) => {
        const seq = speechSequence.length > 0 ? speechSequence : ['lips-x'];
        const next = (prev + 1) % seq.length;
        setCurrentLipId(seq[next]);
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isSpeaking, speed, speechSequence]);

  const restingLipShape =
    lipShapes.find((l) => l.id === 'lips-x') || lipShapes[0] || LIP_PHONEMES[0];

  const activeLipShape =
    lipShapes.find((l) => l.id === currentLipId) || restingLipShape;

  return (
    <LipSyncContext.Provider
      value={{
        isLipSyncActive,
        setIsLipSyncActive,
        lipShapes,
        activeLipShape,
        restingLipShape,
        currentLipId,
        setCurrentLipId,
        speed,
        setSpeed,
        toggleLipSync,
        currentMode,
        setCurrentMode,
        isSpeaking,
        replaceLipShape,
        addNewLipShape,
        removeLipShape,
        resetToDefaultLips,
        speechSequence,
      }}
    >
      {children}
    </LipSyncContext.Provider>
  );
}

export function useLipSync() {
  const context = useContext(LipSyncContext);
  if (!context) {
    throw new Error('useLipSync must be used within a LipSyncProvider');
  }
  return context;
}
