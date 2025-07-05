# TokenWise — Real-Time Wallet Intelligence

TokenWise is a real-time intelligence tool built on the Solana blockchain to track top token holders and monitor their transaction activity.

## 🔧 Features Implemented

- Fetches top 60 token holders for a specific SPL token
- Monitors their transactions in real-time
- Detects protocol used (Jupiter, Raydium, Orca)
- Stores transactions in PostgreSQL

## 📦 Tech Stack

- Node.js + TypeScript
- Solana Web3.js SDK
- PostgreSQL
- dotenv

## 🛠️ Setup Instructions

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```env
RPC_URL=https://api.mainnet-beta.solana.com
DATABASE_URL=postgresql://username:password@localhost:5432/tokenwise
TOKEN_ADDRESS=9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump
```

3. Create PostgreSQL tables:

```sql
CREATE TABLE token_holders (
  wallet_address TEXT PRIMARY KEY,
  token_quantity BIGINT
);

CREATE TABLE token_transactions (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT,
  tx_signature TEXT UNIQUE,
  amount BIGINT,
  side TEXT,
  protocol TEXT,
  timestamp TIMESTAMP
);
```

4. Run the project:

```bash
npm run dev
```

## 📁 Folder Structure

- `src/config/db.ts` – PostgreSQL connection
- `src/services/tokenHolders.ts` – Top holder logic
- `src/services/transactionMonitor.ts` – Real-time transaction monitor
- `src/index.ts` – Entrypoint
