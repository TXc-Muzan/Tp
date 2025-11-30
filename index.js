const fs = require("fs-extra");
const express = require("express");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const app = express();

// === CONFIG ===
const API_KEY = "Shinobu_Ai";
const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
const BASE_IMG = "https://i.postimg.cc/TY6qrSFN/20251108-190001.jpg";
const FALLBACK_AVATAR = "https://i.imgur.com/U8GBAjv.png";

// === Fetch avatar ===
async function fetchAvatar(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(res.data);
  } catch (err) {
    const fallback = await axios.get(FALLBACK_AVATAR, { responseType: "arraybuffer" });
    return Buffer.from(fallback.data);
  }
}

// === MAIN ENDPOINT ===
app.get("/toilet", async (req, res) => {
  try {
    const { uid, key, name } = req.query;

    if (!key || key !== API_KEY)
      return res.status(403).json({ error: "Invalid API Key" });

    if (!uid)
      return res.status(400).json({ error: "Missing uid parameter" });

    if (uid === "61575527024895")
      return res.status(403).json({ error: "You cannot toilet the master!" });

    const [bgImg, avatarBuffer] = await Promise.all([
      loadImage(BASE_IMG),
      fetchAvatar(uid)
    ]);

    const avatarImg = await loadImage(avatarBuffer);

    const canvas = createCanvas(bgImg.width, bgImg.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bgImg, 0, 0);

    // Avatar circle crop
    const ax = 215, ay = 293, size = 80;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + size / 2, ay + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, ax, ay, size, size);
    ctx.restore();

    // Caption
    const displayName = name || "Unknown";
    const text = `We found ${displayName} in an Indian toilet`;

    ctx.font = "bold 22px Sans";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#FFF";

    ctx.strokeText(text, canvas.width / 2, bgImg.height - 25);
    ctx.fillText(text, canvas.width / 2, bgImg.height - 25);

    res.setHeader("Content-Type", "image/png");
    return res.end(canvas.toBuffer("image/png"));

  } catch (e) {
    console.error("ERROR:", e);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// === START SERVER ===
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🚽 Toilet API running on port", PORT);
  console.log(`🔗 Local URL: http://localhost:${PORT}/toilet?uid=4&key=${API_KEY}`);
});