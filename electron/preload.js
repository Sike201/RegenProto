const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Listen for messages from main process
  onRefreshPortfolio: (callback) => {
    ipcRenderer.on('refresh-portfolio', callback);
  },
  
  onShowSettings: (callback) => {
    ipcRenderer.on('show-settings', callback);
  },
  
  // Send messages to main process
  updateTrayTooltip: (portfolioValue) => {
    ipcRenderer.invoke('update-tray-tooltip', portfolioValue);
  },
  
  // Window controls
  resizeWindow: (height) => {
    ipcRenderer.invoke('resize-window', height);
  },
  
  closeWindow: () => {
    ipcRenderer.invoke('close-window');
  },
  
  minimizeWindow: () => {
    ipcRenderer.invoke('minimize-window');
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
