// data/TransactionContext.js

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestSMSPermission,
  fetchAndParseRecentSMS,
  scanInboxAndSave,
  startRealtimeSmsIngestion,
  stopRealtimeSmsIngestion,
  isRealtimeListenerActive,
} from '../services/smsService';
import { getTransactions } from '../services/database';
import { auth } from '../config/firebase';
import authService from '../services/auth';  // <-- Changed: default import

const TransactionContext = createContext();

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
};

export const TransactionProvider = ({ children }) => {
  // State
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState('firebase');
  const [smsPermissionGranted, setSmsPermissionGranted] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStats, setSyncStats] = useState(null);
  const [error, setError] = useState(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  // Get current user ID
  const getUserId = () => {
    return auth.currentUser?.uid || 'anonymous';
  };

  /* ---------------- Permission Check ---------------- */

  const checkSmsPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setSmsPermissionGranted(false);
      return false;
    }
    try {
      const granted = await requestSMSPermission();
      setSmsPermissionGranted(granted);
      return granted;
    } catch (err) {
      console.error('Permission check failed:', err);
      setSmsPermissionGranted(false);
      return false;
    }
  }, []);

  /* ---------------- Load from Different Sources ---------------- */

  const loadFromSms = useCallback(async () => {
    try {
      const hasPermission = await checkSmsPermission();
      if (!hasPermission) {
        console.log('SMS permission not granted');
        setError('SMS permission required');
        return [];
      }

      const userId = getUserId();
      const result = await fetchAndParseRecentSMS(userId, 90);

      if (!result.success) {
        console.log('SMS fetch failed:', result.message);
        setError(result.message);
        return [];
      }

      if (result.transactions.length === 0) {
        console.log('No transactions found in SMS');
        return [];
      }

      // Cache locally
      await AsyncStorage.setItem(
        'cachedtransactions',
        JSON.stringify(result.transactions),
      );
      const nowIso = new Date().toISOString();
      await AsyncStorage.setItem('lastsynctime', nowIso);
      setLastSyncTime(nowIso);

      return result.transactions;
    } catch (err) {
      console.error('Error loading from SMS:', err);
      setError(String(err));
      return [];
    }
  }, [checkSmsPermission]);

  const loadFromFirebase = useCallback(async () => {
  try {
    const userId = getUserId();
    if (userId === 'anonymous') {
      console.log('User not logged in, cannot load from Firebase');
      return [];
    }

    const firebaseTransactions = await getTransactions(userId);
    return firebaseTransactions;
  } catch (err) {
    console.error('Error loading from Firebase:', err);
    setError(String(err));
    return [];
  }
}, []);

