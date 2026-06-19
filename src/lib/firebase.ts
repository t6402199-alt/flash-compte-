import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { Contact, CampaignLog, PaymentTransaction, SimulatedTransfer } from '../types';

import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// COLLECTIONS DEFINITION
const TRANSFERS_COL = 'transfers';
const CONTACTS_COL = 'contacts';
const CAMPAIGNS_COL = 'campaigns';
const TRANSACTIONS_COL = 'transactions';
const SYSTEM_DOC = 'system/balance';

// ---------------- TRANSFERS ----------------
export async function getTransfersFromDb(): Promise<SimulatedTransfer[]> {
  try {
    const querySnapshot = await getDocs(collection(db, TRANSFERS_COL));
    const items: SimulatedTransfer[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as SimulatedTransfer);
    });
    // Sort by createdAt descending
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error standard loading transfers from Firestore:", error);
    return [];
  }
}

export async function getTransferByIdFromDb(id: string): Promise<SimulatedTransfer | null> {
  try {
    const docRef = doc(db, TRANSFERS_COL, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as SimulatedTransfer;
    }
    return null;
  } catch (error) {
    console.error("Error fetching transfer by ID:", error);
    return null;
  }
}

export async function saveTransferToDb(transfer: SimulatedTransfer): Promise<void> {
  try {
    const { id, ...data } = transfer;
    const docRef = doc(db, TRANSFERS_COL, id);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Error saving transfer to Firestore:", error);
  }
}

export async function deleteTransferFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TRANSFERS_COL, id));
  } catch (error) {
    console.error("Error deleting transfer:", error);
  }
}

export async function getTransfersByEmailFromDb(email: string): Promise<SimulatedTransfer[]> {
  try {
    const q = query(collection(db, TRANSFERS_COL), where("email", "==", email.trim().toLowerCase()));
    const querySnapshot = await getDocs(q);
    const items: SimulatedTransfer[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as SimulatedTransfer);
    });
    return items;
  } catch (error) {
    console.error("Error querying transfers by email:", error);
    return [];
  }
}

export async function findTransferByAnyField(searchStr: string): Promise<SimulatedTransfer | null> {
  if (!searchStr) return null;
  const cleanStr = searchStr.trim();
  
  // 1. Try fetching directly by exact matching ID
  let match = await getTransferByIdFromDb(cleanStr);
  if (match) return match;
  
  // 2. Try fetching by tx- prefix match
  if (!cleanStr.startsWith('tx-')) {
    match = await getTransferByIdFromDb(`tx-${cleanStr}`);
    if (match) return match;
  }

  // 3. Try querying Firestore by codePin
  try {
    const qPin = query(collection(db, TRANSFERS_COL), where("codePin", "==", cleanStr));
    const pinSnapshot = await getDocs(qPin);
    if (!pinSnapshot.empty) {
      const firstDoc = pinSnapshot.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() } as SimulatedTransfer;
    }
  } catch (err) {
    console.warn("Query by PIN non-fatal warning:", err);
  }

  // 4. Try querying Firestore by email
  try {
    const qEmail = query(collection(db, TRANSFERS_COL), where("email", "==", cleanStr.toLowerCase()));
    const emailSnapshot = await getDocs(qEmail);
    if (!emailSnapshot.empty) {
      const firstDoc = emailSnapshot.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() } as SimulatedTransfer;
    }
  } catch (err) {
    console.warn("Query by email non-fatal warning:", err);
  }

  return null;
}

// ---------------- CONTACTS ----------------
export async function getContactsFromDb(): Promise<Contact[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CONTACTS_COL));
    const items: Contact[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as Contact);
    });
    return items;
  } catch (error) {
    console.error("Error standard loading contacts from Firestore:", error);
    return [];
  }
}

export async function saveContactToDb(contact: Contact): Promise<void> {
  try {
    const { id, ...data } = contact;
    const docRef = doc(db, CONTACTS_COL, id);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Error saving contact:", error);
  }
}

export async function deleteContactFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CONTACTS_COL, id));
  } catch (error) {
    console.error("Error deleting contact:", error);
  }
}

// ---------------- CAMPAIGNS ----------------
export async function getCampaignsFromDb(): Promise<CampaignLog[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CAMPAIGNS_COL));
    const items: CampaignLog[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as CampaignLog);
    });
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error loading campaigns:", error);
    return [];
  }
}

export async function saveCampaignToDb(campaign: CampaignLog): Promise<void> {
  try {
    const { id, ...data } = campaign;
    const docRef = doc(db, CAMPAIGNS_COL, id);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Error saving campaign:", error);
  }
}

// ---------------- TRANSACTIONS ----------------
export async function getTransactionsFromDb(): Promise<PaymentTransaction[]> {
  try {
    const querySnapshot = await getDocs(collection(db, TRANSACTIONS_COL));
    const items: PaymentTransaction[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as PaymentTransaction);
    });
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error loading transactions:", error);
    return [];
  }
}

export async function saveTransactionToDb(transaction: PaymentTransaction): Promise<void> {
  try {
    const { id, ...data } = transaction;
    const docRef = doc(db, TRANSACTIONS_COL, id);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Error saving transaction:", error);
  }
}

// ---------------- SYSTEM BALANCE ----------------
export async function getBalanceFromDb(): Promise<number | null> {
  try {
    const docRef = doc(db, SYSTEM_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().balance;
    }
    return null;
  } catch (error) {
    console.error("Error loading balance:", error);
    return null;
  }
}

export async function saveBalanceToDb(balance: number): Promise<void> {
  try {
    const docRef = doc(db, SYSTEM_DOC);
    await setDoc(docRef, { balance }, { merge: true });
  } catch (error) {
    console.error("Error saving balance:", error);
  }
}
