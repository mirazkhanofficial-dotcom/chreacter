import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback, useRef } from 'react';
import type { LayerItem, LayerSubItem, LayerImageData, LayerTransform, SavedCharacter, CharacterModelTheme } from '../types';
import { INITIAL_LAYERS } from '../components/LayerPanel';
import { BUILTIN_PRESETS } from '../data/presetCharacters';
import { readUploadedImage } from '../utils/imageUtils';
import { uploadImageToImgBB } from '../utils/imgbbService';
import { useLipSync } from './LipSyncContext';
import {
  saveCharacterToFirebase,
  fetchCharactersFromFirebase,
  deleteCharacterFromFirebase,
  subscribeToCharacters,
  getLocalCachedCharacters,
  saveLatestStateToFirestore,
  fetchLatestStateFromFirestore,
  subscribeToLatestState,
} from '../firebase/characterService';

export const DEFAULT_LAYER_TRANSFORMS: Record<string, LayerTransform> = {
  head: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  hair: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  eyebrows: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  eyes: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  mouth: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  torso: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  armLeft: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  palmLeft: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  armRight: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  palmRight: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  legLeft: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  shoeLeft: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  legRight: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
  shoeRight: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
};

export const TRANSFORMS_STORAGE_KEY = 'character_layer_transforms_v1';
export const LOCKED_PARTS_STORAGE_KEY = 'character_locked_parts_v1';

export const PART_TO_SUBLAYERS: Record<string, string[]> = {
  head: ['head-main'],
  hair: ['additionals-hair', 'additionals-back-hair'],
  eyebrows: ['eyes-left-eyebrow', 'eyes-right-eyebrow'],
  eyes: ['eyes-left-eyeball', 'eyes-right-eyeball', 'eyes-white', 'eyes-eyelids'],
  mouth: [
    'lips-x', 'lips-a', 'lips-b', 'lips-c', 'lips-d', 'lips-e',
    'lips-ab', 'lips-ac', 'lips-adn', 'lips-ad', 'lips-ae', 'lips-af', 'lips-ax'
  ],
  torso: ['body-torso-2'],
  armLeft: ['hands-left-arm', 'hands-left-forearm'],
  palmLeft: ['palms-left-palm', 'palms-left-palm-closed'],
  armRight: ['hands-right-arm', 'hands-right-forearm'],
  palmRight: ['palms-right-palm', 'palms-r-palm-strong'],
  legLeft: ['legs-left-thigh', 'legs-left-calf'],
  shoeLeft: ['legs-left-shoe'],
  legRight: ['legs-right-thigh', 'legs-right-calf'],
  shoeRight: ['legs-right-shoe'],
};

export const PART_PRIMARY_SUBLAYER: Record<string, string> = {
  head: 'head-main',
  hair: 'additionals-hair',
  eyebrows: 'eyes-left-eyebrow',
  eyes: 'eyes-left-eyeball',
  mouth: 'lips-x',
  torso: 'body-torso-2',
  armLeft: 'hands-left-arm',
  palmLeft: 'palms-left-palm',
  armRight: 'hands-right-arm',
  palmRight: 'palms-right-palm',
  legLeft: 'legs-left-thigh',
  shoeLeft: 'legs-left-shoe',
  legRight: 'legs-right-thigh',
  shoeRight: 'legs-right-shoe',
};

