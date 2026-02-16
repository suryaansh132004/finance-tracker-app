// Currency converter - fetches live rates + offline caching
// Free exchangerate-api works great (1000 req/month)
// Fixer.io fallback needs free API key from fixer.io
// Feb 2026 rates - works fine out of the box!

import AsyncStorage from '@react-native-async-storage/async-storage';

const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/';
const FALLBACK_API_URL = 'https://api.fixer.io/latest?access_key=YOUR_FIXER_API_KEY&base=';
const STORAGE_KEY = 'currencyService_exchangeRates';
const LAST_UPDATE_KEY = 'currencyService_lastUpdate';

class CurrencyService {
  constructor() {
    this.exchangeRates = {};
    this.lastUpdate = null;
    this.baseCurrency = 'USD';
    this.updateInterval = 30 * 60 * 1000; // 30 mins
    this.isInitialized = false;
    this.isOnline = true;
  }

  // Load cached rates on startup
  async initialize() {
    try {
      await this.loadCachedRates();
      if (this.needsUpdate()) {
        await this.fetchExchangeRates('USD');
      }
      this.isInitialized = true;
      console.log('✅ Currency service ready');
    } catch (error) {
      console.log('❌ Currency init failed:', error.message);
      this.setFallbackRates();
      this.isInitialized = true;
    }
  }

  // Load from AsyncStorage
  async loadCachedRates() {
    try {
      const cachedRates = await AsyncStorage.getItem(STORAGE_KEY);
      const cachedUpdate = await AsyncStorage.getItem(LAST_UPDATE_KEY);
      
      if (cachedRates && cachedUpdate) {
        this.exchangeRates = JSON.parse(cachedRates);
        this.lastUpdate = new Date(cachedUpdate);
        console.log(`📱 Loaded ${Object.keys(this.exchangeRates).length} currencies from cache`);
        return true;
      }
    } catch (error) {
      console.log('❌ Cache load failed:', error.message);
    }
    return false;
  }

