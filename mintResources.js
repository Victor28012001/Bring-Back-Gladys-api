import { Keypair } from "@solana/web3.js";
import {
  createEdgeClient,
  BadgesCondition,
  ResourceStorageEnum,
} from "@honeycomb-protocol/edge-client";
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

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS;
if (!PROJECT_ADDRESS) {
  throw new Error("🚨 Missing PROJECT_ADDRESS env var");
}
console.log("📦 PROJECT_ADDRESS =", PROJECT_ADDRESS); // Should be a string
console.log("🔑 Admin pubkey =", adminKeypair.publicKey.toString());

try {
  const {
    createMintResourceTransaction: txResponse, // This is the transaction response, you'll need to sign and send this transaction
  } = await client.createMintResourceTransaction({
    resource: resourceAddress.toString(), // Resource public key as a string
    amount: "50000", // Amount of the resource to mint
    authority: adminKeypair.publicKey.toString(), // Project authority's public key
    owner: userPublicKey.toString(), // The owner's public key, this wallet will receive the resource
    payer: adminKeypair.publicKey.toString(), // Optional, specify when you want a different wallet to pay for the tx
  });

  const result = await sendTransaction(
    client,
    {
      transaction: txResponse.transaction,
      blockhash: txResponse.blockhash,
      lastValidBlockHeight: txResponse.lastValidBlockHeight,
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
  console.log("🎉 Resource minted:", resourceAddress);
} catch (err) {
  console.error("❌ Error in /create-resource:", err);
}
