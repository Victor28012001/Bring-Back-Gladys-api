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

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS;
if (!PROJECT_ADDRESS) {
  throw new Error("🚨 Missing PROJECT_ADDRESS env var");
}
console.log("📦 PROJECT_ADDRESS =", PROJECT_ADDRESS); // Should be a string
console.log("🔑 Admin pubkey =", adminKeypair.publicKey.toString());

try {
  const {
    createCreateNewResourceTransaction: {
      resource: resourceAddress, // This is the resource address once it'll be created
      tx: txResponse, // This is the transaction response, you'll need to sign and send this transaction
    },
  } = await client.createCreateNewResourceTransaction({
    project: PROJECT_ADDRESS,
    authority: adminKeypair.publicKey.toString(),
    payer: adminKeypair.publicKey.toString(), // Optional, specify when you want a different wallet to pay for the tx
    params: {
      name: "TEETH", // Name of the resource
      decimals: 6, // Number of decimal places the resource can be divided into
      symbol: "TTH", // Symbol of the resource
      uri: "https://example.com", // URI of the resource
      storage: ResourceStorageEnum.LedgerState, // Type of the resource, can be either AccountState (uncompressed/unwrapped) or LedgerState (compressed/wrapped)
      tags: ["Sword"], // Optional, tags for the resource; tags act as metadata to help you keep track of game stats
    },
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
  console.log("🎉 Resource created:", resourceAddress);
  const {
  createCreateNewResourceTreeTransaction: {
    treeAddress: merkleTreeAddress, // This is the merkle tree address once it'll be created
    tx: treeTxResponse, // This is the transaction response, you'll need to sign and send this transaction
  },
} = await client.createCreateNewResourceTreeTransaction({
    project: PROJECT_ADDRESS,
    authority: adminKeypair.publicKey.toString(),
    payer: adminKeypair.publicKey.toString(), // Optional, specify when you want a different wallet to pay for the tx
    resource: resourceAddress.toString(),
    treeConfig: {
      // Provide either the basic or advanced configuration, we recommend using the basic configuration if you don't know the exact values of maxDepth, maxBufferSize, and canopyDepth (the basic configuration will automatically configure these values for you)
      basic: { 
        numAssets: 1000000, // The desired number of resources this tree will be able to store
      },
      // Uncomment the following config if you want to configure your own profile tree (also comment out the above config)
      // advanced: {
      //   maxDepth: 20,
      //   maxBufferSize: 64,
      //   canopyDepth: 14,
      // }
    }
});

  const result1 = await sendTransaction(
    client,
    {
      transaction: treeTxResponse.transaction,
      blockhash: treeTxResponse.blockhash,
      lastValidBlockHeight: treeTxResponse.lastValidBlockHeight,
    },
    [adminKeypair]
  );

  if (result1.status !== "Success") {
    console.log("❌ Transaction failed.");
    console.log("⚠️ Full result1:", result1);
    console.log("⚠️ Status:", result1.status);
    console.log("🧾 Signature:", result1.signature);
    console.log("🚨 Error:", result1.error);
    throw new Error("Transaction failed");
  }

  console.log("✅ Transaction confirmed:", result1.signature);
  console.log("🎉 Resource Tree created:", merkleTreeAddress);
} catch (err) {
  console.error("❌ Error in /create-resource:", err);
}
