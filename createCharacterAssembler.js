import { Keypair } from "@solana/web3.js";
import { createEdgeClient, MintAsKind } from "@honeycomb-protocol/edge-client";
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
    createCreateAssemblerConfigTransaction: txResponse, // This is the transaction response, you'll need to sign and send this transaction
  } = await client.createCreateAssemblerConfigTransaction({
    project: PROJECT_ADDRESS.toString(),
    authority: adminKeypair.publicKey.toString(),
    payer: adminKeypair.publicKey.toString(), // Optional payer
    treeConfig: {
      basic: {
        numAssets: 100000, // The desired number of character information this tree will be able to store
      },
    },
    ticker: "kooli1233455", // Provide a unique ticker for the config (the ticker ID only needs to be unique within the project)
  });
  const result = await sendTransaction(
    client,
    {
      transaction: txResponse.tx.transaction,
      blockhash: txResponse.tx.blockhash,
      lastValidBlockHeight: txResponse.tx.lastValidBlockHeight,
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
  console.log(
    "🎉 Character Assembler Config created:",
    txResponse.assemblerConfig
  );
  const assemblerConfigAddress = txResponse.assemblerConfig;
  const {
    createAddCharacterTraitsTransactions: txResponse3, // This is the transaction response, you'll need to sign and send this transaction
  } = await client.createAddCharacterTraitsTransactions({
    traits: [
      // Example traits given below, the labels have to match what you've declared in the assembler config
      {
        // label: "Weapon",
        name: "Knife",
        uri: "https://example.com/knife.png",
        layer: "1",
      },
      {
        // label: "Weapon",
        name: "Gun",
        uri: "https://example.com/gun.png",
        layer: "1",
      },
    ],
    assemblerConfig: assemblerConfigAddress.toString(),
    authority: adminKeypair.publicKey.toString(),
    payer: adminKeypair.publicKey.toString(),
  });
  console.log(txResponse3.transactions);
  console.log(txResponse3.transactions.length + " transactions to add traits");
  
  for (const txnBase64 of txResponse3.transactions) {
    const result = await sendTransaction(
      client,
      {
        transaction: txnBase64, // ← raw base64 is accepted
        blockhash: txResponse3.blockhash,
        lastValidBlockHeight: txResponse3.lastValidBlockHeight,
      },
      [adminKeypair]
    );

    if (result.status !== "Success") {
      console.error("❌ Trait Transaction failed:");
      console.log("⚠️ Result:", result);
      throw new Error("Trait transaction failed");
    }

    console.log("✅ Trait Transaction confirmed:", result.signature);
  }
  console.log("🎉 All traits added to the assembler config");
  const traitAdd = txResponse3.blockhash;
  console.log(traitAdd);

  const {
    createCreateCharacterModelTransaction: txResponse1, // This is the transaction response, you'll need to sign and send this transaction
  } = await client.createCreateCharacterModelTransaction({
    project: PROJECT_ADDRESS.toString(),
    authority: adminKeypair.publicKey.toString(),
    payer: adminKeypair.publicKey.toString(), // Optional, use this if you want a different wallet to pay the transaction fee, by default the authority pays for this tx
    mintAs: {
      kind: MintAsKind.MplCore,
    },
    config: {
      kind: "Assembled",
      assemblerConfigInput: {
        assemblerConfig: assemblerConfigAddress.toString(),
        collectionName: "Assembled NFT Collection",
        name: "Assembled Character NFT 0",
        symbol: "ACNFT",
        description: "Creating this NFT with assembler",
        sellerFeeBasisPoints: 0,
        creators: [
          {
            address: adminKeypair.publicKey.toString(),
            share: 100,
          },
        ],
      },
    },
    attributes: [
      // Optional attributes
      ["Weapon", "Bow"],
      ["Armor", "Helmet"],
    ],
    cooldown: {
      // Optional, add a cool down period (in seconds) before the characters can be unwrapped
      ejection: 1, // Ejection/unwrap cool down (in seconds)
    },
  });
  const result1 = await sendTransaction(
    client,
    {
      transaction: txResponse1.tx.transaction,
      blockhash: txResponse1.tx.blockhash,
      lastValidBlockHeight: txResponse1.tx.lastValidBlockHeight,
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
  console.log("🎉 Character Model created:", txResponse1.characterModel);

  const characterModelAddress = txResponse1.characterModel;

  const {
    createCreateCharactersTreeTransaction: txResponse2, // This is the transaction response, you'll need to sign and send this transaction
  } = await client.createCreateCharactersTreeTransaction({
    authority: adminKeypair.publicKey.toString(),
    project: PROJECT_ADDRESS.toString(),
    characterModel: characterModelAddress.toString(),
    payer: adminKeypair.publicKey.toString(), // Optional, only use if you want to pay from a different wallet
    treeConfig: {
      basic: {
        numAssets: 100000,
      },
    },
  });
  const result2 = await sendTransaction(
    client,
    {
      transaction: txResponse2.tx.transaction,
      blockhash: txResponse2.tx.blockhash,
      lastValidBlockHeight: txResponse2.tx.lastValidBlockHeight,
    },
    [adminKeypair]
  );
  if (result2.status !== "Success") {
    console.log("❌ Transaction failed.");
    console.log("⚠️ Full result2:", result2);
    console.log("⚠️ Status:", result2.status);
    console.log("🧾 Signature:", result2.signature);
    console.log("🚨 Error:", result2.error);
    throw new Error("Transaction failed");
  }
  console.log("✅ Transaction confirmed:", result2.signature);
  console.log("🎉 Character Tree created:", txResponse2.treeAddress);
} catch (err) {
  console.error("❌ Error in /create-resource:", err);
}
