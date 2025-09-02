import React, { useState } from 'react';
import { Terminal, ArrowRight, AlertTriangle } from 'lucide-react';
import './WalletInput.css';

const WalletInput = ({ onWalletSubmit, isLoading }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');

  const validateWalletAddress = (address) => {
    if (!address) return 'ERROR: No wallet address provided';
    if (address.length < 32 || address.length > 44) return 'ERROR: Invalid wallet address length';
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) return 'ERROR: Invalid characters detected';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedAddress = walletAddress.trim();
    const validationError = validateWalletAddress(trimmedAddress);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    onWalletSubmit(trimmedAddress);
  };

  const handleInputChange = (e) => {
    setWalletAddress(e.target.value);
    if (error) setError('');
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="terminal-wallet-container">
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-prompt">$</span>
          <span className="terminal-path">REGEN_PORTFOLIO_INIT</span>
          <span className="terminal-time">[{getCurrentTime()}]</span>
        </div>
        <div className="terminal-window-controls">
          <div className="window-btn close"></div>
          <div className="window-btn minimize"></div>
          <div className="window-btn maximize"></div>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="terminal-body">
        <div className="terminal-output">
          <div className="output-line">
            <span className="prompt">$</span>
            <span className="command">solana-portfolio --init</span>
          </div>
          <div className="output-line">
            <span className="system">REGEN PORTFOLIO TRACKER v1.0.0</span>
          </div>
          <div className="output-line">
            <span className="system">Initializing connection to Solana network...</span>
          </div>
          <div className="output-line">
            <span className="success">✓ Connected to mainnet-beta</span>
          </div>
          <div className="output-line">
            <span className="system">Enter wallet address to begin tracking:</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="terminal-form">
          <div className="input-line">
            <span className="input-prompt">WALLET_ADDRESS:</span>
            <input
              type="text"
              value={walletAddress}
              onChange={handleInputChange}
              placeholder="Enter Solana wallet address..."
              className={`terminal-input ${error ? 'error' : ''}`}
              disabled={isLoading}
              spellCheck="false"
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="error-line">
              <span className="error-prompt">!</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          <div className="action-line">
            <button 
              type="submit" 
              className="terminal-button"
              disabled={isLoading || !walletAddress.trim()}
            >
              {isLoading ? (
                <span className="loading-text">CONNECTING...</span>
              ) : (
                <span>CONNECT</span>
              )}
            </button>
          </div>
        </form>

        <div className="terminal-help">
          <div className="help-line">
            <span className="help-label">EXAMPLE:</span>
            <button 
              type="button"
              className="example-wallet"
              onClick={() => setWalletAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')}
              disabled={isLoading}
            >
              9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="terminal-status">
        <span className="status-item">STATUS: {isLoading ? 'CONNECTING' : 'READY'}</span>
        <span className="status-item">NETWORK: MAINNET-BETA</span>
      </div>
    </div>
  );
};

export default WalletInput;
