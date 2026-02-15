import AsyncStorage from '@react-native-async-storage/async-storage';

// Enhanced Currency conversion service with offline support and persistence
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/';
const FALLBACK_API_URL = 'https://api.fixer.io/latest?access_key=YOUR_API_KEY&base=';
const STORAGE_KEY = 'currencyService_exchangeRates';
const LAST_UPDATE_KEY = 'currencyService_lastUpdate';

class CurrencyService {
  constructor() {
    this.exchangeRates = {};
    this.lastUpdate = null;
    this.baseCurrency = 'USD'; // API base currency
    this.updateInterval = 30 * 60 * 1000; // Update every 30 minutes
    this.isInitialized = false;
    this.isOnline = true;
  }

  // Initialize service with cached data
  async initialize() {
    try {
      // Load cached rates first
      await this.loadCachedRates();
      
      // Check if we need to update rates
      if (this.needsUpdate()) {
        await this.fetchExchangeRates('USD');
      }
      
      this.isInitialized = true;
      console.log('✅ Currency service initialized');
    } catch (error) {
      console.log('❌ Currency service initialization failed:', error.message);
      this.setFallbackRates();
      this.isInitialized = true;
    }
  }

  // Load cached exchange rates from storage
  async loadCachedRates() {
    try {
      const cachedRates = await AsyncStorage.getItem(STORAGE_KEY);
      const cachedUpdate = await AsyncStorage.getItem(LAST_UPDATE_KEY);
      
      if (cachedRates && cachedUpdate) {
        this.exchangeRates = JSON.parse(cachedRates);
        this.lastUpdate = new Date(cachedUpdate);
        console.log('📱 Loaded cached exchange rates:', Object.keys(this.exchangeRates).length, 'currencies');
        return true;
      }
    } catch (error) {
      console.log('❌ Failed to load cached rates:', error.message);
    }
    return false;
  }

