// services/smsService.js - Enhanced SMS Reading and Parsing

import SmsAndroid from 'react-native-get-sms-android';
import { PermissionsAndroid, Platform } from 'react-native';
import { addTransaction } from './database';
import { getDeviceId } from './auth';
import SmsListener from 'react-native-android-sms-listener';
import { reloadFromFirebase } from '../data/TransactionContext';


/* ---------------- Runtime permissions ---------------- */

export const requestSMSPermission = async () => {
  if (Platform.OS !== 'android') return false;

  try {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);
    const readGranted =
      results[PermissionsAndroid.PERMISSIONS.READ_SMS] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const receiveGranted =
      results[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] ===
      PermissionsAndroid.RESULTS.GRANTED;

    return readGranted && receiveGranted;
  } catch (err) {
    console.error('SMS permission error:', err);
    return false;
  }
};

/* ---------------- Bank Sender Filtering ---------------- */

const BANK_SENDER_PATTERNS = [
  /HDFCBK/i,
  /HDFC/i,
  /SBIINB/i,
  /SBICRD/i,
  /ATMSBI/i,
  /SBI/i,
  /ICICIB/i,
  /ICICI/i,
  /AXISBK/i,
  /AXIS/i,
  /KOTAKB/i,
  /KOTAK/i,
  /PNBSMS/i,
  /PNB/i,
  /BOIIND/i,
  /BOI/i,
  /CANBNK/i,
  /CANARA/i,
  /UNIONB/i,
  /UNION/i,
  /IDFCFB/i,
  /IDFC/i,
  /YESBK/i,
  /YESBNK/i,
  /INDUSB/i,
  /INDUS/i,
  /PAYTM/i,
  /PHONEPE/i,
  /GPAY/i,
  /AMZN/i,
  /AMAZON/i,
  /JUSPAY/i,
  /RAZORPAY/i,
];

export const isBankSms = address => {
  if (!address) return false;
  return BANK_SENDER_PATTERNS.some(pattern => pattern.test(address));
};

/* ---------------- Enhanced Regex Patterns ---------------- */

