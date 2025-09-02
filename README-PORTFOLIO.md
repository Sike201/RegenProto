# Solana Portfolio Menu Bar App

A minimal yet polished Solana portfolio tracker that lives in your system's menu bar. Built with React, Vite, JavaScript, and Electron.

## Features

### 🎯 Core Features
- **Menu Bar Integration**: Lives in your macOS menu bar/Windows system tray
- **Real-time Portfolio Tracking**: Shows total Solana portfolio value at all times
- **Multi-wallet Support**: Track multiple Solana wallet addresses
- **Token & NFT Support**: Displays token balances, prices, and NFT counts
- **Live Updates**: Auto-refresh every 30-60 seconds (configurable)

### 💫 UI/UX Features
- **Clean, Modern Interface**: Beautiful gradient design with smooth animations
- **Privacy Mode**: Hide/show balance amounts with one click
- **Multi-currency Support**: USD, EUR, GBP, JPY
- **Loading Animations**: Elegant shimmer effects during data fetching
- **Responsive Design**: Optimized for small menu bar windows

### ⚙️ Settings & Configuration
- **Helius API Integration**: Secure API key management
- **Wallet Management**: Add/remove/enable/disable wallet addresses
- **Refresh Intervals**: Customize how often data refreshes (30s - 10min)
- **Currency Preferences**: Choose your preferred display currency

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Helius API key (free at [helius.xyz](https://helius.xyz))

### Installation

1. **Clone the project** (if not already done):
   ```bash
   git clone <your-repo> && cd RegenProtocol
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Get your Helius API key**:
   - Visit [helius.xyz](https://helius.xyz)
   - Sign up for a free account
   - Copy your API key

### Running the App

#### Development Mode
```bash
npm run electron-dev
```
This starts both the Vite dev server and Electron app.

#### Production Build
```bash
npm run build
npm run electron-pack
```

#### Distribution Build
```bash
npm run dist
```
Creates platform-specific installers in the `dist` folder.

## First Time Setup

1. **Launch the app** - The settings panel will open automatically
2. **Enter your Helius API key** in the API Configuration section
3. **Add your Solana wallet address(es)** in the Wallet Addresses section
4. **Configure preferences** (currency, refresh interval)
5. **Click Save** - Your portfolio will load automatically

## Usage

### Menu Bar
- **Click the tray icon** to open/close the portfolio window
- **Right-click the tray icon** for context menu (Refresh, Settings, Quit)
- **Tooltip** shows current total portfolio value

### Portfolio Window
- **Eye icon**: Toggle balance visibility (privacy mode)
- **Refresh icon**: Manual refresh of portfolio data
- **Settings icon**: Open settings panel
- **Token list**: View all tokens with amounts and values

### Settings Panel
- **API Key**: Manage your Helius API key (stored securely locally)
- **Wallets**: Add/remove/enable wallet addresses
- **Display**: Choose currency and refresh interval
- **About**: App version and information

## API Integration

This app uses the **Helius API** for Solana blockchain data:
- Token balances and metadata
- NFT collections and values
- Real-time price data via Jupiter API

Your API key is stored locally and never shared. The app makes direct API calls from your machine.

## Architecture

```
├── electron/           # Electron main process
│   ├── main.js        # Main process with tray functionality
│   └── preload.js     # Secure IPC bridge
├── src/
│   ├── components/    # React components
│   │   ├── PortfolioDisplay.jsx
│   │   ├── PortfolioDisplay.css
│   │   ├── SettingsPanel.jsx
│   │   └── SettingsPanel.css
│   ├── services/      # Business logic
│   │   ├── heliusApi.js    # Helius API integration
│   │   └── storage.js      # Local storage management
│   ├── App.jsx        # Main React app
│   ├── App.css
│   ├── index.css
│   └── main.jsx
└── package.json       # Dependencies & scripts
```

## Tech Stack

- **Frontend**: React 19, Vite, JavaScript
- **Desktop**: Electron 37
- **UI**: Lucide React icons, Custom CSS
- **API**: Helius (Solana data), Jupiter (prices)
- **Storage**: localStorage (settings & cache)

## Troubleshooting

### App won't start
- Ensure Node.js v18+ is installed
- Run `npm install` to install dependencies
- Check for port conflicts (Vite uses port 5173)

### Portfolio not loading
- Verify your Helius API key is valid
- Check wallet addresses are correct Solana addresses
- Ensure internet connection is stable
- Check browser console (F12) for API errors

### Performance issues
- Increase refresh interval in settings
- Disable NFT fetching if you have many NFTs
- Restart the app to clear any memory leaks

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is for educational/personal use. Please respect API rate limits and terms of service.

---

**Made with ❤️ for the Solana community**
