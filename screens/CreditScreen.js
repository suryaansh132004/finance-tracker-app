import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getTodayTransactions, getWeekTransactions, getMonthTransactions, getAllTransactions, getCustomDateRangeTransactions, calculateTotals } from '../data/utils';
import { useSettings } from '../data/SettingsContext';
import { useTheme } from '../data/ThemeContext';
import { formatCurrency } from '../data/currencyService';
import CustomCalendar from '../components2/CustomCalendar';

const CreditScreen = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { theme, isDarkMode } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('Month');
  const [showCalendar, setShowCalendar] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  
  const todayTransactions = getTodayTransactions(settings.currency);
  const weekTransactions = getWeekTransactions(settings.currency);
  const monthTransactions = getMonthTransactions(settings.currency);
  const allTransactions = getAllTransactions(settings.currency);
  const customTransactions = customStartDate && customEndDate ? 
    getCustomDateRangeTransactions(customStartDate, customEndDate, settings.currency) : [];
  
  const getFilteredCreditTransactions = () => {
    let transactions;
    switch (selectedFilter) {
      case 'Today': transactions = todayTransactions; break;
      case 'Week': transactions = weekTransactions; break;
      case 'Month': transactions = monthTransactions; break;
      case 'Custom': transactions = customTransactions; break;
      default: transactions = allTransactions;
    }
    return transactions.filter(t => t.type === 'credit');
  };

  const creditTransactions = getFilteredCreditTransactions();
  const totals = calculateTotals(creditTransactions);

  const filters = ['Today', 'Week', 'Month', 'Custom', 'All'];

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

  const CreditItem = ({ item }) => (
    <TouchableOpacity style={styles.creditRow}>
      <View style={styles.colorBar} />
      
      <View style={styles.creditDetails}>
        <Text style={styles.merchantName}>{item.merchant}</Text>
        <Text style={styles.creditMeta}>
          {new Date(item.timestamp).toLocaleDateString('en-GB', { 
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
          })} • {item.bank}
        </Text>
        <Text style={styles.descriptionText}>{item.description}</Text>
        {item.originalCurrency !== settings.currency && (
          <Text style={styles.originalCurrency}>
            Originally: {formatCurrency(item.originalAmount, item.originalCurrency)}
          </Text>
        )}
      </View>
      
      <Text style={styles.creditAmount}>
        +{formatCurrency(item.amount, settings.currency)}
      </Text>
    </TouchableOpacity>
  );

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
    totalCard: {
      backgroundColor: theme.cardBackground,
      marginHorizontal: 20,
      padding: 20,
      borderRadius: 12,
      marginBottom: 20,
      alignItems: 'flex-start',
    },
    totalLabel: {
      fontSize: 14,
      color: theme.secondaryText,
      marginBottom: 8,
    },
    totalAmount: {
      fontSize: 28,
      fontWeight: '700',
      color: '#10B981',
      marginBottom: 4,
    },
    transactionCount: {
      fontSize: 12,
      color: theme.secondaryText,
      marginBottom: 4,
    },
    currencyIndicator: {
      fontSize: 12,
      color: theme.secondaryText,
      marginBottom: 4,
    },
    averageText: {
      fontSize: 11,
      color: theme.tertiaryText,
    },
    quickStats: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 20,
      gap: 8,
    },
    statItem: {
      flex: 1,
      backgroundColor: theme.cardBackground,
      padding: 12,
      borderRadius: 10,
      alignItems: 'flex-start',
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
      color: '#10B981',
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 10,
      color: theme.secondaryText,
      textAlign: 'center',
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
      paddingHorizontal: 8,
      borderRadius: 20,
      backgroundColor: theme.cardBackground,
      alignItems: 'center',
    },
    activeFilter: {
      backgroundColor: theme.activeButton,
    },
    filterText: {
      fontSize: 12,
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
    creditRow: {
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
      backgroundColor: '#10B981',
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
      marginRight: 16,
    },
    creditDetails: {
      flex: 1,
    },
    merchantName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    creditMeta: {
      fontSize: 12,
      color: theme.secondaryText,
      marginBottom: 2,
    },
    descriptionText: {
      fontSize: 11,
      color: theme.tertiaryText,
    },
    originalCurrency: {
      fontSize: 10,
      color: theme.tertiaryText,
      fontStyle: 'italic',
      marginTop: 2,
    },
    creditAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: '#10B981',
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
        <Text style={styles.headerTitle}>Credit</Text>
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
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Earned ({getFilterDisplayText()})</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totals.totalCredit, settings.currency)}</Text>
          <Text style={styles.transactionCount}>{creditTransactions.length} transactions</Text>
          <Text style={styles.currencyIndicator}>Currency: {settings.currency}</Text>
          
          {creditTransactions.length > 0 && (
            <Text style={styles.averageText}>
              Avg: {formatCurrency(Math.round(totals.totalCredit / creditTransactions.length), settings.currency)} per transaction
            </Text>
          )}
        </View>

        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {creditTransactions.length > 0 ? formatCurrency(Math.max(...creditTransactions.map(t => t.amount)), settings.currency) : formatCurrency(0, settings.currency)}
            </Text>
            <Text style={styles.statLabel}>Highest Credit</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {creditTransactions.filter(t => t.merchant.toLowerCase().includes('salary')).length}
            </Text>
            <Text style={styles.statLabel}>Salary Credits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {creditTransactions.filter(t => t.merchant.toLowerCase().includes('refund')).length}
            </Text>
            <Text style={styles.statLabel}>Refunds</Text>
          </View>
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
          {creditTransactions.length > 0 ? (
            creditTransactions.map((item) => (
              <CreditItem key={item.id} item={item} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No credit transactions found</Text>
              {selectedFilter === 'Custom' && (!customStartDate || !customEndDate) ? (
                <Text style={styles.emptySubtext}>Select a custom date range to see transactions</Text>
              ) : (
                <Text style={styles.emptySubtext}>Credits will appear here when you receive money</Text>
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

export default CreditScreen;
