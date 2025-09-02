class StorageService {
  constructor() {
    this.prefix = 'solana-portfolio-';
  }

  getKey(key) {
    return this.prefix + key;
  }

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  // Specific methods for app settings
  getWallets() {
    return this.get('wallets', []);
  }

  setWallets(wallets) {
    return this.set('wallets', wallets);
  }

  getHeliusApiKey() {
    return this.get('heliusApiKey', '');
  }

  setHeliusApiKey(apiKey) {
    return this.set('heliusApiKey', apiKey);
  }

  getMoralisApiKey() {
    return this.get('moralisApiKey', '');
  }

  setMoralisApiKey(apiKey) {
    return this.set('moralisApiKey', apiKey);
  }

  // Legacy method for backward compatibility
  getApiKey() {
    return this.getHeliusApiKey();
  }

  setApiKey(apiKey) {
    return this.setHeliusApiKey(apiKey);
  }

  getCurrency() {
    return this.get('currency', 'USD');
  }

  setCurrency(currency) {
    return this.set('currency', currency);
  }

  getRefreshInterval() {
    return this.get('refreshInterval', 60);
  }

  setRefreshInterval(interval) {
    return this.set('refreshInterval', interval);
  }

  getHideBalances() {
    return this.get('hideBalances', false);
  }

  setHideBalances(hide) {
    return this.set('hideBalances', hide);
  }

  getLastPortfolioData() {
    return this.get('lastPortfolioData', null);
  }

  setLastPortfolioData(data) {
    return this.set('lastPortfolioData', data);
  }
}

const storage = new StorageService();
export default storage;