  // Save to AsyncStorage
  async saveCachedRates() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.exchangeRates));
      await AsyncStorage.setItem(LAST_UPDATE_KEY, this.lastUpdate.toISOString());
      console.log('💾 Rates cached');
    } catch (error) {
      console.log('❌ Cache save failed:', error.message);
    }
  }

  // Quick network check
  async checkNetworkConnectivity() {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
    }
    return this.isOnline;
  }

  // Fetch rates with fallbacks
  async fetchExchangeRates(baseCurrency = 'USD') {
    // Skip if offline
    await this.checkNetworkConnectivity();
    if (!this.isOnline) {
      console.log('📡 Offline - using cache');
      return false;
    }

    try {
      // Try free API first
      const success = await this.fetchFromPrimaryAPI(baseCurrency);
      if (success) return true;

      // Try Fixer fallback
      console.log('🔄 Free API down, trying Fixer...');
      const fallbackSuccess = await this.fetchFromFallbackAPI(baseCurrency);
      if (fallbackSuccess) return true;

      // Last resort hardcoded rates
      console.log('🔄 All APIs failed, using backup rates');
      this.setFallbackRates();
      return false;
    } catch (error) {
      console.log('❌ Fetch failed:', error.message);
      this.setFallbackRates();
      return false;
    }
  }

  // Free exchangerate-api.com (no key needed!)
  async fetchFromPrimaryAPI(baseCurrency) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${EXCHANGE_API_URL}${baseCurrency}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data?.rates && Object.keys(data.rates).length > 0) {
        this.exchangeRates = { ...data.rates, [baseCurrency]: 1 };
        this.baseCurrency = baseCurrency;
        this.lastUpdate = new Date();
        await this.saveCachedRates();
        console.log(`✅ Free API: ${Object.keys(this.exchangeRates).length} currencies`);
        return true;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('⏱️ Free API timed out');
      } else {
        console.log('❌ Free API failed:', error.message);
      }
    }
    return false;
  }

  // Fixer.io fallback - GET FREE KEY: https://fixer.io
  async fetchFromFallbackAPI(baseCurrency) {
    try {
      // 🔥 PASTE YOUR FIXER.IO API KEY HERE (FREE 1000 req/month)
      const apiKey = 'YOUR_FIXER_IO_API_KEY_HERE';
      
      if (apiKey === 'YOUR_FIXER_IO_API_KEY_HERE') {
        console.log('⚠️ Fixer.io: Add free API key from fixer.io');
        return false;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`https://api.fixer.io/latest?access_key=${apiKey}&base=${baseCurrency}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data?.rates) {
        this.exchangeRates = { ...data.rates, [baseCurrency]: 1 };
        this.baseCurrency = baseCurrency;
        this.lastUpdate = new Date();
        await this.saveCachedRates();
        console.log('✅ Fixer.io: Rates updated');
        return true;
      }
    } catch (error) {
      console.log('❌ Fixer.io failed:', error.message);
    }
    return false;
  }

  // Backup rates (Feb 2026 approx values)
  setFallbackRates() {
    this.exchangeRates = {
      'USD': 1.0,   'EUR': 0.92,  'GBP': 0.79,  'INR': 83.5,  'JPY': 150.2,
      'AUD': 1.48,  'CAD': 1.35,  'CHF': 0.86,  'CNY': 7.18,  'SEK': 10.45,
      'NZD': 1.67,  'MXN': 19.8,  'SGD': 1.34,  'HKD': 7.81,  'NOK': 10.65,
      'KRW': 1340,  'TRY': 32.1,  'RUB': 96.2,  'BRL': 5.55,  'ZAR': 18.9
    };
    this.baseCurrency = 'USD';
    this.lastUpdate = new Date('2026-02-16'); // Known good rates
    console.log('⚠️ Using backup rates (Feb 2026)');
  }

  // Convert ₹1000 -> $12.00
  convertAmount(amount, fromCurrency, toCurrency) {
    if (!amount || isNaN(amount) || amount < 0) {
      console.warn('Invalid amount:', amount);
      return 0;
    }
    if (!fromCurrency || !toCurrency) {
      console.warn('Missing currencies:', fromCurrency, '->', toCurrency);
      return amount;
    }
    if (fromCurrency === toCurrency) return amount;

    if (!this.exchangeRates[fromCurrency] || !this.exchangeRates[toCurrency]) {
      console.warn(`Missing rate: ${fromCurrency} -> ${toCurrency}`);
      return amount; // Can't convert
    }

    try {
      const amountInUSD = amount / this.exchangeRates[fromCurrency];
      const converted = amountInUSD * this.exchangeRates[toCurrency];
      const result = Math.round(converted * 100) / 100;
      console.log(`💱 ${amount} ${fromCurrency} = ${result} ${toCurrency}`);
      return result;
    } catch (error) {
      console.error('Convert error:', error);
      return amount;
    }
  }

  // Get $ ₹ € etc symbols
  getCurrencySymbol(currency) {
    const symbols = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥',
      'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'CNY': '¥', 'SEK': 'kr',
      'NZD': 'NZ$', 'MXN': '$', 'SGD': 'S$', 'HKD': 'HK$', 'NOK': 'kr',
      'KRW': '₩', 'TRY': '₺', 'RUB': '₽', 'BRL': 'R$', 'ZAR': 'R'
    };
    return symbols[currency] || currency;
  }

  // Format ₹1,234.56
  formatAmount(amount, currency) {
    if (!amount || isNaN(amount)) return `${this.getCurrencySymbol(currency)}0.00`;
    
    const symbol = this.getCurrencySymbol(currency);
    try {
      let options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
      
      // No decimals for JPY/KRW
      if (currency === 'JPY' || currency === 'KRW') {
        options = { minimumFractionDigits: 0, maximumFractionDigits: 0 };
      }
      
      const formatted = amount.toLocaleString('en-US', options);
      return `${symbol}${formatted}`;
    } catch (error) {
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  // Needs fresh rates?
  needsUpdate() {
    if (!this.lastUpdate) return true;
    if (!this.isOnline) return false;
    const now = new Date();
    return (now - this.lastUpdate) > this.updateInterval;
  }

  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;
    if (!this.exchangeRates[fromCurrency] || !this.exchangeRates[toCurrency]) {
      console.warn(`No rate: ${fromCurrency} -> ${toCurrency}`);
      return null;
    }
    return Math.round((this.exchangeRates[toCurrency] / this.exchangeRates[fromCurrency]) * 10000) / 10000;
  }

  getAvailableCurrencies() {
    const names = {
      'USD': 'US Dollar', 'EUR': 'Euro', 'GBP': 'British Pound', 'INR': 'Indian Rupee',
      'JPY': 'Japanese Yen', 'AUD': 'Australian Dollar', 'CAD': 'Canadian Dollar',
      'CHF': 'Swiss Franc', 'CNY': 'Chinese Yuan', 'SEK': 'Swedish Krona', 'NZD': 'New Zealand Dollar',
      'MXN': 'Mexican Peso', 'SGD': 'Singapore Dollar', 'HKD': 'Hong Kong Dollar',
      'NOK': 'Norwegian Krone', 'KRW': 'South Korean Won', 'TRY': 'Turkish Lira',
      'RUB': 'Russian Ruble', 'BRL': 'Brazilian Real', 'ZAR': 'South African Rand'
    };
    
    return Object.keys(this.exchangeRates).map(code => ({
      code, name: names[code] || code, symbol: this.getCurrencySymbol(code)
    }));
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isOnline: this.isOnline,
      lastUpdate: this.lastUpdate,
      availableCurrencies: Object.keys(this.exchangeRates).length,
      baseCurrency: this.baseCurrency,
      needsUpdate: this.needsUpdate()
    };
  }

  async forceRefresh() {
    console.log('🔄 Force refresh...');
    this.lastUpdate = null;
    return await this.fetchExchangeRates(this.baseCurrency);
  }

  async clearCache() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(LAST_UPDATE_KEY);
      this.exchangeRates = {};
      this.lastUpdate = null;
      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  }
}

// Single global instance
export const currencyService = new CurrencyService();

// Helper functions
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (!currencyService.isInitialized) {
    console.warn('Currency service not ready, using backup');
    currencyService.setFallbackRates();
  }
  return currencyService.convertAmount(amount, fromCurrency, toCurrency);
};

export const formatCurrency = (amount, currency) => {
  if (!currencyService.isInitialized) {
    currencyService.setFallbackRates();
  }
  return currencyService.formatAmount(amount, currency);
};

export const getExchangeRate = (from, to) => currencyService.getExchangeRate(from, to);
export const getCurrencySymbol = (currency) => currencyService.getCurrencySymbol(currency);
export const getAvailableCurrencies = () => currencyService.getAvailableCurrencies();
export const getCurrencyServiceStatus = () => currencyService.getStatus();
export const refreshCurrencyRates = () => currencyService.forceRefresh();
export const clearCurrencyCache = () => currencyService.clearCache();

// Currency list for dropdowns
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' }
];

// Auto-init (safe to call multiple times)
currencyService.initialize().catch(console.error);

console.log('💱 Currency service loaded - FREE tier ready!');
