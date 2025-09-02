import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, AlertTriangle, Key, Eye, EyeOff } from 'lucide-react';
import storage from '../services/storage';
import './SettingsPanel.css';

const SettingsPanel = ({ 
  isVisible, 
  onClose, 
  wallets = [], 
  onWalletsChange,
  onApiKeysChange,
  apiKeysConfigured
}) => {
  const [localWallets, setLocalWallets] = useState(wallets);
  const [newWallet, setNewWallet] = useState('');
  const [errors, setErrors] = useState({});
  const [heliusApiKey, setHeliusApiKey] = useState('');
  const [moralisApiKey, setMoralisApiKey] = useState('');
  const [showHeliusKey, setShowHeliusKey] = useState(false);
  const [showMoralisKey, setShowMoralisKey] = useState(false);
  const [activeTab, setActiveTab] = useState('wallets');

  useEffect(() => {
    setLocalWallets(wallets);
  }, [wallets]);

  // Load API keys from storage
  useEffect(() => {
    if (isVisible) {
      const savedHeliusKey = storage.getHeliusApiKey();
      const savedMoralisKey = storage.getMoralisApiKey();
      setHeliusApiKey(savedHeliusKey);
      setMoralisApiKey(savedMoralisKey);
      
      // Show API keys tab if no keys are configured
      if (!apiKeysConfigured) {
        setActiveTab('api-keys');
      }
    }
  }, [isVisible, apiKeysConfigured]);

  const validateWalletAddress = (address) => {
    // Basic Solana address validation
    if (!address) return false;
    if (address.length < 32 || address.length > 44) return false;
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) return false;
    return true;
  };

  const addWallet = () => {
    if (!newWallet.trim()) {
      setErrors({ ...errors, newWallet: 'ERROR: No wallet address provided' });
      return;
    }

    if (!validateWalletAddress(newWallet.trim())) {
      setErrors({ ...errors, newWallet: 'ERROR: Invalid Solana wallet address' });
      return;
    }

    if (localWallets.some(w => w.address === newWallet.trim())) {
      setErrors({ ...errors, newWallet: 'ERROR: Wallet address already exists' });
      return;
    }

    const wallet = {
      id: Date.now().toString(),
      address: newWallet.trim(),
      name: `WALLET_${localWallets.length + 1}`,
      enabled: true
    };

    const updatedWallets = [...localWallets, wallet];
    setLocalWallets(updatedWallets);
    onWalletsChange(updatedWallets);
    setNewWallet('');
    setErrors({ ...errors, newWallet: null });
  };

  const removeWallet = (id) => {
    const updatedWallets = localWallets.filter(w => w.id !== id);
    setLocalWallets(updatedWallets);
    onWalletsChange(updatedWallets);
  };

  const toggleWallet = (id) => {
    const updatedWallets = localWallets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    setLocalWallets(updatedWallets);
    onWalletsChange(updatedWallets);
  };

  const updateWalletName = (id, name) => {
    const updatedWallets = localWallets.map(w => 
      w.id === id ? { ...w, name: name.toUpperCase().replace(/[^A-Z0-9_]/g, '_') } : w
    );
    setLocalWallets(updatedWallets);
    onWalletsChange(updatedWallets);
  };

  // API Key validation functions
  const validateHeliusApiKey = (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') return false;
    // Helius API keys are typically UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(apiKey);
  };

  const validateMoralisApiKey = (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') return false;
    // Moralis API keys are JWT tokens with 3 parts separated by dots
    const parts = apiKey.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  };

  const saveApiKeys = () => {
    const newErrors = {};

    if (!heliusApiKey.trim()) {
      newErrors.heliusApiKey = 'ERROR: Helius API key is required';
    } else if (!validateHeliusApiKey(heliusApiKey.trim())) {
      newErrors.heliusApiKey = 'ERROR: Invalid Helius API key format (should be UUID)';
    }

    if (!moralisApiKey.trim()) {
      newErrors.moralisApiKey = 'ERROR: Moralis API key is required';
    } else if (!validateMoralisApiKey(moralisApiKey.trim())) {
      newErrors.moralisApiKey = 'ERROR: Invalid Moralis API key format (should be JWT token)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors({ ...errors, ...newErrors });
      return;
    }

    // Save API keys
    onApiKeysChange(heliusApiKey.trim(), moralisApiKey.trim());
    setErrors({ ...errors, heliusApiKey: null, moralisApiKey: null });
    
    // Switch to wallets tab after successful save
    setActiveTab('wallets');
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addWallet();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="terminal-container settings-terminal">
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-prompt">$</span>
          <span className="terminal-path">SETTINGS_MANAGER</span>
          <span className="terminal-time">[{getCurrentTime()}]</span>
        </div>
        <div className="terminal-controls">
          <button className="terminal-btn" onClick={onClose}>
            <ArrowLeft size={12} />
            BACK
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="terminal-tabs">
        <button 
          className={`tab-btn ${activeTab === 'api-keys' ? 'active' : ''}`}
          onClick={() => setActiveTab('api-keys')}
        >
          <Key size={12} />
          API_KEYS
          {!apiKeysConfigured && <span className="tab-indicator">!</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'wallets' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallets')}
        >
          WALLETS
        </button>
      </div>

      {/* Main Content Area */}
      <div className="settings-content">
        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
        <>
          {/* API Keys Status */}
          <div className="terminal-summary">
            <div className="summary-line">
              <span className="label">API_KEYS_STATUS:</span>
              <span className={`value ${apiKeysConfigured ? 'success' : 'warning'}`}>
                {apiKeysConfigured ? 'CONFIGURED' : 'REQUIRED'}
              </span>
            </div>
            {!apiKeysConfigured && (
              <div className="summary-line warning">
                <AlertTriangle size={12} />
                <span className="warning-text">API keys required to fetch portfolio data</span>
              </div>
            )}
          </div>

          {/* Helius API Key */}
          <div className="terminal-summary">
            <div className="summary-line">
              <span className="label">HELIUS_API_KEY:</span>
              <a href="https://helius.xyz" target="_blank" rel="noopener noreferrer" className="api-link">
                GET_FREE_KEY →
              </a>
            </div>
            <div className="api-input-section">
              <div className="input-line">
                <span className="input-prompt">&gt;</span>
                <input
                  type={showHeliusKey ? 'text' : 'password'}
                  value={heliusApiKey}
                  onChange={(e) => {
                    setHeliusApiKey(e.target.value);
                    setErrors({ ...errors, heliusApiKey: null });
                  }}
                  placeholder="PASTE_HELIUS_API_KEY_HERE"
                  className="terminal-input api-input"
                />
                <button 
                  className="terminal-btn toggle-btn"
                  onClick={() => setShowHeliusKey(!showHeliusKey)}
                  title={showHeliusKey ? 'Hide key' : 'Show key'}
                >
                  {showHeliusKey ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
              {errors.heliusApiKey && (
                <div className="error-line">
                  <span className="error-prompt">!</span>
                  <span className="error-text">{errors.heliusApiKey}</span>
                </div>
              )}
            </div>
          </div>

          {/* Moralis API Key */}
          <div className="terminal-summary">
            <div className="summary-line">
              <span className="label">MORALIS_API_KEY:</span>
              <a href="https://moralis.io" target="_blank" rel="noopener noreferrer" className="api-link">
                GET_FREE_KEY →
              </a>
            </div>
            <div className="api-input-section">
              <div className="input-line">
                <span className="input-prompt">&gt;</span>
                <input
                  type={showMoralisKey ? 'text' : 'password'}
                  value={moralisApiKey}
                  onChange={(e) => {
                    setMoralisApiKey(e.target.value);
                    setErrors({ ...errors, moralisApiKey: null });
                  }}
                  placeholder="PASTE_MORALIS_API_KEY_HERE"
                  className="terminal-input api-input"
                />
                <button 
                  className="terminal-btn toggle-btn"
                  onClick={() => setShowMoralisKey(!showMoralisKey)}
                  title={showMoralisKey ? 'Hide key' : 'Show key'}
                >
                  {showMoralisKey ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
              {errors.moralisApiKey && (
                <div className="error-line">
                  <span className="error-prompt">!</span>
                  <span className="error-text">{errors.moralisApiKey}</span>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="terminal-summary">
            <div className="input-line">
              <button 
                className="terminal-btn save-btn"
                onClick={saveApiKeys}
                disabled={!heliusApiKey.trim() || !moralisApiKey.trim()}
              >
                <Key size={12} />
                SAVE_API_KEYS
              </button>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="terminal-table">
            <div className="setup-instructions">
              <div className="instruction-line">
                <span className="step">1.</span>
                <span className="text">Get free Helius API key from helius.xyz</span>
              </div>
              <div className="instruction-line">
                <span className="step">2.</span>
                <span className="text">Get free Moralis API key from moralis.io</span>
              </div>
              <div className="instruction-line">
                <span className="step">3.</span>
                <span className="text">Paste both keys above and click SAVE_API_KEYS</span>
              </div>
              <div className="instruction-line">
                <span className="step">4.</span>
                <span className="text">Switch to WALLETS tab to add your wallet addresses</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Wallets Tab */}
      {activeTab === 'wallets' && (
        <>
          {!apiKeysConfigured && (
            <div className="terminal-summary">
              <div className="summary-line warning">
                <AlertTriangle size={12} />
                <span className="warning-text">Configure API keys first in the API_KEYS tab</span>
              </div>
            </div>
          )}

          {/* Add Wallet Section */}
          <div className="terminal-summary">
            <div className="summary-line">
              <span className="label">ADD_WALLET:</span>
            </div>
            <div className="wallet-input-section">
              <div className="input-line">
                <span className="input-prompt">&gt;</span>
                <input
                  type="text"
                  value={newWallet}
                  onChange={(e) => {
                    setNewWallet(e.target.value);
                    setErrors({ ...errors, newWallet: null });
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="ENTER_SOLANA_WALLET_ADDRESS"
                  className="terminal-input"
                />
                <button 
                  className="terminal-btn add-wallet-btn"
                  onClick={addWallet}
                  disabled={!newWallet.trim()}
                >
                  <Plus size={12} />
                  ADD
                </button>
              </div>
              {errors.newWallet && (
                <div className="error-line">
                  <span className="error-prompt">!</span>
                  <span className="error-text">{errors.newWallet}</span>
                </div>
              )}
            </div>
          </div>

          {/* Wallets Table */}
          {localWallets.length > 0 && (
            <div className="terminal-table">
              <div className="table-header">
                <div className="col-name">NAME</div>
                <div className="col-address">ADDRESS</div>
                <div className="col-status">STATUS</div>
                <div className="col-actions">ACTIONS</div>
              </div>
              <div className="table-body">
                {localWallets.map((wallet) => (
                  <div key={wallet.id} className="table-row wallet-row">
                    <div className="col-name">
                      <input
                        type="text"
                        value={wallet.name}
                        onChange={(e) => updateWalletName(wallet.id, e.target.value)}
                        className="wallet-name-input"
                        maxLength={20}
                      />
                    </div>
                    <div className="col-address mono">
                      {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                    </div>
                    <div className="col-status">
                      <button 
                        className={`status-btn ${wallet.enabled ? 'enabled' : 'disabled'}`}
                        onClick={() => toggleWallet(wallet.id)}
                      >
                        {wallet.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="col-actions">
                      <button 
                        className="terminal-btn delete-btn"
                        onClick={() => removeWallet(wallet.id)}
                        title="Remove wallet"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {localWallets.length === 0 && (
            <div className="terminal-table">
              <div className="empty-state">
                <div className="empty-line">
                  <span className="label">STATUS:</span>
                  <span className="value">NO_WALLETS_CONFIGURED</span>
                </div>
                <div className="empty-line">
                  <span className="label">ACTION:</span>
                  <span className="value">ADD_WALLET_ADDRESS_ABOVE</span>
                </div>
              </div>
            </div>
          )}
        </>
        )}
      </div>

      {/* Status Bar */}
      <div className="terminal-status">
        <span className="status-item">API_KEYS: {apiKeysConfigured ? 'OK' : 'MISSING'}</span>
        <span className="status-item">WALLETS: {localWallets.length}</span>
        <span className="status-item">ENABLED: {localWallets.filter(w => w.enabled).length}</span>
        <span className="status-item">STATUS: {apiKeysConfigured ? 'READY' : 'SETUP_REQUIRED'}</span>
      </div>
    </div>
  );
};

export default SettingsPanel;