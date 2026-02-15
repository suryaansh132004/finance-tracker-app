// data/utils.js (updated – no dummy data)
import { convertCurrency } from './currencyService';

// Convert transactions to user's preferred currency
export const convertTransactionAmounts = (transactions = [], userCurrency = 'INR') => {
  return (transactions || []).map(transaction => ({
    ...transaction,
    originalAmount: transaction.amount,
    originalCurrency: transaction.currency || 'INR',
    amount: convertCurrency(
      transaction.amount,
      transaction.currency || 'INR',
      userCurrency
    ),
    displayCurrency: userCurrency,
  }));
};

// Filter transactions by date range (inclusive)
export const filterByDateRange = (transactions = [], startDate, endDate) => {
  if (!startDate && !endDate) return transactions || [];

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);

  return (transactions || []).filter(t => {
    const d = new Date(t.date || t.timestamp);
    if (Number.isNaN(d.getTime())) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
};

// Convenience: get today's transactions from a list
export const getTodayTransactions = (transactions = [], userCurrency = 'INR') => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const todayTrans = filterByDateRange(transactions, startOfDay, endOfDay);
  return convertTransactionAmounts(todayTrans, userCurrency);
};

// This week
export const getWeekTransactions = (transactions = [], userCurrency = 'INR') => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekTrans = filterByDateRange(transactions, startOfWeek, null);
  return convertTransactionAmounts(weekTrans, userCurrency);
};

// This month
export const getMonthTransactions = (transactions = [], userCurrency = 'INR') => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const monthTrans = filterByDateRange(transactions, startOfMonth, null);
  return convertTransactionAmounts(monthTrans, userCurrency);
};

// All
export const getAllTransactions = (transactions = [], userCurrency = 'INR') => {
  return convertTransactionAmounts(transactions, userCurrency);
};

// Custom date range
export const getCustomDateRangeTransactions = (
  transactions = [],
  startDate,
  endDate,
  userCurrency = 'INR'
) => {
  const filtered = filterByDateRange(transactions, startDate, endDate);
  return convertTransactionAmounts(filtered, userCurrency);
};

// Recent N
export const getRecentTransactions = (
  transactions = [],
  limit = 10,
  userCurrency = 'INR'
) => {
  const sorted = [...(transactions || [])].sort(
    (a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
  );
  const limited = sorted.slice(0, limit);
  return convertTransactionAmounts(limited, userCurrency);
};

// Calculate totals (amounts already converted)
export const calculateTotals = (transactions = []) => {
  const totalDebit = (transactions || [])
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalCredit = (transactions || [])
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return {
    totalDebit,
    totalCredit,
    netAmount: totalCredit - totalDebit,
    transactionCount: (transactions || []).length,
  };
};

// Group by category
export const getTransactionsByCategory = (transactions = []) => {
  const categories = {};

  (transactions || []).forEach(transaction => {
    const category = transaction.category || 'other';
    if (!categories[category]) {
      categories[category] = {
        transactions: [],
        totalAmount: 0,
        count: 0,
      };
    }
    categories[category].transactions.push(transaction);
    categories[category].totalAmount += transaction.amount || 0;
    categories[category].count += 1;
  });

  return categories;
};

// Daily spending trends over N days
export const getSpendingTrends = (
  transactions = [],
  days = 30,
  userCurrency = 'INR'
) => {
  const trends = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayTransactions = (transactions || []).filter(t => {
      const tDate = new Date(t.timestamp || t.date).toISOString().split('T')[0];
      return tDate === dateStr;
    });

    const convertedTrans = convertTransactionAmounts(dayTransactions, userCurrency);
    const dayTotals = calculateTotals(convertedTrans);

    trends.push({
      date: dateStr,
      debitAmount: dayTotals.totalDebit,
      creditAmount: dayTotals.totalCredit,
      netAmount: dayTotals.netAmount,
      transactionCount: dayTotals.transactionCount,
    });
  }

  return trends;
};
