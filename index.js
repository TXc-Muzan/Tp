const fs = require("fs-extra");
const express = require("express");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");
const { createCanvas, loadImage } = require("canvas");
const app = express();

// === CONFIG ===
const API_KEY = "Shinobu_Ai";
const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
const BASE_IMG = "https://i.postimg.cc/TY6qrSFN/20251108-190001.jpg";
const FALLBACK_AVATAR = "https://i.imgur.com/U8GBAjv.png";

// === Fetch avatar (BUFFER) using axios ===
async function fetchAvatar(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;

  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(res.data);
  } catch (err) {
    console.warn(`⚠️ Cannot fetch avatar for UID ${uid}, using fallback.`);
    const res = await axios.get(FALLBACK_AVATAR, { responseType: "arraybuffer" });
    return Buffer.from(res.data);
  }
}

// === MAIN TOILET ENDPOINT ===
app.get("/toilet", async (req, res) => {
  try {
    const { uid, key, name } = req.query;

    // --- API key check ---
    if (!key || key !== API_KEY)
      return res.status(403).json({ error: "Invalid API Key" });

    if (!uid)
      return res.status(400).json({ error: "Missing uid parameter" });

    if (uid === "61575527024895")
      return res.status(403).json({ error: "You cannot toilet the master!" });

    // --- Load image + avatar ---
    const [baseImg, avatarBuffer] = await Promise.all([
      loadImage(BASE_IMG),
      fetchAvatar(uid)
    ]);

    const avatarImg = await loadImage(avatarBuffer);

    // --- Create canvas ---
    const canvas = createCanvas(baseImg.width, baseImg.height);
    const ctx = canvas.getContext("2d");

    // --- Draw background ---
    ctx.drawImage(baseImg, 0, 0);

    // --- Circular avatar mask ---
    const ax = 215;
    const ay = 293;
    const size = 80;

    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + size / 2, ay + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, ax, ay, size, size);
    ctx.restore();

    // --- Caption ---
    const displayName = name || "Unknown";
    const text = `We found ${displayName} in an Indian toilet`;

    ctx.font = "bold 22px Sans";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#FFF";

    const tx = canvas.width / 2;
    const ty = baseImg.height - 25;

    ctx.strokeText(text, tx, ty);
    ctx.fillText(text, tx, ty);

    // --- Output PNG ---
    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    return res.end(buffer);

  } catch (e) {
    console.error("[TOILET ERROR]", e);
    res.status(500).json({ error: "Failed to generate toilet meme" });
  }
});

// === START SERVER ===
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚽 Toilet API running on port ${PORT}`));
