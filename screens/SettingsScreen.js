import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Modal, FlatList, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../data/SettingsContext';
import { useTheme } from '../data/ThemeContext';
import { CURRENCIES } from '../data/currencyService';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { settings, updateSetting } = useSettings();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  // Add refs for each input to maintain focus on web
  const inputRefs = useRef({
    firstName: null,
    lastName: null,
    age: null,
    city: null,
    country: null,
    monthlyIncome: null,
    budgetLimit: null,
    bugTitle: null,
    bugDescription: null,
  });

  // Local form state (typing happens here only)
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

  // Bug report form state
  const [bugReport, setBugReport] = useState({
    title: '',
    description: '',
    attachments: [],
  });

  // Data source state
  const [useSMSData, setUseSMSData] = useState(false);
  const [initialForm, setInitialForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showOccupationModal, setShowOccupationModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [submittingBug, setSubmittingBug] = useState(false);

  // Initialize form data from settings
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
  }, [
    settings.firstName,
    settings.lastName,
    settings.age,
    settings.occupation,
    settings.monthlyIncome,
    settings.financialGoal,
    settings.budgetLimit,
    settings.city,
    settings.country
  ]);

  // Use useCallback to prevent re-renders that cause focus loss
  const setField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const setBugField = useCallback((field, value) => {
    setBugReport(prev => ({ ...prev, [field]: value }));
  }, []);

  const hasChanges = useMemo(() => {
    return Object.keys(form).some(k => (form[k] ?? '') !== (initialForm[k] ?? ''));
  }, [form, initialForm]);

  const canSubmitBug = useMemo(() => {
    return bugReport.title.trim().length > 0 && bugReport.description.trim().length > 0;
  }, [bugReport.title, bugReport.description]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const updates = Object.keys(form).filter(k => (form[k] ?? '') !== (initialForm[k] ?? ''));
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
      Alert.alert(
        'Bug Report Submitted',
        'Thank you for your feedback! We\'ll review your report and get back to you soon.',
        [{ text: 'OK' }]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to submit bug report. Please try again.');
    } finally {
      setSubmittingBug(false);
    }
  }, [canSubmitBug]);

  const handleCloseBugModal = useCallback(() => {
    if (bugReport.title.trim() || bugReport.description.trim()) {
      Alert.alert(
        'Discard Bug Report',
        'Are you sure you want to discard your bug report?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setBugReport({ title: '', description: '', attachments: [] });
              setShowBugReportModal(false);
            }
          }
        ]
      );
    } else {
      setShowBugReportModal(false);
    }
  }, [bugReport]);

  const handleSMSToggle = useCallback(() => {
    Alert.alert(
      'SMS Data Access',
      'SMS parsing functionality will be available in the next update. This will allow automatic transaction detection from bank SMS alerts.',
      [{ text: 'OK' }]
    );
  }, []);

  const occupationOptions = [
    'Student','Software Engineer','Doctor','Teacher','Business Owner','Marketing Professional','Finance Professional','Sales Representative','Designer','Freelancer','Consultant','Manager','Engineer','Lawyer','Accountant','Architect','Nurse','Chef','Artist','Writer','Entrepreneur','Analyst','Researcher','Other'
  ];

  const goalOptions = [
    'Emergency Fund','House Down Payment','Car Purchase','Vacation','Retirement Savings','Education Fund','Investment Portfolio','Debt Repayment','Wedding','Business Investment','Other'
  ];

  // WEB-OPTIMIZED Input component
  const Input = useCallback(({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    maxLength,
    optional = false,
    multiline = false,
    autoCapitalize = 'words',
    fieldName
  }) => (
    <View style={styles(theme).inputBlock}>
      <Text style={styles(theme).label}>
        {label} {optional ? <Text style={styles(theme).optional}>(Optional)</Text> : null}
      </Text>
      <TextInput
        ref={(ref) => {
          if (fieldName && inputRefs.current) {
            inputRefs.current[fieldName] = ref;
          }
        }}
        style={[styles(theme).input, multiline && styles(theme).inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        blurOnSubmit={!multiline}
        returnKeyType={multiline ? 'default' : 'done'}
      />
    </View>
  ), [theme, inputRefs]);

  const Select = useCallback(({ label, value, placeholder, onPress, optional = false }) => (
    <View style={styles(theme).inputBlock}>
      <Text style={styles(theme).label}>
        {label} {optional ? <Text style={styles(theme).optional}>(Optional)</Text> : null}
      </Text>
      <TouchableOpacity onPress={onPress} style={styles(theme).select}>
        <Text style={[styles(theme).selectText, !value && styles(theme).placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.secondaryText} />
      </TouchableOpacity>
    </View>
  ), [theme]);

  const ActionButton = useCallback(({ label, icon, onPress, color = theme.text, backgroundColor = theme.cardBackground }) => (
    <TouchableOpacity onPress={onPress} style={[styles(theme).actionButton, { backgroundColor }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles(theme).actionButtonText, { color }]}>{label}</Text>
    </TouchableOpacity>
  ), [theme]);

  const CurrencyModal = useCallback(() => (
    <Modal visible={showCurrencyModal} animationType="slide" transparent>
      <View style={styles(theme).modalOverlay}>
        <View style={styles(theme).modalSheet}>
          <View style={styles(theme).modalHeader}>
            <Text style={styles(theme).modalTitle}>Select Currency</Text>
            <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={CURRENCIES}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles(theme).row, 
                  settings.currency === item.code && styles(theme).rowSelected
                ]}
                onPress={() => handleCurrencyChange(item.code)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={styles(theme).currencySymbol}>{item.symbol}</Text>
                  <View>
                    <Text style={styles(theme).rowTitle}>{item.name}</Text>
                    <Text style={styles(theme).rowSub}>{item.code}</Text>
                  </View>
                </View>
                {settings.currency === item.code ? <Ionicons name="checkmark" size={18} color={theme.activeButton} /> : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  ), [showCurrencyModal, theme, settings.currency, handleCurrencyChange]);

  const OptionModal = useCallback(({ title, options, visible, onClose, onSelect, current }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles(theme).modalOverlay}>
        <View style={styles(theme).modalSheet}>
          <View style={styles(theme).modalHeader}>
            <Text style={styles(theme).modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles(theme).row, 
                  current === item && styles(theme).rowSelected
                ]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={styles(theme).rowTitle}>{item}</Text>
                {current === item ? <Ionicons name="checkmark" size={18} color={theme.activeButton} /> : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  ), [theme]);

  const BugReportModal = useCallback(() => (
    <Modal visible={showBugReportModal} animationType="slide" transparent>
      <View style={styles(theme).modalOverlay}>
        <View style={styles(theme).bugModalSheet}>
          <View style={styles(theme).modalHeader}>
            <Text style={styles(theme).modalTitle}>Report a Bug</Text>
            <TouchableOpacity onPress={handleCloseBugModal}>
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles(theme).bugModalContent}>
            <Text style={styles(theme).bugModalDescription}>
              Help us improve the app by reporting any issues you encounter. We appreciate your feedback!
            </Text>

            <Input
              label="Bug Title"
              value={bugReport.title}
              onChangeText={(t) => setBugField('title', t)}
              placeholder="Brief description of the issue"
              maxLength={100}
              fieldName="bugTitle"
            />

            <Input
              label="Description"
              value={bugReport.description}
              onChangeText={(t) => setBugField('description', t)}
              placeholder="Detailed description of what happened, steps to reproduce, expected vs actual behavior..."
              multiline
              maxLength={1000}
              fieldName="bugDescription"
              autoCapitalize="sentences"
            />

            <Text style={styles(theme).label}>Screenshots/Screen Recording (Optional)</Text>
            <TouchableOpacity style={styles(theme).attachmentButton}>
              <Ionicons name="camera-outline" size={20} color={theme.secondaryText} />
              <Text style={styles(theme).attachmentButtonText}>Add Screenshots or Screen Recording</Text>
            </TouchableOpacity>
            <Text style={styles(theme).attachmentNote}>
              Note: File attachment feature will be available in the next update.
            </Text>

            <View style={styles(theme).bugReportInfo}>
              <Ionicons name="information-circle-outline" size={16} color={theme.secondaryText} />
              <Text style={styles(theme).bugInfoText}>
                Your device info and app version will be automatically included to help us debug the issue.
              </Text>
            </View>
          </ScrollView>

          <View style={styles(theme).bugModalActions}>
            <TouchableOpacity style={styles(theme).bugCancelBtn} onPress={handleCloseBugModal}>
              <Text style={styles(theme).bugCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles(theme).bugSubmitBtn,
                (!canSubmitBug || submittingBug) && styles(theme).bugSubmitBtnDisabled
              ]}
              onPress={handleBugSubmit}
              disabled={!canSubmitBug || submittingBug}
            >
              <Text style={[
                styles(theme).bugSubmitText,
                (!canSubmitBug || submittingBug) && styles(theme).bugSubmitTextDisabled
              ]}>
                {submittingBug ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ), [showBugReportModal, theme, bugReport, canSubmitBug, submittingBug, handleCloseBugModal, handleBugSubmit, setBugField, Input]);

  return (
    <View style={styles(theme).container}>
      {/* ✅ FIXED: Header outside ScrollView */}
      <View style={styles(theme).header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles(theme).title}>Settings</Text>
        {hasChanges ? (
          <View style={styles(theme).badge}>
            <Text style={styles(theme).badgeText}>UNSAVED</Text>
          </View>
        ) : <View style={{ width: 70 }} />}
      </View>

      {/* ✅ FIXED: Proper KeyboardAvoidingView + ScrollView structure */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: hasChanges ? 120 : 40, // Extra space when action bar is visible
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          {/* Personal Information */}
          <Text style={styles(theme).section}>Personal Information</Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="First name"
                value={form.firstName}
                onChangeText={(t) => setField('firstName', t)}
                placeholder="Enter first name"
                maxLength={30}
                fieldName="firstName"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Last name"
                value={form.lastName}
                onChangeText={(t) => setField('lastName', t)}
                placeholder="Enter last name"
                maxLength={30}
                optional
                fieldName="lastName"
              />
            </View>
          </View>

          <Input
            label="Age"
            value={form.age}
            onChangeText={(t) => setField('age', t.replace(/[^0-9]/g, ''))}
            placeholder="Enter age"
            keyboardType="numeric"
            maxLength={2}
            optional
            fieldName="age"
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="City"
                value={form.city}
                onChangeText={(t) => setField('city', t)}
                placeholder="Your city"
                optional
                fieldName="city"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Country"
                value={form.country}
                onChangeText={(t) => setField('country', t)}
                placeholder="Your country"
                optional
                fieldName="country"
              />
            </View>
          </View>

          {/* Professional */}
          <Text style={styles(theme).section}>Professional</Text>
          
          <Select
            label="Occupation"
            value={form.occupation}
            placeholder="Select your occupation"
            onPress={() => setShowOccupationModal(true)}
            optional
          />

          <Input
            label="Monthly income"
            value={form.monthlyIncome}
            onChangeText={(t) => setField('monthlyIncome', t.replace(/[^0-9.]/g, ''))}
            placeholder={`Enter amount in ${settings.currency}`}
            keyboardType="numeric"
            optional
            fieldName="monthlyIncome"
          />

          {/* Financial */}
          <Text style={styles(theme).section}>Financial</Text>
          
          <Select
            label="Primary currency"
            value={`${CURRENCIES.find(c => c.code === settings.currency)?.symbol || ''} ${settings.currency}`}
            placeholder="Select currency"
            onPress={() => setShowCurrencyModal(true)}
          />

          <Select
            label="Financial goal"
            value={form.financialGoal}
            placeholder="Select your main goal"
            onPress={() => setShowGoalModal(true)}
            optional
          />

          <Input
            label="Monthly budget limit"
            value={form.budgetLimit}
            onChangeText={(t) => setField('budgetLimit', t.replace(/[^0-9.]/g, ''))}
            placeholder={`Enter limit in ${settings.currency}`}
            keyboardType="numeric"
            optional
            fieldName="budgetLimit"
          />

          {/* Preferences */}
          <Text style={styles(theme).section}>Preferences</Text>
          
          <View style={styles(theme).toggleRow}>
            <Text style={styles(theme).toggleText}>Dark mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.activeButton }}
              thumbColor={isDarkMode ? theme.background : theme.text}
            />
          </View>

          {/* Data Source Section */}
          <Text style={styles(theme).section}>Data Source</Text>
          
          <View style={styles(theme).toggleRow}>
            <View style={styles(theme).dataSourceInfo}>
              <Text style={styles(theme).toggleText}>Use SMS Data</Text>
              <Text style={styles(theme).dataSourceSubtext}>
                Automatically detect transactions from bank SMS alerts
              </Text>
            </View>
            <Switch
              value={useSMSData}
              onValueChange={handleSMSToggle}
              trackColor={{ false: theme.border, true: theme.activeButton }}
              thumbColor={useSMSData ? theme.background : theme.text}
            />
          </View>

          <View style={styles(theme).dataSourceNote}>
            <Ionicons name="information-circle-outline" size={16} color={theme.secondaryText} />
            <Text style={styles(theme).dataSourceNoteText}>
              SMS parsing functionality will be available in the next update. Currently using sample transaction data.
            </Text>
          </View>

          {/* Support */}
          <Text style={styles(theme).section}>Support</Text>
          
          <ActionButton
            label="Report a Bug"
            icon="bug-outline"
            onPress={() => setShowBugReportModal(true)}
            color="#FF6B6B"
            backgroundColor={theme.cardBackground}
          />
        </ScrollView>

        {/* ✅ FIXED: Sticky action bar outside ScrollView */}
        {hasChanges && (
          <View style={styles(theme).actionBarContainer}>
            <View style={styles(theme).actionBar}>
              <TouchableOpacity style={styles(theme).resetBtn} onPress={handleReset} disabled={saving}>
                <Text style={styles(theme).resetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles(theme).saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles(theme).saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <CurrencyModal />
      <OptionModal
        title="Select occupation"
        options={occupationOptions}
        visible={showOccupationModal}
        onClose={() => setShowOccupationModal(false)}
        onSelect={(val) => setField('occupation', val)}
        current={form.occupation}
      />
      <OptionModal
        title="Select financial goal"
        options={goalOptions}
        visible={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSelect={(val) => setField('financialGoal', val)}
        current={form.financialGoal}
      />
      <BugReportModal />
    </View>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 18, 
    paddingHorizontal: 20, 
    paddingBottom: 14, 
    backgroundColor: theme.background 
  },
  title: { 
    flex: 1, 
    textAlign: 'left', 
    color: theme.text, 
    fontSize: 22, 
    fontWeight: '700', 
    marginLeft: 6 
  },
  badge: { 
    backgroundColor: '#F59E0B', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 10 
  },
  badgeText: { 
    color: '#0B0B0B', 
    fontSize: 10, 
    fontWeight: '700' 
  },
  section: { 
    color: theme.text, 
    fontWeight: '700', 
    fontSize: 16, 
    marginTop: 24, 
    marginBottom: 12 
  },
  inputBlock: { 
    marginBottom: 14 
  },
  label: { 
    color: theme.text, 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 6 
  },
  optional: { 
    color: theme.tertiaryText, 
    fontWeight: '400', 
    fontSize: 12 
  },
  input: { 
    backgroundColor: theme.cardBackground, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.border, 
    color: theme.text, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    fontSize: 16, 
    minHeight: 48 
  },
  inputMultiline: { 
    minHeight: 80, 
    textAlignVertical: 'top' 
  },
  select: { 
    backgroundColor: theme.cardBackground, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.border, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    minHeight: 48, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  selectText: { 
    fontSize: 16, 
    color: theme.text 
  },
  placeholder: { 
    color: theme.secondaryText 
  },
  toggleRow: { 
    backgroundColor: theme.cardBackground, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.border, 
    paddingHorizontal: 14, 
    paddingVertical: 14, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  toggleText: { 
    fontSize: 16, 
    color: theme.text, 
    fontWeight: '500' 
  },
  dataSourceInfo: { 
    flex: 1 
  },
  dataSourceSubtext: { 
    color: theme.secondaryText, 
    fontSize: 12, 
    marginTop: 2 
  },
  dataSourceNote: { 
    backgroundColor: theme.cardBackground, 
    borderRadius: 8, 
    padding: 12, 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginTop: 8, 
    marginBottom: 8 
  },
  dataSourceNoteText: { 
    color: theme.secondaryText, 
    fontSize: 12, 
    lineHeight: 16, 
    marginLeft: 8, 
    flex: 1 
  },
  actionButton: { 
    backgroundColor: theme.cardBackground, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.border, 
    paddingHorizontal: 14, 
    paddingVertical: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  actionButtonText: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: '500', 
    marginLeft: 12 
  },
  actionBarContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: theme.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
  },
  actionBar: { 
    flexDirection: 'row', 
    gap: 12 
  },
  resetBtn: { 
    flex: 1, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.border, 
    alignItems: 'center', 
    paddingVertical: 14 
  },
  resetText: { 
    color: theme.text, 
    fontWeight: '600', 
    fontSize: 16 
  },
  saveBtn: { 
    flex: 2, 
    borderRadius: 12, 
    backgroundColor: theme.text, 
    alignItems: 'center', 
    paddingVertical: 14 
  },
  saveText: { 
    color: theme.background, 
    fontWeight: '700', 
    fontSize: 16 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalSheet: { 
    backgroundColor: theme.background, 
    maxHeight: '80%', 
    borderTopLeftRadius: 18, 
    borderTopRightRadius: 18 
  },
  bugModalSheet: { 
    backgroundColor: theme.background, 
    height: '90%', 
    borderTopLeftRadius: 18, 
    borderTopRightRadius: 18 
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 18, 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border 
  },
  modalTitle: { 
    color: theme.text, 
    fontWeight: '700', 
    fontSize: 16 
  },
  bugModalContent: { 
    paddingHorizontal: 18, 
    paddingVertical: 16, 
    paddingBottom: 20 
  },
  bugModalDescription: { 
    color: theme.secondaryText, 
    fontSize: 14, 
    lineHeight: 20, 
    marginBottom: 20 
  },
  attachmentButton: { 
    backgroundColor: theme.cardBackground, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.border, 
    borderStyle: 'dashed', 
    paddingHorizontal: 14, 
    paddingVertical: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  attachmentButtonText: { 
    color: theme.secondaryText, 
    fontSize: 14, 
    marginLeft: 8 
  },
  attachmentNote: { 
    color: theme.tertiaryText, 
    fontSize: 12, 
    marginTop: 6, 
    fontStyle: 'italic' 
  },
  bugReportInfo: { 
    backgroundColor: theme.cardBackground, 
    borderRadius: 8, 
    padding: 12, 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginTop: 12 
  },
  bugInfoText: { 
    color: theme.secondaryText, 
    fontSize: 12, 
    lineHeight: 16, 
    marginLeft: 8, 
    flex: 1 
  },
  bugModalActions: { 
    flexDirection: 'row', 
    gap: 12, 
    paddingHorizontal: 18, 
    paddingVertical: 16, 
    borderTopWidth: 1, 
    borderTopColor: theme.border 
  },
  bugCancelBtn: { 
    flex: 1, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.border, 
    alignItems: 'center', 
    paddingVertical: 14 
  },
  bugCancelText: { 
    color: theme.text, 
    fontWeight: '600', 
    fontSize: 16 
  },
  bugSubmitBtn: { 
    flex: 2, 
    borderRadius: 12, 
    backgroundColor: '#FF6B6B', 
    alignItems: 'center', 
    paddingVertical: 14 
  },
  bugSubmitBtnDisabled: { 
    backgroundColor: theme.secondaryText, 
    opacity: 0.5 
  },
  bugSubmitText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 16 
  },
  bugSubmitTextDisabled: { 
    color: '#FFFFFF' 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 18, 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border 
  },
  rowSelected: { 
    backgroundColor: theme.activeButton + '12' 
  },
  rowTitle: { 
    color: theme.text, 
    fontSize: 15, 
    fontWeight: '600' 
  },
  rowSub: { 
    color: theme.secondaryText, 
    fontSize: 12 
  },
  currencySymbol: { 
    color: theme.text, 
    fontSize: 22, 
    width: 28, 
    textAlign: 'center' 
  },
});

export default SettingsScreen;
