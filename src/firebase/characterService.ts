import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { ref, set, get, remove } from 'firebase/database';
import { db, rtdb } from './config';
import type { SavedCharacter } from '../types';

const LOCAL_STORAGE_KEY = 'firebase_saved_characters_cache_v1';
const FIRESTORE_COLLECTION = 'characters';
const FIRESTORE_LATEST_STATE_DOC = 'latest_character';
const LATEST_STATE_COLLECTION = 'app_state';

/**
 * Load locally cached characters
 */
export function getLocalCachedCharacters(): SavedCharacter[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      }
    }
  } catch (e) {
    console.warn('Error reading local characters cache:', e);
  }
  return [];
}

/**
 * Save characters array to local cache
 */
export function setLocalCachedCharacters(characters: SavedCharacter[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(characters));
  } catch (e) {
    console.warn('Error saving local characters cache:', e);
  }
}

/**
 * Save latest character & uploaded layers state directly to Firestore
 */
export async function saveLatestStateToFirestore(
  character: SavedCharacter
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = JSON.parse(JSON.stringify(character));
    payload.updatedAt = Date.now();

    // 1. Write to app_state/latest_character in Firestore
    const latestDocRef = doc(db, LATEST_STATE_COLLECTION, FIRESTORE_LATEST_STATE_DOC);
    await setDoc(latestDocRef, payload, { merge: true });

    // 2. Also save to characters collection so it is in the character list
    if (character.id) {
      const charDocRef = doc(db, FIRESTORE_COLLECTION, character.id);
      await setDoc(charDocRef, payload, { merge: true });
    }

    // 3. Write to RTDB for high-speed synchronization
    if (rtdb) {
      try {
        const rtdbLatestRef = ref(rtdb, 'app_state/latest_character');
        await set(rtdbLatestRef, payload);
        if (character.id) {
          const rtdbCharRef = ref(rtdb, `characters/${character.id}`);
          await set(rtdbCharRef, payload);
        }
      } catch (rtdbErr) {
        console.warn('RTDB sync warning:', rtdbErr);
      }
    }

    // Update local cache
    const list = getLocalCachedCharacters();
    const idx = list.findIndex((c) => c.id === character.id);
    if (idx >= 0) {
      list[idx] = payload;
    } else {
      list.unshift(payload);
    }
    setLocalCachedCharacters(list);

    return { success: true };
  } catch (err: any) {
    console.warn('saveLatestStateToFirestore error:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch the latest active character state from Firestore
 * (Loads the last update when entering the website)
 */
export async function fetchLatestStateFromFirestore(): Promise<SavedCharacter | null> {
  // 1. Check app_state/latest_character in Firestore
  try {
    const latestDocRef = doc(db, LATEST_STATE_COLLECTION, FIRESTORE_LATEST_STATE_DOC);
    const snap = await getDoc(latestDocRef);
    if (snap.exists()) {
      const data = snap.data() as SavedCharacter;
      if (data && (Object.keys(data.customLayersMap || {}).length > 0 || Object.keys(data.layerTransforms || {}).length > 0 || data.name)) {
        return { ...data, id: data.id || snap.id };
      }
    }
  } catch (err) {
    console.warn('Could not read app_state/latest_character from Firestore:', err);
  }

  // 2. Try fetching the most recently updated character from 'characters'
  try {
    const charsCollection = collection(db, FIRESTORE_COLLECTION);
    const q = query(charsCollection, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const firstDoc = snapshot.docs[0];
      const data = firstDoc.data() as SavedCharacter;
      return { ...data, id: firstDoc.id };
    }
  } catch (err) {
    console.warn('Could not read characters collection from Firestore:', err);
  }

  // 3. Fallback to RTDB
  if (rtdb) {
    try {
      const rtdbLatestRef = ref(rtdb, 'app_state/latest_character');
      const snap = await get(rtdbLatestRef);
      if (snap.exists()) {
        const val = snap.val() as SavedCharacter;
        return val;
      }
    } catch (rtdbErr) {
      console.warn('RTDB fetchLatestState warning:', rtdbErr);
    }
  }

  // 4. Fallback to local cache
  const cached = getLocalCachedCharacters();
  if (cached.length > 0) {
    return cached[0];
  }

  return null;
}

/**
 * Subscribe to the latest active state in Firestore in realtime
 */
export function subscribeToLatestState(
  onUpdate: (latest: SavedCharacter) => void
): () => void {
  try {
    const latestDocRef = doc(db, LATEST_STATE_COLLECTION, FIRESTORE_LATEST_STATE_DOC);
    const unsubscribe = onSnapshot(
      latestDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SavedCharacter;
          if (data) {
            onUpdate({ ...data, id: data.id || docSnap.id });
          }
        }
      },
      (err) => {
        console.warn('subscribeToLatestState realtime warning:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('subscribeToLatestState failed:', err);
    return () => {};
  }
}

/**
 * Save or update a character in Firebase (Firestore + RTDB) with instant local persistence
 */
export async function saveCharacterToFirebase(
  data: Omit<SavedCharacter, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: number;
  }
): Promise<{ character: SavedCharacter; isFirebaseOnline: boolean; error?: string }> {
  const now = Date.now();
  const id = data.id || `char_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = data.createdAt || now;

  const characterToSave: SavedCharacter = {
    id,
    name: data.name?.trim() || 'Untitled Character',
    thumbnailUrl: data.thumbnailUrl || '',
    createdAt,
    updatedAt: now,
    layerTransforms: data.layerTransforms || {},
    customLayersMap: data.customLayersMap || {},
    lockedParts: data.lockedParts || {},
    restingLipShapeId: data.restingLipShapeId || 'lips-x',
  };

  // 1. Immediately update local storage cache so UI responds instantly
  const localList = getLocalCachedCharacters();
  const existingIdx = localList.findIndex((c) => c.id === id);
  let updatedList: SavedCharacter[];
  if (existingIdx >= 0) {
    updatedList = [...localList];
    updatedList[existingIdx] = characterToSave;
  } else {
    updatedList = [characterToSave, ...localList];
  }
  setLocalCachedCharacters(updatedList);

  let isFirebaseOnline = false;
  let saveError: string | undefined;

  // 2. Save to Firestore
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, id);
    // Sanitize undefined fields for Firestore
    const firestorePayload = JSON.parse(JSON.stringify(characterToSave));
    await setDoc(docRef, firestorePayload, { merge: true });
    isFirebaseOnline = true;
  } catch (err: any) {
    console.warn('Firestore save warning (falling back to cache/RTDB):', err);
    saveError = err?.message || 'Firestore not accessible';
  }

  // 3. Also backup to Realtime Database if connected
  if (rtdb) {
    try {
      const rtdbRef = ref(rtdb, `characters/${id}`);
      await set(rtdbRef, JSON.parse(JSON.stringify(characterToSave)));
      isFirebaseOnline = true;
    } catch (rtdbErr) {
      console.warn('Firebase RTDB save warning:', rtdbErr);
    }
  }

  return { character: characterToSave, isFirebaseOnline, error: saveError };
}

/**
 * Fetch all saved characters from Firebase (or fallback to local cache)
 */
export async function fetchCharactersFromFirebase(): Promise<{
  characters: SavedCharacter[];
  fromFirebase: boolean;
}> {
  const localCached = getLocalCachedCharacters();

  try {
    const charsCollection = collection(db, FIRESTORE_COLLECTION);
    const q = query(charsCollection, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const firebaseChars: SavedCharacter[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as SavedCharacter;
        firebaseChars.push({
          ...item,
          id: docSnap.id,
        });
      });

      // Update local cache
      setLocalCachedCharacters(firebaseChars);
      return { characters: firebaseChars, fromFirebase: true };
    }
  } catch (firestoreErr) {
    console.warn('Firestore fetch failed, checking RTDB/cache:', firestoreErr);
  }

  // Try RTDB if Firestore was empty or failed
  if (rtdb) {
    try {
      const rtdbCharsRef = ref(rtdb, 'characters');
      const rtdbSnap = await get(rtdbCharsRef);
      if (rtdbSnap.exists()) {
        const val = rtdbSnap.val();
        const rtdbChars: SavedCharacter[] = Object.values(val);
        rtdbChars.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setLocalCachedCharacters(rtdbChars);
        return { characters: rtdbChars, fromFirebase: true };
      }
    } catch (rtdbErr) {
      console.warn('RTDB fetch failed:', rtdbErr);
    }
  }

  return { characters: localCached, fromFirebase: false };
}

/**
 * Delete a character from Firebase & Local Cache
 */
export async function deleteCharacterFromFirebase(id: string): Promise<boolean> {
  // 1. Remove from local cache
  const localList = getLocalCachedCharacters();
  const filtered = localList.filter((c) => c.id !== id);
  setLocalCachedCharacters(filtered);

  let deletedInCloud = false;

  // 2. Remove from Firestore
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, id);
    await deleteDoc(docRef);
    deletedInCloud = true;
  } catch (err) {
    console.warn('Firestore delete failed:', err);
  }

  // 3. Remove from RTDB
  if (rtdb) {
    try {
      const rtdbRef = ref(rtdb, `characters/${id}`);
      await remove(rtdbRef);
      deletedInCloud = true;
    } catch (err) {
      console.warn('RTDB delete failed:', err);
    }
  }

  return deletedInCloud;
}

/**
 * Subscribe to realtime character changes in Firestore
 */
export function subscribeToCharacters(
  onUpdate: (characters: SavedCharacter[]) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const charsCollection = collection(db, FIRESTORE_COLLECTION);
    const q = query(charsCollection, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: SavedCharacter[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as SavedCharacter), id: docSnap.id });
        });
        if (list.length > 0) {
          setLocalCachedCharacters(list);
          onUpdate(list);
        }
      },
      (err) => {
        console.warn('Firestore realtime subscription error, using cache:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach realtime listener:', err);
    return () => {};
  }
}
