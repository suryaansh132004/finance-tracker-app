import { dummyTransactions } from './dummyData';
import { convertCurrency } from './currencyService';

// Convert transactions to user's preferred currency
export const convertTransactionAmounts = (transactions, userCurrency = 'INR') => {
  return transactions.map(transaction => ({
    ...transaction,
    originalAmount: transaction.amount,
    originalCurrency: transaction.currency || 'INR',
    amount: convertCurrency(transaction.amount, transaction.currency || 'INR', userCurrency),
    displayCurrency: userCurrency
  }));
};

// Get today's transactions with currency conversion
export const getTodayTransactions = (userCurrency = 'INR') => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
  const todayTrans = dummyTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.timestamp);
    return transactionDate >= startOfDay && transactionDate <= endOfDay;
  });

  return convertTransactionAmounts(todayTrans, userCurrency);
};

// Get this week's transactions with currency conversion
export const getWeekTransactions = (userCurrency = 'INR') => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weekTrans = dummyTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.timestamp);
    return transactionDate >= startOfWeek;
  });

  return convertTransactionAmounts(weekTrans, userCurrency);
};

// Get this month's transactions with currency conversion
export const getMonthTransactions = (userCurrency = 'INR') => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const monthTrans = dummyTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.timestamp);
    return transactionDate >= startOfMonth;
  });

  return convertTransactionAmounts(monthTrans, userCurrency);
};

// Get ALL transactions with currency conversion
export const getAllTransactions = (userCurrency = 'INR') => {
  return convertTransactionAmounts(dummyTransactions, userCurrency);
};

// Get custom date range transactions
export const getCustomDateRangeTransactions = (startDate, endDate, userCurrency = 'INR') => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  const customTrans = dummyTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.timestamp);
    return transactionDate >= start && transactionDate <= end;
  });

  return convertTransactionAmounts(customTrans, userCurrency);
};

// Get recent transactions with currency conversion
export const getRecentTransactions = (limit = 10, userCurrency = 'INR') => {
  const converted = convertTransactionAmounts(dummyTransactions, userCurrency);
  return converted.slice(0, limit);
};

// Calculate totals (amounts already converted)
export const calculateTotals = (transactions) => {
  const totalDebit = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalCredit = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
    
  return {
    totalDebit,
    totalCredit,
    netAmount: totalCredit - totalDebit,
    transactionCount: transactions.length
  };
};

// Rest of functions remain the same...
export const getTransactionsByCategory = (transactions) => {
  const categories = {};
  
  transactions.forEach(transaction => {
    const category = transaction.category || 'other';
    if (!categories[category]) {
      categories[category] = {
        transactions: [],
        totalAmount: 0,
        count: 0
      };
    }
    categories[category].transactions.push(transaction);
    categories[category].totalAmount += transaction.amount;
    categories[category].count++;
  });
  
  return categories;
};

export const getSpendingTrends = (days = 30, userCurrency = 'INR') => {
  const trends = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayTransactions = dummyTransactions.filter(t => {
      const tDate = new Date(t.timestamp).toISOString().split('T')[0];
      return tDate === dateStr;
    });
    
    const convertedTrans = convertTransactionAmounts(dayTransactions, userCurrency);
    const dayTotals = calculateTotals(convertedTrans);
    
    trends.push({
      date: dateStr,
      debitAmount: dayTotals.totalDebit,
      creditAmount: dayTotals.totalCredit,
      netAmount: dayTotals.netAmount,
      transactionCount: dayTotals.transactionCount
    });
  }
  
  return trends;
};
