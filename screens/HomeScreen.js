import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getTodayTransactions, getWeekTransactions, getMonthTransactions, calculateTotals, getRecentTransactions } from '../data/utils';
import { useSettings } from '../data/SettingsContext';
import { useTheme } from '../data/ThemeContext';
import { formatCurrency } from '../data/currencyService';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { settings, refreshSettings } = useSettings(); // ✅ Add refreshSettings
  const { theme, isDarkMode } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('Today');
  const [refreshing, setRefreshing] = useState(false);

  // ✅ REFRESH SETTINGS WHEN SCREEN COMES INTO FOCUS
  useFocusEffect(
    useCallback(() => {
      refreshSettings(); // Refresh settings when returning from Settings screen
    }, [refreshSettings])
  );

  // ✅ GET DATA BASED ON SELECTED FILTER
  const todayTransactions = getTodayTransactions(settings.currency);
  const weekTransactions = getWeekTransactions(settings.currency);
  const monthTransactions = getMonthTransactions(settings.currency);

  // ✅ FILTERED DATA BASED ON SELECTED FILTER
  const filteredTransactions = useMemo(() => {
    switch (selectedFilter) {
      case 'Today':
        return todayTransactions;
      case 'This week':
        return weekTransactions;
      case 'This month':
        return monthTransactions;
      default:
        return todayTransactions;
    }
  }, [selectedFilter, todayTransactions, weekTransactions, monthTransactions]);

  // ✅ CALCULATE TOTALS BASED ON FILTERED DATA
  const filteredTotals = calculateTotals(filteredTransactions);
  
  // ✅ ALWAYS SHOW RECENT TRANSACTIONS (5 most recent regardless of filter)
  const recentTransactions = getRecentTransactions(5, settings.currency);

  // ✅ FIXED TOTALS FOR CARDS (not affected by filter)
  const todayTotals = calculateTotals(todayTransactions);
  const monthTotals = calculateTotals(monthTransactions);

  const filters = ['Today', 'This week', 'This month'];

  // ✅ SMART FINANCIAL TREND LOGIC
  const getFinancialTrend = (type, changePercent) => {
    const isPositiveChange = changePercent > 0;
    
    if (type === 'debit' || type === 'spending') {
      return {
        emoji: isPositiveChange ? '📉' : '📈',
        color: isPositiveChange ? '#EF4444' : '#10B981',
        text: `${isPositiveChange ? '+' : ''}${changePercent}%`
      };
    } else if (type === 'credit' || type === 'earning') {
      return {
        emoji: isPositiveChange ? '📈' : '📉',
        color: isPositiveChange ? '#10B981' : '#EF4444',
        text: `${isPositiveChange ? '+' : ''}${changePercent}%`
      };
    }
    
    return { emoji: '📊', color: theme.secondaryText, text: `${changePercent}%` };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSettings(); // ✅ Refresh settings on pull-to-refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const TransactionRow = ({ item, index }) => {
    const isCredit = item.type === 'credit';

    return (
      <TouchableOpacity style={styles.transactionRow}>
        <View style={[styles.colorBar, { backgroundColor: isCredit ? '#10B981' : '#EF4444' }]} />
        <View style={styles.transactionDetails}>
          <Text style={styles.merchantName}>{item.merchant}</Text>
          <Text style={styles.transactionMeta}>
            {new Date(item.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}, {' '}
            {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} • {item.bank}
          </Text>
          {item.originalCurrency !== settings.currency && (
            <Text style={styles.originalCurrency}>
              Originally: {formatCurrency(item.originalAmount, item.originalCurrency)}
            </Text>
          )}
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: isCredit ? '#10B981' : '#EF4444' }]}>
            {isCredit ? '+' : '-'} {formatCurrency(item.amount, settings.currency)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Calculate trend data
  const todaySpendTrend = getFinancialTrend('spending', 10);
  const monthDebitTrend = getFinancialTrend('spending', -5);
  const monthCreditTrend = getFinancialTrend('earning', 8);

  // ✅ GET DISPLAY LABEL FOR CURRENT FILTER
  const getFilterDisplayLabel = () => {
    switch (selectedFilter) {
      case 'Today':
        return "Today's";
      case 'This week':
        return "This week's";
      case 'This month':
        return "This month's";
      default:
        return "Today's";
    }
  };

  // ✅ SAFE NAME DISPLAY
  const displayName = settings.firstName || 'User';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    currencyIndicator: {
      fontSize: 12,
      color: theme.secondaryText,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 20,
      gap: 8,
    },
    filterPill: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: theme.cardBackground,
      alignItems: 'center',
    },
    activeFilterPill: {
      backgroundColor: theme.activeButton,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.secondaryText,
    },
    activeFilterText: {
      color: theme.activeButtonText,
    },
    statsContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    statCard: {
      backgroundColor: theme.cardBackground,
      padding: 20,
      borderRadius: 12,
      marginBottom: 12,
      alignItems: 'flex-start',
    },
    statLabel: {
      fontSize: 14,
      color: theme.secondaryText,
      marginBottom: 8,
    },
    statAmount: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 4,
    },
    statChangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statChangeText: {
      fontSize: 12,
      fontWeight: '500',
    },
    transactionsSection: {
      paddingHorizontal: 20,
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    transactionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      marginBottom: 8,
      paddingVertical: 16,
      paddingRight: 16,
    },
    colorBar: {
      width: 4,
      height: '100%',
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
      marginRight: 16,
    },
    transactionDetails: {
      flex: 1,
    },
    merchantName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    transactionMeta: {
      fontSize: 11,
      color: theme.secondaryText,
      marginBottom: 2,
    },
    originalCurrency: {
      fontSize: 10,
      color: theme.tertiaryText,
      fontStyle: 'italic',
      marginTop: 2,
    },
    transactionRight: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: '700',
    },
    scanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.activeButton,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    scanButtonText: {
      color: theme.activeButtonText,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    filterSummaryCard: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      marginHorizontal: 20,
    },
    filterSummaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    filterSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    filterSummaryLabel: {
      fontSize: 14,
      color: theme.secondaryText,
    },
    filterSummaryValue: {
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.greeting}>Hi, {displayName}</Text>
            <Text style={styles.currencyIndicator}>Currency: {settings.currency}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Settings')}
            style={{ padding: 8 }}
          >
            <Ionicons name="settings-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.secondaryText} />}
      >
        <View style={styles.filterContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                selectedFilter === filter && styles.activeFilterPill
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.activeFilterText
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ FILTER-BASED SUMMARY CARD */}
        <View style={styles.filterSummaryCard}>
          <Text style={styles.filterSummaryTitle}>{getFilterDisplayLabel()} Summary</Text>
          
          <View style={styles.filterSummaryRow}>
            <Text style={styles.filterSummaryLabel}>Total Spent</Text>
            <Text style={[styles.filterSummaryValue, { color: '#EF4444' }]}>
              {formatCurrency(filteredTotals.totalDebit, settings.currency)}
            </Text>
          </View>
          
          <View style={styles.filterSummaryRow}>
            <Text style={styles.filterSummaryLabel}>Total Earned</Text>
            <Text style={[styles.filterSummaryValue, { color: '#10B981' }]}>
              {formatCurrency(filteredTotals.totalCredit, settings.currency)}
            </Text>
          </View>
          
          <View style={[styles.filterSummaryRow, { marginBottom: 0, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border }]}>
            <Text style={[styles.filterSummaryLabel, { fontWeight: '600' }]}>Net Amount</Text>
            <Text style={[
              styles.filterSummaryValue, 
              { 
                color: filteredTotals.netAmount >= 0 ? '#10B981' : '#EF4444',
                fontWeight: '700' 
              }
            ]}>
              {filteredTotals.netAmount >= 0 ? '+' : ''}{formatCurrency(filteredTotals.netAmount, settings.currency)}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {/* Today's Spend Card */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today's spend</Text>
            <Text style={[styles.statAmount, { color: '#EF4444' }]}>
              {formatCurrency(todayTotals.totalDebit, settings.currency)}
            </Text>
            <View style={styles.statChangeContainer}>
              <Text style={styles.statChangeText}>
                <Text style={{ fontSize: 12 }}>{todaySpendTrend.emoji}</Text>
                <Text style={[styles.statChangeText, { color: todaySpendTrend.color }]}>
                  {todaySpendTrend.text}
                </Text>
              </Text>
            </View>
          </View>

          {/* Month-to-date Debit Card */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Month-to-date debit</Text>
            <Text style={[styles.statAmount, { color: '#EF4444' }]}>
              {formatCurrency(monthTotals.totalDebit, settings.currency)}
            </Text>
            <View style={styles.statChangeContainer}>
              <Text style={styles.statChangeText}>
                <Text style={{ fontSize: 12 }}>{monthDebitTrend.emoji}</Text>
                <Text style={[styles.statChangeText, { color: monthDebitTrend.color }]}>
                  {monthDebitTrend.text}
                </Text>
              </Text>
            </View>
          </View>

          {/* Month-to-date Credit Card */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Month-to-date credit</Text>
            <Text style={[styles.statAmount, { color: '#10B981' }]}>
              {formatCurrency(monthTotals.totalCredit, settings.currency)}
            </Text>
            <View style={styles.statChangeContainer}>
              <Text style={styles.statChangeText}>
                <Text style={{ fontSize: 12 }}>{monthCreditTrend.emoji}</Text>
                <Text style={[styles.statChangeText, { color: monthCreditTrend.color }]}>
                  {monthCreditTrend.text}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Latest Transactions</Text>
          
          {recentTransactions.map((item, index) => (
            <TransactionRow key={item.id} item={item} index={index} />
          ))}
        </View>

        <TouchableOpacity style={styles.scanButton}>
          <Ionicons name="qr-code" size={20} color={theme.activeButtonText} />
          <Text style={styles.scanButtonText}>Scan SMS</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