const patterns = {
  debitIntent:
    /\b(debited|spent|withdrawn|purchase(?:d)?|paid|pos|upi pay|imps|neft|ecs|autodebit|sent|payment|charged|transferred to)\b(?!\s*card)/i,
  creditIntent:
    /\b(credited|received|deposit(?:ed)?|refund(?:ed)?|cashback|reversed|transferred from|salary|bonus|interest)\b/i,

  // intent‑anchored amount patterns
  amountAfterDebited:
    /\bdebited\s+(?:by\s*)?(?:inr|rs\.?|rupees|₹)?\s*[:\-]?\s*([0-9]{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i,
  amountAfterCredited:
    /\bcredited\s+(?:with\s+)?(?:by\s*)?(?:inr|rs\.?|rupees|₹)?\s*[:\-]?\s*([0-9]{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i,
  amountGeneric:
    /(?:inr|rs\.?|rupees|₹)\s*[:\-]?\s*([0-9]{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i,
  amountAlt:
    /([0-9]{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:debited|credited|has been)/i,

  // More flexible account tail (handles "AC X4693", "Acc XX0325", "Acct XX325")
  accountTail:
    /(?:a\/c|ac(?:ct?|count)?)\s+X+(\d{3,6})\b/i,

  upiId: /\b([a-z0-9.\-_]+@[a-z0-9]+)\b/i,

  merchantAfterAt: /\bat\s+([A-Z0-9&][A-Za-z0-9 &\-.]{2,40})\b/i,
  merchantAfterToFrom:
    /\b(?:to|from)\s+([A-Z0-9&][A-Za-z0-9 &\-.]{2,40})\b/i,
  merchantVPA: /VPA\s+([a-zA-Z0-9@.\-]+)/i,

  // Person name patterns (for credited/from scenarios)
  personNameCredited: /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3})\s+credited\b/i,
  personNameFrom: /\bfrom\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3})\.\s*UPI/i,

  // ENHANCED date patterns to catch multiple formats, including trailing punctuation
  // Matches: 02Dec25, 21-Jun-24, 07-12-25, 15-10-2025, "15 October 2024", etc.
  date:
    /\b((?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(?:\d{1,2}[-\/]?\w{3}[-\/]?\d{2,4})|(?:\d{1,2}\s+\w{3,9}\s+\d{2,4}))(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?\b[^\dA-Za-z]?/i,

  availableBal:
    /\b(?:avl|avail|available)\s*(?:bal|balance)\s*[:\-]?\s*(?:inr|rs\.?)?\s*([0-9]{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\b/i,

  reference:
    /\b(?:ref(?:erence)?(?:\s*no\.?)?|rrn|auth(?:[ \-]?code)?)\s*[:\-]?\s*([A-Z0-9\-]{6,})\b/i,

  channelPos:
    /\b(?:pos|atm|ecom|ecspay|upi|imps|neft|netbanking|bbps|rtgs)\b/i,

  bankHint:
    /\b(hdfc|icici|sbi|axis|kotak|idfc|boi|bob|pnb|yes bank|canara|union|indusind|federal)\b/i,
};

/* ---------------- Category Detection ---------------- */

const CATEGORY_PATTERNS = {
  food: /zomato|swiggy|domino|pizza|mcdonald|kfc|burger|cafe|restaurant|food|eat|dining|starbucks|dunkin/i,
  shopping:
    /amazon|flipkart|myntra|ajio|nykaa|shoppers|mall|mart|store|retail|meesho|snapdeal/i,
  transport:
    /uber|ola|rapido|metro|irctc|railway|petrol|fuel|parking|makemytrip|redbus|yatra/i,
  utilities:
    /jio|airtel|vi|vodafone|bsnl|electricity|water|gas|bill|recharge|broadband|tata power|bescom/i,
  entertainment:
    /netflix|prime|hotstar|spotify|bookmyshow|movie|game|zee5|sonyliv|gaana/i,
  healthcare:
    /pharmacy|medical|hospital|doctor|medicine|apollo|1mg|netmeds|pharmeasy|practo/i,
  education:
    /school|college|course|udemy|coursera|byju|unacademy|vedantu|upgrad/i,
  finance:
    /emi|loan|insurance|mutual fund|investment|interest|lic|sip|ppf/i,
  transfer: /transfer|neft|imps|rtgs|upi/i,
  groceries:
    /bigbasket|grofers|blinkit|zepto|instamart|dmart|more|spencers/i,
  subscription: /subscription|renewal|monthly|annual|premium/i,
};

const categorizeTransaction = (merchant, body) => {
  const combined = `${merchant || ''} ${body || ''}`.toLowerCase();
  for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(combined)) return category;
  }
  return 'other';
};

/* ---------------- Helper Functions ---------------- */

const normalizeAmount = s => {
  if (!s) return null;
  const n = s.replace(/,/g, '');
  const f = parseFloat(n);
  return Number.isFinite(f) && f > 0 && f < 10000000 ? f : null;
};

const cleanMerchantName = merchant => {
  if (!merchant) return null;
  return merchant
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s&\-\.@]/g, '')
    .substring(0, 50);
};

// Enhanced helper to parse Indian date formats
function parseIndianDate(dateStr) {
  if (!dateStr) return null;

  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  // Format 1: "02Dec25" (DDMmmYY - no separators)
  let match = dateStr.match(/^(\d{1,2})([A-Za-z]{3})(\d{2,4})$/i);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2].toLowerCase();
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    const month = monthMap[monthStr];
    if (month !== undefined) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        console.log('📅 Parsed date (DDMmmYY):', dateStr, '→', d);
        return d;
      }
    }
  }

  // Format 2: "21-Jun-24" or "21/Jun/24" (DD-Mmm-YY with separators)
  match = dateStr.match(/^(\d{1,2})[-\/]([A-Za-z]{3})[-\/](\d{2,4})$/i);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2].toLowerCase();
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    const month = monthMap[monthStr];
    if (month !== undefined) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        console.log('📅 Parsed date (DD-Mmm-YY):', dateStr, '→', d);
        return d;
      }
    }
  }

  // Format 3: "07-12-25" or "15-10-2025" (DD-MM-YY or DD-MM-YYYY)
  match = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
  if (match) {
    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      console.log('📅 Parsed date (DD-MM-YY):', dateStr, '→', d);
      return d;
    }
  }

  // Format 4: "15 October 2024" (DD Month YYYY with spaces)
  match = dateStr.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{2,4})$/i);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2].toLowerCase().substring(0, 3); // first 3 chars
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    const month = monthMap[monthStr];
    if (month !== undefined) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        console.log('📅 Parsed date (DD Month YYYY):', dateStr, '→', d);
        return d;
      }
    }
  }

  // Fallback: try native Date parsing (may be unreliable)
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    console.log('📅 Parsed date (fallback):', dateStr, '→', d);
    return d;
  }

  console.warn('⚠️ Could not parse date:', dateStr);
  return null;
}

