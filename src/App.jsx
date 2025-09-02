import React, { useState, useEffect, useCallback } from 'react';
import WalletInput from './components/WalletInput';
import SimplePortfolio from './components/SimplePortfolio';
import SettingsPanel from './components/SettingsPanel';
import HeliusApiService from './services/heliusApi';
import currencyService from './services/currencyService';
import storage from './services/storage';
import './App.css';

const REFRESH_INTERVAL = 60; // 60 seconds

function App() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [rawPortfolioData, setRawPortfolioData] = useState(null); // Store raw USD data
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [hasWallets, setHasWallets] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showSettings, setShowSettings] = useState(false);
  const [apiService, setApiService] = useState(null);
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  
  // Auto-refresh timer
  const [refreshTimer, setRefreshTimer] = useState(null);

  // Initialize API service and app state from storage
  useEffect(() => {
    const savedWallets = storage.getWallets();
    const savedPortfolioData = storage.getLastPortfolioData();
    const savedCurrency = storage.getCurrency();
    const heliusApiKey = storage.getHeliusApiKey();
    const moralisApiKey = storage.getMoralisApiKey();
    
    // Initialize API service with stored keys
    const service = new HeliusApiService(heliusApiKey, moralisApiKey);
    setApiService(service);
    setApiKeysConfigured(!!(heliusApiKey && moralisApiKey));
    
    // Migration: Convert old single wallet to new format
    const legacyWallet = storage.get('walletAddress', '');
    if (legacyWallet && savedWallets.length === 0) {
      const migratedWallet = {
        id: '1',
        address: legacyWallet,
        name: 'Main Wallet',
        enabled: true
      };
      storage.setWallets([migratedWallet]);
      storage.remove('walletAddress'); // Clean up legacy storage
      setWallets([migratedWallet]);
      setHasWallets(true);
    } else if (savedWallets.length > 0) {
      setWallets(savedWallets);
      setHasWallets(true);
    }

    setSelectedCurrency(savedCurrency);

    if (savedPortfolioData) {
      setRawPortfolioData(savedPortfolioData); // Store as raw data
    }
  }, []);

  // Set up auto-refresh timer
  useEffect(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    if (hasWallets && wallets.length > 0 && apiKeysConfigured) {
      const timer = setInterval(() => {
        refreshPortfolio();
      }, REFRESH_INTERVAL * 1000);

      setRefreshTimer(timer);

      return () => clearInterval(timer);
    }
  }, [hasWallets, wallets, apiKeysConfigured]);

  // Listen for Electron messages
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onRefreshPortfolio(() => {
        refreshPortfolio();
      });

      return () => {
        window.electronAPI.removeAllListeners('refresh-portfolio');
      };
    }
  }, []);

  // Convert raw data when currency changes
  useEffect(() => {
    if (rawPortfolioData && selectedCurrency) {
      const convertData = async () => {
        try {
          console.log('Converting data for currency:', selectedCurrency);
          console.log('Raw data sample token:', rawPortfolioData.tokens?.[0]);
          const convertedData = await currencyService.convertPortfolioData(rawPortfolioData, selectedCurrency);
          console.log('Converted data sample token:', convertedData.tokens?.[0]);
          setPortfolioData(convertedData);
        } catch (error) {
          console.error('Error converting portfolio data:', error);
          setPortfolioData(rawPortfolioData); // Fallback to raw data
        }
      };
      convertData();
    }
  }, [rawPortfolioData, selectedCurrency]);

  // Update tray tooltip when portfolio value changes
  useEffect(() => {
    if (portfolioData && window.electronAPI) {
      const symbol = currencyService.getCurrencySymbol(selectedCurrency);
      // Use simple number formatting without toLocaleString to avoid $ symbols
      const value = Number(portfolioData.totalValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const formattedValue = `${symbol}${value}`;
      window.electronAPI.updateTrayTooltip(formattedValue);
    }
  }, [portfolioData, selectedCurrency]);



  const refreshPortfolio = useCallback(async () => {
    if (!wallets || wallets.length === 0 || !apiService || !apiKeysConfigured) return;

    setIsLoading(true);
    try {
      const rawData = await apiService.getPortfolioData(wallets);
      
      // Store raw USD data
      setRawPortfolioData(rawData);
      storage.setLastPortfolioData(rawData); // Store raw USD data
      
      // The useEffect will handle conversion automatically
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
      // Don't show error to user, just log it
    } finally {
      setIsLoading(false);
    }
  }, [apiService, wallets, apiKeysConfigured]);

  // Initial data fetch when wallets are set
  useEffect(() => {
    if (hasWallets && wallets.length > 0 && !portfolioData && apiKeysConfigured) {
      refreshPortfolio();
    }
  }, [hasWallets, wallets, portfolioData, refreshPortfolio, apiKeysConfigured]);

  const handleWalletSubmit = (address) => {
    const newWallet = {
      id: Date.now().toString(),
      address: address,
      name: 'Main Wallet',
      enabled: true
    };
    
    const newWallets = [newWallet];
    setWallets(newWallets);
    setHasWallets(true);
    storage.setWallets(newWallets);
    
    // Clear any existing portfolio data
    setPortfolioData(null);
    setRawPortfolioData(null);
    
    // Fetch new portfolio data will happen via useEffect
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };
  
  const handleCloseSettings = () => {
    setShowSettings(false);
  };
  
  const handleWalletsChange = (newWallets) => {
    setWallets(newWallets);
    storage.setWallets(newWallets);
    
    // If no wallets left, reset state
    if (newWallets.length === 0) {
      setHasWallets(false);
      setPortfolioData(null);
      setRawPortfolioData(null);
      storage.remove('lastPortfolioData');
      
      // Clear refresh timer
      if (refreshTimer) {
        clearInterval(refreshTimer);
        setRefreshTimer(null);
      }
    } else {
      setHasWallets(true);
      // Clear existing data to force refresh with new wallet set
      setPortfolioData(null);
      setRawPortfolioData(null);
    }
  };

  const handleCurrencyChange = (newCurrency) => {
    setSelectedCurrency(newCurrency);
    storage.setCurrency(newCurrency);
    // The useEffect will handle the conversion automatically
  };

  const handleApiKeysChange = (heliusApiKey, moralisApiKey) => {
    // Save to storage
    storage.setHeliusApiKey(heliusApiKey);
    storage.setMoralisApiKey(moralisApiKey);
    
    // Update API service
    if (apiService) {
      apiService.setHeliusApiKey(heliusApiKey);
      apiService.setMoralisApiKey(moralisApiKey);
    }
    
    // Update configuration status
    setApiKeysConfigured(!!(heliusApiKey && moralisApiKey));
  };

  return (
    <div className="app">
      {!hasWallets ? (
        <WalletInput 
          onWalletSubmit={handleWalletSubmit}
          isLoading={isLoading}
        />
      ) : (
        <>
          <SimplePortfolio
            portfolioData={portfolioData}
            isLoading={isLoading}
            onRefresh={refreshPortfolio}
            onShowSettings={handleShowSettings}
            wallets={wallets}
            selectedCurrency={selectedCurrency}
            onCurrencyChange={handleCurrencyChange}
            apiKeysConfigured={apiKeysConfigured}
          />
          <SettingsPanel
            isVisible={showSettings}
            onClose={handleCloseSettings}
            wallets={wallets}
            onWalletsChange={handleWalletsChange}
            onApiKeysChange={handleApiKeysChange}
            apiKeysConfigured={apiKeysConfigured}
          />
        </>
      )}
    </div>
  );
}

export default App;