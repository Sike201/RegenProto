import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Settings, DollarSign } from 'lucide-react';
import currencyService from '../services/currencyService';
import './SimplePortfolio.css';

const SimplePortfolio = ({ 
  portfolioData, 
  isLoading, 
  onRefresh, 
  onShowSettings,
  wallets = [],
  selectedCurrency = 'USD',
  onCurrencyChange,
  apiKeysConfigured = false
}) => {
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  // Get currencies and ensure symbols are properly defined
  const supportedCurrencies = currencyService.getSupportedCurrencies().map(currency => ({
    ...currency,
    symbol: currency.symbol || (currency.code === 'EUR' ? '€' : currency.code === 'GBP' ? '£' : currency.code === 'JPY' ? '¥' : '$')
  }));
  const formatValue = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    // Use a simple number format without any potential currency symbols
    const formatted = Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    console.log('formatValue input:', value, 'output:', formatted);
    return formatted;
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '0.00';
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(2) + 'M';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(2) + 'K';
    }
    // Use simple number formatting without any potential currency symbols
    return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatPrice = (price) => {
    if (!price || price === 0 || isNaN(price)) return '0.0000';
    if (price < 0.0001) return Number(price).toExponential(2);
    if (price < 0.01) return Number(price).toFixed(6);
    if (price < 1) return Number(price).toFixed(4);
    return Number(price).toFixed(2);
  };

  const formatWalletAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const formatWalletsDisplay = () => {
    if (!wallets || wallets.length === 0) return 'NO_WALLETS';
    const enabledWallets = wallets.filter(w => w.enabled);
    if (enabledWallets.length === 0) return 'NO_ENABLED_WALLETS';
    if (enabledWallets.length === 1) {
      return formatWalletAddress(enabledWallets[0].address);
    }
    return `${enabledWallets.length}_WALLETS`;
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCurrencySymbol = () => {
    const symbol = currencyService.getCurrencySymbol(selectedCurrency);
    console.log('getCurrencySymbol:', symbol, 'for currency:', selectedCurrency);
    return symbol || '$'; // Fallback to $ if symbol is undefined
  };

  const handleCurrencySelect = (currency) => {
    onCurrencyChange(currency);
    setShowCurrencyMenu(false);
  };

  const containerRef = useRef(null);

  // Auto-resize window based on content
  useEffect(() => {
    if (containerRef.current && window.electronAPI) {
      const resizeWindow = () => {
        const rect = containerRef.current.getBoundingClientRect();
        const contentHeight = containerRef.current.scrollHeight;
        const newHeight = Math.max(300, Math.min(800, contentHeight + 20));
        window.electronAPI.resizeWindow(newHeight);
      };

      // Resize after content loads
      const timer = setTimeout(resizeWindow, 100);
      
      return () => clearTimeout(timer);
    }
  }, [portfolioData?.tokens]);

  return (
    <div className="terminal-container" ref={containerRef}>
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-prompt">$</span>
          <span className="terminal-path">REGEN_PORTFOLIO</span>
          <span className="terminal-time">[{getCurrentTime()}]</span>
        </div>
        <div className="terminal-controls">
          <div className="currency-selector">
            <button 
              className="terminal-btn currency-btn"
              onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
              title="Change Currency"
            >
              <span className="currency-symbol-btn">{getCurrencySymbol()}</span>
              <span className="currency-code">{selectedCurrency}</span>
            </button>
            {showCurrencyMenu && (
              <div className="currency-menu">
                {supportedCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    className={`currency-option ${selectedCurrency === currency.code ? 'selected' : ''}`}
                    onClick={() => handleCurrencySelect(currency.code)}
                  >
                    <span className="currency-symbol">{currency.symbol}</span>
                    <span className="currency-name">{currency.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            className={`terminal-btn ${isLoading ? 'loading' : ''}`}
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw size={12} className={isLoading ? 'spin' : ''} />
          </button>
          <button 
            className="terminal-btn" 
            onClick={onShowSettings}
            title="Settings"
          >
            <Settings size={12} />
          </button>
        </div>
      </div>

      {/* API Keys Setup Message */}
      {!apiKeysConfigured && (
        <div className="terminal-summary setup-required">
          <div className="summary-line warning">
            <span className="label">⚠️ SETUP_REQUIRED:</span>
            <span className="value">API_KEYS_NOT_CONFIGURED</span>
          </div>
          <div className="summary-line">
            <span className="label">ACTION:</span>
            <span className="value">Click Settings → API_KEYS to configure</span>
          </div>
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="terminal-summary">
        <div className="summary-line">
          <span className="label">WALLETS:</span>
          <span className="value mono">{formatWalletsDisplay()}</span>
        </div>
        <div className="summary-line total">
          <span className="label">TOTAL_VALUE:</span>
          <span className="value mono highlight">{getCurrencySymbol()}{formatValue(portfolioData?.totalValue)}</span>
        </div>
        <div className="summary-line">
          <span className="label">ASSETS:</span>
          <span className="value mono">{portfolioData?.tokens?.length || 0}</span>
        </div>
      </div>

      {/* Terminal Table */}
      {portfolioData?.tokens && portfolioData.tokens.length > 0 && (
        <div className="terminal-table">
          <div className="table-header">
            <div className="col-symbol">SYMBOL</div>
            <div className="col-amount">AMOUNT</div>
            <div className="col-price">PRICE</div>
            <div className="col-value">VALUE</div>
          </div>
          <div className="table-body">
            {portfolioData.tokens.map((token, index) => (
              <div key={index} className="table-row">
                <div className="col-symbol">
                  <span className="token-symbol">{token.symbol}</span>
                </div>
                <div className="col-amount mono">
                  {formatAmount(token.amount)}
                </div>
                <div className="col-price mono">
                  {getCurrencySymbol()}{formatPrice(token.price)}
                </div>
                <div className="col-value mono">
                  {getCurrencySymbol()}{formatValue(token.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Status Bar */}
      <div className="terminal-status">
        <span className="status-item">
          {portfolioData?.lastUpdated ? 
            `LAST_UPDATE: ${new Date(portfolioData.lastUpdated).toLocaleTimeString('en-US', { hour12: false })}` : 
            'NO_DATA'
          }
        </span>
        <span className="status-item">
          STATUS: {isLoading ? 'LOADING' : 'READY'}
        </span>
      </div>
    </div>
  );
};

export default SimplePortfolio;