// After loadFromFirebase is defined, but NOT inside it
const reloadFromFirebase = useCallback(async () => {
  try {
    const fresh = await loadFromFirebase();
    if (fresh) {
      setTransactions(fresh);
    }
  } catch (err) {
    console.error('Error reloading from Firebase after realtime save:', err);
  }
}, [loadFromFirebase]);


  const loadCachedTransactions = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem('cachedtransactions');
      const syncTime = await AsyncStorage.getItem('lastsynctime');
      if (cached) {
        setLastSyncTime(syncTime);
        return JSON.parse(cached);
      }
      return null;
    } catch (err) {
      console.error('Error loading cache:', err);
      return null;
    }
  }, []);

  /* ---------------- Main Load Function ---------------- */

  const loadTransactions = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);

      try {
        let loadedTransactions = [];

        switch (dataSource) {
          case 'sms':
            if (!forceRefresh) {
              const cached = await loadCachedTransactions();
              if (cached && cached.length > 0) {
                setTransactions(cached);
                setLoading(false);
                // Refresh in background
                loadFromSms().then(fresh => {
                  if (fresh && fresh.length > 0) {
                    setTransactions(fresh);
                  }
                });
                return;
              }
            }
            loadedTransactions = await loadFromSms();
            break;

          case 'firebase':
            loadedTransactions = await loadFromFirebase();
            break;

          default:
            loadedTransactions = [];
            break;
        }

        setTransactions(loadedTransactions);
      } catch (err) {
        console.error('Error in loadTransactions:', err);
        setError(String(err));
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    },
    [dataSource, loadFromSms, loadFromFirebase, loadCachedTransactions],
  );

  /* ---------------- Scan and Save to Firebase ---------------- */

  const syncSmsToFirebase = async () => {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        console.log('User not authenticated, attempting to sign in...');
        const authenticated = await authService.ensureAuthenticated();
        if (!authenticated) {
          return { success: false, message: 'User not logged in' };
        }
      }

      const userId = authService.getUserId();
      if (!userId) {
        return { success: false, message: 'Could not get user ID' };
      }

      console.log('Starting SMS sync for user:', userId);
      setRefreshing(true);

      const res = await scanInboxAndSave(userId, 90);

      if (!res.success) {
        return { success: false, message: res.message }; // Sync failed
      }

      setSyncStats({
        scanned: res.scanned,
        parsed: res.parsed,
        saved: res.saved,
        failed: res.failed,
        duplicates: res.duplicates,
      });

      // Reload from Firebase after saving
      const fresh = await loadFromFirebase();
      setTransactions(fresh);

      const nowIso = new Date().toISOString();
      await AsyncStorage.setItem('lastsynctime', nowIso);
      setLastSyncTime(nowIso);

      return { success: true, ...res };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, message: error.message };
    } finally {
      setRefreshing(false);
    }
  };

  /* ---------------- Realtime SMS Listener ---------------- */

  const enableRealtimeSync = async () => {
    try {
      const userId = getUserId();
      if (userId === 'anonymous') {
        setError('Please login to enable realtime sync');
        return false;
      }

      const result = await startRealtimeSmsIngestion(userId);
      if (result.started) {
        setRealtimeEnabled(true);
        await AsyncStorage.setItem('realtimeenabled', 'true');
        return true;
      } else {
        setError(result.reason || 'Failed to start realtime sync');
        return false;
      }
    } catch (err) {
      console.error('Error enabling realtime sync:', err);
      setError(String(err));
      return false;
    }
  };

  const disableRealtimeSync = async () => {
    try {
      stopRealtimeSmsIngestion();
      setRealtimeEnabled(false);
      await AsyncStorage.setItem('realtimeenabled', 'false');
      return true;
    } catch (err) {
      console.error('Error disabling realtime sync:', err);
      return false;
    }
  };

  /* ---------------- Data Source Switching ---------------- */

  const switchDataSource = async newSource => {
    if (newSource === dataSource) return;

    setDataSource(newSource);
    await AsyncStorage.setItem('datasource', newSource);

    // Clear cache when switching away from SMS
    if (newSource !== 'sms') {
      await AsyncStorage.removeItem('cachedtransactions');
    }
  };

  /* ---------------- Refresh ---------------- */

  const refreshTransactions = async () => {
    setRefreshing(true);
    await loadTransactions(true);
    setRefreshing(false);
  };

  /* ---------------- Clear Error ---------------- */

  const clearError = () => {
    setError(null);
  };

  /* ---------------- Derived values: totals & recent ---------------- */

  const totals = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter transactions by actual transaction date (not timestamp)
    const thisMonthTxs = transactions.filter(tx => {
      const d = new Date(tx.date); // Use date field (transaction date from body)
      return !Number.isNaN(d.getTime()) && d >= startOfMonth;
    });

    const monthlyIncome = thisMonthTxs
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const monthlyExpense = thisMonthTxs
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const balance = monthlyIncome - monthlyExpense;

    return { balance, monthlyIncome, monthlyExpense };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .filter(tx => tx)
      .sort((a, b) => {
        // Sort by timestamp (SMS receive time) for recency
        const da = new Date(a.timestamp || a.date);
        const db = new Date(b.timestamp || b.date);
        return db - da;
      })
      .slice(0, 10);
  }, [transactions]);

  /* ---------------- Initialize ---------------- */

  useEffect(() => {
    const init = async () => {
      try {
        // Load saved preferences
        const savedSource = await AsyncStorage.getItem('datasource');
        const savedRealtime = await AsyncStorage.getItem('realtimeenabled');
        const savedSyncTime = await AsyncStorage.getItem('lastsynctime');

        if (savedSource) setDataSource(savedSource);
        if (savedSyncTime) setLastSyncTime(savedSyncTime);
        if (savedRealtime === 'true') setRealtimeEnabled(true);
      } catch (err) {
        console.error('Init error:', err);
      }
    };

    init();
  }, []);

  // Load transactions when data source changes
  useEffect(() => {
    loadTransactions();
  }, [dataSource, loadTransactions]);

  // Handle app state changes for realtime listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && realtimeEnabled) {
        const userId = getUserId();
        if (userId !== 'anonymous' && !isRealtimeListenerActive()) {
          startRealtimeSmsIngestion(userId);
        }
      }
    });

    return () => subscription?.remove();
  }, [realtimeEnabled]);

  // Start realtime listener if enabled
  useEffect(() => {
    if (realtimeEnabled) {
      const userId = getUserId();
      if (userId !== 'anonymous') {
        startRealtimeSmsIngestion(userId);
      }

      return () => {
        if (realtimeEnabled) {
          stopRealtimeSmsIngestion();
        }
      };
    }
  }, [realtimeEnabled]);

  /* ---------------- Context Value ---------------- */

  const value = {
  // Data
  transactions,
  totals,
  recentTransactions,
  loading,
  refreshing,
  error,

  // Data source
  dataSource,
  switchDataSource,

  // SMS permissions
  smsPermissionGranted,
  checkSmsPermission,

  // Sync
  lastSyncTime,
  syncStats,
  syncSmsToFirebase,
  refreshTransactions,

  // Realtime
  realtimeEnabled,
  enableRealtimeSync,
  disableRealtimeSync,

  // New helper for realtime UI refresh
  reloadFromFirebase,

  // Utils
  clearError,
};

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionContext;