interface CharacterLayersContextType {
  layers: LayerItem[];
  customLayersMap: Record<string, LayerImageData>;
  totalImgbbHosted: number;
  isUploadingAny: boolean;
  uploadStatusMessage: string | null;
  layerTransforms: Record<string, LayerTransform>;
  lockedParts: Record<string, boolean>;
  isLayerLocked: (partKeyOrSubId: string) => boolean;
  togglePartLock: (partKeyOrSubId: string) => void;
  setPartLock: (partKeyOrSubId: string, locked: boolean) => void;
  updateLayerTransform: (layerKey: string, updates: Partial<LayerTransform>) => void;
  resetLayerTransform: (layerKey: string) => void;
  resetAllLayerTransforms: () => void;
  saveLayerTransforms: () => void;
  persistTransformsToFirestore: () => void;
  uploadAndReplaceLayer: (subLayerId: string, file: File, existingMeta?: Partial<LayerImageData>) => Promise<string | null>;
  removeLayerImage: (subLayerId: string) => void;
  removeLayerImageForPart: (partKey: string) => void;
  toggleLayerLock: (subLayerId: string) => void;
  resetAllLayers: () => void;
  // Firebase Character Management
  activeCharacterId: string | null;
  activeCharacterName: string;
  setActiveCharacterName: (name: string) => void;
  activeModelTheme: CharacterModelTheme;
  setActiveModelTheme: (theme: CharacterModelTheme) => void;
  savedCharacters: SavedCharacter[];
  presetCharacters: SavedCharacter[];
  isLoadingCharacters: boolean;
  isSavingToFirebase: boolean;
  saveCurrentCharacter: (customName?: string) => Promise<{ success: boolean; character?: SavedCharacter; message: string }>;
  saveAsNewCharacter: (customName: string) => Promise<{ success: boolean; character?: SavedCharacter; message: string }>;
  loadSavedCharacter: (character: SavedCharacter) => void;
  deleteSavedCharacter: (id: string) => Promise<boolean>;
  startNewCharacter: () => void;
  refreshCharactersList: () => Promise<void>;
}

const CharacterLayersContext = createContext<CharacterLayersContextType | undefined>(undefined);

const STORAGE_KEY = 'character_custom_layers_v1';
const ACTIVE_CHAR_ID_KEY = 'active_character_id_v1';
const ACTIVE_CHAR_NAME_KEY = 'active_character_name_v1';

