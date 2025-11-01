import { ethers } from "ethers";
import { provider } from "./ether";
import axios from "axios";
import { rebuildBalancesFromTransfers, topHoldersFromMap } from "./holders";

async function getTokenMeta(tokenAddress: string) {
  const abi = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
  ];

  const contract = new ethers.Contract(tokenAddress, abi, provider);

  const [decimals, symbol, totalSupply] = await Promise.all([
    contract.decimals().catch(() => 18),
    contract.symbol().catch(() => tokenAddress),
    contract.totalSupply().catch(() => 0n),
  ]);

  return {
    decimals: Number(decimals),
    symbol,
    totalSupply: totalSupply.toString(),
  };
}

//Snap
async function currentHolders(tokenI: string, topI: string) {
  try {
    const token = ethers.getAddress(tokenI);
    const top = Number(topI) || 20;

    const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || "";
    if (!ETHERSCAN_KEY) {
      console.log(
        "ETHERSCAN_KEY not set — use /holders/snapshot for robust method"
      );
      //   return res.status(400).json({
      //     error:
      //       "ETHERSCAN_KEY not set — use /holders/snapshot for robust method",
      //   });
    }

    const url = `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${token}&page=1&offset=${top}&apikey=${ETHERSCAN_KEY}`;
    const resp = await axios.get(url);

    if (resp.data && resp.data.status === "1" && resp.data.result) {
      const meta = await getTokenMeta(token);
      console.log({
        token,
        meta,
        holders: resp.data.result,
      });

      //   return res.json({
      //     token,
      //     meta,
      //     holders: resp.data.result,
      //   });
    }

    console.log({
      error: "Etherscan holder endpoint unavailable. Use snapshot method.",
    });
    // return res.status(500).json({
    //   error: "Etherscan holder endpoint unavailable. Use snapshot method.",
    // });
  } catch (err: any) {
    console.error(err);
    console.log({ error: String(err.message || err) });
    // return res.status(500).json({ error: String(err.message || err) });
  }
}

async function snapshotBlock(tokenI: string, topI: string, blockI: string) {
  try {
    const token = ethers.getAddress(tokenI);
    const blockNumber = Number(blockI);
    const top = Number(topI) || 20;

    // For simplicity, assume deploy from block 0 (can be optimized later)
    const fromBlock = 0;

    const meta = await getTokenMeta(token);
    const balancesMap = await rebuildBalancesFromTransfers(
      token,
      fromBlock,
      blockNumber,
      10000
    );

    const topHolders = topHoldersFromMap(balancesMap, meta.decimals, top);

    console.log({
      token,
      meta,
      snapshotBlock: blockNumber,
      topHolders,
      holderCount: balancesMap.size,
    });
    // return res.json({
    //   token,
    //   meta,
    //   snapshotBlock: blockNumber,
    //   topHolders,
    //   holderCount: balancesMap.size,
    // });
  } catch (err: any) {
    console.error(err);
    console.log({ error: String(err.message || err) });
    // return res.status(500).json({ error: String(err.message || err) });
  }
}

async function blockByTime(tsI: number) {
  try {
    const ts = Number(tsI);
    const latest = await provider.getBlockNumber();
    let low = 0;
    let high = latest;
    let best = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const block = await provider.getBlock(mid);
      if (!block) break;

      if (block.timestamp === ts) {
        best = mid;
        break;
      } else if (block.timestamp < ts) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    console.log({ block: best });
    return { block: best };
    // return res.json({ block: best });
  } catch (err: any) {
    console.log({ error: String(err.message || err) });
    // return res.status(500).json({ error: String(err.message || err) });
  }
}

export async function name() {
  console.log("Entre");
  const token = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT
  const date = Math.floor(new Date("2024-07-01T00:00:00Z").getTime() / 1000);

  // 1️⃣ buscar el bloque correspondiente
  const blockInfo = await blockByTime(date);
  const blockNumber = blockInfo?.block;

  console.log({ blockInfo });
  console.log({ blockNumber });

  // 2️⃣ generar snapshot en ese bloque
  //   await snapshotBlock(token, "10", String(blockNumber));
}
