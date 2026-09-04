import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocsFromServer,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { User, Material, PurchaseProposal, InventoryTransaction, ActivityLog } from '../types';
import { normalizeProposalNumber, isProposalMatch } from '../utils/inventoryEngine';

// Collection references
const USERS_COL = 'users';
const MATERIALS_COL = 'materials';
const PROPOSALS_COL = 'proposals';
const TRANSACTIONS_COL = 'transactions';
const LOGS_COL = 'activity_logs';
const SETTINGS_COL = 'system_settings';
export const DELETED_PROPOSALS_COL = 'deleted_proposals';
export const DELETED_TRANSACTIONS_COL = 'deleted_transactions';

// Local storage key for persistent tombstones across tabs/sessions
const LOCAL_DELETED_PROPOSALS_KEY = 'smart_deleted_proposal_numbers_v2';
const LOCAL_DELETED_TX_KEY = 'smart_deleted_tx_codes_v1';

// Shared module-scoped set of deleted proposal keys from Cloud Firestore
let globalCloudDeletedProposalKeys = new Set<string>();

export function getLocalDeletedProposals(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_PROPOSALS_KEY);
    if (!raw) return new Set<string>();
    const list = JSON.parse(raw);
    return new Set<string>(Array.isArray(list) ? list.map((s: string) => s.toLowerCase().trim()) : []);
  } catch {
    return new Set<string>();
  }
}