export function CharacterLayersProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<LayerItem[]>(() => {
    // Attempt local storage hydration
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedMap: Record<string, LayerImageData> = JSON.parse(saved);
        return INITIAL_LAYERS.map((group) => ({
          ...group,
          subLayers: group.subLayers.map((sub) => {
            if (parsedMap[sub.id]) {
              return {
                ...sub,
                image: parsedMap[sub.id],
              };
            }
            return sub;
          }),
        }));
      }
    } catch (e) {
      console.warn('Failed to load layers from storage', e);
    }
    return INITIAL_LAYERS;
  });

  const [isUploadingAny, setIsUploadingAny] = useState(false);
  const [uploadStatusMessage, setUploadStatusMessage] = useState<string | null>(null);

  // Active Character tracking
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_CHAR_ID_KEY) || null;
    } catch {
      return null;
    }
  });

  const [activeCharacterName, setActiveCharacterName] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_CHAR_NAME_KEY) || 'My Character';
    } catch {
      return 'My Character';
    }
  });

  // Active Model Theme ('default' | 'indian_man' | 'indian_woman')
  const [activeModelTheme, setActiveModelThemeState] = useState<CharacterModelTheme>(() => {
    try {
      return (localStorage.getItem('active_model_theme_v1') as CharacterModelTheme) || 'default';
    } catch {
      return 'default';
    }
  });

  const setActiveModelTheme = useCallback((theme: CharacterModelTheme) => {
    setActiveModelThemeState(theme);
    try {
      localStorage.setItem('active_model_theme_v1', theme);
    } catch {}
  }, []);

  // Saved Characters list from Firebase / Cache
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>(() => getLocalCachedCharacters());
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);

  // Layer lock state persisted
  const [lockedParts, setLockedParts] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(LOCKED_PARTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const isLayerLocked = (partKeyOrSubId: string): boolean => {
    if (lockedParts[partKeyOrSubId]) return true;
    const subIds = PART_TO_SUBLAYERS[partKeyOrSubId];
    if (subIds) {
      for (const group of layers) {
        for (const sub of group.subLayers) {
          if (subIds.includes(sub.id) && sub.isLocked) {
            return true;
          }
        }
      }
    }
    for (const group of layers) {
      const found = group.subLayers.find((s) => s.id === partKeyOrSubId);
      if (found && found.isLocked) return true;
    }
    return false;
  };

  const togglePartLock = (partKeyOrSubId: string) => {
    const isCurrentlyLocked = isLayerLocked(partKeyOrSubId);
    const newLockState = !isCurrentlyLocked;
    const relatedSubIds = PART_TO_SUBLAYERS[partKeyOrSubId] || [partKeyOrSubId];

    setLockedParts((prev) => {
      const next = { ...prev, [partKeyOrSubId]: newLockState };
      try {
        localStorage.setItem(LOCKED_PARTS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setLayers((prev) =>
      prev.map((group) => ({
        ...group,
        subLayers: group.subLayers.map((sub) =>
          relatedSubIds.includes(sub.id) ? { ...sub, isLocked: newLockState } : sub
        ),
      }))
    );
  };

  const setPartLock = (partKeyOrSubId: string, locked: boolean) => {
    const relatedSubIds = PART_TO_SUBLAYERS[partKeyOrSubId] || [partKeyOrSubId];
    setLockedParts((prev) => {
      const next = { ...prev, [partKeyOrSubId]: locked };
      try {
        localStorage.setItem(LOCKED_PARTS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setLayers((prev) =>
      prev.map((group) => ({
        ...group,
        subLayers: group.subLayers.map((sub) =>
          relatedSubIds.includes(sub.id) ? { ...sub, isLocked: locked } : sub
        ),
      }))
    );
  };

  // Layer transform state (Position X/Y, Zoom/Scale, Rotation) for customizable character arrangement
  const [layerTransforms, setLayerTransforms] = useState<Record<string, LayerTransform>>(() => {
    try {
      const saved = localStorage.getItem(TRANSFORMS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_LAYER_TRANSFORMS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load layer transforms from storage', e);
    }
    return DEFAULT_LAYER_TRANSFORMS;
  });

  const updateLayerTransform = (layerKey: string, updates: Partial<LayerTransform>) => {
    setLayerTransforms((prev) => {
      const current = prev[layerKey] || DEFAULT_LAYER_TRANSFORMS[layerKey] || { x: 0, y: 0, scale: 1, rotation: 0 };
      const next = {
        ...prev,
        [layerKey]: {
          ...current,
          ...updates,
        },
      };
      try {
        localStorage.setItem(TRANSFORMS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const resetLayerTransform = (layerKey: string) => {
    setLayerTransforms((prev) => {
      const next = {
        ...prev,
        [layerKey]: DEFAULT_LAYER_TRANSFORMS[layerKey] || { x: 0, y: 0, scale: 1, rotation: 0 },
      };
      try {
        localStorage.setItem(TRANSFORMS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const resetAllLayerTransforms = () => {
    setLayerTransforms(DEFAULT_LAYER_TRANSFORMS);
    try {
      localStorage.removeItem(TRANSFORMS_STORAGE_KEY);
    } catch (e) {}
    setUploadStatusMessage('All layer positions reset to default');
    setTimeout(() => setUploadStatusMessage(null), 2500);
  };

  const saveLayerTransforms = () => {
    try {
      localStorage.setItem(TRANSFORMS_STORAGE_KEY, JSON.stringify(layerTransforms));
      setUploadStatusMessage('Character saved! All layer adjustments updated.');
      setTimeout(() => setUploadStatusMessage(null), 3500);
    } catch (e) {}
  };

  const { replaceLipShape, resetDefaultLips } = useLipSync();

  // Keep a reactive map of all custom layers
  const customLayersMap = useMemo(() => {
    const map: Record<string, LayerImageData> = {};
    for (const group of layers) {
      for (const sub of group.subLayers) {
        if (sub.image && (sub.image.isCustom || sub.image.firebaseUrl || sub.image.imgbbUrl)) {
          map[sub.id] = sub.image;
        }
      }
    }
    return map;
  }, [layers]);

  // Persist custom layers map into localStorage
  useEffect(() => {
    try {
      if (Object.keys(customLayersMap).length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customLayersMap));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to persist custom layers', e);
    }
  }, [customLayersMap]);

  // Count how many layers have active cloud URLs
  const totalImgbbHosted = useMemo(() => {
    let count = 0;
    const items = Object.values(customLayersMap) as LayerImageData[];
    for (const item of items) {
      if (item.firebaseUrl || item.imgbbUrl || item.isSavedInFirestore) count++;
    }
    return count;
  }, [customLayersMap]);

  /**
   * Persists current transforms & custom layers directly to Firestore
   */
  const persistTransformsToFirestore = useCallback(() => {
    try {
      localStorage.setItem(TRANSFORMS_STORAGE_KEY, JSON.stringify(layerTransforms));
      saveLatestStateToFirestore({
        id: activeCharacterId || 'current_character',
        name: activeCharacterName || 'My Character',
        thumbnailUrl: '',
        modelTheme: activeModelTheme,
        layerTransforms,
        customLayersMap,
        lockedParts,
        restingLipShapeId: 'lips-x',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).catch((e) => console.warn('Firestore auto-sync error:', e));
    } catch (e) {}
  }, [layerTransforms, customLayersMap, lockedParts, activeCharacterId, activeCharacterName, activeModelTheme]);

  /**
   * Uploads layer directly to Firestore and instantly replaces the character layer live!
   * No reload needed, zero lag, fully persistent in Firestore.
   */
  const uploadAndReplaceLayer = async (subLayerId: string, file: File): Promise<string | null> => {
    setIsUploadingAny(true);
    setUploadStatusMessage(`Saving ${file.name} to Firestore...`);

    try {
      // Find all sibling sublayers in the same part so previous layers are cleanly purged
      let siblingSubIds: string[] = [];
      for (const [_, subs] of Object.entries(PART_TO_SUBLAYERS)) {
        if (subs.includes(subLayerId)) {
          siblingSubIds = subs.filter((s) => s !== subLayerId);
          break;
        }
      }

      // 1. Instant local read & optimize for Firestore (preserves full alpha transparency)
      const localImage = await readUploadedImage(file);
      const finalizedData: LayerImageData = {
        dataUrl: localImage.dataUrl,
        name: file.name,
        width: localImage.width || 300,
        height: localImage.height || 300,
        isCustom: true,
        isSavedInFirestore: true,
      };

      // 2. Apply immediate update across layers: replace target sublayer & clear old sibling sublayers
      setLayers((prevLayers) =>
        prevLayers.map((group) => ({
          ...group,
          subLayers: group.subLayers.map((sub) => {
            if (sub.id === subLayerId) {
              return { ...sub, image: finalizedData };
            }
            if (siblingSubIds.includes(sub.id)) {
              // Completely remove old layer fragments from previous version
              return { ...sub, image: null };
            }
            return sub;
          }),
        }))
      );

      // 3. If it's a lip shape, immediately notify LipSyncContext so talking loops uninterrupted
      if (subLayerId.startsWith('lips-')) {
        replaceLipShape(subLayerId, localImage.dataUrl, file.name);
      }

      // 4. Update custom layers map & persist to localStorage
      const updatedCustomMap: Record<string, LayerImageData> = {
        ...customLayersMap,
        [subLayerId]: finalizedData,
      };
      for (const sib of siblingSubIds) {
        delete updatedCustomMap[sib];
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomMap));
      } catch (e) {}

      // 5. Store directly into Firestore document in background
      await saveLatestStateToFirestore({
        id: activeCharacterId || 'current_character',
        name: activeCharacterName || 'My Character',
        thumbnailUrl: localImage.dataUrl,
        modelTheme: activeModelTheme,
        layerTransforms,
        customLayersMap: updatedCustomMap,
        lockedParts,
        restingLipShapeId: 'lips-x',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      setUploadStatusMessage(`✓ Layer replaced live & saved to Firestore: ${file.name}`);
      setTimeout(() => setUploadStatusMessage(null), 3000);
      return localImage.dataUrl;
    } catch (err: any) {
      console.error('Error in uploadAndReplaceLayer:', err);
      setUploadStatusMessage(`Error: ${err.message || 'Failed to save layer'}`);
      setTimeout(() => setUploadStatusMessage(null), 3000);
      return null;
    } finally {
      setIsUploadingAny(false);
    }
  };

  /**
   * Reset a single sublayer back to default SVG
   */
  const removeLayerImage = (subLayerId: string) => {
    // Find initial default for this sublayer
    let defaultSub: LayerSubItem | undefined;
    for (const group of INITIAL_LAYERS) {
      const found = group.subLayers.find((s) => s.id === subLayerId);
      if (found) {
        defaultSub = found;
        break;
      }
    }

    setLayers((prev) =>
      prev.map((group) => ({
        ...group,
        subLayers: group.subLayers.map((sub) =>
          sub.id === subLayerId
            ? {
                ...sub,
                image: defaultSub?.image ? { ...defaultSub.image, isCustom: false } : null,
              }
            : sub
        ),
      }))
    );

    if (subLayerId.startsWith('lips-')) {
      resetDefaultLips();
    }
  };

  /**
   * Reset a part back to default (removes uploaded custom layer)
   */
  const removeLayerImageForPart = (partKey: string) => {
    const subIds = PART_TO_SUBLAYERS[partKey] || [partKey];
    for (const subId of subIds) {
      removeLayerImage(subId);
    }
    setUploadStatusMessage(`Old custom layer removed for ${partKey}`);
    setTimeout(() => setUploadStatusMessage(null), 2500);
  };

  /**
   * Toggle lock state of a sublayer
   */
  const toggleLayerLock = (subLayerId: string) => {
    setLayers((prev) =>
      prev.map((group) => ({
        ...group,
        subLayers: group.subLayers.map((sub) => {
          if (sub.id === subLayerId) {
            const nextLocked = !sub.isLocked;
            // Also sync to lockedParts if applicable
            for (const [pKey, subs] of Object.entries(PART_TO_SUBLAYERS)) {
              if (subs.includes(subLayerId)) {
                setLockedParts((lPrev) => {
                  const lNext = { ...lPrev, [pKey]: nextLocked };
                  try {
                    localStorage.setItem(LOCKED_PARTS_STORAGE_KEY, JSON.stringify(lNext));
                  } catch (e) {}
                  return lNext;
                });
                break;
              }
            }
            return { ...sub, isLocked: nextLocked };
          }
          return sub;
        }),
      }))
    );
  };

  /**
   * Reset all layers back to initial defaults
   */
  const resetAllLayers = () => {
    setLayers(INITIAL_LAYERS);
    resetDefaultLips();
    setLockedParts({});
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LOCKED_PARTS_STORAGE_KEY);
    } catch (e) {}
  };

  /**
   * Load an existing saved character from Firebase/cache into editor & preview
   */
  const loadSavedCharacter = useCallback((character: SavedCharacter) => {
    setActiveCharacterId(character.id);
    setActiveCharacterName(character.name);
    if (character.modelTheme) {
      setActiveModelTheme(character.modelTheme);
    } else {
      setActiveModelTheme('default');
    }
    try {
      localStorage.setItem(ACTIVE_CHAR_ID_KEY, character.id);
      localStorage.setItem(ACTIVE_CHAR_NAME_KEY, character.name);
    } catch (e) {}

    // Apply layer transforms
    const newTransforms: Record<string, LayerTransform> = {
      ...DEFAULT_LAYER_TRANSFORMS,
      ...(character.layerTransforms || {}),
    };
    setLayerTransforms(newTransforms);
    try {
      localStorage.setItem(TRANSFORMS_STORAGE_KEY, JSON.stringify(newTransforms));
    } catch (e) {}

    // Apply custom layers & locks
    const customMap = character.customLayersMap || {};
    const locked = character.lockedParts || {};
    setLockedParts(locked);
    try {
      localStorage.setItem(LOCKED_PARTS_STORAGE_KEY, JSON.stringify(locked));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customMap));
    } catch (e) {}

    setLayers(
      INITIAL_LAYERS.map((group) => ({
        ...group,
        subLayers: group.subLayers.map((sub) => {
          const customImg = customMap[sub.id];
          const isSubLocked = !!locked[sub.id];
          return {
            ...sub,
            image: customImg ? { ...customImg, isCustom: true } : (sub.image ? { ...sub.image, isCustom: false } : null),
            isLocked: isSubLocked,
          };
        }),
      }))
    );

    // Sync lips if custom phonemes exist
    for (const [subId, imgData] of Object.entries(customMap)) {
      if (subId.startsWith('lips-') && imgData?.dataUrl) {
        replaceLipShape(subId, imgData.dataUrl, imgData.name);
      }
    }

    setUploadStatusMessage(`Loaded character: "${character.name}"`);
    setTimeout(() => setUploadStatusMessage(null), 3500);
  }, [replaceLipShape, setActiveModelTheme]);

  /**
   * Refresh characters list from Firebase
   */
  const refreshCharactersList = useCallback(async () => {
    setIsLoadingCharacters(true);
    try {
      const res = await fetchCharactersFromFirebase();
      setSavedCharacters(res.characters);
    } catch (e) {
      console.warn('Could not refresh character list:', e);
    } finally {
      setIsLoadingCharacters(false);
    }
  }, []);

  const hasLoadedInitialRef = useRef(false);

  // Subscribe to character updates & load last updated character on website entry
  useEffect(() => {
    refreshCharactersList();

    // Auto-load the last updated character state from Firestore ONCE on website entry
    if (!hasLoadedInitialRef.current) {
      hasLoadedInitialRef.current = true;
      const loadLastUpdate = async () => {
        try {
          const latest = await fetchLatestStateFromFirestore();
          if (latest) {
            loadSavedCharacter(latest);
          }
        } catch (e) {
          console.warn('Auto-load last update warning:', e);
        }
      };
      loadLastUpdate();
    }

    const unsubscribeChars = subscribeToCharacters((updatedList) => {
      setSavedCharacters(updatedList);
    });

    return () => {
      if (typeof unsubscribeChars === 'function') unsubscribeChars();
    };
  }, [refreshCharactersList, loadSavedCharacter]);

  /**
   * Save current character to Firebase (Updates active character)
   */
  const saveCurrentCharacter = async (customName?: string): Promise<{ success: boolean; character?: SavedCharacter; message: string }> => {
    setIsSavingToFirebase(true);
    const finalName = customName?.trim() || activeCharacterName || 'My Character';
    // If active character is a preset model, saving branches it into a new custom character
    const targetId = (activeCharacterId && !activeCharacterId.startsWith('preset-'))
      ? activeCharacterId
      : `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const result = await saveCharacterToFirebase({
        id: targetId,
        name: finalName,
        layerTransforms,
        customLayersMap,
        lockedParts,
        restingLipShapeId: 'lips-x',
        modelTheme: activeModelTheme,
      });

      // Also persist to app_state/latest_character in Firestore
      await saveLatestStateToFirestore(result.character);

      setActiveCharacterId(result.character.id);
      setActiveCharacterName(result.character.name);
      try {
        localStorage.setItem(ACTIVE_CHAR_ID_KEY, result.character.id);
        localStorage.setItem(ACTIVE_CHAR_NAME_KEY, result.character.name);
        localStorage.setItem(TRANSFORMS_STORAGE_KEY, JSON.stringify(layerTransforms));
      } catch (e) {}

      // Update state list
      setSavedCharacters((prev) => {
        const idx = prev.findIndex((c) => c.id === result.character.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = result.character;
          return next;
        }
        return [result.character, ...prev];
      });

      const statusMsg = result.isFirebaseOnline
        ? `✓ Character "${finalName}" saved to Firebase & updated!`
        : `✓ Character "${finalName}" saved (synced locally)!`;

      setUploadStatusMessage(statusMsg);
      setTimeout(() => setUploadStatusMessage(null), 4000);
      return { success: true, character: result.character, message: statusMsg };
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to save character';
      setUploadStatusMessage(`Save error: ${errMsg}`);
      setTimeout(() => setUploadStatusMessage(null), 4000);
      return { success: false, message: errMsg };
    } finally {
      setIsSavingToFirebase(false);
    }
  };

  /**
   * Save as New Character to Firebase (Leaves existing character intact)
   */
  const saveAsNewCharacter = async (customName: string): Promise<{ success: boolean; character?: SavedCharacter; message: string }> => {
    setIsSavingToFirebase(true);
    const now = Date.now();
    const newId = `char_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const finalName = customName.trim() || `Character ${savedCharacters.length + 1}`;
    try {
      const result = await saveCharacterToFirebase({
        id: newId,
        name: finalName,
        layerTransforms,
        customLayersMap,
        lockedParts,
        restingLipShapeId: 'lips-x',
        modelTheme: activeModelTheme,
      });

      await saveLatestStateToFirestore(result.character);

      setActiveCharacterId(result.character.id);
      setActiveCharacterName(result.character.name);
      try {
        localStorage.setItem(ACTIVE_CHAR_ID_KEY, result.character.id);
        localStorage.setItem(ACTIVE_CHAR_NAME_KEY, result.character.name);
        localStorage.setItem(TRANSFORMS_STORAGE_KEY, JSON.stringify(layerTransforms));
      } catch (e) {}

      setSavedCharacters((prev) => [result.character, ...prev.filter((c) => c.id !== result.character.id)]);

      const statusMsg = `✓ Saved as new character "${finalName}"!`;
      setUploadStatusMessage(statusMsg);
      setTimeout(() => setUploadStatusMessage(null), 4000);
      return { success: true, character: result.character, message: statusMsg };
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to save character';
      setUploadStatusMessage(`Save error: ${errMsg}`);
      setTimeout(() => setUploadStatusMessage(null), 4000);
      return { success: false, message: errMsg };
    } finally {
      setIsSavingToFirebase(false);
    }
  };

  /**
   * Delete a saved character from Firebase & cache
   */
  const deleteSavedCharacter = async (id: string): Promise<boolean> => {
    try {
      await deleteCharacterFromFirebase(id);
      setSavedCharacters((prev) => prev.filter((c) => c.id !== id));
      if (activeCharacterId === id) {
        setActiveCharacterId(null);
        setActiveCharacterName('New Character');
        try {
          localStorage.removeItem(ACTIVE_CHAR_ID_KEY);
        } catch (e) {}
      }
      setUploadStatusMessage('Character deleted from Firebase');
      setTimeout(() => setUploadStatusMessage(null), 2500);
      return true;
    } catch (e) {
      console.warn('Error deleting character:', e);
      return false;
    }
  };

  /**
   * Start a brand new fresh character
   */
  const startNewCharacter = () => {
    setActiveCharacterId(null);
    setActiveCharacterName('New Character');
    try {
      localStorage.removeItem(ACTIVE_CHAR_ID_KEY);
      localStorage.setItem(ACTIVE_CHAR_NAME_KEY, 'New Character');
    } catch (e) {}
    resetAllLayerTransforms();
    resetAllLayers();
    setUploadStatusMessage('Started new character. Modify layers and save to Firebase anytime.');
    setTimeout(() => setUploadStatusMessage(null), 3500);
  };

  return (
    <CharacterLayersContext.Provider
      value={{
        layers,
        customLayersMap,
        totalImgbbHosted,
        isUploadingAny,
        uploadStatusMessage,
        layerTransforms,
        lockedParts,
        isLayerLocked,
        togglePartLock,
        setPartLock,
        updateLayerTransform,
        resetLayerTransform,
        resetAllLayerTransforms,
        saveLayerTransforms,
        persistTransformsToFirestore,
        uploadAndReplaceLayer,
        removeLayerImage,
        removeLayerImageForPart,
        toggleLayerLock,
        resetAllLayers,
        // Firebase Character Management
        activeCharacterId,
        activeCharacterName,
        setActiveCharacterName,
        activeModelTheme,
        setActiveModelTheme,
        savedCharacters,
        presetCharacters: BUILTIN_PRESETS,
        isLoadingCharacters,
        isSavingToFirebase,
        saveCurrentCharacter,
        saveAsNewCharacter,
        loadSavedCharacter,
        deleteSavedCharacter,
        startNewCharacter,
        refreshCharactersList,
      }}
    >
      {children}
    </CharacterLayersContext.Provider>
  );
}

export function useCharacterLayers() {
  const context = useContext(CharacterLayersContext);
  if (!context) {
    throw new Error('useCharacterLayers must be used within a CharacterLayersProvider');
  }
  return context;
}
