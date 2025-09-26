// Enhanced dummy data with multiple currencies
const generateDummyData = () => {
  const merchants = {
    food: ['Zomato', 'Swiggy', 'McDonald\'s', 'KFC', 'Domino\'s Pizza', 'Subway', 'Cafe Coffee Day'],
    shopping: ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Nykaa', 'Big Basket'],
    transport: ['Uber', 'Ola', 'Rapido', 'IRCTC', 'Mumbai Metro'],
    utilities: ['Jio', 'Airtel', 'Vi', 'Tata Power', 'BESCOM'],
    entertainment: ['BookMyShow', 'Netflix', 'Amazon Prime', 'Disney+ Hotstar'],
    healthcare: ['Apollo Pharmacy', '1mg', 'Netmeds', 'PharmEasy'],
    education: ['BYJU\'S', 'Unacademy', 'Vedantu', 'Coursera'],
    finance: ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'],
    credit: ['Salary Credit', 'Bonus', 'Freelance Payment', 'Interest Credit', 'Refund']
  };

  const banks = ['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra'];
  
  // Different currencies for realistic diversity
  const currencies = ['INR', 'USD', 'EUR', 'GBP'];
  const currencyWeights = [0.75, 0.15, 0.05, 0.05]; // 75% INR, 15% USD, etc.

  const selectRandomCurrency = () => {
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < currencies.length; i++) {
      cumulative += currencyWeights[i];
      if (random <= cumulative) {
        return currencies[i];
      }
    }
    return 'INR'; // Default fallback
  };

  const generateTransaction = (date, type = 'random') => {
    const categories = Object.keys(merchants);
    let category, merchant, amount, currency;
    
    currency = selectRandomCurrency(); // Select currency for this transaction
    
    if (type === 'credit') {
      category = 'credit';
      merchant = merchants.credit[Math.floor(Math.random() * merchants.credit.length)];
      
      // Different ranges based on currency
      switch (currency) {
        case 'USD':
          amount = Math.floor(Math.random() * 800) + 100; // $100-$900
          break;
        case 'EUR':
          amount = Math.floor(Math.random() * 700) + 80; // €80-€780
          break;
        case 'GBP':
          amount = Math.floor(Math.random() * 600) + 70; // £70-£670
          break;
        default:
          amount = Math.floor(Math.random() * 50000) + 1000; // ₹1,000-₹51,000
      }
    } else {
      category = categories[Math.floor(Math.random() * categories.length)];
      if (category === 'credit') category = 'food';
      merchant = merchants[category][Math.floor(Math.random() * merchants[category].length)];
      
      // Currency-specific pricing
      switch (currency) {
        case 'USD':
          switch (category) {
            case 'food': amount = Math.floor(Math.random() * 30) + 5; break; // $5-$35
            case 'shopping': amount = Math.floor(Math.random() * 200) + 20; break; // $20-$220
            default: amount = Math.floor(Math.random() * 100) + 10; // $10-$110
          }
          break;
        case 'EUR':
          switch (category) {
            case 'food': amount = Math.floor(Math.random() * 25) + 4; break; // €4-€29
            case 'shopping': amount = Math.floor(Math.random() * 180) + 15; break; // €15-€195
            default: amount = Math.floor(Math.random() * 90) + 8; // €8-€98
          }
          break;
        case 'GBP':
          switch (category) {
            case 'food': amount = Math.floor(Math.random() * 20) + 3; break; // £3-£23
            case 'shopping': amount = Math.floor(Math.random() * 150) + 12; break; // £12-£162
            default: amount = Math.floor(Math.random() * 80) + 6; // £6-£86
          }
          break;
        default: // INR
          switch (category) {
            case 'food': amount = Math.floor(Math.random() * 800) + 50; break;
            case 'shopping': amount = Math.floor(Math.random() * 5000) + 200; break;
            default: amount = Math.floor(Math.random() * 1000) + 100; break;
          }
      }
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      type: type === 'credit' ? 'credit' : 'debit',
      amount: amount,
      currency: currency, // ✅ ADD CURRENCY TO EACH TRANSACTION
      merchant: merchant,
      category: category,
      bank: banks[Math.floor(Math.random() * banks.length)],
      timestamp: date.toISOString(),
      description: `${type === 'credit' ? 'Credit' : 'Payment'} to ${merchant}`,
    };
  };

  // Generate transactions (same logic as before)
  const transactions = [];
  const now = new Date();

  for (let i = 0; i < 90; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const isToday = i === 0;
    const isThisWeek = i < 7;
    const isThisMonth = i < 30;
    
    let dailyTransactionCount;
    if (isToday) dailyTransactionCount = Math.floor(Math.random() * 4) + 2;
    else if (isThisWeek) dailyTransactionCount = Math.floor(Math.random() * 6) + 1;
    else if (isThisMonth) dailyTransactionCount = Math.floor(Math.random() * 4) + 1;
    else dailyTransactionCount = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < dailyTransactionCount; j++) {
      const randomHour = Math.floor(Math.random() * 24);
      const randomMinute = Math.floor(Math.random() * 60);
      const transactionDate = new Date(date);
      transactionDate.setHours(randomHour, randomMinute, 0, 0);
      
      const transactionType = Math.random() < 0.15 ? 'credit' : 'debit';
      
      transactions.push(generateTransaction(transactionDate, transactionType));
    }
  }

  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return transactions;
};

export const dummyTransactions = generateDummyData();

// Enhanced summary with currency info
export const getDataSummary = () => {
  const total = dummyTransactions.length;
  const debits = dummyTransactions.filter(t => t.type === 'debit').length;
  const credits = dummyTransactions.filter(t => t.type === 'credit').length;
  
  // Currency distribution
  const currencyDistribution = {};
  dummyTransactions.forEach(t => {
    currencyDistribution[t.currency] = (currencyDistribution[t.currency] || 0) + 1;
  });

  return {
    totalTransactions: total,
    debitTransactions: debits,
    creditTransactions: credits,
    currencyDistribution: currencyDistribution,
    dateRange: {
      oldest: dummyTransactions[dummyTransactions.length - 1]?.timestamp,
      newest: dummyTransactions[0]?.timestamp
    }
  };
};

console.log('💰 Multi-Currency Dummy Data Generated:', getDataSummary());
