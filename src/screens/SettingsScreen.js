import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  FlatList,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../data/SettingsContext';
import { useTheme } from '../data/ThemeContext';
import { useTransactions } from '../data/TransactionContext';
import { auth } from '../config/firebase';  // ✅ FIXED - Web SDK
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut
} from 'firebase/auth';  // ✅ FIXED - Web SDK functions
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Define CURRENCIES locally
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { settings, updateSetting } = useSettings();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { dataSource, switchDataSource, syncSmsToFirebase, lastSyncTime, refreshing, realtimeEnabled, enableRealtimeSync, disableRealtimeSync } = useTransactions();

  // Auth state
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    occupation: '',
    monthlyIncome: '',
    financialGoal: '',
    budgetLimit: '',
    city: '',
    country: '',
  });

  const [bugReport, setBugReport] = useState({ title: '', description: '', attachments: [] });
  const [useSMSData, setUseSMSData] = useState(false);
  const [initialForm, setInitialForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showOccupationModal, setShowOccupationModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [submittingBug, setSubmittingBug] = useState(false);

useEffect(() => {
  const subscriber = onAuthStateChanged(auth, setUser);  // ✅ Changed syntax
  return subscriber;
}, []);

// Auth functions - REPLACE lines ~98-140
const signUpWithEmail = useCallback(async () => {
  if (!authEmail || !authPassword) {
    Alert.alert('Error', 'Please enter email and password');
    return;
  }
  try {
    await createUserWithEmailAndPassword(auth, authEmail, authPassword);  // ✅ Changed
    setShowAuthModal(false);
    setAuthEmail('');
    setAuthPassword('');
    Alert.alert('Success', 'Account created successfully!');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
}, [authEmail, authPassword]);

const signInWithEmail = useCallback(async () => {
  if (!authEmail || !authPassword) {
    Alert.alert('Error', 'Please enter email and password');
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, authEmail, authPassword);  // ✅ Changed
    setShowAuthModal(false);
    setAuthEmail('');
    setAuthPassword('');
    Alert.alert('Success', 'Signed in successfully!');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
}, [authEmail, authPassword]);

const signInWithGoogle = useCallback(async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = GoogleAuthProvider.credential(idToken);  // ✅ Changed
    await signInWithCredential(auth, googleCredential);  // ✅ Changed
    setShowAuthModal(false);
    Alert.alert('Success', 'Signed in with Google!');
  } catch (error) {
    console.error('Google Sign-In error:', error);
    Alert.alert('Error', 'Google Sign-In failed');
  }
}, []);


 const handleSignOut = useCallback(async () => {  // ✅ Changed name
  try {
    await firebaseSignOut(auth);  // ✅ Use the imported function
    Alert.alert('Signed Out', 'You have been signed out successfully.');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
}, []);


  useEffect(() => {
    setUseSMSData(dataSource === 'sms');
  }, [dataSource]);

  useEffect(() => {
    const f = {
      firstName: settings.firstName || '',
      lastName: settings.lastName || '',
      age: settings.age || '',
      occupation: settings.occupation || '',
      monthlyIncome: settings.monthlyIncome || '',
      financialGoal: settings.financialGoal || '',
      budgetLimit: settings.budgetLimit || '',
      city: settings.city || '',
      country: settings.country || '',
    };
    setForm(f);
    setInitialForm(f);
  }, [settings.firstName, settings.lastName, settings.age, settings.occupation, settings.monthlyIncome, settings.financialGoal, settings.budgetLimit, settings.city, settings.country]);

  const setField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const hasChanges = useMemo(() => {
    return Object.keys(form).some(k => form[k] !== (initialForm[k] ?? ''));
  }, [form, initialForm]);

  const canSubmitBug = useMemo(() => {
    return bugReport.title.trim().length > 0 && bugReport.description.trim().length > 0;
  }, [bugReport.title, bugReport.description]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const updates = Object.keys(form).filter(k => form[k] !== (initialForm[k] ?? ''));
      for (const key of updates) {
        await updateSetting(key, form[key]);
      }
      setInitialForm(form);
      Alert.alert('Saved', 'Settings updated successfully.');
    } catch (e) {
      Alert.alert('Error', 'Could not save settings. Try again.');
    } finally {
      setSaving(false);
    }
  }, [form, initialForm, hasChanges, updateSetting]);

  const handleReset = useCallback(() => {
    setForm(initialForm);
  }, [initialForm]);

  const handleCurrencyChange = useCallback(async (code) => {
    try {
      await updateSetting('currency', code);
      setShowCurrencyModal(false);
    } catch {
      Alert.alert('Error', 'Failed to change currency.');
    }
  }, [updateSetting]);

  const handleBugSubmit = useCallback(async () => {
    if (!canSubmitBug) return;
    setSubmittingBug(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setBugReport({ title: '', description: '', attachments: [] });
      setShowBugReportModal(false);
      Alert.alert('Bug Report Submitted', 'Thank you for your feedback!');
    } catch (e) {
      Alert.alert('Error', 'Failed to submit bug report.');
    } finally {
      setSubmittingBug(false);
    }
  }, [canSubmitBug]);

  const handleSMSToggle = useCallback(async (value) => {
    if (value) {
      console.log('Enabling SMS data source...');
      try {
        await switchDataSource('sms');
        setUseSMSData(true);
        Alert.alert(
          'SMS Data Enabled',
          'The app will now read your bank SMS.\n\nNote: You may need to grant SMS permissions when the app first tries to read your messages.\n\n"Scan SMS and Sync to Cloud" to start.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('SMS enable error:', error);
        Alert.alert('Error', `Could not enable SMS data: ${error.message}`, [{ text: 'OK' }]);
      }
    } else {
      await switchDataSource('firebase');
      setUseSMSData(false);
      Alert.alert('SMS Data Disabled', 'SMS-based tracking has been turned off.', [{ text: 'OK' }]);
    }
  }, [switchDataSource]);

  const handleSmsSync = useCallback(async () => {
    try {
      if (!useSMSData) {
        Alert.alert('Enable SMS First...', 'Please enable "Use SMS Data" before syncing.', [{ text: 'OK' }]);
        return;
      }
      console.log('Starting SMS sync...');
      const res = await syncSmsToFirebase();
      if (res?.success) {
        Alert.alert('SMS Sync Complete', `Scanned ${res.scanned ?? 0} SMS messages\nFound ${res.parsed ?? 0} transactions\ntransactions have been synced to the cloud.`);
      } else {
        Alert.alert('Sync Failed', res?.message || 'Could not sync SMS transactions.');
      }
    } catch (e) {
      console.error('SMS sync error:', e);
      Alert.alert('Sync Failed', `An error occurred: ${e.message}`);
    }
  }, [syncSmsToFirebase, useSMSData]);

  const handleRealtimeToggle = useCallback(async (value) => {
    if (value) {
      console.log('Checking for realtime tracking...');
      try {
        if (!useSMSData) {
          Alert.alert('Enable SMS First', 'Please enable "Use SMS Data" before enabling realtime tracking.', [{ text: 'OK' }]);
          return;
        }
        console.log('Enabling realtime SMS tracking...');
        const success = await enableRealtimeSync();
        if (success) {
          console.log('Realtime SMS tracking enabled');
          Alert.alert('Success', 'Realtime SMS tracking is now active! New bank SMS will be automatically added.');
        } else {
          Alert.alert('Error', 'Could not enable realtime tracking. Make sure you are logged in.');
        }
      } catch (error) {
        console.error('Failed to enable realtime sync:', error);
        Alert.alert('Error', `Could not enable realtime tracking: ${error.message}`);
      }
    } else {
      console.log('Disabling realtime SMS tracking...');
      await disableRealtimeSync();
      console.log('Realtime SMS tracking disabled');
    }
  }, [enableRealtimeSync, disableRealtimeSync, useSMSData]);

  const occupationOptions = [
    'Student', 'Software Engineer', 'Doctor', 'Teacher', 'Business Owner',
    'Marketing Professional', 'Finance Professional', 'Sales Representative',
    'Designer', 'Freelancer', 'Consultant', 'Manager', 'Engineer', 'Lawyer',
    'Accountant', 'Architect', 'Nurse', 'Chef', 'Artist', 'Writer',
    'Entrepreneur', 'Analyst', 'Researcher', 'Other'
  ];

  const goalOptions = [
    'Emergency Fund', 'House Down Payment', 'Car Purchase', 'Vacation',
    'Retirement Savings', 'Education Fund', 'Investment Portfolio',
    'Debt Repayment', 'Wedding', 'Business Investment', 'Other'
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.background }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6, marginRight: 8 }}>
              <Icon name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: theme.text, fontSize: 20, fontWeight: '700' }}>Settings</Text>
            {hasChanges && (
              <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ color: '#0B0B0B', fontSize: 10, fontWeight: '700' }}>UNSAVED</Text>
              </View>
            )}
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: hasChanges ? 100 : 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Authentication Section */}
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginTop: 16, marginBottom: 10 }}>
              Account
            </Text>
            <View
              style={{
                backgroundColor: theme.cardBackground,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 8,
              }}
            >
              {user ? (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Icon name="person-circle-outline" size={20} color={theme.text} style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 14, color: theme.text, fontWeight: '500' }}>
                      {user.email || 'Anonymous User'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleSignOut}
                    style={{
                      backgroundColor: '#FF6B6B',
                      paddingVertical: 8,
                      borderRadius: 8,
                      alignItems: 'center',
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 13 }}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowAuthModal(true)}
                  style={{
                    backgroundColor: theme.activeButton,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Sign In / Sign Up</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ backgroundColor: theme.cardBackground, borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'flex-start', marginTop: 6, marginBottom: 8 }}>
              <Icon name="information-circle-outline" size={14} color={theme.secondaryText} />
              <Text style={{ color: theme.secondaryText, fontSize: 11, lineHeight: 15, marginLeft: 8, flex: 1 }}>
                Sign in to sync your data across multiple devices
              </Text>
            </View>

            {/* Personal Information */}
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginTop: 16, marginBottom: 10 }}>
              Personal Information
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>First name</Text>
                <TextInput
                  style={{
                    backgroundColor: theme.cardBackground,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    color: theme.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    height: 44,
                  }}
                  value={form.firstName}
                  onChangeText={t => setField('firstName', t)}
                  placeholder="Enter first name"
                  placeholderTextColor={theme.secondaryText}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Last name</Text>
                <Text style={{ color: theme.tertiaryText, fontSize: 11 }}>Optional</Text>
                <TextInput
                  style={{
                    backgroundColor: theme.cardBackground,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    color: theme.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    height: 44,
                  }}
                  value={form.lastName}
                  onChangeText={t => setField('lastName', t)}
                  placeholder="Enter last name"
                  placeholderTextColor={theme.secondaryText}
                />
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Age</Text>
              <Text style={{ color: theme.tertiaryText, fontSize: 11 }}>Optional</Text>
              <TextInput
                style={{
                  backgroundColor: theme.cardBackground,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  color: theme.text,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  height: 44,
                }}
                value={form.age}
                onChangeText={t => setField('age', t.replace(/[^0-9]/g, ''))}
                placeholder="Enter age"
                placeholderTextColor={theme.secondaryText}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>City</Text>
                <Text style={{ color: theme.tertiaryText, fontSize: 11 }}>Optional</Text>
                <TextInput
                  style={{
                    backgroundColor: theme.cardBackground,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    color: theme.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    height: 44,
                  }}
                  value={form.city}
                  onChangeText={t => setField('city', t)}
                  placeholder="Your city"
                  placeholderTextColor={theme.secondaryText}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Country</Text>
                <Text style={{ color: theme.tertiaryText, fontSize: 11 }}>Optional</Text>
                <TextInput
                  style={{
                    backgroundColor: theme.cardBackground,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    color: theme.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    height: 44,
                  }}
                  value={form.country}
                  onChangeText={t => setField('country', t)}
                  placeholder="Your country"
                  placeholderTextColor={theme.secondaryText}
                />
              </View>
            </View>

            {/* Professional */}
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginTop: 16, marginBottom: 10 }}>
              Professional
            </Text>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Occupation</Text>
              <Text style={{ color: theme.tertiaryText, fontSize: 11 }}>Optional</Text>
              <TouchableOpacity
                onPress={() => setShowOccupationModal(true)}
                style={{
                  backgroundColor: theme.cardBackground,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  height: 44,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 14, color: form.occupation ? theme.text : theme.secondaryText }}>
                  {form.occupation || 'Select your occupation'}
                </Text>
                <Icon name="chevron-down" size={18} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Monthly income</Text>
              <Text style={{ color: theme.tertiaryText, fontSize: 11 }}>Optional</Text>
              <TextInput
                style={{
                  backgroundColor: theme.cardBackground,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  color: theme.text,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  height: 44,
                }}
                value={form.monthlyIncome}
                onChangeText={t => setField('monthlyIncome', t.replace(/[^0-9.]/g, ''))}
                placeholder={`Enter amount in ${settings.currency || 'USD'}`}
                placeholderTextColor={theme.secondaryText}
                keyboardType="numeric"
              />
            </View>

            {/* Financial */}
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginTop: 16, marginBottom: 10 }}>
              Financial
            </Text>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Primary currency</Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyModal(true)}
                style={{
                  backgroundColor: theme.cardBackground,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  height: 44,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {(() => {
                  const code = settings.currency || 'INR';
                  const meta = CURRENCIES.find(c => c.code === code);
                  const label = `${meta?.symbol || '₹'} ${code}`;
                  return (
                    <Text style={{ fontSize: 14, color: theme.text }}>
                      {label}
                    </Text>
                  );
                })()}
                <Icon name="chevron-down" size={18} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Financial goal</Text>
              <Text style={{ color: theme.tertiaryText, fontSize: 11 }}>Optional</Text>
              <TouchableOpacity
                onPress={() => setShowGoalModal(true)}
                style={{
                  backgroundColor: theme.cardBackground,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  height: 44,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 14, color: form.financialGoal ? theme.text : theme.secondaryText }}>
                  {form.financialGoal || 'Select your main goal'}
                </Text>
                <Icon name="chevron-down" size={18} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Monthly budget limit</Text>
              <Text style={{ color: theme.tertiaryText, fontSize: 11 }}>Optional</Text>
              <TextInput
                style={{
                  backgroundColor: theme.cardBackground,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  color: theme.text,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  height: 44,
                }}
                value={form.budgetLimit}
                onChangeText={t => setField('budgetLimit', t.replace(/[^0-9.]/g, ''))}
                placeholder={`Enter limit in ${settings.currency || 'USD'}`}
                placeholderTextColor={theme.secondaryText}
                keyboardType="numeric"
              />
            </View>

            {/* Preferences */}
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginTop: 16, marginBottom: 10 }}>
              Preferences
            </Text>
            <View
              style={{
                backgroundColor: theme.cardBackground,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 14, color: theme.text, fontWeight: '500' }}>Dark mode</Text>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.activeButton }}
                thumbColor={isDarkMode ? theme.background : theme.text}
              />
            </View>

            {/* Data Source */}
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginTop: 16, marginBottom: 10 }}>
              Data Source
            </Text>
            <View
              style={{
                backgroundColor: theme.cardBackground,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 14, color: theme.text, fontWeight: '500' }}>Use SMS Data</Text>
                <Text style={{ color: theme.secondaryText, fontSize: 11, marginTop: 2, lineHeight: 14 }}>
                  Automatically detect transactions from bank SMS alerts
                </Text>
                {lastSyncTime && (
                  <Text style={{ color: theme.secondaryText, fontSize: 11, marginTop: 3 }}>
                    Last sync: {new Date(lastSyncTime).toLocaleString()}
                  </Text>
                )}
              </View>
              <Switch
                value={useSMSData}
                onValueChange={handleSMSToggle}
                trackColor={{ false: theme.border, true: theme.activeButton }}
                thumbColor={useSMSData ? theme.background : theme.text}
              />
            </View>

            <View style={{ backgroundColor: theme.cardBackground, borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'flex-start', marginTop: 6, marginBottom: 8 }}>
              <Icon name="information-circle-outline" size={14} color={theme.secondaryText} />
              <Text style={{ color: theme.secondaryText, fontSize: 11, lineHeight: 15, marginLeft: 8, flex: 1 }}>
                SMS are processed on-device. You can switch back to sample data anytime.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSmsSync}
              disabled={refreshing}
              style={{
                backgroundColor: theme.cardBackground,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              <Icon name="download-outline" size={20} color={theme.text} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', marginLeft: 12, color: theme.text }}>
                {refreshing ? 'Syncing SMS...' : 'Scan SMS and Sync to Cloud'}
              </Text>
            </TouchableOpacity>

            <View
              style={{
                backgroundColor: theme.cardBackground,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 14, color: theme.text, fontWeight: '500' }}>Realtime SMS Tracking</Text>
                <Text style={{ color: theme.secondaryText, fontSize: 11, marginTop: 2, lineHeight: 14 }}>
                  Automatically add new transactions as SMS arrive
                </Text>
              </View>
              <Switch
                value={realtimeEnabled}
                onValueChange={handleRealtimeToggle}
                trackColor={{ false: theme.border, true: theme.activeButton }}
                thumbColor={realtimeEnabled ? theme.background : theme.text}
              />
            </View>

            {/* Support */}
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginTop: 16, marginBottom: 10 }}>
              Support
            </Text>
            <TouchableOpacity
              onPress={() => setShowBugReportModal(true)}
              style={{
                backgroundColor: theme.cardBackground,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Icon name="bug-outline" size={20} color="#FF6B6B" />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', marginLeft: 12, color: '#FF6B6B' }}>
                Report a Bug
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Save Button */}
          {hasChanges && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: theme.cardBackground,
                borderTopWidth: 1,
                borderTopColor: theme.border,
                padding: 12,
                flexDirection: 'row',
              }}
            >
              <TouchableOpacity
                onPress={handleReset}
                disabled={saving}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                  paddingVertical: 12,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 15 }}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  flex: 2,
                  borderRadius: 10,
                  backgroundColor: theme.text,
                  alignItems: 'center',
                  paddingVertical: 12,
                  marginLeft: 8,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ color: theme.background, fontWeight: '700', fontSize: 15 }}>
                  {saving ? 'Saving...' : 'Save changes'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Auth Modal */}
        <Modal visible={showAuthModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={{ backgroundColor: theme.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>
                    {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setShowAuthModal(false);
                    setAuthEmail('');
                    setAuthPassword('');
                  }}>
                    <Icon name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                  <TouchableOpacity
                    onPress={() => setAuthMode('signin')}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderBottomWidth: 2,
                      borderBottomColor: authMode === 'signin' ? theme.activeButton : 'transparent',
                    }}
                  >
                    <Text style={{ textAlign: 'center', fontWeight: '600', color: authMode === 'signin' ? theme.text : theme.secondaryText }}>
                      Sign In
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAuthMode('signup')}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderBottomWidth: 2,
                      borderBottomColor: authMode === 'signup' ? theme.activeButton : 'transparent',
                    }}
                  >
                    <Text style={{ textAlign: 'center', fontWeight: '600', color: authMode === 'signup' ? theme.text : theme.secondaryText }}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={{
                    backgroundColor: theme.background,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    color: theme.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                  value={authEmail}
                  onChangeText={setAuthEmail}
                  placeholder="Email"
                  placeholderTextColor={theme.secondaryText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TextInput
                  style={{
                    backgroundColor: theme.background,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    color: theme.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                  value={authPassword}
                  onChangeText={setAuthPassword}
                  placeholder="Password"
                  placeholderTextColor={theme.secondaryText}
                  secureTextEntry
                />

                <TouchableOpacity
                  onPress={authMode === 'signin' ? signInWithEmail : signUpWithEmail}
                  style={{
                    borderRadius: 10,
                    backgroundColor: theme.activeButton,
                    alignItems: 'center',
                    paddingVertical: 14,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>
                    {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
                  <Text style={{ marginHorizontal: 10, color: theme.secondaryText }}>OR</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
                </View>

                <TouchableOpacity
                  onPress={signInWithGoogle}
                  style={{
                    borderRadius: 10,
                    backgroundColor: '#FFF',
                    borderWidth: 1,
                    borderColor: theme.border,
                    alignItems: 'center',
                    paddingVertical: 12,
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="logo-google" size={20} color="#DB4437" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#000', fontWeight: '600', fontSize: 15 }}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Currency Modal */}
        <Modal visible={showCurrencyModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: theme.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Select Currency</Text>
                <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                  <Icon name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={CURRENCIES}
                keyExtractor={item => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleCurrencyChange(item.code)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                      backgroundColor: settings.currency === item.code ? theme.border : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 20, marginRight: 12 }}>{item.symbol}</Text>
                    <Text style={{ flex: 1, color: theme.text, fontWeight: settings.currency === item.code ? '600' : '400' }}>
                      {item.code} - {item.name}
                    </Text>
                    {settings.currency === item.code && <Icon name="checkmark" size={24} color={theme.text} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Occupation Modal */}
        <Modal visible={showOccupationModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: theme.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Select Occupation</Text>
                <TouchableOpacity onPress={() => setShowOccupationModal(false)}>
                  <Icon name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={occupationOptions}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setField('occupation', item);
                      setShowOccupationModal(false);
                    }}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                      backgroundColor: form.occupation === item ? theme.border : 'transparent',
                    }}
                  >
                    <Text style={{ color: theme.text, fontWeight: form.occupation === item ? '600' : '400' }}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Goal Modal */}
        <Modal visible={showGoalModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: theme.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Select Financial Goal</Text>
                <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                  <Icon name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={goalOptions}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setField('financialGoal', item);
                      setShowGoalModal(false);
                    }}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                      backgroundColor: form.financialGoal === item ? theme.border : 'transparent',
                    }}
                  >
                    <Text style={{ color: theme.text, fontWeight: form.financialGoal === item ? '600' : '400' }}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Bug Report Modal */}
        <Modal visible={showBugReportModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={{ backgroundColor: theme.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Report a Bug</Text>
                  <TouchableOpacity onPress={() => setShowBugReportModal(false)}>
                    <Icon name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={{
                    backgroundColor: theme.background,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    color: theme.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                  value={bugReport.title}
                  onChangeText={t => setBugReport(prev => ({ ...prev, title: t }))}
                  placeholder="Bug title"
                  placeholderTextColor={theme.secondaryText}
                />
                <TextInput
                  style={{
                    backgroundColor: theme.background,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    color: theme.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    height: 120,
                    textAlignVertical: 'top',
                    marginBottom: 16,
                  }}
                  value={bugReport.description}
                  onChangeText={t => setBugReport(prev => ({ ...prev, description: t }))}
                  placeholder="Describe the bug in detail..."
                  placeholderTextColor={theme.secondaryText}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleBugSubmit}
                  disabled={!canSubmitBug || submittingBug}
                  style={{
                    borderRadius: 10,
                    backgroundColor: canSubmitBug && !submittingBug ? '#FF6B6B' : theme.border,
                    alignItems: 'center',
                    paddingVertical: 14,
                    opacity: !canSubmitBug || submittingBug ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>
                    {submittingBug ? 'Submitting...' : 'Submit Bug Report'}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

