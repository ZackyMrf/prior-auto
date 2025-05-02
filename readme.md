# Prior Testnet Bot 🤖

A simple bot that automates token swaps on Prior Testnet to help you earn points.

## What This Bot Does

- ✅ Connects your wallets to Prior Testnet
- 🚰 Claims PRIOR tokens from the faucet when needed
- 🔄 Automatically performs swaps (PRIOR → USDC)
- 📊 Tracks points earned and displays transaction details

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

### 4. Run the Bot

Start the bot with the following command:

```bash
node index.js
```

---

## How It Works

1. The bot connects each wallet in your `.env` file.
2. Checks if each wallet has enough PRIOR tokens.
3. Claims from the faucet if needed.
4. Performs 5 swaps for each wallet (by default).
5. Waits between operations to avoid rate limits.
6. Displays the points earned after each swap.

---

## Configuration Options

You can adjust the following values in the `CONFIG` object in `index.js`:

- **`SWAP_AMOUNT`**: How much PRIOR to swap each time (default: 0.05)
- **`SWAP_COUNT`**: Number of swaps per wallet (default: 5)
- **`DELAY.BETWEEN_SWAPS`**: Time to wait between swaps in milliseconds (default: 5000)
- **`DELAY.BETWEEN_WALLETS`**: Time to wait between processing wallets in milliseconds (default: 10000)

---

## Troubleshooting

- **Not getting points?** Make sure your wallet has enough PRIOR tokens (minimum 0.25).
- **Faucet not working?** You can only claim from the faucet once every 24 hours.
- **Rate limit errors?** The bot handles these automatically with retries.

---

## Example Output

```
🤖 Starting bot with 2 wallets...

=== Processing Wallet ===
📍 Address: 0x072ACFA035D02C010E5852523c387eD0335066A4
✅ Wallet initialized successfully
🔌 Connecting wallet: 0x072ACFA035D02C010E5852523c387eD0335066A4
📊 Checking PRIOR balance: 0.35
🚀 Performing 5 swaps...

=== Transaction Details ===
🏆 Points Earned: 10
💯 Total Points: 150
📅 Daily Points: 50
...
```

---
