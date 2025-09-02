import axios from 'axios';

class HeliusApiService {
  constructor(heliusApiKey = '', moralisApiKey = '') {
    console.log('🚀 NEW HELIUS API SERVICE LOADED - UPDATED VERSION WITH DETAILED LOGGING! 🚀');
    this.heliusApiKey = heliusApiKey;
    this.heliusRpcUrl = heliusApiKey ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}` : '';
    this.moralisApiKey = moralisApiKey;
  }

  setHeliusApiKey(apiKey) {
    this.heliusApiKey = apiKey;
    this.heliusRpcUrl = apiKey ? `https://mainnet.helius-rpc.com/?api-key=${apiKey}` : '';
  }

  setMoralisApiKey(apiKey) {
    this.moralisApiKey = apiKey;
  }

  // Legacy method for backward compatibility
  setApiKey(apiKey) {
    this.setHeliusApiKey(apiKey);
  }

  // Validation methods
  validateHeliusApiKey(apiKey) {
    // Basic Helius API key format validation
    if (!apiKey || typeof apiKey !== 'string') return false;
    // Helius API keys are typically UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(apiKey);
  }

  validateMoralisApiKey(apiKey) {
    // Basic Moralis API key format validation (JWT format)
    if (!apiKey || typeof apiKey !== 'string') return false;
    // Moralis API keys are JWT tokens with 3 parts separated by dots
    const parts = apiKey.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * Get SOL balance using Helius RPC getBalance endpoint
   * Docs: https://www.helius.dev/docs/api-reference/rpc/http/getbalance
   */
  async getSolBalance(walletAddress) {
    if (!this.heliusApiKey) {
      throw new Error('Helius API key not configured. Please add your API key in Settings.');
    }

    if (!this.validateHeliusApiKey(this.heliusApiKey)) {
      throw new Error('Invalid Helius API key format. Please check your API key in Settings.');
    }

    try {
      const response = await axios.post(this.heliusRpcUrl, {
        jsonrpc: '2.0',
        id: 'get-balance',
        method: 'getBalance',
        params: [walletAddress]
      });

      if (response.data.error) {
        throw new Error(`Helius RPC Error: ${response.data.error.message}`);
      }

      // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
      const lamports = response.data.result?.value || 0;
      const solBalance = lamports / 1000000000;
      
      return solBalance;
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      throw new Error(`Failed to fetch SOL balance: ${error.message}`);
    }
  }

  /**
   * Get SPL token balances using Moralis API
   * Docs: https://docs.moralis.com/web3-data-api/solana/reference/get-spl
   */
  async getSplTokens(walletAddress) {
    if (!this.moralisApiKey) {
      throw new Error('Moralis API key not configured. Please add your API key in Settings.');
    }

    if (!this.validateMoralisApiKey(this.moralisApiKey)) {
      throw new Error('Invalid Moralis API key format. Please check your API key in Settings.');
    }

    try {
      const response = await axios.get(
        `https://solana-gateway.moralis.io/account/mainnet/${walletAddress}/tokens`,
        {
          headers: {
            'X-API-Key': this.moralisApiKey,
            'accept': 'application/json'
          },
          params: {
            network: 'mainnet',
            excludeSpam: false
          }
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Error fetching SPL tokens:', error);
      if (error.response?.status === 401) {
        throw new Error('Invalid Moralis API key');
      }
      throw new Error(`Failed to fetch SPL tokens: ${error.message}`);
    }
  }

  /**
   * Get token prices using DexScreener API
   * Docs: https://docs.dexscreener.com/api/reference
   */
  async getTokenPrices(tokenMints) {
    if (!tokenMints || tokenMints.length === 0) {
      return {};
    }

    try {
      console.log(`Calling DexScreener API for ${tokenMints.length} tokens...`);
      
      // DexScreener allows querying multiple tokens at once
      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenMints.join(',')}`,
        {
          timeout: 10000 // 10 second timeout
        }
      );

      console.log(`DexScreener response status: ${response.status}`);
      console.log(`DexScreener response data:`, response.data);

      const prices = {};
      
      if (response.data && response.data.pairs) {
        console.log(`Found ${response.data.pairs.length} pairs from DexScreener`);
        
        // Process each pair and get the best price
        for (const pair of response.data.pairs) {
          const tokenAddress = pair.baseToken.address;
          const price = parseFloat(pair.priceUsd);
          
          console.log(`Processing pair: ${pair.baseToken.symbol} (${tokenAddress}) - Price: $${price}, Liquidity: $${pair.liquidity?.usd || 0}`);
          
          // Use the highest liquidity pair for more accurate pricing
          if (!prices[tokenAddress] || (pair.liquidity?.usd || 0) > (prices[tokenAddress].liquidity || 0)) {
            prices[tokenAddress] = {
              price: price,
              liquidity: pair.liquidity?.usd || 0,
              symbol: pair.baseToken.symbol,
              name: pair.baseToken.name
            };
          }
        }
      } else {
        console.log('No pairs found in DexScreener response');
      }

      // Check which tokens didn't get prices
      const missingPrices = tokenMints.filter(mint => !prices[mint]);
      if (missingPrices.length > 0) {
        console.log(`Missing prices for ${missingPrices.length} tokens:`, missingPrices);
        
        // Try Jupiter API as fallback for missing tokens
        try {
          const jupiterPrices = await this.getJupiterPrices(missingPrices);
          Object.assign(prices, jupiterPrices);
          
          // Check if we still have missing prices after Jupiter
          const stillMissing = missingPrices.filter(mint => !prices[mint]);
          if (stillMissing.length > 0) {
            console.log(`Still missing prices after Jupiter: ${stillMissing.length} tokens`);
            
            // Try Moralis Token Price API as final fallback
            const moralisPrices = await this.getMoralisPrices(stillMissing);
            Object.assign(prices, moralisPrices);
          }
        } catch (fallbackError) {
          console.log('Jupiter fallback also failed:', fallbackError.message);
        }
      }

      return prices;
    } catch (error) {
      console.error('Error fetching token prices from DexScreener:', error);
      
      // Try Jupiter API as complete fallback
      try {
        console.log('Trying Jupiter API as complete fallback...');
        const jupiterPrices = await this.getJupiterPrices(tokenMints);
        
        // If Jupiter also fails, try Moralis Token Price API
        const missingAfterJupiter = tokenMints.filter(mint => !jupiterPrices[mint]);
        if (missingAfterJupiter.length > 0) {
          const moralisPrices = await this.getMoralisPrices(missingAfterJupiter);
          Object.assign(jupiterPrices, moralisPrices);
        }
        
        return jupiterPrices;
      } catch (fallbackError) {
        console.error('All pricing APIs failed:', fallbackError);
        return {};
      }
    }
  }

  /**
   * Fallback pricing using Jupiter API
   */
  async getJupiterPrices(tokenMints) {
    try {
      const response = await axios.get(
        'https://api.jup.ag/price/v2',
        {
          params: {
            ids: tokenMints.join(',')
          },
          timeout: 5000
        }
      );

      const prices = {};
      if (response.data && response.data.data) {
        for (const [mint, priceData] of Object.entries(response.data.data)) {
          prices[mint] = {
            price: priceData.price,
            liquidity: 0,
            symbol: priceData.mintSymbol || 'UNKNOWN',
            name: priceData.mintSymbol || 'Unknown Token'
          };
        }
      }

      console.log(`Jupiter API found prices for ${Object.keys(prices).length} tokens`);
      return prices;
    } catch (error) {
      console.error('Jupiter API error:', error);
      return {};
    }
  }

  /**
   * Alternative pricing using Moralis Token Price API (Solana-specific)
   * Docs: https://docs.moralis.com/web3-data-api/solana/reference/get-sol-token-price
   */
  async getMoralisPrices(tokenMints) {
    try {
      console.log('Trying Moralis Token Price API as fallback...');
      
      const prices = {};
      
      // Moralis requires individual calls for each token
      for (const mint of tokenMints) {
        try {
          const response = await axios.get(
            `https://solana-gateway.moralis.io/token/mainnet/${mint}/price`,
            {
              headers: {
                'X-API-Key': this.moralisApiKey,
                'accept': 'application/json'
              },
              params: {
                network: 'mainnet'
              },
              timeout: 5000
            }
          );

          if (response.data && response.data.usdPrice) {
            prices[mint] = {
              price: parseFloat(response.data.usdPrice),
              liquidity: 0,
              symbol: response.data.tokenSymbol || 'UNKNOWN',
              name: response.data.tokenName || response.data.tokenSymbol || 'Unknown Token'
            };
            console.log(`Moralis found price for ${mint}: $${response.data.usdPrice} (${response.data.tokenSymbol || 'UNKNOWN'})`);
          }
        } catch (tokenError) {
          console.log(`Moralis: No price found for ${mint}`, tokenError.response?.status || tokenError.message);
        }
      }

      console.log(`Moralis API found prices for ${Object.keys(prices).length} tokens`);
      return prices;
    } catch (error) {
      console.error('Moralis Token Price API error:', error);
      return {};
    }
  }

  /**
   * Get SOL price specifically from DexScreener
   */
  async getSolPrice() {
    try {
      // SOL mint address
      const solMint = 'So11111111111111111111111111111111111111112';
      const prices = await this.getTokenPrices([solMint]);
      
      return prices[solMint]?.price || 0;
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      return 0;
    }
  }

  /**
   * Main method to get complete portfolio data
   * Returns formatted data for Electron tray updater
   */
  async getPortfolioData(walletAddresses) {
    if (!walletAddresses || walletAddresses.length === 0) {
      return {
        totalValue: 0,
        tokens: [],
        nfts: [],
        nftsValue: 0,
        lastUpdated: new Date(),
        change24h: 0,
        // New format for tray updater
        totalValueUSD: 0,
        breakdown: []
      };
    }

    try {
      let totalValueUSD = 0;
      const breakdown = [];
      const tokenMap = new Map(); // To combine tokens from multiple wallets
      const processedWallets = new Set(); // Prevent duplicate processing

      // Process each wallet
      for (const wallet of walletAddresses) {
        if (!wallet.enabled) continue;
        
        // Skip if we've already processed this wallet address
        if (processedWallets.has(wallet.address)) {
          console.log(`Skipping duplicate wallet: ${wallet.address}`);
          continue;
        }
        processedWallets.add(wallet.address);

        try {
          console.log(`Processing wallet: ${wallet.address}`);

          // 1. Get SOL balance
          const solBalance = await this.getSolBalance(wallet.address);
          console.log(`SOL balance: ${solBalance}`);

          // 2. Get SPL tokens
          const splTokens = await this.getSplTokens(wallet.address);
          console.log(`Found ${splTokens.length} SPL tokens`);
          
          // Log each token found
          splTokens.forEach((token, index) => {
            console.log(`Token ${index + 1}: ${token.symbol || 'UNKNOWN'} (${token.mint}) - Amount: ${token.amount}`);
          });

          // Collect all token mints for batch price fetching
          const tokenMints = [];
          
          // Add SOL mint
          if (solBalance > 0) {
            tokenMints.push('So11111111111111111111111111111111111111112');
          }

          // Add SPL token mints
          for (const token of splTokens) {
            if (token.amount && parseFloat(token.amount) > 0) {
              tokenMints.push(token.mint);
            }
          }

          // 3. Get all prices at once
          console.log(`Requesting prices for mints: ${tokenMints.join(', ')}`);
          const prices = await this.getTokenPrices(tokenMints);
          console.log(`Fetched prices for ${Object.keys(prices).length} tokens`);
          
          // Log each price fetched
          Object.entries(prices).forEach(([mint, priceData]) => {
            console.log(`Price for ${mint}: $${priceData.price} (${priceData.symbol || 'UNKNOWN'})`);
          });

          // 4. Process SOL
          if (solBalance > 0) {
            const solMint = 'So11111111111111111111111111111111111111112';
            const solPrice = prices[solMint]?.price || 0;
            const solUsdValue = solBalance * solPrice;

            // Combine SOL from multiple wallets
            const existingSol = tokenMap.get('SOL');
            if (existingSol) {
              existingSol.balance += solBalance;
              existingSol.usdValue += solUsdValue;
            } else {
              tokenMap.set('SOL', {
                symbol: 'SOL',
                name: 'Solana',
                mint: solMint,
                balance: solBalance,
                price: solPrice,
                usdValue: solUsdValue,
                decimals: 9
              });
            }

            totalValueUSD += solUsdValue;
          }

          // 5. Process SPL tokens
          for (const token of splTokens) {
            const tokenAmount = parseFloat(token.amount || '0');
            if (tokenAmount <= 0) continue;

            const tokenPrice = prices[token.mint]?.price || 0;
            const tokenUsdValue = tokenAmount * tokenPrice;

            // Combine tokens from multiple wallets
            const existingToken = tokenMap.get(token.symbol || token.mint);
            if (existingToken) {
              existingToken.balance += tokenAmount;
              existingToken.usdValue += tokenUsdValue;
            } else {
              tokenMap.set(token.symbol || token.mint, {
                symbol: token.symbol || 'UNKNOWN',
                name: token.name || prices[token.mint]?.name || 'Unknown Token',
                mint: token.mint,
                balance: tokenAmount,
                price: tokenPrice,
                usdValue: tokenUsdValue,
                decimals: token.decimals || 6
              });
            }

            totalValueUSD += tokenUsdValue;
          }

        } catch (walletError) {
          console.error(`Error processing wallet ${wallet.address}:`, walletError);
        }
      }

      // Convert map to array and sort by USD value
      const sortedTokens = Array.from(tokenMap.values())
        .sort((a, b) => b.usdValue - a.usdValue);

      // Create breakdown for tray updater
      for (const token of sortedTokens) {
        breakdown.push({
          symbol: token.symbol,
          balance: token.balance,
          price: token.price,
          usdValue: token.usdValue
        });
      }

      // Legacy format for existing components
      const legacyTokens = sortedTokens.map(token => ({
        mint: token.mint,
        symbol: token.symbol,
        name: token.name,
        amount: token.balance,
        decimals: token.decimals,
        price: token.price,
        value: token.usdValue
      }));

      const portfolioData = {
        // Legacy format
        totalValue: totalValueUSD,
        tokens: legacyTokens,
        nfts: [],
        nftsValue: 0,
        lastUpdated: new Date(),
        change24h: 0,
        
        // New format for tray updater
        totalValueUSD: totalValueUSD,
        breakdown: breakdown
      };

      console.log(`Portfolio total value: $${totalValueUSD.toFixed(2)}`);
      return portfolioData;

    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      throw new Error(`Failed to fetch portfolio data: ${error.message}`);
    }
  }
}

export default HeliusApiService;