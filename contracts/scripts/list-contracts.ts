/**
 * list-contracts.ts
 * Calls mintAndList() on PrecropMarket for each of the 8 mock contracts.
 * Outputs the real on-chain tokenIds so mockContracts.ts can be updated.
 *
 * Usage:
 *   npx hardhat run scripts/list-contracts.ts --network base-sepolia
 *
 * Requires in .env.local (one level up):
 *   DEPLOYER_PRIVATE_KEY, NEXT_PUBLIC_PRECROP_MARKET_ADDRESS
 */

import { ethers } from "hardhat";

const MARKET_ADDRESS = process.env.NEXT_PUBLIC_PRECROP_MARKET_ADDRESS!;
const BASE_URI = "https://precrop.markets/api/metadata/";

const CONTRACTS = [
  { id: "pcm-001", name: "Heritage Red Fife Wheat",        priceUsdc: 925   },
  { id: "pcm-002", name: "Purple Barley",                   priceUsdc: 720   },
  { id: "pcm-003", name: "Heirloom San Marzano Tomatoes",   priceUsdc: 840   },
  { id: "pcm-004", name: "Emmer Farro",                     priceUsdc: 1240  },
  { id: "pcm-005", name: "Black Garlic",                    priceUsdc: 1760  },
  { id: "pcm-006", name: "Artisan Blue Popcorn",            priceUsdc: 980   },
  { id: "pcm-007", name: "Persian Saffron",                 priceUsdc: 6400  },
  { id: "pcm-008", name: "Spelt Berries",                   priceUsdc: 990   },
];

async function main() {
  if (!MARKET_ADDRESS) throw new Error("NEXT_PUBLIC_PRECROP_MARKET_ADDRESS not set in .env.local");

  const [signer] = await ethers.getSigners();
  console.log("Listing with:", signer.address);

  const market = await ethers.getContractAt("PrecropMarket", MARKET_ADDRESS, signer);

  console.log("\nMinting and listing 8 contracts...\n");

  const results: Array<{ id: string; tokenId: number; name: string; priceUsdc: number }> = [];

  for (const c of CONTRACTS) {
    const metadataURI = `${BASE_URI}${c.id}`;
    const priceAtoms = BigInt(Math.round(c.priceUsdc * 1_000_000));

    const tx = await market.mintAndList(metadataURI, priceAtoms);
    const receipt = await tx.wait();

    // Parse ContractMinted event to get tokenId
    const iface = market.interface;
    let tokenId = -1;
    for (const log of receipt!.logs) {
      try {
        const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
        if (parsed?.name === "ContractMinted") {
          tokenId = Number(parsed.args.tokenId);
          break;
        }
      } catch {}
    }

    results.push({ id: c.id, tokenId, name: c.name, priceUsdc: c.priceUsdc });
    console.log(`✅ ${c.id} "${c.name}" → tokenId: ${tokenId}`);
  }

  console.log("\n── Update tokenId in mockContracts.ts ────────────────────");
  for (const r of results) {
    console.log(`  ${r.id}: tokenId ${r.tokenId}  (${r.name})`);
  }

  console.log("\n── Paste this into mockContracts.ts (tokenId field) ──────");
  for (const r of results) {
    console.log(`  // ${r.id} → tokenId: ${r.tokenId},`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
