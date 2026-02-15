import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { calculateTotals, getTransactionsByCategory } from '../data/utils';
import { useSettings } from '../data/SettingsContext';
import { useTheme } from '../data/ThemeContext';
import { formatCurrency } from '../data/currencyService';
import CustomCalendar from '../components/CustomCalendar';
import { useTransactions } from '../data/TransactionContext';

const DebitScreen = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { theme, isDarkMode } = useTheme();
  const { transactions } = useTransactions();
  const [selectedFilter, setSelectedFilter] = useState('Today');
  const [showCalendar, setShowCalendar] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);

  // All transactions from context (dummy on web, SMS/Firebase on Android)
  const allTransactionsRaw = useMemo(
    () => (Array.isArray(transactions) ? transactions : []),
    [transactions]
  );

  const getTxDate = (tx) => {
    const raw = tx.date || tx.timestamp;
    return raw ? new Date(raw) : new Date();
  };

  // Date-based slices
  const todayTransactions = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return allTransactionsRaw.filter((t) => {
      const d = getTxDate(t);
      return d >= start && d <= end;
    });
  }, [allTransactionsRaw]);

  const weekTransactions = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return allTransactionsRaw.filter((t) => {
      const d = getTxDate(t);
      return d >= startOfWeek;
    });
  }, [allTransactionsRaw]);

  const monthTransactions = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return allTransactionsRaw.filter((t) => {
      const d = getTxDate(t);
      return d >= startOfMonth;
    });
  }, [allTransactionsRaw]);

  const customTransactions = useMemo(() => {
    if (!customStartDate || !customEndDate) return [];
    const start = new Date(customStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEndDate);
    end.setHours(23, 59, 59, 999);
    return allTransactionsRaw.filter((t) => {
      const d = getTxDate(t);
      return d >= start && d <= end;
    });
  }, [allTransactionsRaw, customStartDate, customEndDate]);

  const allTransactions = allTransactionsRaw;

  const getFilteredDebitTransactions = () => {
    let base;
    switch (selectedFilter) {
      case 'Today':
        base = todayTransactions;
        break;
      case 'Week':
        base = weekTransactions;
        break;
      case 'Month':
        base = monthTransactions;
        break;
      case 'Custom':
        base = customTransactions;
        break;
      default:
        base = allTransactions;
    }
    return base.filter((t) => t.type === 'debit');
  };

  const debitTransactions = getFilteredDebitTransactions();
  const totals = calculateTotals(debitTransactions);
  const categories = getTransactionsByCategory(debitTransactions);

  const filters = ['Today', 'Week', 'Month', 'Custom', 'All'];
  const topCategories = Object.entries(categories)
    .sort(([, a], [, b]) => b.totalAmount - a.totalAmount)
    .slice(0, 3);

  const handleCustomDateRangeSelect = (startDate, endDate) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setSelectedFilter('Custom');
  };

  const getFilterDisplayText = () => {
    if (selectedFilter === 'Custom' && customStartDate && customEndDate) {
      return `${customStartDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      })} - ${customEndDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      })}`;
    }
    return selectedFilter;
  };

  const DebitItem = ({ item }) => (
    <TouchableOpacity style={styles.debitRow}>
      <View style={styles.colorBar} />
      <View style={styles.debitDetails}>
        <Text style={styles.merchantName}>{item.merchant}</Text>
        <Text style={styles.debitMeta}>
          {new Date(item.date || item.timestamp).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          • {item.bank || item.bankHint || ''}
        </Text>
        {item.category && (
          <Text style={styles.categoryText}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
        )}
        {item.originalCurrency &&
          item.originalCurrency !== settings.currency && (
            <Text style={styles.originalCurrency}>
              Originally: {formatCurrency(item.originalAmount, item.originalCurrency)}
            </Text>
          )}
        <Text style={styles.debitAmount}>
          -{formatCurrency(item.amount, settings.currency)}
        </Text>
      </View>
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
      color: '#EF4444',
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
    },
    categoriesContainer: {
      marginHorizontal: 20,
      marginBottom: 20,
    },
    categoriesTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    categoriesList: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryColorBar: {
      width: 3,
      height: 24,
      backgroundColor: '#EF4444',
      borderRadius: 2,
      marginRight: 12,
    },
    categoryDetails: {
      flex: 1,
    },
    categoryName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 2,
    },
    categoryAmount: {
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
    debitRow: {
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
      backgroundColor: '#EF4444',
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
      marginRight: 16,
    },
    debitDetails: {
      flex: 1,
    },
    merchantName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    debitMeta: {
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
    debitAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: '#EF4444',
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Debit</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="cog" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>
          Total Spent ({getFilterDisplayText()})
        </Text>
        <Text style={styles.totalAmount}>
          {formatCurrency(totals.totalDebit, settings.currency)}
        </Text>
        <Text style={styles.transactionCount}>
          {debitTransactions.length} transactions
        </Text>
        <Text style={styles.currencyIndicator}>
          Currency: {settings.currency}
        </Text>
      </View>

      {topCategories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>Top Spending Categories</Text>
          <View style={styles.categoriesList}>
            {topCategories.map(([categoryName, categoryData]) => (
              <View key={categoryName} style={styles.categoryItem}>
                <View style={styles.categoryColorBar} />
                <View style={styles.categoryDetails}>
                  <Text style={styles.categoryName}>
                    {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                  </Text>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(categoryData.totalAmount, settings.currency)} (
                    {categoryData.count} txns)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.activeFilter,
            ]}
            onPress={() => {
              if (filter === 'Custom') {
                setShowCalendar(true);
              } else {
                setSelectedFilter(filter);
              }
            }}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.activeFilterText,
              ]}
            >
              {filter === 'Custom' &&
              selectedFilter === 'Custom' &&
              customStartDate &&
              customEndDate
                ? `${customStartDate.getDate()}/${customStartDate.getMonth() + 1} - ${customEndDate.getDate()}/${customEndDate.getMonth() + 1}`
                : filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.transactionsContainer}>
        {debitTransactions.length > 0 ? (
          debitTransactions.map((item) => <DebitItem key={item.id} item={item} />)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No debit transactions found</Text>
            {selectedFilter === 'Custom' && (!customStartDate || !customEndDate) && (
              <Text style={styles.emptySubtext}>
                Select a custom date range to see transactions
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.bottomSpacing} />

      <CustomCalendar
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateRangeSelect={handleCustomDateRangeSelect}
        initialStartDate={customStartDate}
        initialEndDate={customEndDate}
      />
    </ScrollView>
  );
};

export default DebitScreen;