  // Save exchange rates to storage
  async saveCachedRates() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.exchangeRates));
      await AsyncStorage.setItem(LAST_UPDATE_KEY, this.lastUpdate.toISOString());
      console.log('💾 Exchange rates cached successfully');
    } catch (error) {
      console.log('❌ Failed to cache rates:', error.message);
    }
  }

  // Check network connectivity
  async checkNetworkConnectivity() {
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        timeout: 5000 
      });
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
    }
    return this.isOnline;
  }

  // Get live exchange rates with multiple API fallbacks
  async fetchExchangeRates(baseCurrency = 'USD') {
    // Check network connectivity first
    await this.checkNetworkConnectivity();
    
    if (!this.isOnline) {
      console.log('📡 No internet connection, using cached rates');
      return false;
    }

    try {
      // Try primary API
      const success = await this.fetchFromPrimaryAPI(baseCurrency);
      if (success) return true;

      // Try fallback API if primary fails
      console.log('🔄 Primary API failed, trying fallback...');
      const fallbackSuccess = await this.fetchFromFallbackAPI(baseCurrency);
      if (fallbackSuccess) return true;

      // If both APIs fail, use hardcoded fallback
      console.log('🔄 All APIs failed, using hardcoded rates');
      this.setFallbackRates();
      return false;

    } catch (error) {
      console.log('❌ Exchange rate fetch failed:', error.message);
      this.setFallbackRates();
      return false;
    }
  }

  // Fetch from primary API
  async fetchFromPrimaryAPI(baseCurrency) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${EXCHANGE_API_URL}${baseCurrency}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.rates && Object.keys(data.rates).length > 0) {
        this.exchangeRates = {
          ...data.rates,
          [baseCurrency]: 1 // Base currency always 1
        };
        this.baseCurrency = baseCurrency;
        this.lastUpdate = new Date();
        
        // Cache the new rates
        await this.saveCachedRates();
        
        console.log('✅ Primary API - Exchange rates updated:', Object.keys(this.exchangeRates).length, 'currencies');
        return true;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('⏱️ Primary API request timed out');
      } else {
        console.log('❌ Primary API error:', error.message);
      }
    }
    return false;
  }

  // Fetch from fallback API (you need to add your API key)
  async fetchFromFallbackAPI(baseCurrency) {
    try {
      // Replace YOUR_API_KEY with actual API key from fixer.io
      const apiKey = 'YOUR_ACTUAL_FIXER_API_KEY';
      if (apiKey === 'YOUR_ACTUAL_FIXER_API_KEY') {
        console.log('⚠️ Fixer.io API key not configured');
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
      
      if (data && data.rates) {
        this.exchangeRates = {
          ...data.rates,
          [baseCurrency]: 1
        };
        this.baseCurrency = baseCurrency;
        this.lastUpdate = new Date();
        
        await this.saveCachedRates();
        
        console.log('✅ Fallback API - Exchange rates updated');
        return true;
      }
    } catch (error) {
      console.log('❌ Fallback API error:', error.message);
    }
    return false;
  }

  // Enhanced fallback rates with more currencies
  setFallbackRates() {
    this.exchangeRates = {
      'USD': 1.0,
      'EUR': 0.85,
      'GBP': 0.73,
      'INR': 83.12,
      'JPY': 149.50,
      'AUD': 1.52,
      'CAD': 1.35,
      'CHF': 0.92,
      'CNY': 7.24,
      'SEK': 10.89,
      'NZD': 1.64,
      'MXN': 18.05,
      'SGD': 1.35,
      'HKD': 7.84,
      'NOK': 10.73,
      'KRW': 1338.50,
      'TRY': 27.85,
      'RUB': 92.50,
      'BRL': 5.05,
      'ZAR': 18.75,
    };
    this.baseCurrency = 'USD';
    this.lastUpdate = new Date();
    console.log('⚠️ Using enhanced fallback exchange rates');
  }

  // Convert amount from one currency to another with validation
  convertAmount(amount, fromCurrency, toCurrency) {
    // Validate inputs
    if (!amount || isNaN(amount) || amount < 0) {
      console.warn('Invalid amount for conversion:', amount);
      return 0;
    }

    if (!fromCurrency || !toCurrency) {
      console.warn('Invalid currencies:', fromCurrency, '->', toCurrency);
      return amount;
    }

    if (fromCurrency === toCurrency) return amount;
    
    if (!this.exchangeRates[fromCurrency] || !this.exchangeRates[toCurrency]) {
      console.warn(`Currency not available: ${fromCurrency} -> ${toCurrency}`);
      console.warn('Available currencies:', Object.keys(this.exchangeRates));
      return amount; // Return original if conversion not possible
    }

    try {
      // Convert: amount -> USD -> target currency
      const amountInBase = amount / this.exchangeRates[fromCurrency];
      const convertedAmount = amountInBase * this.exchangeRates[toCurrency];
      
      const result = Math.round(convertedAmount * 100) / 100; // Round to 2 decimals
      
      // Log conversion for debugging
      console.log(`💱 Converted ${amount} ${fromCurrency} = ${result} ${toCurrency}`);
      
      return result;
    } catch (error) {
      console.error('Conversion error:', error);
      return amount;
    }
  }

  // Enhanced currency symbols with more options
  getCurrencySymbol(currency) {
    const symbols = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥',
      'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'CNY': '¥', 'SEK': 'kr',
      'NZD': 'NZ$', 'MXN': '$', 'SGD': 'S$', 'HKD': 'HK$', 'NOK': 'kr',
      'KRW': '₩', 'TRY': '₺', 'RUB': '₽', 'BRL': 'R$', 'ZAR': 'R'
    };
    return symbols[currency] || currency;
  }

  // Enhanced formatting with locale support
  formatAmount(amount, currency) {
    if (!amount || isNaN(amount)) return `${this.getCurrencySymbol(currency)}0.00`;
    
    const symbol = this.getCurrencySymbol(currency);
    
    try {
      // Use different formatting for different currencies
      let options = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      };

      // Japanese Yen and Korean Won don't use decimals
      if (currency === 'JPY' || currency === 'KRW') {
        options = {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        };
      }

      const formatted = amount.toLocaleString('en-US', options);
      return `${symbol}${formatted}`;
    } catch (error) {
      console.error('Formatting error:', error);
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  // Check if rates need updating (with offline consideration)
  needsUpdate() {
    if (!this.lastUpdate) return true;
    if (!this.isOnline) return false; // Don't update if offline
    
    const now = new Date();
    return (now - this.lastUpdate) > this.updateInterval;
  }

  // Get exchange rate between two currencies with caching
  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;
    
    if (!this.exchangeRates[fromCurrency] || !this.exchangeRates[toCurrency]) {
      console.warn(`Exchange rate not available: ${fromCurrency} -> ${toCurrency}`);
      return null;
    }

    const rate = this.exchangeRates[toCurrency] / this.exchangeRates[fromCurrency];
    return Math.round(rate * 10000) / 10000; // Round to 4 decimals
  }

  // Get all available currencies with names
  getAvailableCurrencies() {
    const currencyNames = {
      'USD': 'US Dollar', 'EUR': 'Euro', 'GBP': 'British Pound', 
      'INR': 'Indian Rupee', 'JPY': 'Japanese Yen', 'AUD': 'Australian Dollar',
      'CAD': 'Canadian Dollar', 'CHF': 'Swiss Franc', 'CNY': 'Chinese Yuan',
      'SEK': 'Swedish Krona', 'NZD': 'New Zealand Dollar', 'MXN': 'Mexican Peso',
      'SGD': 'Singapore Dollar', 'HKD': 'Hong Kong Dollar', 'NOK': 'Norwegian Krone',
      'KRW': 'South Korean Won', 'TRY': 'Turkish Lira', 'RUB': 'Russian Ruble',
      'BRL': 'Brazilian Real', 'ZAR': 'South African Rand'
    };

    return Object.keys(this.exchangeRates).map(code => ({
      code,
      name: currencyNames[code] || code,
      symbol: this.getCurrencySymbol(code)
    }));
  }

  // Get service status
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

  // Force refresh rates
  async forceRefresh() {
    console.log('🔄 Force refreshing exchange rates...');
    this.lastUpdate = null; // Force update
    return await this.fetchExchangeRates(this.baseCurrency);
  }

  // Clear cached data
  async clearCache() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(LAST_UPDATE_KEY);
      this.exchangeRates = {};
      this.lastUpdate = null;
      console.log('🗑️ Exchange rate cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();

// Enhanced helper functions with error handling
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (!currencyService.isInitialized) {
    console.warn('Currency service not initialized, using fallback');
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

export const getExchangeRate = (from, to) => {
  return currencyService.getExchangeRate(from, to);
};

export const getCurrencySymbol = (currency) => {
  return currencyService.getCurrencySymbol(currency);
};

export const getAvailableCurrencies = () => {
  return currencyService.getAvailableCurrencies();
};

// Export the CURRENCIES array for the settings screen
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
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

// Initialize on app startup with error handling
currencyService.initialize().catch(error => {
  console.error('Currency service initialization failed:', error);
});

// Export service status for debugging
export const getCurrencyServiceStatus = () => currencyService.getStatus();
export const refreshCurrencyRates = () => currencyService.forceRefresh();
export const clearCurrencyCache = () => currencyService.clearCache();
