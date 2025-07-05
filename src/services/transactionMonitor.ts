import { Connection, PublicKey } from '@solana/web3.js';
import pool from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

const connection = new Connection(process.env.RPC_URL!);
const TOKEN_ADDRESS = new PublicKey(process.env.TOKEN_ADDRESS!);

const PROTOCOLS = {
  Jupiter: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
  Raydium: '4ckmDgGzLYLyWsi1N7eae3j4iTjH7WJxgYtxghhNp9oU',
  Orca: 'nDEXnBZmzYAM2FA1QW5L6p4xYPz5fTTHZcBv9RtZRH6'
};

export async function monitorTransactions() {
  console.log('🔄 Starting transaction monitor...');

  const res = await pool.query('SELECT wallet_address FROM token_holders');
  const wallets: string[] = res.rows.map(row => row.wallet_address);

  for (const wallet of wallets) {
    const pubkey = new PublicKey(wallet);
    const sigs = await connection.getConfirmedSignaturesForAddress2(pubkey, { limit: 10 });

    for (const sig of sigs) {
      const existing = await pool.query('SELECT 1 FROM token_transactions WHERE tx_signature = $1', [sig.signature]);
      if (existing.rowCount > 0) continue;

      const tx = await connection.getParsedTransaction(sig.signature, 'confirmed');
      if (!tx) continue;

      const instructions = tx.transaction.message.instructions;
      const timestamp = new Date((tx.blockTime ?? 0) * 1000);
      let foundProtocol = null;

      for (const [name, programId] of Object.entries(PROTOCOLS)) {
        if (instructions.some(i => 'programId' in i && i.programId.toString() === programId)) {
          foundProtocol = name;
        }
      }

      const innerInstructions = tx.meta?.innerInstructions ?? [];
      let amountTransferred = 0;

      for (const group of innerInstructions) {
        for (const instr of group.instructions) {
          const parsed = 'parsed' in instr ? instr.parsed : null;
          if (
            parsed?.info?.mint === TOKEN_ADDRESS.toBase58() &&
            ['transfer', 'transferChecked'].includes(parsed?.type)
          ) {
            amountTransferred += parseInt(parsed.info.amount || '0');
          }
        }
      }

      if (amountTransferred > 0) {
        const side = tx.meta?.postTokenBalances?.[0]?.uiTokenAmount?.uiAmount >
                     tx.meta?.preTokenBalances?.[0]?.uiTokenAmount?.uiAmount
                     ? 'buy' : 'sell';

        await pool.query(
          `INSERT INTO token_transactions (wallet_address, tx_signature, amount, side, protocol, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (tx_signature) DO NOTHING`,
          [wallet, sig.signature, amountTransferred, side, foundProtocol || 'unknown', timestamp]
        );
      }
    }
  }

  console.log('✅ Polled and saved recent transactions');
}
