# Prior Testnet Bot 🤖

A simple bot that automates token swaps on Prior Testnet to help you earn points.

## What This Bot Does

- ✅ Connects your wallets to Prior Testnet
- 🚰 Claims PRIOR tokens from the faucet when needed
- 🔄 Automatically performs swaps (PRIOR → USDC)
- 📊 Tracks points earned and displays transaction details
- 🌐 Supports proxy rotation to avoid rate limits

---

## Quick Setup

### 1. Clone the Repository

Run the following commands to clone the repository and navigate into it:

```bash
git clone https://github.com/zackymrf/prior-auto.git
cd prior-auto
```

### 2. Install Dependencies

Run the following command to install the required dependencies:

```bash
npm install
```

### 3. Configure Your Wallets

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit the `.env` file and add your wallet details:

```dotenv
# Add as many wallets as needed
WALLET_1_ADDRESS=0x123...your_address_here
WALLET_1_PRIVATEKEY=abcd...your_private_key_here
WALLET_2_ADDRESS=0x456...another_address_here
WALLET_2_PRIVATEKEY=efgh...another_private_key_here
```

> ⚠️ **NEVER share your `.env` file or commit it to git!**

### 4. Configure Proxies (Optional)

The bot supports HTTP proxies to distribute requests and avoid rate limits. Add your proxies to the `proxy.txt` file, one per line:

```
http://username:password@host:port
```

If no proxies are provided, the bot will use your direct connection.

### 5. Run the Bot

Start the bot with the following command:

```bash
node index.js
```

---

## How It Works

1. The bot loads your configured wallets and proxies.
2. For each wallet, it:
   - Connects to the Prior Testnet
   - Checks if the wallet has enough PRIOR tokens
   - Claims from the faucet if needed
   - Performs multiple token swaps
   - Rotates through available proxies for each request
3. The bot waits between operations to avoid rate limits.
4. Detailed transaction information and points earned are displayed after each swap.

---

## Configuration Options

You can adjust the following values in the `CONFIG` object in `index.js`:

- **`SWAP_AMOUNT`**: How much PRIOR to swap each time (default: 0.05)
- **`SWAP_COUNT`**: Number of swaps per wallet (default: 5)
- **`MIN_PRIOR_BALANCE`**: Minimum PRIOR balance needed (default: 0.25)
- **`DELAY.BETWEEN_SWAPS`**: Time to wait between swaps in milliseconds (default: 5000)
- **`DELAY.BETWEEN_WALLETS`**: Time to wait between processing wallets in milliseconds (default: 10000)

---

## Proxy Support

The bot automatically reads and rotates through proxies listed in the `proxy.txt` file. Supported formats:

```
http://host:port
http://username:password@host:port
```

### Benefits of Using Proxies:
- Avoid rate limiting
- Distribute requests across multiple IPs
- Process more wallets without getting blocked

---

## Troubleshooting

- **Not getting points?** Make sure your wallet has enough PRIOR tokens (minimum 0.25).
- **Faucet not working?** You can only claim from the faucet once every 24 hours.
- **Rate limit errors?** The bot handles these automatically with retries, but consider adding more proxies.
- **Proxy connection issues?** Check that your proxies are formatted correctly and are online.

---

## Example Output

```
🤖 Starting bot with 4 wallets...

🔄 Processing wallet 1/4
=== Processing Wallet ===
📍 Address: 0x072ACFA035D02C010E5852523c387eD0335066A4
✅ Wallet initialized successfully
👛 Wallet Address: 0x072ACFA035D02C010E5852523c387eD0335066A4
🔌 Connecting wallet: 0x072ACFA035D02C010E5852523c387eD0335066A4
🔄 Using proxy: http://***:***@51.159.85.23:6060
✅ Wallet connected successfully
📊 Checking PRIOR balance for wallet: 0x072ACFA035D02C010E5852523c387eD0335066A4
💰 PRIOR Balance: 0.35
🚀 Performing 5 swaps...

=== Transaction Details ===
🆔 Transaction ID: 12345
📝 Type: swap
💱 Amount: 0.05 PRIOR to USDC
🏆 Points Earned: 10
💯 Total Points: 150
📅 Daily Points: 50
...
```

---
