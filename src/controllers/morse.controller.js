const fs = require("fs");
const { encodeToMorse, decodeFromMorse } = require("../utils/morse.util");
const { fernetEncrypt, fernetDecrypt } = require("../utils/fernet.util");

async function encodeText(req, res) {
  try {
    const { text, language = "english" } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const morse = encodeToMorse(text.trim(), language.toLowerCase());
    const payload = JSON.stringify({ language: language.toLowerCase(), data: morse });
    const encrypted = fernetEncrypt(req.user.fernet_key, payload);

    res.setHeader("Content-Disposition", 'attachment; filename="morse.enc"');
    res.setHeader("Content-Type", "application/octet-stream");
    return res.send(Buffer.from(encrypted));
  } catch (err) {
    console.error("[encode]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function decodeFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File required" });
    }

    const language = (req.body.language || "english").toLowerCase();
    const encryptedData = fs.readFileSync(req.file.path, "utf-8");

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    let decrypted;
    try {
      decrypted = fernetDecrypt(req.user.fernet_key, encryptedData);
    } catch {
      return res.status(400).json({ error: "Decryption failed" });
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(decrypted);
    } catch (e) {
      // Graceful fallback for older files lacking metadata
      parsedPayload = { language: "english", data: decrypted };
    }

    if (parsedPayload.language !== language) {
      return res.status(400).json({ error: "Language mismatch! Please select the correct language." });
    }

    const decoded_text = decodeFromMorse(parsedPayload.data, language);
    return res.json({ decoded_text });
  } catch (err) {
    console.error("[decode]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  encodeText,
  decodeFile
};
