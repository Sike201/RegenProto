import React, { useState, useEffect } from 'react';
import { RefreshCw, Settings, Plus, Eye, EyeOff } from 'lucide-react';
import './PortfolioDisplay.css';

const PortfolioDisplay = ({ 
  portfolioData, 
  isLoading, 
  onRefresh, 
  onShowSettings,
  currency = 'USD',
  hideBalances = false,
  onToggleBalances
}) => {
  const [displayValue, setDisplayValue] = useState('0.00');
  
  useEffect(() => {
    if (portfolioData && portfolioData.totalValue) {
      setDisplayValue(portfolioData.totalValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }));
    }
  }, [portfolioData]);

  const getCurrencySymbol = (curr) => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'JPY': '¥',
      'GBP': '£'
    };
    return symbols[curr] || '$';
  };

  const formatBalance = (value) => {
    if (hideBalances) return '••••••';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatTokenAmount = (amount, decimals = 6) => {
    if (hideBalances) return '••••••';
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  };

  return (
    <div className="portfolio-container">
      {/* Header */}
      <div className="portfolio-header">
        <div className="header-actions">
          <button 
            className="action-btn" 
            onClick={onToggleBalances}
            title={hideBalances ? 'Show balances' : 'Hide balances'}
          >
            {hideBalances ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button 
            className={`action-btn ${isLoading ? 'loading' : ''}`}
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh portfolio"
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          </button>
          <button 
            className="action-btn" 
            onClick={onShowSettings}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Total Portfolio Value */}
      <div className="total-value-section">
        <div className="total-label">Total Portfolio</div>
        <div className="total-value">
          {getCurrencySymbol(currency)}{hideBalances ? '••••••' : displayValue}
        </div>
        {portfolioData?.change24h !== undefined && (
          <div className={`change-24h ${portfolioData.change24h >= 0 ? 'positive' : 'negative'}`}>
            {portfolioData.change24h >= 0 ? '+' : ''}{portfolioData.change24h.toFixed(2)}%
            <span className="change-label">24h</span>
          </div>
        )}
      </div>

      {/* Portfolio Breakdown */}
      <div className="portfolio-breakdown">
        <div className="section-title">Holdings</div>
        
        {isLoading ? (
          <div className="loading-skeleton">
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
          </div>
        ) : portfolioData?.tokens?.length > 0 ? (
          <div className="tokens-list">
            {portfolioData.tokens.map((token, index) => (
              <div key={index} className="token-item">
                <div className="token-info">
                  <div className="token-name">{token.name || token.symbol}</div>
                  <div className="token-amount">
                    {formatTokenAmount(token.amount)} {token.symbol}
                  </div>
                </div>
                <div className="token-value">
                  <div className="token-usd-value">
                    {getCurrencySymbol(currency)}{formatBalance(token.value || 0)}
                  </div>
                  {token.price && (
                    <div className="token-price">
                      {getCurrencySymbol(currency)}{token.price.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-message">No tokens found</div>
            <div className="empty-description">
              Add your Solana wallet address in settings to see your portfolio
            </div>
            <button className="add-wallet-btn" onClick={onShowSettings}>
              <Plus size={16} />
              Add Wallet
            </button>
          </div>
        )}
      </div>

      {/* NFTs Section (if available) */}
      {portfolioData?.nfts && portfolioData.nfts.length > 0 && (
        <div className="nfts-section">
          <div className="section-title">NFTs ({portfolioData.nfts.length})</div>
          <div className="nfts-value">
            {getCurrencySymbol(currency)}{formatBalance(portfolioData.nftsValue || 0)}
          </div>
        </div>
      )}

      {/* Last Updated */}
      {portfolioData?.lastUpdated && (
        <div className="last-updated">
          Last updated: {new Date(portfolioData.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default PortfolioDisplay;
