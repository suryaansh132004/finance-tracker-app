import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAllTransactions, getTodayTransactions, getWeekTransactions, getMonthTransactions, getCustomDateRangeTransactions, calculateTotals } from '../data/utils';
import { useSettings } from '../data/SettingsContext';
import { useTheme } from '../data/ThemeContext';
import { formatCurrency } from '../data/currencyService';
import CustomCalendar from '../components2/CustomCalendar';

const TransactionsScreen = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { theme, isDarkMode } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showCalendar, setShowCalendar] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  
  const allTransactions = getAllTransactions(settings.currency);
  const todayTransactions = getTodayTransactions(settings.currency);
  const weekTransactions = getWeekTransactions(settings.currency);
  const monthTransactions = getMonthTransactions(settings.currency);
  const customTransactions = customStartDate && customEndDate ? 
    getCustomDateRangeTransactions(customStartDate, customEndDate, settings.currency) : [];
  
  const filteredTransactions = useMemo(() => {
    switch (selectedFilter) {
      case 'Today': return todayTransactions;
      case 'Week': return weekTransactions;
      case 'Month': return monthTransactions;
      case 'Custom': return customTransactions;
      default: return allTransactions.slice(0, 50);
    }
  }, [selectedFilter, allTransactions, todayTransactions, weekTransactions, monthTransactions, customTransactions]);

  const totals = calculateTotals(filteredTransactions);
  const filters = ['All', 'Today', 'Week', 'Month', 'Custom'];

  const handleCustomDateRangeSelect = (startDate, endDate) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setSelectedFilter('Custom');
  };

  const getFilterDisplayText = () => {
    if (selectedFilter === 'Custom' && customStartDate && customEndDate) {
      return `${customStartDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${customEndDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
    }
    return selectedFilter;
  };

  const TransactionItem = ({ item }) => {
    const isCredit = item.type === 'credit';
    
    return (
      <TouchableOpacity style={styles.transactionRow}>
        <View style={[styles.colorBar, { backgroundColor: isCredit ? '#10B981' : '#EF4444' }]} />
        
        <View style={styles.transactionDetails}>
          <Text style={styles.merchantName}>{item.merchant}</Text>
          <Text style={styles.transactionMeta}>
            {new Date(item.timestamp).toLocaleDateString('en-GB', { 
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
            })} • {item.bank}
          </Text>
          <Text style={styles.categoryText}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
          {item.originalCurrency !== settings.currency && (
            <Text style={styles.originalCurrency}>
              Originally: {formatCurrency(item.originalAmount, item.originalCurrency)}
            </Text>
          )}
        </View>
        
        <Text style={[styles.amount, { color: isCredit ? '#10B981' : '#EF4444' }]}>
          {isCredit ? '+' : '-'}{formatCurrency(item.amount, settings.currency)}
        </Text>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 10,
      position: 'relative',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    settingsButton: {
      position: 'absolute',
      right: 20,
      top: 20,
      padding: 8,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    summaryContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 12,
      gap: 12,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: theme.cardBackground,
      padding: 16,
      borderRadius: 12,
    },
    summaryLabel: {
      fontSize: 13,
      color: theme.secondaryText,
      marginBottom: 4,
    },
    summaryAmount: {
      fontSize: 18,
      fontWeight: '700',
      color: '#EF4444',
      marginBottom: 2,
    },
    summaryCount: {
      fontSize: 11,
      color: theme.secondaryText,
    },
    netAmountCard: {
      backgroundColor: theme.cardBackground,
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      alignItems: 'flex-start',
    },
    netAmountLabel: {
      fontSize: 14,
      color: theme.secondaryText,
      marginBottom: 6,
    },
    netAmountValue: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
    },
    currencyIndicator: {
      fontSize: 12,
      color: theme.secondaryText,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 16,
      gap: 6,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: 20,
      backgroundColor: theme.cardBackground,
      alignItems: 'center',
    },
    activeFilter: {
      backgroundColor: theme.activeButton,
    },
    filterText: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.secondaryText,
      textAlign: 'center',
    },
    activeFilterText: {
      color: theme.activeButtonText,
    },
    transactionsContainer: {
      paddingHorizontal: 20,
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
      fontSize: 12,
      color: theme.secondaryText,
      marginBottom: 2,
    },
    categoryText: {
      fontSize: 11,
      color: theme.tertiaryText,
    },
    originalCurrency: {
      fontSize: 10,
      color: theme.tertiaryText,
      fontStyle: 'italic',
      marginTop: 2,
    },
    amount: {
      fontSize: 16,
      fontWeight: '700',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 50,
    },
    emptyText: {
      fontSize: 16,
      color: theme.secondaryText,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.tertiaryText,
      textAlign: 'center',
    },
    bottomSpacing: {
      height: 50,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Transactions</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent ({getFilterDisplayText()})</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totals.totalDebit, settings.currency)}</Text>
            <Text style={styles.summaryCount}>{filteredTransactions.filter(t => t.type === 'debit').length} debits</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Earned ({getFilterDisplayText()})</Text>
            <Text style={[styles.summaryAmount, { color: '#10B981' }]}>{formatCurrency(totals.totalCredit, settings.currency)}</Text>
            <Text style={styles.summaryCount}>{filteredTransactions.filter(t => t.type === 'credit').length} credits</Text>
          </View>
        </View>

        <View style={styles.netAmountCard}>
          <Text style={styles.netAmountLabel}>Net Amount ({getFilterDisplayText()})</Text>
          <Text style={[
            styles.netAmountValue, 
            { color: totals.netAmount >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {totals.netAmount >= 0 ? '+' : ''}{formatCurrency(totals.netAmount, settings.currency)}
          </Text>
          <Text style={styles.currencyIndicator}>Currency: {settings.currency}</Text>
        </View>

        <View style={styles.filterContainer}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.activeFilter]}
              onPress={() => {
                if (filter === 'Custom') {
                  setShowCalendar(true);
                } else {
                  setSelectedFilter(filter);
                }
              }}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>
                {filter === 'Custom' && selectedFilter === 'Custom' && customStartDate && customEndDate
                  ? `${customStartDate.getDate()}/${customStartDate.getMonth() + 1}-${customEndDate.getDate()}/${customEndDate.getMonth() + 1}`
                  : filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.transactionsContainer}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((item) => (
              <TransactionItem key={item.id} item={item} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions found</Text>
              {selectedFilter === 'Custom' && (!customStartDate || !customEndDate) && (
                <Text style={styles.emptySubtext}>Select a custom date range to see transactions</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <CustomCalendar
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateRangeSelect={handleCustomDateRangeSelect}
        initialStartDate={customStartDate}
        initialEndDate={customEndDate}
      />
    </View>
  );
};

export default TransactionsScreen;
