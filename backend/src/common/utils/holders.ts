import { provider, TRANSFER_TOPIC, topicToAddress } from "./ether";
import { ethers } from "ethers";

/**
 * Batcher: fetch logs in block windows to avoid provider limits.
 */
export async function fetchTransferLogs(
  tokenAddress: string,
  fromBlock: number,
  toBlock: number,
  step = 5000
) {
  const logs: ethers.Log[] = [];
  let start = fromBlock;

  while (start <= toBlock) {
    const end = Math.min(start + step - 1, toBlock);
    const filter = {
      address: tokenAddress,
      fromBlock: start,
      toBlock: end,
      topics: [TRANSFER_TOPIC],
    };

    // eslint-disable-next-line no-await-in-loop
    const partial = await provider.getLogs(filter);
    logs.push(...partial);
    start = end + 1;
  }

  return logs;
}

/**
 * Rebuild balances up to targetBlock by applying Transfer events.
 * Returns a Map<address, bigint> with raw token base units.
 */
export async function rebuildBalancesFromTransfers(
  tokenAddress: string,
  deployBlock: number,
  targetBlock: number,
  step = 5000
) {
  const logs = await fetchTransferLogs(
    tokenAddress,
    deployBlock,
    targetBlock,
    step
  );
  const balances = new Map<string, bigint>();

  for (const log of logs) {
    const from = topicToAddress(log.topics[1]);
    const to = topicToAddress(log.topics[2]);
    const value = BigInt(log.data);

    // subtract from
    if (from !== ethers.ZeroAddress) {
      const prev = balances.get(from) ?? 0n;
      balances.set(from, prev - value);
    }

    // add to
    if (to !== ethers.ZeroAddress) {
      const prev = balances.get(to) ?? 0n;
      balances.set(to, prev + value);
    }
  }

  // limpiar balances negativos o en cero
  for (const [addr, amount] of Array.from(balances.entries())) {
    if (amount <= 0n) {
      balances.delete(addr);
    }
  }

  return balances;
}

/**
 * Dado un Map de balances y los decimales,
 * devuelve los top N holders (orden descendente).
 */
export function topHoldersFromMap(
  balances: Map<string, bigint>,
  decimals: number,
  topN = 20
) {
  const arr = Array.from(balances.entries())
    .map(([address, amount]) => ({ address, amount }))
    .sort((a, b) => (a.amount > b.amount ? -1 : a.amount < b.amount ? 1 : 0))
    .slice(0, topN);

  return arr.map(x => ({
    address: x.address,
    raw: x.amount.toString(),
    human: ethers.formatUnits(x.amount, decimals),
  }));
}
