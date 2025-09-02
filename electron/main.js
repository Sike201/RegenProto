const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

class SolanaPortfolioApp {
  constructor() {
    this.tray = null;
    this.window = null;
    this.isQuitting = false;
  }

  init() {
    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      this.setupIpcHandlers();
      this.createTray();
      this.createWindow();
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on('window-all-closed', (event) => {
      // Prevent the app from quitting, keep it running in the tray
      if (process.platform !== 'darwin' || this.isQuitting) {
        app.quit();
      } else {
        event.preventDefault();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });
  }

  createTray() {
    // Create a simple icon for the tray (we'll use a default icon for now)
    const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKySURBVFhH7ZbNaxNBFMafJBo/wIOCBy+ePHjx4MWDB0/+AV48ePDgwYMXDx48eNHixYsXLx48eNGLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjx4sWLFy9evHjxYgvlC1BRazVCKGsYAAAAASUVORK5CYII=');
    
    this.tray = new Tray(icon);
    
    // Set initial title and tooltip
    this.tray.setTitle('$0.00');
    this.tray.setToolTip('RegenPortfolio Tracker');
    
    // Create context menu for tray
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Portfolio',
        click: () => {
          this.showWindow();
        }
      },
      {
        label: 'Refresh Now',
        click: () => {
          this.refreshPortfolio();
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    this.tray.setContextMenu(contextMenu);
    
    // Show window on tray click
    this.tray.on('click', () => {
      this.toggleWindow();
    });
  }

  createWindow() {
    this.window = new BrowserWindow({
      width: 380,
      height: 300,
      minHeight: 200,
      maxHeight: 800,
      show: false,
      frame: false,
      resizable: false,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Load the React app
    const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
    this.window.loadURL(startUrl);
    
    // Force reload in development to clear any cached JavaScript
    if (isDev) {
      // Force a hard reload to clear any cached JavaScript
      this.window.webContents.once('dom-ready', () => {
        this.window.webContents.reloadIgnoringCache();
      });
    }

    // Hide window when it loses focus
    this.window.on('blur', () => {
      if (!this.window.webContents.isDevToolsOpened()) {
        this.window.hide();
      }
    });

    this.window.on('closed', () => {
      this.window = null;
    });
  }

  showWindow() {
    if (this.window) {
      if (this.window.isVisible()) {
        this.window.hide();
      } else {
        this.positionWindowNearTray();
        this.window.show();
        this.window.focus();
      }
    }
  }

  toggleWindow() {
    if (this.window) {
      if (this.window.isVisible()) {
        this.window.hide();
      } else {
        this.positionWindowNearTray();
        this.window.show();
        this.window.focus();
      }
    }
  }

  positionWindowNearTray() {
    if (!this.window || !this.tray) return;

    const trayBounds = this.tray.getBounds();
    const windowBounds = this.window.getBounds();
    
    // Position window near the tray icon
    let x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
    let y = Math.round(trayBounds.y + trayBounds.height + 4);
    
    // Ensure window doesn't go off screen
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    if (x + windowBounds.width > screenWidth) {
      x = screenWidth - windowBounds.width;
    }
    if (x < 0) x = 0;
    
    if (y + windowBounds.height > screenHeight) {
      y = trayBounds.y - windowBounds.height - 4;
    }
    
    this.window.setPosition(x, y, false);
  }

  refreshPortfolio() {
    if (this.window) {
      this.window.webContents.send('refresh-portfolio');
    }
  }

  showSettings() {
    if (this.window) {
      this.window.webContents.send('show-settings');
      this.showWindow();
    }
  }

  updateTrayTooltip(formattedValue) {
    if (this.tray) {
      // The formattedValue is already formatted with currency symbol from the React app
      
      // Update both title (shown in menu bar) and tooltip
      this.tray.setTitle(formattedValue);
      this.tray.setToolTip(`RegenPortfolio: ${formattedValue}`);
    }
  }

  setupIpcHandlers() {
    // Handle tray tooltip updates
    ipcMain.handle('update-tray-tooltip', (event, formattedValue) => {
      this.updateTrayTooltip(formattedValue);
    });

    // Handle dynamic window resizing
    ipcMain.handle('resize-window', (event, height) => {
      if (this.window) {
        const currentSize = this.window.getSize();
        const newHeight = Math.max(200, Math.min(800, height));
        this.window.setSize(currentSize[0], newHeight);
        this.positionWindowNearTray();
      }
    });

    // Handle window controls
    ipcMain.handle('close-window', () => {
      if (this.window) {
        this.window.hide();
      }
    });

    ipcMain.handle('minimize-window', () => {
      if (this.window) {
        this.window.hide();
      }
    });
  }
}

// Initialize the app
const portfolioApp = new SolanaPortfolioApp();
portfolioApp.init();

// Export for potential use in other modules
module.exports = portfolioApp;

    