export function saveLocalDeletedProposal(target: string) {
  try {
    const current = getLocalDeletedProposals();
    const clean = target.toLowerCase().trim();
    const norm = normalizeProposalNumber(clean);
    if (clean) current.add(clean);
    if (norm) current.add(norm.toLowerCase().trim());
    localStorage.setItem(LOCAL_DELETED_PROPOSALS_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

export function clearLocalDeletedProposals() {
  try {
    localStorage.removeItem(LOCAL_DELETED_PROPOSALS_KEY);
    localStorage.removeItem(LOCAL_DELETED_TX_KEY);
  } catch {}
}

function getLocalDeletedTransactions(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_TX_KEY);
    if (!raw) return new Set<string>();
    const list = JSON.parse(raw);
    return new Set<string>(Array.isArray(list) ? list.map((s: string) => s.toLowerCase().trim()) : []);
  } catch {
    return new Set<string>();
  }
}

function saveLocalDeletedTransaction(codeOrId: string) {
  try {
    const current = getLocalDeletedTransactions();
    const clean = codeOrId.toLowerCase().trim();
    if (clean) current.add(clean);
    localStorage.setItem(LOCAL_DELETED_TX_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

// BroadcastChannel for instant cross-tab communication on the same browser
const SYNC_CHANNEL_NAME = 'smart_inventory_cross_tab_sync';
let syncBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    syncBroadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch (err) {
    console.warn('[firebaseSync] BroadcastChannel not supported:', err);
  }
}

/**
 * Broadcast an immediate notification to other tabs on this browser
 */
export function broadcastLocalChange(type: 'MATERIALS' | 'TRANSACTIONS' | 'PROPOSALS' | 'USERS' | 'SETTINGS' | 'REFRESH') {
  try {
    if (syncBroadcastChannel) {
      syncBroadcastChannel.postMessage({ type, timestamp: Date.now() });
    }
  } catch {}
}

/**
 * Subscribe to cross-tab broadcast notifications
 */
export function subscribeToBroadcast(callback: (type: string) => void): () => void {
  if (!syncBroadcastChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type) {
      callback(event.data.type);
    }
  };
  syncBroadcastChannel.addEventListener('message', handler);
  return () => {
    syncBroadcastChannel?.removeEventListener('message', handler);
  };
}

/**
 * Utility to recursively remove undefined properties before saving to Firestore.
 * Prevents "Function setDoc() called with invalid data. Unsupported field value: undefined" errors.
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Helper to build a safe, deterministic Firestore doc ID
 */
export function sanitizeDocId(key: string): string {
  return encodeURIComponent(key.trim().toUpperCase().replace(/[\/\s#?&]/g, '_'));
}

/**
 * 1. REAL-TIME USERS SYNC
 */
export function subscribeToUsers(
  onUpdate: (users: User[]) => void,
  initialFallback: User[]
) {
  const usersRef = collection(db, USERS_COL);
  return onSnapshot(
    usersRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Seed initial users if empty
        seedUsers(initialFallback);
        onUpdate(initialFallback);
      } else {
        const usersMap = new Map<string, User>();
        snapshot.forEach((d) => {
          const u = d.data() as User;
          if (!u.id) u.id = d.id;
          const key = (u.email || u.id).trim().toLowerCase();
          usersMap.set(key, u);
        });
        const usersList = Array.from(usersMap.values());
        usersList.sort((a, b) => (a.stt || 0) - (b.stt || 0));
        onUpdate(usersList);
      }
    },
    (err) => {
      console.error('Firebase users sync error, using local fallback:', err);
    }
  );
}

export async function saveUserToCloud(user: User) {
  try {
    const userRef = doc(db, USERS_COL, user.id);
    await setDoc(userRef, cleanForFirestore(user), { merge: true });
    broadcastLocalChange('USERS');
  } catch (e) {
    console.error('Error saving user to Firebase:', e);
  }
}

export async function deleteUserFromCloud(userId: string) {
  try {
    const userRef = doc(db, USERS_COL, userId);
    await deleteDoc(userRef);
    broadcastLocalChange('USERS');
  } catch (e) {
    console.error('Error deleting user from Firebase:', e);
  }
}

export async function seedUsers(users: User[]) {
  try {
    const batch = writeBatch(db);
    users.forEach((u) => {
      const ref = doc(db, USERS_COL, u.id);
      batch.set(ref, cleanForFirestore(u), { merge: true });
    });
    await batch.commit();
    broadcastLocalChange('USERS');
  } catch (e) {
    console.error('Error seeding users to Firebase:', e);
  }
}

/**
 * 2. REAL-TIME MATERIALS SYNC WITH AUTOMATIC DEDUPLICATION
 */
export function subscribeToMaterials(
  onUpdate: (materials: Material[]) => void,
  initialFallback?: Material[]
) {
  const materialsRef = collection(db, MATERIALS_COL);
  return onSnapshot(
    materialsRef,
    (snapshot) => {
      if (snapshot.empty) {
        if (initialFallback && initialFallback.length > 0) {
          seedMaterials(initialFallback);
          onUpdate(initialFallback);
        } else {
          onUpdate([]);
        }
      } else {
        // Deduplicate materials by code to ensure identical inventory across all devices
        const mapByCode = new Map<string, Material>();
        snapshot.forEach((d) => {
          const m = d.data() as Material;
          if (!m.id) m.id = d.id;
          const code = (m.code || '').trim().toUpperCase();
          if (!code) return;

          if (!mapByCode.has(code)) {
            mapByCode.set(code, m);
          } else {
            // Keep the more complete record (prefer non-zero initialStock or longer name)
            const existing = mapByCode.get(code)!;
            const existingStock = existing.initialStock || 0;
            const newStock = m.initialStock || 0;
            if (newStock > existingStock || (newStock === existingStock && (m.name?.length || 0) > (existing.name?.length || 0))) {
              mapByCode.set(code, { ...existing, ...m });
            }
          }
        });
        const list = Array.from(mapByCode.values());
        onUpdate(list);
      }
    },
    (err) => {
      console.error('Firebase materials sync error:', err);
    }
  );
}

export async function saveMaterialToCloud(material: Material) {
  try {
    const codeKey = (material.code || '').trim().toUpperCase();
    const docId = material.id || (codeKey ? `mat_${sanitizeDocId(codeKey)}` : `mat_${Date.now()}`);
    const ref = doc(db, MATERIALS_COL, docId);
    await setDoc(ref, cleanForFirestore(material), { merge: true });
    broadcastLocalChange('MATERIALS');
  } catch (e) {
    console.error('Error saving material to Firebase:', e);
  }
}

export async function deleteMaterialFromCloud(materialIdOrCode: string) {
  try {
    const target = (materialIdOrCode || '').trim().toLowerCase();
    if (!target) return;

    // Delete direct doc if ID is known
    try {
      const ref = doc(db, MATERIALS_COL, materialIdOrCode);
      await deleteDoc(ref);
    } catch {}

    // Also delete any doc whose code matches
    const snap = await getDocs(collection(db, MATERIALS_COL));
    const batch = writeBatch(db);
    let found = false;
    snap.forEach((d) => {
      const data = d.data();
      const dId = (d.id || '').trim().toLowerCase();
      const code = (data.code || '').trim().toLowerCase();
      if (dId === target || code === target) {
        batch.delete(d.ref);
        found = true;
      }
    });
    if (found) {
      await batch.commit();
    }
    broadcastLocalChange('MATERIALS');
  } catch (e) {
    console.error('Error deleting material from Firebase:', e);
  }
}

export async function clearMaterialsFromCloud() {
  try {
    const snap = await getDocs(collection(db, MATERIALS_COL));
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    broadcastLocalChange('MATERIALS');
  } catch (e) {
    console.error('Error clearing materials from Firebase:', e);
  }
}

export async function seedMaterials(materials: Material[]) {
  try {
    const chunks: Material[][] = [];
    for (let i = 0; i < materials.length; i += 400) {
      chunks.push(materials.slice(i, i + 400));
    }
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((m) => {
        const codeKey = (m.code || '').trim().toUpperCase();
        const docId = m.id || (codeKey ? `mat_${sanitizeDocId(codeKey)}` : `mat_${Date.now()}`);
        const ref = doc(db, MATERIALS_COL, docId);
        batch.set(ref, cleanForFirestore(m), { merge: true });
      });
      await batch.commit();
    }
    broadcastLocalChange('MATERIALS');
  } catch (e) {
    console.error('Error seeding materials:', e);
  }
}

/**
 * 3. REAL-TIME PROPOSALS SYNC WITH AUTOMATIC MERGING & PERMANENT TOMBSTONES
 */
export function subscribeToProposals(
  onUpdate: (proposals: PurchaseProposal[]) => void,
  initialFallback?: PurchaseProposal[]
) {
  const proposalsRef = collection(db, PROPOSALS_COL);
  const deletedRef = collection(db, DELETED_PROPOSALS_COL);

  // Subscribe to tombstones so deletions on ANY device immediately drop from ALL devices
  onSnapshot(
    deletedRef,
    (delSnap) => {
      globalCloudDeletedProposalKeys = new Set<string>();
      delSnap.forEach((d) => {
        const data = d.data();
        const norm = (data.normKey || d.id || '').trim().toLowerCase();
        const propNum = (data.proposalNumber || '').trim().toLowerCase();
        if (norm) globalCloudDeletedProposalKeys.add(norm);
        if (propNum) {
          globalCloudDeletedProposalKeys.add(propNum);
          const pNorm = normalizeProposalNumber(propNum);
          if (pNorm) globalCloudDeletedProposalKeys.add(pNorm.toLowerCase());
        }
      });
    },
    (err) => console.warn('deleted_proposals sync warning:', err)
  );

  return onSnapshot(
    proposalsRef,
    (snapshot) => {
      if (snapshot.empty) {
        const localDeleted = getLocalDeletedProposals();
        if (initialFallback && initialFallback.length > 0) {
          const validInitial = initialFallback.filter((p) => {
            const norm = (normalizeProposalNumber(p.proposalNumber) || p.id).toLowerCase();
            const raw = (p.proposalNumber || '').toLowerCase().trim();
            return (
              !globalCloudDeletedProposalKeys.has(norm) &&
              !globalCloudDeletedProposalKeys.has(raw) &&
              !localDeleted.has(norm) &&
              !localDeleted.has(raw)
            );
          });
          if (validInitial.length > 0) {
            seedProposals(validInitial);
            onUpdate(validInitial);
            return;
          }
        }
        onUpdate([]);
        return;
      }

      const localDeleted = getLocalDeletedProposals();
      const proposalsMap = new Map<string, PurchaseProposal>();

      snapshot.forEach((d) => {
        const data = d.data() as PurchaseProposal;
        if (!data.id) data.id = d.id;
        const normKey = normalizeProposalNumber(data.proposalNumber) || data.id;
        const normKeyLower = normKey.toLowerCase().trim();
        const rawNumLower = (data.proposalNumber || '').toLowerCase().trim();
        const docIdLower = (d.id || '').toLowerCase().trim();

        // Check if this proposal has been permanently deleted
        const isDeleted =
          globalCloudDeletedProposalKeys.has(normKeyLower) ||
          globalCloudDeletedProposalKeys.has(rawNumLower) ||
          globalCloudDeletedProposalKeys.has(docIdLower) ||
          localDeleted.has(normKeyLower) ||
          localDeleted.has(rawNumLower) ||
          localDeleted.has(docIdLower);

        if (isDeleted) {
          return; // Strictly discard deleted proposals
        }

        if (!proposalsMap.has(normKey)) {
          proposalsMap.set(normKey, data);
        } else {
          // Merge items from any duplicate document to ensure full line-item integrity
          const existing = proposalsMap.get(normKey)!;
          const mergedItemsMap = new Map<string, any>();
          (existing.items || []).forEach((it) => {
            const itCode = (it.materialCode || '').trim().toUpperCase();
            mergedItemsMap.set(itCode, it);
          });
          (data.items || []).forEach((it) => {
            const itCode = (it.materialCode || '').trim().toUpperCase();
            if (!mergedItemsMap.has(itCode) || (it.requestedQuantity || 0) > (mergedItemsMap.get(itCode).requestedQuantity || 0)) {
              mergedItemsMap.set(itCode, it);
            }
          });

          proposalsMap.set(normKey, {
            ...existing,
            ...data,
            title: data.title || existing.title,
            date: data.date || existing.date,
            department: data.department || existing.department,
            notes: data.notes || existing.notes,
            items: Array.from(mergedItemsMap.values()),
          });
        }
      });

      const list = Array.from(proposalsMap.values());
      list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      onUpdate(list);
    },
    (err) => {
      console.error('Firebase proposals sync error:', err);
    }
  );
}

export async function saveProposalToCloud(proposal: PurchaseProposal) {
  try {
    const normKey = normalizeProposalNumber(proposal.proposalNumber);
    const docId = proposal.id || (normKey ? `prop_${sanitizeDocId(normKey)}` : `prop_${Date.now()}`);
    const ref = doc(db, PROPOSALS_COL, docId);
    await setDoc(ref, cleanForFirestore(proposal), { merge: true });

    // If previously marked deleted, unmark it when re-created
    if (normKey) {
      try {
        await deleteDoc(doc(db, DELETED_PROPOSALS_COL, normKey.toLowerCase()));
      } catch {}
    }

    broadcastLocalChange('PROPOSALS');
  } catch (e) {
    console.error('Error saving proposal to Firebase:', e);
  }
}

export async function deleteProposalFromCloud(proposalIdOrNumber: string) {
  try {
    const target = (proposalIdOrNumber || '').trim();
    if (!target) return;
    const targetLower = target.toLowerCase();
    const normKey = normalizeProposalNumber(target);

    // 1. Record permanent tombstone locally & on Cloud Firestore
    saveLocalDeletedProposal(target);
    if (normKey) {
      saveLocalDeletedProposal(normKey);
      try {
        await setDoc(doc(db, DELETED_PROPOSALS_COL, normKey.toLowerCase()), {
          normKey: normKey.toLowerCase(),
          proposalNumber: target,
          id: proposalIdOrNumber,
          deletedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not save cloud tombstone:', err);
      }
    }

    // 2. Delete directly by ID
    try {
      const ref = doc(db, PROPOSALS_COL, proposalIdOrNumber);
      await deleteDoc(ref);
    } catch {}

    // 3. Delete any matching proposal document in Firestore
    const snap = await getDocs(collection(db, PROPOSALS_COL));
    const batch = writeBatch(db);
    let found = false;
    snap.forEach((d) => {
      const data = d.data();
      const docId = (d.id || '').trim().toLowerCase();
      const dId = (data.id || '').trim().toLowerCase();
      const propNum = (data.proposalNumber || '').trim().toLowerCase();
      const dNorm = normalizeProposalNumber(data.proposalNumber || '');
      if (
        docId === targetLower ||
        dId === targetLower ||
        propNum === targetLower ||
        isProposalMatch(propNum, targetLower) ||
        (normKey && dNorm && dNorm.toLowerCase() === normKey.toLowerCase())
      ) {
        batch.delete(d.ref);
        found = true;
      }
    });
    if (found) {
      await batch.commit();
    }

    // 4. Also automatically remove any linked transactions referencing this deleted proposal
    try {
      const txSnap = await getDocs(collection(db, TRANSACTIONS_COL));
      const txBatch = writeBatch(db);
      let txFound = false;
      txSnap.forEach((d) => {
        const txData = d.data();
        const txProp = (txData.proposalNumber || '').trim();
        if (
          txProp &&
          (isProposalMatch(txProp, target) ||
            (normKey && normalizeProposalNumber(txProp) === normKey))
        ) {
          txBatch.delete(d.ref);
          txFound = true;
        }
      });
      if (txFound) {
        await txBatch.commit();
      }
    } catch (txErr) {
      console.warn('Could not cleanup linked transactions on cloud:', txErr);
    }

    broadcastLocalChange('PROPOSALS');
    broadcastLocalChange('TRANSACTIONS');
  } catch (e) {
    console.error('Error deleting proposal from Firebase:', e);
  }
}

export async function clearProposalsFromCloud() {
  try {
    const snap = await getDocs(collection(db, PROPOSALS_COL));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    broadcastLocalChange('PROPOSALS');
  } catch (e) {
    console.error('Error clearing proposals from Firebase:', e);
  }
}

export async function seedProposals(proposals: PurchaseProposal[]) {
  try {
    const batch = writeBatch(db);
    proposals.forEach((p) => {
      const normKey = normalizeProposalNumber(p.proposalNumber);
      const docId = p.id || (normKey ? `prop_${sanitizeDocId(normKey)}` : `prop_${Date.now()}`);
      const ref = doc(db, PROPOSALS_COL, docId);
      batch.set(ref, cleanForFirestore(p), { merge: true });
    });
    await batch.commit();
    broadcastLocalChange('PROPOSALS');
  } catch (e) {
    console.error('Error seeding proposals:', e);
  }
}

/**
 * 4. REAL-TIME TRANSACTIONS SYNC WITH DEDUPLICATION & TOMBSTONES
 */
export function subscribeToTransactions(
  onUpdate: (transactions: InventoryTransaction[]) => void,
  initialFallback?: InventoryTransaction[]
) {
  const txRef = collection(db, TRANSACTIONS_COL);
  const delTxRef = collection(db, DELETED_TRANSACTIONS_COL);

  let cloudDeletedTxCodes = new Set<string>();
  onSnapshot(
    delTxRef,
    (snap) => {
      cloudDeletedTxCodes = new Set<string>();
      snap.forEach((d) => {
        const data = d.data();
        const code = (data.code || d.id || '').trim().toLowerCase();
        if (code) cloudDeletedTxCodes.add(code);
      });
    },
    (err) => console.warn('deleted_transactions sync warning:', err)
  );

  return onSnapshot(
    txRef,
    (snapshot) => {
      // NEVER auto-reseed on empty
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }
      const localDelTx = getLocalDeletedTransactions();
      const localDelProps = getLocalDeletedProposals();
      const txMap = new Map<string, InventoryTransaction>();
      snapshot.forEach((d) => {
        const data = d.data() as InventoryTransaction;
        if (!data.id) data.id = d.id;
        const codeKey = (data.code || data.id).trim().toUpperCase();
        const codeLower = codeKey.toLowerCase();
        const docIdLower = (d.id || '').toLowerCase().trim();

        if (cloudDeletedTxCodes.has(codeLower) || cloudDeletedTxCodes.has(docIdLower) || localDelTx.has(codeLower) || localDelTx.has(docIdLower)) {
          return; // Discard deleted transactions
        }

        // Check if transaction references a deleted proposal
        if (data.proposalNumber && data.proposalNumber.trim()) {
          const propRaw = data.proposalNumber.trim().toLowerCase();
          const propNorm = normalizeProposalNumber(propRaw);
          if (
            localDelProps.has(propRaw) ||
            (propNorm && localDelProps.has(propNorm.toLowerCase())) ||
            globalCloudDeletedProposalKeys.has(propRaw) ||
            (propNorm && globalCloudDeletedProposalKeys.has(propNorm.toLowerCase()))
          ) {
            return; // Discard transactions referencing deleted proposals
          }
        }

        if (!txMap.has(codeKey)) {
          txMap.set(codeKey, data);
        } else {
          const existing = txMap.get(codeKey)!;
          const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          const newTime = new Date(data.updatedAt || data.createdAt || 0).getTime();
          if (newTime >= existingTime) {
            txMap.set(codeKey, { ...existing, ...data });
          }
        }
      });
      const list = Array.from(txMap.values());
      list.sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
      onUpdate(list);
    },
    (err) => {
      console.error('Firebase transactions sync error:', err);
    }
  );
}

export async function saveTransactionToCloud(tx: InventoryTransaction) {
  try {
    const codeKey = (tx.code || '').trim().toUpperCase();
    const docId = tx.id || (codeKey ? `tx_${sanitizeDocId(codeKey)}` : `tx_${Date.now()}`);
    const ref = doc(db, TRANSACTIONS_COL, docId);
    await setDoc(ref, cleanForFirestore(tx), { merge: true });
    broadcastLocalChange('TRANSACTIONS');
  } catch (e) {
    console.error('Error saving transaction to Firebase:', e);
  }
}

export async function deleteTransactionFromCloud(txIdOrCode: string) {
  try {
    const target = (txIdOrCode || '').trim();
    if (!target) return;
    const targetLower = target.toLowerCase();

    // 1. Record permanent tombstone locally & on Cloud Firestore
    saveLocalDeletedTransaction(targetLower);
    try {
      await setDoc(doc(db, DELETED_TRANSACTIONS_COL, targetLower), {
        code: targetLower,
        deletedAt: new Date().toISOString(),
      });
    } catch {}

    // 2. Delete directly by ID
    try {
      const ref = doc(db, TRANSACTIONS_COL, txIdOrCode);
      await deleteDoc(ref);
    } catch {}

    // 3. Delete across all matching docs
    const snap = await getDocs(collection(db, TRANSACTIONS_COL));
    const batch = writeBatch(db);
    let found = false;
    snap.forEach((d) => {
      const data = d.data();
      const docId = (d.id || '').trim().toLowerCase();
      const dId = (data.id || '').trim().toLowerCase();
      const code = (data.code || '').trim().toLowerCase();
      if (docId === targetLower || dId === targetLower || code === targetLower) {
        batch.delete(d.ref);
        found = true;
      }
    });
    if (found) {
      await batch.commit();
    }
    broadcastLocalChange('TRANSACTIONS');
  } catch (e) {
    console.error('Error deleting transaction from Firebase:', e);
  }
}

export async function clearTransactionsFromCloud() {
  try {
    const snap = await getDocs(collection(db, TRANSACTIONS_COL));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    broadcastLocalChange('TRANSACTIONS');
  } catch (e) {
    console.error('Error clearing transactions from Firebase:', e);
  }
}

export async function seedTransactions(transactions: InventoryTransaction[]) {
  try {
    const batch = writeBatch(db);
    transactions.forEach((t) => {
      const codeKey = (t.code || '').trim().toUpperCase();
      const docId = t.id || (codeKey ? `tx_${sanitizeDocId(codeKey)}` : `tx_${Date.now()}`);
      const ref = doc(db, TRANSACTIONS_COL, docId);
      batch.set(ref, cleanForFirestore(t), { merge: true });
    });
    await batch.commit();
    broadcastLocalChange('TRANSACTIONS');
  } catch (e) {
    console.error('Error seeding transactions:', e);
  }
}

/**
 * 5. REAL-TIME ACTIVITY LOGS SYNC
 * Limited to latest 150 items to keep network payload lightweight on mobile devices
 */
export function subscribeToLogs(
  onUpdate: (logs: ActivityLog[]) => void,
  initialFallback?: ActivityLog[]
) {
  const logsRef = collection(db, LOGS_COL);
  const q = query(logsRef, orderBy('timestamp', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        if (initialFallback && initialFallback.length > 0) {
          seedLogs(initialFallback);
          onUpdate(initialFallback);
        } else {
          onUpdate([]);
        }
      } else {
        const list: ActivityLog[] = [];
        snapshot.forEach((d) => {
          const l = d.data() as ActivityLog;
          if (!l.id) l.id = d.id;
          list.push(l);
        });
        onUpdate(list);
      }
    },
    (err) => {
      console.error('Firebase logs sync error:', err);
    }
  );
}

export async function saveLogToCloud(log: ActivityLog) {
  try {
    const ref = doc(db, LOGS_COL, log.id);
    await setDoc(ref, cleanForFirestore(log), { merge: true });
  } catch (e) {
    console.error('Error saving log to Firebase:', e);
  }
}

export async function deleteLogFromCloud(logId: string) {
  try {
    const ref = doc(db, LOGS_COL, logId);
    await deleteDoc(ref);
  } catch (e) {
    console.error('Error deleting log from Firebase:', e);
  }
}

export async function clearLogsFromCloud() {
  try {
    const snap = await getDocs(collection(db, LOGS_COL));
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (e) {
    console.error('Error clearing logs from Firebase:', e);
  }
}

export async function seedLogs(logs: ActivityLog[]) {
  try {
    const batch = writeBatch(db);
    logs.slice(0, 150).forEach((l) => {
      const ref = doc(db, LOGS_COL, l.id);
      batch.set(ref, cleanForFirestore(l), { merge: true });
    });
    await batch.commit();
  } catch (e) {
    console.error('Error seeding logs:', e);
  }
}

/**
 * 6. REAL-TIME SYSTEM SETTINGS SYNC (Company, Department, Units, Circular, Logo, Theme)
 * Ensures brand settings and custom units sync across all browsers and devices instantly
 */
export interface SystemSettingsConfig {
  companyName?: string;
  departmentName?: string;
  circularStandard?: string;
  customUnits?: string[];
  customLogo?: string | null;
  themeConfig?: any;
  updatedAt?: string;
  updatedBy?: string;
}

const SETTINGS_DOC_ID = 'general_config';

export function subscribeToSystemSettings(
  onUpdate: (settings: SystemSettingsConfig) => void
) {
  const settingsRef = doc(db, SETTINGS_COL, SETTINGS_DOC_ID);
  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SystemSettingsConfig;
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('Firebase system settings sync error:', err);
    }
  );
}

export async function saveSystemSettingsToCloud(settings: Partial<SystemSettingsConfig>) {
  try {
    const settingsRef = doc(db, SETTINGS_COL, SETTINGS_DOC_ID);
    await setDoc(
      settingsRef,
      cleanForFirestore({
        ...settings,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
    broadcastLocalChange('SETTINGS');
  } catch (e) {
    console.error('Error saving system settings to Firebase:', e);
  }
}

/**
 * 7. FORCE REFRESH ALL COLLECTIONS DIRECTLY FROM CLOUD SERVER
 * Used by manual refresh button and visibility-change / online triggers
 */
export async function refreshAllFromCloud(): Promise<{
  users: User[];
  materials: Material[];
  proposals: PurchaseProposal[];
  transactions: InventoryTransaction[];
  settings?: SystemSettingsConfig;
}> {
  const [usersSnap, matsSnap, propsSnap, txsSnap, setSnap, delPropsSnap, delTxsSnap] = await Promise.all([
    getDocsFromServer(collection(db, USERS_COL)),
    getDocsFromServer(collection(db, MATERIALS_COL)),
    getDocsFromServer(collection(db, PROPOSALS_COL)),
    getDocsFromServer(collection(db, TRANSACTIONS_COL)),
    getDocs(collection(db, SETTINGS_COL)).catch(() => null),
    getDocs(collection(db, DELETED_PROPOSALS_COL)).catch(() => null),
    getDocs(collection(db, DELETED_TRANSACTIONS_COL)).catch(() => null),
  ]);

  // Load deleted tombstones
  const deletedPropsSet = getLocalDeletedProposals();
  if (delPropsSnap) {
    delPropsSnap.forEach((d) => {
      const data = d.data();
      const norm = (data.normKey || d.id || '').trim().toLowerCase();
      const propNum = (data.proposalNumber || '').trim().toLowerCase();
      if (norm) deletedPropsSet.add(norm);
      if (propNum) deletedPropsSet.add(propNum);
    });
  }

  const deletedTxSet = getLocalDeletedTransactions();
  if (delTxsSnap) {
    delTxsSnap.forEach((d) => {
      const code = (d.data().code || d.id || '').trim().toLowerCase();
      if (code) deletedTxSet.add(code);
    });
  }

  // Process users
  const usersMap = new Map<string, User>();
  usersSnap.forEach((d) => {
    const u = d.data() as User;
    if (!u.id) u.id = d.id;
    usersMap.set((u.email || u.id).trim().toLowerCase(), u);
  });
  const users = Array.from(usersMap.values()).sort((a, b) => (a.stt || 0) - (b.stt || 0));

  // Process materials (deduplicated)
  const matsMap = new Map<string, Material>();
  matsSnap.forEach((d) => {
    const m = d.data() as Material;
    if (!m.id) m.id = d.id;
    const code = (m.code || '').trim().toUpperCase();
    if (!code) return;
    if (!matsMap.has(code) || (m.initialStock || 0) > (matsMap.get(code)!.initialStock || 0)) {
      matsMap.set(code, m);
    }
  });
  const materials = Array.from(matsMap.values());

  // Process proposals (deduplicated & filtering out tombstones)
  const propsMap = new Map<string, PurchaseProposal>();
  propsSnap.forEach((d) => {
    const p = d.data() as PurchaseProposal;
    if (!p.id) p.id = d.id;
    const norm = normalizeProposalNumber(p.proposalNumber) || p.id;
    const normLower = norm.toLowerCase().trim();
    const rawLower = (p.proposalNumber || '').toLowerCase().trim();
    const docIdLower = (d.id || '').toLowerCase().trim();

    if (deletedPropsSet.has(normLower) || deletedPropsSet.has(rawLower) || deletedPropsSet.has(docIdLower)) {
      return; // Skip deleted proposals
    }

    if (!propsMap.has(norm)) {
      propsMap.set(norm, p);
    }
  });
  const proposals = Array.from(propsMap.values()).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  // Process transactions (deduplicated & filtering out tombstones)
  const txMap = new Map<string, InventoryTransaction>();
  txsSnap.forEach((d) => {
    const tx = d.data() as InventoryTransaction;
    if (!tx.id) tx.id = d.id;
    const code = (tx.code || tx.id).trim().toUpperCase();
    const codeLower = code.toLowerCase();
    const docIdLower = (d.id || '').toLowerCase().trim();

    if (deletedTxSet.has(codeLower) || deletedTxSet.has(docIdLower)) {
      return; // Skip deleted transactions
    }

    if (!txMap.has(code)) {
      txMap.set(code, tx);
    }
  });
  const transactions = Array.from(txMap.values()).sort(
    (a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()
  );

  let settings: SystemSettingsConfig | undefined;
  if (setSnap && !setSnap.empty) {
    const docData = setSnap.docs.find((d) => d.id === SETTINGS_DOC_ID)?.data();
    if (docData) settings = docData as SystemSettingsConfig;
  }

  return { users, materials, proposals, transactions, settings };
}