/* ---------------- Main Parser ---------------- */

export const parseTransactionSMS = (message, senderAddress = null) => {
  if (!message || typeof message !== 'string') {
    const now = new Date();
    return {
      type: null,
      amount: null,
      merchant: null,
      date: now,
      timestamp: now,
      category: 'other',
      accountTail: null,
      balance: null,
      reference: null,
      channel: null,
      bankHint: null,
      currency: 'INR',
      raw: message || '',
    };
  }

  // Strip common forwarding prefixes
  let body = message.trim();
  body = body.replace(/^(FWD:|Forwarded message:|From\s+\+?\d+:)\s*/i, '');

  // 1. Determine type (content-driven)
  let type = null;
  if (patterns.creditIntent.test(body)) type = 'credit';
  if (patterns.debitIntent.test(body))
    type = type === 'credit' ? 'credit' : 'debit';

  // 2. Proximity window around intent for amount
  let proximityWindow = body;
  const intentMatch =
    body.match(patterns.debitIntent) || body.match(patterns.creditIntent);
  if (intentMatch) {
    const idx = intentMatch.index || 0;
    const start = Math.max(0, idx - 60);
    const end = Math.min(body.length, idx + 120);
    proximityWindow = body.slice(start, end);
  }

  // 3. Amount extraction
  let amount = null;
  if (type === 'debit') {
    amount =
      normalizeAmount(
        (proximityWindow.match(patterns.amountAfterDebited) || [])[1],
      ) ||
      normalizeAmount(
        (proximityWindow.match(patterns.amountGeneric) || [])[1],
      ) ||
      normalizeAmount((body.match(patterns.amountAlt) || [])[1]) ||
      normalizeAmount((body.match(patterns.amountGeneric) || [])[1]) ||
      null;
  } else if (type === 'credit') {
    amount =
      normalizeAmount(
        (proximityWindow.match(patterns.amountAfterCredited) || [])[1],
      ) ||
      normalizeAmount(
        (proximityWindow.match(patterns.amountGeneric) || [])[1],
      ) ||
      normalizeAmount((body.match(patterns.amountAlt) || [])[1]) ||
      normalizeAmount((body.match(patterns.amountGeneric) || [])[1]) ||
      null;
  } else {
    amount =
      normalizeAmount(
        (proximityWindow.match(patterns.amountGeneric) || [])[1],
      ) ||
      normalizeAmount((body.match(patterns.amountAlt) || [])[1]) ||
      null;
  }

  // 4. Bank hint (content ONLY, ignore sender)
  let bankHint = (body.match(patterns.bankHint) || [])[1]?.toUpperCase() || null;

  // 5. Account tail
  const accountTail = (body.match(patterns.accountTail) || [])[1] || null;

  // 6. Date parsing (Indian formats: 02Dec25, 21-Jun-24, 07-12-25, etc.)
  const dateStr = (body.match(patterns.date) || [])[1] || null;
  let parsedDate = null;

  if (dateStr) {
    console.log('📩 Raw dateStr from SMS:', JSON.stringify(dateStr));

    // Strip trailing punctuation like ".", ";", ":" etc. after the date
    const cleanedDateStr = dateStr.replace(/[^\dA-Za-z\/\- ]+$/g, '');
    console.log('📩 Cleaned dateStr:', JSON.stringify(cleanedDateStr));

    parsedDate = parseIndianDate(cleanedDateStr);
  }

  // 7. Merchant extraction (content-driven priority: UPI ID > person name > generic)
  let merchant = null;

  // Try full UPI ID first (most reliable)
  const upiMatch = body.match(patterns.upiId);
  if (upiMatch) {
    merchant = upiMatch[1]; // full UPI like "paytmqr5zr0nq@ptys"
  }

  // If no UPI, try person name patterns for credits/debits
  if (!merchant) {
    const personCredited = body.match(patterns.personNameCredited);
    const personFrom = body.match(patterns.personNameFrom);
    merchant = personCredited?.[1] || personFrom?.[1] || null;
  }

  // Fallback to old patterns (at/to/VPA)
  if (!merchant) {
    merchant =
      (body.match(patterns.merchantAfterAt) || [])[1] ||
      (body.match(patterns.merchantAfterToFrom) || [])[1] ||
      (body.match(patterns.merchantVPA) || [])[1] ||
      null;
  }

  merchant = cleanMerchantName(merchant);

  // 8. Other fields
  const balanceRaw = (body.match(patterns.availableBal) || [])[1] || null;
  const balance = normalizeAmount(balanceRaw);
  const reference = (body.match(patterns.reference) || [])[1] || null;
  const channel = (body.match(patterns.channelPos) || [])[0]?.toLowerCase() || null;
  const category = categorizeTransaction(merchant, body);

  const now = new Date();
  const finalDate = parsedDate || now;

  return {
    type,
    amount,
    merchant: merchant || 'Unknown',
    date: finalDate,
    timestamp: finalDate, // will be overridden by SMS metadata in fetchAndParseRecentSMS
    category,
    accountTail,
    balance,
    reference,
    channel,
    bankHint,
    currency: 'INR',
    raw: body,
  };
};

