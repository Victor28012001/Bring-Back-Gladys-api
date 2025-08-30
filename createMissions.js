import { Keypair } from "@solana/web3.js";
import { createEdgeClient, RewardKind } from "@honeycomb-protocol/edge-client";
import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL = "https://edge.test.honeycombprotocol.com/";
const client = createEdgeClient(API_URL, true);

const adminSecret = JSON.parse(process.env.ADMIN_KEY);
const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(adminSecret));
const userPublicKey = "CTrafojxD1SrWo14H5eAewyybYmT72Ht4QeNcxQfK6Hw"; // Replace with the user's public key who will receive the resource
console.log("👤 User pubkey =", userPublicKey.toString());
const resourceAddress = process.env.RESOURCE_ADDRESS;
if (!resourceAddress) {
  throw new Error("🚨 Missing RESOURCE_ADDRESS env var");
}

const characterModelAddress = process.env.CHARACTER_MODEL_ADDRESS;
if (!characterModelAddress) {
  throw new Error("🚨 Missing CHARACTER_MODEL_ADDRESS env var");
}

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS;
if (!PROJECT_ADDRESS) {
  throw new Error("🚨 Missing PROJECT_ADDRESS env var");
}
console.log("📦 PROJECT_ADDRESS =", PROJECT_ADDRESS); // Should be a string
console.log("🔑 Admin pubkey =", adminKeypair.publicKey.toString());

// const missionPoolAddress = process.env.MISSION_POOL_ADDRESS;
// if (!missionPoolAddress) {
//   throw new Error("🚨 Missing MISSION_POOL_ADDRESS env var");
// }
try {
  const {
    createCreateMissionPoolTransaction: {
      missionPoolAddress, // The address of the mission pool
      tx, // The transaction response, you'll need to sign and send this transaction
    },
  } = await client.createCreateMissionPoolTransaction({
    data: {
      name: "Test Mission Pool",
      project: PROJECT_ADDRESS.toString(),
      payer: adminKeypair.publicKey.toString(),
      authority: adminKeypair.publicKey.toString(),
      characterModel: characterModelAddress.toString(),
    },
  });
  const result = await sendTransaction(
    client,
    {
      transaction: tx.transaction,
      blockhash: tx.blockhash,
      lastValidBlockHeight: tx.lastValidBlockHeight,
    },
    [adminKeypair]
  );

  if (result.status !== "Success") {
    console.log("❌ Transaction failed.");
    console.log("⚠️ Full result:", result);
    console.log("⚠️ Status:", result.status);
    console.log("🧾 Signature:", result.signature);
    console.log("🚨 Error:", result.error);
    throw new Error("Transaction failed");
  }

  console.log("✅ Transaction confirmed:", result.signature);
  console.log("🎉 mission Pool Address minted:", missionPoolAddress);

  const {
    createCreateMissionTransaction: {
      missionAddress, // The address of the mission
      tx: tx1, // The transaction response, you'll need to sign and send this transaction
    },
  } = await client.createCreateMissionTransaction({
    data: {
      name: "Test mission",
      project: PROJECT_ADDRESS.toString(),
      cost: {
        address: resourceAddress.toString(),
        amount: "100000",
      },
      duration: "86400", // 1 day
      minXp: "50000", // Minimum XP required to participate in the mission
      rewards: [
        {
          kind: RewardKind.Xp,
          max: "100",
          min: "100",
        },
        {
          kind: RewardKind.Resource,
          max: "50000000",
          min: "25000000",
          resource: resourceAddress.toString(),
        },
      ],
      missionPool: missionPoolAddress.toString(),
      authority: adminKeypair.publicKey.toString(),
      payer: adminKeypair.publicKey.toString(),
    },
  });
  const result1 = await sendTransaction(
    client,
    {
      transaction: tx1.transaction,
      blockhash: tx1.blockhash,
      lastValidBlockHeight: tx1.lastValidBlockHeight,
    },
    [adminKeypair]
  );

  if (result1.status !== "Success") {
    console.log("❌ Transaction failed.");
    console.log("⚠️ Full result:", result1);
    console.log("⚠️ Status:", result1.status);
    console.log("🧾 Signature:", result1.signature);
    console.log("🚨 Error:", result1.error);
    throw new Error("Transaction failed");
  }

  console.log("✅ Transaction confirmed:", result1.signature);
  console.log("🎉 mission Address minted:", missionAddress);
} catch (err) {
  console.error("❌ Error in /mission:", err);
}
