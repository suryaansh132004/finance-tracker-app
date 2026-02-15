import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../data/ThemeContext';
import { useSettings } from '../data/SettingsContext';
import { useTransactions } from '../data/TransactionContext';
import SummaryCard from '../components/SummaryCard';
import TransactionItem from '../components/TransactionItem';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { settings } = useSettings();
  const {
    transactions,
    totals,
    loading,
    dataSource,
    syncSmsToFirebase,
    refreshing,
    syncStatus,
  } = useTransactions();

  const [showSyncOptions, setShowSyncOptions] = useState(false);

  const currency = settings?.currency || 'INR';

  // Monthly credit/debit from totals
  const monthlyCredit = totals?.monthlyIncome ?? 0;
  const monthlyDebit = totals?.monthlyExpense ?? 0;

  // Recent transactions sorted by newest first
  const recentSorted = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    return [...transactions]
      .sort(
        (a, b) =>
          new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp)
      )
      .slice(0, 10);
  }, [transactions]);

  const handleQuickAction = useCallback(
    action => {
      switch (action) {
        case 'viewAll':
          navigation.navigate('Transactions');
          break;
        default:
          break;
      }
    },
    [navigation],
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading your finances...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with user's name */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.secondaryText }]}>
              Good {getGreeting()}, {settings.firstName || 'User'}!
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Monthly credit/debit */}
        <Text
          style={{
            color: theme.secondaryText,
            fontSize: 13,
            fontWeight: '500',
            marginHorizontal: 20,
            marginBottom: 6,
          }}
        >
          This month’s totals
        </Text>

        <View style={styles.summaryContainer}>
          <SummaryCard
            title="Credit"
            amount={monthlyCredit}
            type="income"
            currency={currency}
          />
          <SummaryCard
            title="Debit"
            amount={monthlyDebit}
            type="expense"
            currency={currency}
          />
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent
            </Text>
            <TouchableOpacity onPress={() => handleQuickAction('viewAll')}>
              <Text style={[styles.viewAll, { color: theme.accent || theme.text }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {recentSorted.length === 0 ? (
  <Text style={{ color: theme.secondaryText, fontSize: 13 }}>
    No recent expenses yet.
  </Text>
) : (
  recentSorted
    .filter(tx => tx && tx.type)    // guard
    .map(transaction => (
      <View key={transaction.id || `${transaction.timestamp}-${transaction.amount}`} style={styles.transactionItem}>
        <TransactionItem item={transaction} currency={currency} />
      </View>
    ))
)}

        </View>

        {/* Data Source Info */}
        <View
          style={[
            styles.dataSourceCard,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.dataSourceRow}>
            <Icon
              name={dataSource === 'sms' ? 'phone-portrait-outline' : 'cloud-outline'}
              size={18}
              color={theme.text}
            />
            <Text style={[styles.dataSourceText, { color: theme.text }]}>
              {dataSource === 'sms' ? 'SMS Data' : 'Cloud Data'}
            </Text>
          </View>
          {dataSource === 'sms' && syncStatus && (
            <Text style={[styles.syncStatus, { color: theme.secondaryText }]}>
              {syncStatus}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// Helper function
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileButton: {
    padding: 8,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionItem: {
    marginBottom: 8,
  },
  dataSourceCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  dataSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dataSourceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  syncStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default HomeScreen;
