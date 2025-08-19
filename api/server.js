// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { Keypair } from "@solana/web3.js";
// import { createEdgeClient } from "@honeycomb-protocol/edge-client";
// import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers.js";

// const API_URL = "https://edge.test.honeycombprotocol.com/";

// export const client = createEdgeClient(API_URL, true);

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 4000;

// app.use(cors());
// app.use(express.json());

// // Load admin key
// const adminSecret = JSON.parse(process.env.ADMIN_KEY);
// const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(adminSecret));

// app.get('/home', (req, res) => {
//   res.status(200).json('Welcome, your app is working well');
// })

// // POST endpoint for awarding XP
// app.post("/award-xp", async (req, res) => {
//   const { profileAddress, xp = 0, achievements = [] } = req.body;

//   if (!profileAddress) {
//     return res.status(400).json({ error: "Missing 'profileAddress'" });
//   }

//   try {
//     console.log("➡️  Awarding XP:", {
//       profileAddress,
//       xp,
//       achievements,
//     });
//     console.log("Using admin keypair:", adminKeypair.publicKey.toString());
//     const fetchedProfiles = await client.findProfiles({
//       addresses: [profileAddress], // From request body
//       includeProof: true,
//     });

//     const fetchedProfile = fetchedProfiles.profile[0]; // ✅ Correct access
//     console.log("Fetched profile:", fetchedProfile);
//     const projectAddress = fetchedProfile.project;
//     console.log("Project address:", projectAddress);

//     const {
//       project: [projectData],
//     } = await client.findProjects({
//       addresses: [projectAddress],
//     });

//     console.log("🔑 Project Authority:", projectData.authority);
//     console.log("Backend key in use:", adminKeypair.publicKey.toString());
//     const isAdminAuthorized =
//       projectData.authority === adminKeypair.publicKey.toString();

//     if (!isAdminAuthorized) {
//       console.error("❌ Admin key is not authorized for this project.");
//       // Optionally throw an error or prevent the transaction
//     }

//     const { createUpdatePlatformDataTransaction: txResponse } =
//       await client.createUpdatePlatformDataTransaction({
//         profile: fetchedProfile.address,
//         authority: adminKeypair.publicKey.toString(), // Must be authorized admin
//         platformData: {
//           addXp: xp,
//           addAchievements: achievements,
//         },
//       });

//     console.log("✅ Platform transaction created. Sending...");
//     // console.log(txResponse);

//     // Step 2: Send and sign the transaction
//     const result = await sendTransaction(
//       client,
//       {
//         transaction: txResponse.transaction,
//         blockhash: txResponse.blockhash,
//         lastValidBlockHeight: txResponse.lastValidBlockHeight,
//       },
//       [adminKeypair]
//     );

//     if (result.status !== "Success") {
//       const logs = result.getLogs ? await result.getLogs() : [];

//       console.error("❌ Transaction failed.");
//       console.error("⚠️ Full result:", result);
//       console.error("⚠️ Status:", result.status);
//       console.error("🧾 Signature:", result.signature);
//       console.error("🚨 Error:", result.error);

//       return res.status(500).json({
//         error: "Transaction failed",
//         details: result.error,
//         logs,
//         debug: JSON.stringify(result.error, null, 2),
//       });
//     }

//     console.log("✅ Transaction confirmed:", result.signature);

//     return res.status(200).json({
//       success: true,
//       signature: result.signature,
//       profile: profileAddress,
//     });
//   } catch (err) {
//     console.error("❌ Error in /award-xp:", err);
//     return res.status(500).json({ error: err.message });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Backend running on http://localhost:${PORT}`);
// });
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Keypair } from "@solana/web3.js";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers.js";

const API_URL = "https://edge.test.honeycombprotocol.com/";
export const client = createEdgeClient(API_URL, true);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Load admin key
let adminKeypair;
try {
  const adminSecret = JSON.parse(process.env.ADMIN_KEY);
  adminKeypair = Keypair.fromSecretKey(Uint8Array.from(adminSecret));
} catch (e) {
  console.error("❌ Error loading admin key:", e.message);
}

app.get('/home', (req, res) => {
  res.status(200).json('Welcome, your app is working well');
});

app.post("/award-xp", async (req, res) => {
  try {
    const { profileAddress, xp = 0, achievements = [] } = req.body;

    if (!profileAddress) {
      return res.status(400).json({ error: "Missing 'profileAddress'" });
    }

    const fetchedProfiles = await client.findProfiles({
      addresses: [profileAddress],
      includeProof: true,
    });

    const fetchedProfile = fetchedProfiles.profile[0];
    const projectAddress = fetchedProfile.project;

    const {
      project: [projectData],
    } = await client.findProjects({ addresses: [projectAddress] });

    const isAdminAuthorized =
      projectData.authority === adminKeypair.publicKey.toString();

    if (!isAdminAuthorized) {
      return res.status(403).json({ error: "Unauthorized admin key." });
    }

    const {
      createUpdatePlatformDataTransaction: txResponse,
    } = await client.createUpdatePlatformDataTransaction({
      profile: fetchedProfile.address,
      authority: adminKeypair.publicKey.toString(),
      platformData: { addXp: xp, addAchievements: achievements },
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
      return res.status(500).json({
        error: "Transaction failed",
        details: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      signature: result.signature,
      profile: profileAddress,
    });
  } catch (err) {
    console.error("❌ Error in /award-xp:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Required export for Vercel
export default app;
