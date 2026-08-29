import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { User, Material, PurchaseProposal, InventoryTransaction, ActivityLog } from '../types';

// Collection references
const USERS_COL = 'users';
const MATERIALS_COL = 'materials';
const PROPOSALS_COL = 'proposals';
const TRANSACTIONS_COL = 'transactions';
const LOGS_COL = 'activity_logs';

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
        const usersList: User[] = [];
        snapshot.forEach((d) => {
          usersList.push(d.data() as User);
        });
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
    await setDoc(userRef, user, { merge: true });
  } catch (e) {
    console.error('Error saving user to Firebase:', e);
  }
}

export async function deleteUserFromCloud(userId: string) {
  try {
    const userRef = doc(db, USERS_COL, userId);
    await deleteDoc(userRef);
  } catch (e) {
    console.error('Error deleting user from Firebase:', e);
  }
}

export async function seedUsers(users: User[]) {
  try {
    const batch = writeBatch(db);
    users.forEach((u) => {
      const ref = doc(db, USERS_COL, u.id);
      batch.set(ref, u);
    });
    await batch.commit();
  } catch (e) {
    console.error('Error seeding users to Firebase:', e);
  }
}

/**
 * 2. REAL-TIME MATERIALS SYNC
 */
export function subscribeToMaterials(
  onUpdate: (materials: Material[]) => void,
  initialFallback: Material[]
) {
  const materialsRef = collection(db, MATERIALS_COL);
  return onSnapshot(
    materialsRef,
    (snapshot) => {
      if (snapshot.empty) {
        seedMaterials(initialFallback);
        onUpdate(initialFallback);
      } else {
        const list: Material[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Material);
        });
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
    const ref = doc(db, MATERIALS_COL, material.id || material.code);
    await setDoc(ref, material, { merge: true });
  } catch (e) {
    console.error('Error saving material to Firebase:', e);
  }
}

export async function deleteMaterialFromCloud(materialIdOrCode: string) {
  try {
    const ref = doc(db, MATERIALS_COL, materialIdOrCode);
    await deleteDoc(ref);
  } catch (e) {
    console.error('Error deleting material from Firebase:', e);
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
        const ref = doc(db, MATERIALS_COL, m.id || m.code);
        batch.set(ref, m);
      });
      await batch.commit();
    }
  } catch (e) {
    console.error('Error seeding materials:', e);
  }
}

/**
 * 3. REAL-TIME PROPOSALS SYNC
 */
export function subscribeToProposals(
  onUpdate: (proposals: PurchaseProposal[]) => void,
  initialFallback: PurchaseProposal[]
) {
  const proposalsRef = collection(db, PROPOSALS_COL);
  return onSnapshot(
    proposalsRef,
    (snapshot) => {
      if (snapshot.empty) {
        seedProposals(initialFallback);
        onUpdate(initialFallback);
      } else {
        const list: PurchaseProposal[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as PurchaseProposal);
        });
        onUpdate(list);
      }
    },
    (err) => {
      console.error('Firebase proposals sync error:', err);
    }
  );
}

export async function saveProposalToCloud(proposal: PurchaseProposal) {
  try {
    const ref = doc(db, PROPOSALS_COL, proposal.id);
    await setDoc(ref, proposal, { merge: true });
  } catch (e) {
    console.error('Error saving proposal to Firebase:', e);
  }
}

export async function deleteProposalFromCloud(proposalId: string) {
  try {
    const ref = doc(db, PROPOSALS_COL, proposalId);
    await deleteDoc(ref);
  } catch (e) {
    console.error('Error deleting proposal from Firebase:', e);
  }
}

export async function seedProposals(proposals: PurchaseProposal[]) {
  try {
    const batch = writeBatch(db);
    proposals.forEach((p) => {
      const ref = doc(db, PROPOSALS_COL, p.id);
      batch.set(ref, p);
    });
    await batch.commit();
  } catch (e) {
    console.error('Error seeding proposals:', e);
  }
}

/**
 * 4. REAL-TIME TRANSACTIONS SYNC
 */
export function subscribeToTransactions(
  onUpdate: (transactions: InventoryTransaction[]) => void,
  initialFallback: InventoryTransaction[]
) {
  const txRef = collection(db, TRANSACTIONS_COL);
  return onSnapshot(
    txRef,
    (snapshot) => {
      if (snapshot.empty) {
        seedTransactions(initialFallback);
        onUpdate(initialFallback);
      } else {
        const list: InventoryTransaction[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as InventoryTransaction);
        });
        onUpdate(list);
      }
    },
    (err) => {
      console.error('Firebase transactions sync error:', err);
    }
  );
}

export async function saveTransactionToCloud(tx: InventoryTransaction) {
  try {
    const ref = doc(db, TRANSACTIONS_COL, tx.id);
    await setDoc(ref, tx, { merge: true });
  } catch (e) {
    console.error('Error saving transaction to Firebase:', e);
  }
}

export async function deleteTransactionFromCloud(txId: string) {
  try {
    const ref = doc(db, TRANSACTIONS_COL, txId);
    await deleteDoc(ref);
  } catch (e) {
    console.error('Error deleting transaction from Firebase:', e);
  }
}

export async function seedTransactions(transactions: InventoryTransaction[]) {
  try {
    const batch = writeBatch(db);
    transactions.forEach((t) => {
      const ref = doc(db, TRANSACTIONS_COL, t.id);
      batch.set(ref, t);
    });
    await batch.commit();
  } catch (e) {
    console.error('Error seeding transactions:', e);
  }
}

/**
 * 5. REAL-TIME ACTIVITY LOGS SYNC
 */
export function subscribeToLogs(
  onUpdate: (logs: ActivityLog[]) => void,
  initialFallback: ActivityLog[]
) {
  const logsRef = collection(db, LOGS_COL);
  return onSnapshot(
    logsRef,
    (snapshot) => {
      if (snapshot.empty) {
        seedLogs(initialFallback);
        onUpdate(initialFallback);
      } else {
        const list: ActivityLog[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as ActivityLog);
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
    await setDoc(ref, log, { merge: true });
  } catch (e) {
    console.error('Error saving log to Firebase:', e);
  }
}

export async function seedLogs(logs: ActivityLog[]) {
  try {
    const batch = writeBatch(db);
    logs.forEach((l) => {
      const ref = doc(db, LOGS_COL, l.id);
      batch.set(ref, l);
    });
    await batch.commit();
  } catch (e) {
    console.error('Error seeding logs:', e);
  }
}
