import { createLoyaltyProgram, initializeVerxio } from "@verxioprotocol/core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  keypairIdentity,
  createSignerFromKeypair,
} from "@metaplex-foundation/umi";
import { Keypair } from "@solana/web3.js";
import "dotenv/config";

(async () => {
  try {
    // 1. Load keypair from .env
    const secret = JSON.parse(process.env.ADMIN_KEY);
    // const feePayer = Keypair.fromSecretKey(new Uint8Array(secret));
    // console.log("🔑 Admin pubkey =", feePayer.publicKey.toString());

    // 2. Create a signer and set it as the identity on the UMI instance
    const umi = createUmi("https://api.devnet.solana.com");
    // const signer = createSignerFromKeypair(umi, feePayer);

    const collectionSecretKey = new Uint8Array(secret);
    const collectionKeypair =
      umi.eddsa.createKeypairFromSecretKey(collectionSecretKey);
    const collectionKeypairSigner = createSignerFromKeypair(
      umi,
      collectionKeypair
    );
    const context = initializeVerxio(umi, collectionKeypairSigner.publicKey);
    context.umi.use(keypairIdentity(collectionKeypairSigner)); // <-- important!

    // 3. Initialize Verxio context using the same identity
    // const context = initializeVerxio(umi, signer.publicKey); // 👈 must match signer

    // console.log(signer.publicKey)
    console.log(context.programAuthority);

    // 4. Create loyalty program
    const result = await createLoyaltyProgram(context, {
      loyaltyProgramName: "Game Rewards",
      metadataUri:
        "https://aquamarine-working-thrush-698.mypinata.cloud/ipfs/bafkreidom7bk32qqpgez5la6ax3czmsxainibihlay3krz5tttizh3b2ue",
      programAuthority: context.programAuthority,
      updateAuthority: collectionKeypairSigner,
      metadata: {
        organizationName: "My Studio",
        brandColor: "#FF0000",
      },
      tiers: [
        { name: "Rookie", xpRequired: 0, rewards: ["Starter items"] },
        { name: "Veteran", xpRequired: 1000, rewards: ["Exclusive skins"] },
        { name: "Legend", xpRequired: 5000, rewards: ["Special abilities"] },
      ],
      pointsPerAction: {
        levelComplete: 100,
        achievementUnlock: 50,
        dailyLogin: 20,
      },
    });

    console.log("✅ Loyalty program created!");
    console.log("Collection Address:", result.collection.publicKey.toString());
    console.log("Signature:", result.signature);
  } catch (error) {
    console.error("❌ Failed to create loyalty program:", error);
  }
})();
