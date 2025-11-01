// npm install @ankr.com/ankr.js
import { AnkrProvider } from "@ankr.com/ankr.js";

const RPC =
  process.env.RPC_URL ||
  "https://rpc.ankr.com/multichain/d96dd27a962553ca56c160340bb8271f77691c13a2c033edd11604b6184040a3";
const provider = new AnkrProvider(RPC);

/**
 * Obtener balances de un wallet en varias cadenas
 */
async function getWalletBalances(walletAddress: string) {
  const balances = await provider.getAccountBalance({
    blockchain: ["eth", "bsc", "polygon", "avalanche"], // puedes filtrar solo Ethereum
    walletAddress,
  });
  console.log("Balances:", balances);
  return balances;
}

/**
 * Obtener holders de un token ERC-20 en Ethereum usando Ankr
 * Nota: Ankr tiene endpoints que pueden devolver balances de holders
 */
async function getTokenHolders(tokenAddress: string, top = 100) {
  const holders = await provider.getTokenHolders({
    blockchain: "eth",
    contractAddress: tokenAddress,
    pageSize: top,
  });
  console.log("Top holders:", holders);
  return holders;
}

// Ejemplo de uso
// async function main() {
//   // 1️⃣ Balances de un wallet
//   await getWalletBalances("0xfa9019df60d3c710d7d583b2d69e18d412257617");

//   // 2️⃣ Top holders de un token (ej: USDT)
//   await getTokenHolders("0xdAC17F958D2ee523a2206206994597C13D831ec7", 10);
// }

getTokenHolders("0xdAC17F958D2ee523a2206206994597C13D831ec7").catch(
  console.error
);
