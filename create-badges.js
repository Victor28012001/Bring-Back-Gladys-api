import { Keypair } from "@solana/web3.js";
import {
  createEdgeClient,
  BadgesCondition,
} from "@honeycomb-protocol/edge-client";
import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL = "https://edge.test.honeycombprotocol.com/";
const client = createEdgeClient(API_URL, true);

const adminSecret = JSON.parse(process.env.ADMIN_KEY);
const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(adminSecret));

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS;
if (!PROJECT_ADDRESS) {
  throw new Error("🚨 Missing PROJECT_ADDRESS env var");
}
console.log("📦 PROJECT_ADDRESS =", PROJECT_ADDRESS); // Should be a string
console.log("🔑 Admin pubkey =", adminKeypair.publicKey.toString());

// 🎖️ Badge names matching achievements
const badgeNames = [
  "Game Completed",
  "Speed Runner",
  "Flawless Victory",
  "Energy Efficient",
  "Sharpshooter",
  "Pacifist",
  "Level 1 Completed",
  "Level 2 Completed",
  "Level 3 Completed",
  "Level 4 Completed",
  "Level 5 Completed",
  "Level 6 Completed",
  "Level 7 Completed",
  "Level 8 Completed",
];


async function createBadge(name, index) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneYear = 60 * 60 * 24 * 365;

    const {
      createInitializeBadgeCriteriaTransaction: {
        transaction,
        blockhash,
        lastValidBlockHeight,
      },
    } = await client.createInitializeBadgeCriteriaTransaction({
      args: {
        authority: adminKeypair.publicKey.toString(),
        projectAddress: PROJECT_ADDRESS,
        payer: adminKeypair.publicKey.toString(),
        badgeIndex: index,
        condition: BadgesCondition.Public,
        startTime: now,
        endTime: now + oneYear,
      },
    });

    const result = await sendTransaction(
      client,
      { transaction, blockhash, lastValidBlockHeight },
      [adminKeypair]
    );

    if (result.status !== "Success") {
      console.error(`❌ Failed to create badge "${name}"`, result.error);
    } else {
      console.log(`✅ Badge "${name}" created (index ${index})`);
      console.log("📩 Signature:", result.signature);
    }
  } catch (err) {
    console.error(`❌ Error creating badge "${name}":`, err.message);
  }
}


// 🌀 Loop to create all badges
(async () => {
  for (let i = 0; i < badgeNames.length; i++) {
    await createBadge(badgeNames[i], i);
  }

  console.log("🏅 All badges created.");
})();