class CurrencyService {
  constructor() {
    this.exchangeRatesKey = 'regen-portfolio-exchange-rates';
    this.exchangeDateKey = 'regen-portfolio-exchange-date';
    this.baseUrl = 'https://api.exchangerate-api.com/v4/latest/USD';
    this.defaultRates = {
      USD: 1.0,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      CAD: 1.25,
      AUD: 1.35,
      CHF: 0.92,
      CNY: 6.45
    };
  }

  /**
   * Get today's date as a string for comparison
   */
  getTodayString() {
    return new Date().toDateString();
  }

  /**
   * Check if cached exchange rates are from today
   */
  areRatesFromToday() {
    const cachedDate = localStorage.getItem(this.exchangeDateKey);
    const today = this.getTodayString();
    return cachedDate === today;
  }

  /**
   * Get cached exchange rates from localStorage
   */
  getCachedRates() {
    try {
      const rates = localStorage.getItem(this.exchangeRatesKey);
      return rates ? JSON.parse(rates) : null;
    } catch (error) {
      console.error('Error parsing cached exchange rates:', error);
      return null;
    }
  }

  /**
   * Store exchange rates in localStorage with today's date
   */
  cacheRates(rates) {
    try {
      localStorage.setItem(this.exchangeRatesKey, JSON.stringify(rates));
      localStorage.setItem(this.exchangeDateKey, this.getTodayString());
      console.log('💰 Exchange rates cached successfully for', this.getTodayString());
    } catch (error) {
      console.error('Error caching exchange rates:', error);
    }
  }

  /**
   * Fetch fresh exchange rates from ExchangeRate-API
   */
  async fetchFreshRates() {
    try {
      console.log('🌐 Fetching fresh exchange rates from API...');
      const response = await fetch(this.baseUrl);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.rates) {
        console.log('✅ Fresh exchange rates fetched successfully');
        return data.rates;
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('❌ Error fetching exchange rates:', error);
      console.log('🔄 Falling back to default rates');
      return this.defaultRates;
    }
  }

  /**
   * Get current exchange rates (cached if from today, otherwise fetch fresh)
   */
  async getExchangeRates() {
    // Check if we have today's rates cached
    if (this.areRatesFromToday()) {
      const cachedRates = this.getCachedRates();
      if (cachedRates) {
        console.log('💾 Using cached exchange rates from today');
        return cachedRates;
      }
    }

    // Fetch fresh rates and cache them
    const freshRates = await this.fetchFreshRates();
    this.cacheRates(freshRates);
    return freshRates;
  }

  /**
   * Convert USD amount to target currency
   */
  async convertFromUSD(usdAmount, targetCurrency = 'USD') {
    if (targetCurrency === 'USD') {
      return usdAmount;
    }

    try {
      const rates = await this.getExchangeRates();
      const rate = rates[targetCurrency];
      
      if (!rate) {
        console.warn(`Exchange rate not found for ${targetCurrency}, using USD`);
        return usdAmount;
      }

      return usdAmount * rate;
    } catch (error) {
      console.error('Error converting currency:', error);
      return usdAmount; // Fallback to USD
    }
  }

  /**
   * Convert portfolio data to target currency
   */
  async convertPortfolioData(portfolioData, targetCurrency = 'USD') {
    if (!portfolioData || targetCurrency === 'USD') {
      return portfolioData;
    }

    try {
      const rates = await this.getExchangeRates();
      const rate = rates[targetCurrency];
      
      if (!rate) {
        console.warn(`Exchange rate not found for ${targetCurrency}, keeping USD`);
        return portfolioData;
      }

      // Convert the portfolio data
      const convertedData = {
        ...portfolioData,
        totalValue: portfolioData.totalValue * rate,
        tokens: portfolioData.tokens.map(token => ({
          ...token,
          value: token.value * rate,
          price: token.price * rate
        }))
      };

      return convertedData;
    } catch (error) {
      console.error('Error converting portfolio data:', error);
      return portfolioData; // Fallback to original data
    }
  }

  /**
   * Get currency symbol for display
   */
  getCurrencySymbol(currencyCode) {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'Fr',
      CNY: '¥'
    };
    return symbols[currencyCode] || currencyCode;
  }

  /**
   * Get list of supported currencies
   */
  getSupportedCurrencies() {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' }
    ];
  }

  /**
   * Clear cached rates (useful for testing or force refresh)
   */
  clearCache() {
    localStorage.removeItem(this.exchangeRatesKey);
    localStorage.removeItem(this.exchangeDateKey);
    console.log('🗑️ Exchange rate cache cleared');
  }
}

// Export singleton instance
const currencyService = new CurrencyService();
export default currencyService;