/* ---------------- Inbox Keywords ---------------- */

const bankKeywords = [
  'debited',
  'credited',
  'avl bal',
  'available bal',
  'imps',
  'neft',
  'upi',
  'a/c',
  'ac ',
  'account',
  'card',
  'pos',
  'atm',
  'transaction',
  'transferred',
  'paid',
  'received',
  'purchase',
  'withdrawn',
  'refund',
  'cashback',
];

const otpKeywords = ['otp', 'one time password', 'verification code', 'cvv', 'pin'];

/* ---------------- Fetch and Parse SMS ---------------- */

export const fetchAndParseRecentSMS = async (userId, daysBack = 90) => {
  const hasPermission = await requestSMSPermission();
  if (!hasPermission) {
    return { success: false, message: 'SMS permission denied', transactions: [] };
  }

  const minDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;

  const filter = {
    box: 'inbox',
    maxCount: 500,
    minDate: minDate,
  };

  return new Promise((resolve, reject) => {
    SmsAndroid.list(
      JSON.stringify(filter),
      fail => reject({ success: false, message: fail, transactions: [] }),
      (count, smsList) => {
        try {
          const messages = JSON.parse(smsList);
          const transactions = [];

          messages.forEach(sms => {
            const text = (sms.body || '').toLowerCase();
            const address = sms.address || '';

            const isBankish =
              bankKeywords.some(k => text.includes(k)) || isBankSms(address);
            const isOtp = otpKeywords.some(k => text.includes(k));

            if (isBankish && !isOtp) {
              const parsed = parseTransactionSMS(sms.body, address);

              if (parsed.type && parsed.amount) {
                const smsTime = new Date(parseInt(sms.date, 10)); // SMS receive time
                const tsIso = smsTime.toISOString();

                // Use parsed.date (from body) if valid, otherwise fall back to SMS time
                const transactionDate =
                  parsed.date &&
                  !isNaN(parsed.date.getTime())
                  ? parsed.date
                  : smsTime;

                transactions.push({
                  ...parsed,
                  id: `sms_${sms.date}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                  userId,
                  timestamp: tsIso,          // SMS receive time (for sorting)
                  date: transactionDate,     // Transaction date from body (02Dec25, 21-Jun-24, etc.)
                  description: sms.body.substring(0, 140),
                  sender: address,
                });
              }
            }
          });

          transactions.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
          );

          console.log(
            `✅ Parsed ${transactions.length} transactions from ${count} SMS`,
          );
          resolve({ success: true, transactions, totalSmsScanned: count });
        } catch (error) {
          console.error('Error parsing SMS list:', error);
          reject({ success: false, message: String(error), transactions: [] });
        }
      },
    );
  });
};

/* ---------------- Firestore Integration ---------------- */

const toFirestoreShape = async (parsed, userId) => {
  if (!parsed.amount || !parsed.type) return null;

  const deviceId = await getDeviceId();  // Get device ID for this transaction

  const tsIso =
    parsed.timestamp instanceof Date
      ? parsed.timestamp.toISOString()
      : parsed.timestamp || new Date().toISOString();

  let dateStr;
if (parsed.date instanceof Date) {
  const d = parsed.date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  dateStr = `${year}-${month}-${day}`;
} else {
  dateStr = parsed.date || tsIso.split('T')[0];
}


  return {
    userId,
    deviceId,        // track which device this came from
    amount: parsed.amount,
    type: parsed.type,
    category: parsed.category || 'other',
    merchant: parsed.merchant || 'Unknown',
    description: parsed.description || parsed.raw?.slice(0, 140) || '',
    date: dateStr,
    timestamp: tsIso,
    currency: parsed.currency || 'INR',
    bank: parsed.bankHint || 'Unknown',
    accountTail: parsed.accountTail || null,
    channel: parsed.channel || null,
    reference: parsed.reference || null,
  };
};

export const saveParsedTransactions = async (userId, parsedList = []) => {
  const results = { saved: 0, failed: 0, errors: [], duplicates: 0 };

  for (const p of parsedList) {
    const shaped = await toFirestoreShape(p, userId);  // await because it's now async
    if (!shaped) {
      results.failed += 1;
      results.errors.push({ reason: 'invalid-shape', parsed: p });
      continue;
    }
    try {
      await addTransaction(userId, shaped);
      results.saved += 1;
    } catch (e) {
      if (
        String(e).includes('duplicate') ||
        String(e).includes('already exists')
      ) {
        results.duplicates += 1;
      } else {
        results.failed += 1;
        results.errors.push({ reason: 'firestore-error', error: String(e) });
      }
    }
  }

  return results;
};

export const scanInboxAndSave = async (userId, daysBack = 90) => {
  try {
    const res = await fetchAndParseRecentSMS(userId, daysBack);
    if (!res.success) return res;

    const summary = await saveParsedTransactions(userId, res.transactions);
    return {
      success: true,
      scanned: res.totalSmsScanned,
      parsed: res.transactions.length,
      saved: summary.saved,
      failed: summary.failed,
      duplicates: summary.duplicates,
      errors: summary.errors,
    };
  } catch (error) {
    return { success: false, message: String(error) };
  }
};

      /* ---------------- Real-time Listener ---------------- */

let smsListenerActive = false;
let smsSubscription = null;

export const startRealtimeSmsIngestion = async userId => {
  // Only Android supports this
  if (Platform.OS !== 'android') {
    console.warn('Real-time SMS ingestion is only available on Android');
    return { started: false, reason: 'not-android' };
  }

  // Ensure we have SMS permissions first
  const hasPermission = await requestSMSPermission();
  if (!hasPermission) {
    console.warn('SMS permission denied, cannot start realtime ingestion');
    return { started: false, reason: 'permission-denied' };
  }

  // Avoid double listeners
  if (smsListenerActive && smsSubscription) {
    return { started: true, reason: 'already-started' };
  }

  try {
    smsSubscription = SmsListener.addListener(async message => {
  try {
    const body = message.body || '';
    const address = message.originatingAddress || message.address || '';

    // 1) Parse SMS
    const parsed = parseTransactionSMS(body, address);
    if (!parsed.type || !parsed.amount) {
      // Not a transaction (OTP / spam / promo)
      return;
    }

    // 2) Attach timestamp + meta
    const smsTime = message.timestamp ? new Date(message.timestamp) : new Date();
    const enriched = {
      ...parsed,
      timestamp: smsTime,
      description: body.substring(0, 140),
      sender: address,
    };

    // 3) Build Firestore shape
    const shaped = await toFirestoreShape(enriched, userId);
    if (!shaped) return;

    // 4) Save to Firestore
    const saved = await addTransaction(userId, shaped);
    console.log('✅ Realtime SMS transaction saved', {
      amount: saved.amount,
      type: saved.type,
      date: saved.date,
    });

    // 5) Refresh context from Firebase
    reloadFromFirebase();
  } catch (err) {
    console.error('❌ Error handling realtime SMS:', err);
  }
});


    smsListenerActive = true;
    console.log('📡 Real-time SMS ingestion started');
    return { started: true };
  } catch (error) {
    console.error('Failed to start realtime SMS listener:', error);
    smsListenerActive = false;
    smsSubscription = null;
    return { started: false, reason: String(error) };
  }
};

export const stopRealtimeSmsIngestion = () => {
  if (smsSubscription) {
    smsSubscription.remove();
    smsSubscription = null;
  }
  smsListenerActive = false;
  console.log('⏹ Real-time SMS ingestion stopped');
  return { stopped: true };
};

export const isRealtimeListenerActive = () => smsListenerActive;


/* ---------------- Utility Exports ---------------- */

export {
  BANK_SENDER_PATTERNS,
  CATEGORY_PATTERNS,
  bankKeywords,
  otpKeywords,
};
