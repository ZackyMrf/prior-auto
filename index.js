require('dotenv').config();
const axios = require('axios');
const { ethers } = require('ethers');

// Configuration constants
const CONFIG = {
  API_BASE_URL: 'https://priortestnet.xyz/api',
  SWAP_AMOUNT: '0.05',
  SWAP_COUNT: 5,
  PRIOR_CONTRACT: '0xefc91c5a51e8533282486fa2601dffe0a0b16edb',
  MIN_PRIOR_BALANCE: '0.25',
  RPC_URL: 'https://sepolia.base.org',
  DELAY: {
    BETWEEN_SWAPS: 5000,
    BETWEEN_WALLETS: 10000,
    DEFAULT_RETRY: 2000
  }
};

// Enhanced HTTP client
class ApiClient {
  constructor(baseUrl, headers) {
    this.baseUrl = baseUrl;
    this.headers = headers;
  }

  async post(endpoint, data, retries = 3) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await axios.post(url, data, { headers: this.headers });
      return response.data;
    } catch (error) {
      if (error.response?.status === 429 && retries > 0) {
        const retryAfter = error.response.data.retryAfter || 
                          (error.response.headers['retry-after'] || 2);
        console.log(`⚠️ Rate limit hit. Waiting ${retryAfter}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.post(endpoint, data, retries - 1);
      }
      throw error;
    }
  }
}

// Common headers for all requests
const headers = {
  'accept': '*/*',
  'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'content-type': 'application/json',
  'dnt': '1',
  'origin': 'https://priortestnet.xyz',
  'priority': 'u=1, i',
  'referer': 'https://priortestnet.xyz/',
  'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

// Initialize global objects
const api = new ApiClient(CONFIG.API_BASE_URL, headers);
const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);

// Function to parse wallet configuration from .env
function parseWalletConfig() {
  const wallets = [];
  
  // First, look for indexed wallet config (WALLET_1_ADDRESS, WALLET_1_PRIVATEKEY, etc)
  let index = 1;
  while (true) {
    const address = process.env[`WALLET_${index}_ADDRESS`];
    const privateKey = process.env[`WALLET_${index}_PRIVATEKEY`];
    
    if (!address || !privateKey) break;
    
    wallets.push({ address, privateKey });
    index++;
  }
  
  // If no indexed wallets found, check legacy format
  if (wallets.length === 0) {
    // Check for WALLETS array (old multi-account format)
    if (process.env.WALLETS) {
      try {
        return JSON.parse(process.env.WALLETS);
      } catch (error) {
        console.error('❌ Error parsing WALLETS JSON:', error.message);
      }
    }
    
    // Check for single wallet format
    if (process.env.WALLET_ADDRESS && process.env.PRIVATE_KEY) {
      return [{
        address: process.env.WALLET_ADDRESS,
        privateKey: process.env.PRIVATE_KEY
      }];
    }
  }
  
  if (wallets.length === 0) {
    throw new Error('⛔ No wallet configuration found in .env file');
  }
  
  return wallets;
}

// Class to handle wallet operations
class WalletManager {
  constructor(walletData) {
    this.address = walletData.address;
    this.privateKey = walletData.privateKey;
    this.wallet = null;
    this.swapResults = [];
  }
  
  async initialize() {
    try {
      this.wallet = new ethers.Wallet(this.privateKey, provider);
      console.log('✅ Wallet initialized successfully');
      console.log(`👛 Wallet Address: ${this.wallet.address}`);
      return this.wallet;
    } catch (error) {
      console.error('❌ Error initializing wallet:', error.message);
      throw error;
    }
  }
  
  async checkPriorBalance() {
    try {
      console.log(`📊 Checking PRIOR balance for wallet: ${this.address}`);
      const priorContract = new ethers.Contract(
        CONFIG.PRIOR_CONTRACT,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      
      const balance = await priorContract.balanceOf(this.address);
      const formattedBalance = ethers.formatUnits(balance, 18);
      console.log(`💰 PRIOR Balance: ${formattedBalance}`);
      
      return parseFloat(formattedBalance) >= parseFloat(CONFIG.MIN_PRIOR_BALANCE);
    } catch (error) {
      console.error('❌ Error checking PRIOR balance:', error.message);
      throw error;
    }
  }
  
  async connect() {
    try {
      console.log(`🔌 Connecting wallet: ${this.address}`);
      const data = await api.post('/auth', { address: this.address });
      console.log('✅ Wallet connected successfully');
      return data;
    } catch (error) {
      console.error('❌ Error connecting wallet:', error.message);
      throw error;
    }
  }
  
  async claimFaucet() {
    try {
      console.log(`🚰 Claiming faucet for wallet: ${this.address}`);
      await api.post('/faucet/claim', { address: this.address });
      console.log('✅ Faucet claimed successfully');
      return true;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('24 hours')) {
        console.log(`⏳ Cannot claim faucet yet. Time remaining: ${error.response.data.timeRemaining} hours`);
        // Check if we have enough PRIOR balance to continue
        const hasSufficientBalance = await this.checkPriorBalance();
        if (hasSufficientBalance) {
          console.log('✅ Sufficient PRIOR balance to continue with swaps');
          return true;
        }
        return false;
      }
      console.error('❌ Error claiming faucet:', error.message);
      throw error;
    }
  }
  
  async performSwap() {
    try {
      // Generate random transaction hash for testing
      const txHash = '0x' + Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('');
      
      console.log(`🔄 Performing swap for wallet: ${this.address}`);
      const data = await api.post('/swap', {
        address: this.address,
        amount: CONFIG.SWAP_AMOUNT,
        tokenFrom: "PRIOR",
        tokenTo: "USDC",
        txHash: txHash
      });
      
      console.log('✅ Swap completed successfully');
      this.displayTransactionDetails(data);
      this.swapResults.push(data);
      return data;
    } catch (error) {
      console.error('❌ Error performing swap:', error.message);
      throw error;
    }
  }
  
  displayTransactionDetails(data) {
    console.log('\n=== Transaction Details ===');
    console.log(`🆔 Transaction ID: ${data.transaction.id}`);
    console.log(`📝 Type: ${data.transaction.type}`);
    console.log(`💱 Amount: ${data.transaction.amount} ${data.transaction.tokenFrom} to ${data.transaction.tokenTo}`);
    console.log(`🏆 Points Earned: ${data.pointsEarned}`);
    console.log(`🚥 Status: ${data.transaction.status}`);
    console.log(`🕒 Timestamp: ${new Date(data.transaction.timestamp).toLocaleString()}`);
    console.log(`📜 TX Hash: ${data.transaction.txHash}`);
    
    console.log('\n=== User Stats ===');
    console.log(`👤 User ID: ${data.user.id}`);
    console.log(`📍 Address: ${data.user.address}`);
    console.log(`💯 Total Points: ${data.user.totalPoints}`);
    console.log(`📅 Daily Points: ${data.user.dailyPoints}`);
    console.log(`🚰 Last Faucet Claim: ${data.user.lastFaucetClaim ? 
      new Date(data.user.lastFaucetClaim).toLocaleString() : 'Never'}`);
    console.log('========================\n');
  }
  
  displaySummary() {
    if (this.swapResults.length === 0) {
      console.log('❌ No swaps were performed');
      return;
    }
    
    const totalPoints = this.swapResults.reduce((sum, result) => sum + result.pointsEarned, 0);
    const lastUserStats = this.swapResults[this.swapResults.length - 1].user;
    
    console.log('\n====== Summary ======');
    console.log(`🔄 Total Swaps Completed: ${this.swapResults.length}`);
    console.log(`🏆 Total Points Earned: ${totalPoints}`);
    console.log(`💯 Final Total Points: ${lastUserStats.totalPoints}`);
    console.log(`📅 Final Daily Points: ${lastUserStats.dailyPoints}`);
    console.log('===================\n');
  }
  
  async process() {
    try {
      console.log('\n=== Processing Wallet ===');
      console.log(`📍 Address: ${this.address}`);
      
      // Initialize wallet
      await this.initialize();
      
      // Connect wallet
      await this.connect();
      
      // Check balance and claim faucet if needed
      const hasSufficientBalance = await this.checkPriorBalance();
      let canProceed = hasSufficientBalance;
      
      if (!hasSufficientBalance) {
        canProceed = await this.claimFaucet();
      }
      
      if (canProceed) {
        console.log(`🚀 Performing ${CONFIG.SWAP_COUNT} swaps...`);
        for (let i = 0; i < CONFIG.SWAP_COUNT; i++) {
          console.log(`🔄 Swap ${i+1}/${CONFIG.SWAP_COUNT}`);
          await this.performSwap();
          
          // Add delay between swaps
          if (i < CONFIG.SWAP_COUNT - 1) {
            console.log(`⏳ Waiting ${CONFIG.DELAY.BETWEEN_SWAPS/1000}s before next swap...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY.BETWEEN_SWAPS));
          }
        }
        
        // Display summary after all swaps
        this.displaySummary();
      } else {
        console.log('⚠️ Cannot proceed with swaps due to insufficient balance and unable to claim faucet');
      }
      
    } catch (error) {
      console.error('❌ Error processing wallet:', error);
    }
  }
}

// Main function to run the bot
async function runBot() {
  try {
    // Get wallet configuration
    const WALLETS = parseWalletConfig();
    
    if (WALLETS.length === 0) {
      throw new Error('⛔ No wallets configured in .env file');
    }
    
    console.log(`\n🤖 Starting bot with ${WALLETS.length} wallets...\n`);
    
    // Process each wallet
    for (let i = 0; i < WALLETS.length; i++) {
      console.log(`\n🔄 Processing wallet ${i + 1}/${WALLETS.length}`);
      
      const walletManager = new WalletManager(WALLETS[i]);
      await walletManager.process();
      
      // Add delay between processing wallets
      if (i < WALLETS.length - 1) {
        console.log(`⏳ Waiting ${CONFIG.DELAY.BETWEEN_WALLETS/1000}s before processing next wallet...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY.BETWEEN_WALLETS));
      }
    }
    
    console.log('\n✅ All wallets processed successfully');
  } catch (error) {
    console.error('\n❌ Bot error:', error);
  }
}

// Run the bot
runBot();