// services/database.js
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Build a stable key used to detect duplicates from the same SMS
const buildDedupeKey = (userId, data) => {
  const date = data.date || new Date().toISOString().split('T')[0];
  const amount = Number.parseFloat(data.amount || 0).toFixed(2);
  const type = (data.type || '').toLowerCase();
  const ref = (data.reference || '').toString().trim().toLowerCase();
  const merchant = (data.merchant || '').toString().trim().toLowerCase();
  const tail = (data.accountTail || '').toString().trim();

  return [
    userId,
    date,
    amount,
    type,
    ref || 'noref',
    merchant || 'nomerch',
    tail || 'notail',
  ].join('|');
};

// Add transaction with de‑duplication
export const addTransaction = async (userId, transactionData) => {
  try {
    const dedupeKey = buildDedupeKey(userId, transactionData);

    // 1) Check if a transaction with same dedupeKey already exists
    const checkQ = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('dedupeKey', '==', dedupeKey),
    );
    const existingSnap = await getDocs(checkQ);

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const existingData = { id: existingDoc.id, ...existingDoc.data() };
      console.log('⚠️ Duplicate transaction skipped (dedupeKey match)');
      return existingData;
    }

    // 2) Prepare payload for new document
    const payload = {
      userId,
      amount: parseFloat(transactionData.amount),
      type: transactionData.type,
      category: transactionData.category || 'Other',
      merchant: transactionData.merchant || '',
      description: transactionData.description || '',
      date: transactionData.date || new Date().toISOString().split('T')[0],

      // Extra fields useful for SMS‑parsed data
      currency: transactionData.currency || 'INR',
      bank: transactionData.bank || transactionData.bankHint || 'Unknown',
      accountTail: transactionData.accountTail || null,
      channel: transactionData.channel || null,
      reference: transactionData.reference || null,
      timestamp: transactionData.timestamp || null,

      dedupeKey, // used to detect duplicates next time
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'transactions'), payload);
    console.log('✅ Transaction saved to Firebase!');
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error('❌ Firebase error:', error);
    throw error;
  }
};

// Get transactions for a user, newest first
export const getTransactions = async (userId) => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(q);
    const transactions = [];

    snapshot.forEach((d) => {
      transactions.push({ id: d.id, ...d.data() });
    });

    console.log(`✅ Got ${transactions.length} transactions`);
    return transactions;
  } catch (error) {
    console.error('❌ Firebase error:', error);
    throw error;
  }
};

// Optional: delete a transaction by id
export const deleteTransaction = async (transactionId) => {
  try {
    await deleteDoc(doc(db, 'transactions', transactionId));
    console.log('🗑️ Transaction deleted:', transactionId);
    return true;
  } catch (error) {
    console.error('❌ Delete error:', error);
    throw error;
  }
};
