const fs = require("fs");
const path = require("path");
const { encodeToMorse, decodeFromMorse } = require("../utils/morse.util");
const { fernetEncrypt, fernetDecrypt } = require("../utils/fernet.util");
const { pool } = require("../config/db");
const { UPLOAD_FOLDER } = require("../middlewares/upload.middleware");

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

// Encode and save to database
async function encodeAndSave(req, res) {
  try {
    const { text, language = "english", fileName } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const morse = encodeToMorse(text.trim(), language.toLowerCase());
    const payload = JSON.stringify({ language: language.toLowerCase(), data: morse });
    const encrypted = fernetEncrypt(req.user.fernet_key, payload);

    // Save to database
    const unique_filename = `${req.user.id}_${Date.now()}_morse.enc`;
    const destPath = path.join(UPLOAD_FOLDER, unique_filename);
    
    // Save encrypted data to file
    fs.writeFileSync(destPath, encrypted);

    // Save file info to database
    const { rows } = await pool.query(
      `INSERT INTO encoded_files (user_id, original_name, file_name, file_path, file_type, is_viewable)
       VALUES ($1, $2, $3, $4, 'encoded', true)
       RETURNING id, file_name, created_at`,
      [req.user.id, fileName || `encoded_${Date.now()}.enc`, unique_filename, destPath]
    );

    return res.json({ 
      message: "File encoded and saved successfully", 
      file: rows[0],
      file_id: rows[0].id
    });
  } catch (err) {
    console.error("[encode-save]", err);
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

// Decode and save to database
async function decodeAndSave(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File required" });
    }

    const language = (req.body.language || "english").toLowerCase();
    const fileName = req.body.fileName || req.file.originalname;
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
      parsedPayload = { language: "english", data: decrypted };
    }

    if (parsedPayload.language !== language) {
      return res.status(400).json({ error: "Language mismatch! Please select the correct language." });
    }

    const decoded_text = decodeFromMorse(parsedPayload.data, language);

    // Save decoded content to database
    const unique_filename = `${req.user.id}_${Date.now()}_decoded.txt`;
    const destPath = path.join(UPLOAD_FOLDER, unique_filename);
    
    // Save decoded text to file
    fs.writeFileSync(destPath, decoded_text);

    // Save file info to database
    const { rows } = await pool.query(
      `INSERT INTO encoded_files (user_id, original_name, file_name, file_path, file_type, is_viewable)
       VALUES ($1, $2, $3, $4, 'decoded', true)
       RETURNING id, file_name, created_at`,
      [req.user.id, fileName || `decoded_${Date.now()}.txt`, unique_filename, destPath]
    );

    return res.json({ 
      message: "File decoded and saved successfully", 
      decoded_text: decoded_text,
      file: rows[0],
      file_id: rows[0].id
    });
  } catch (err) {
    console.error("[decode-save]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  encodeText,
  encodeAndSave,
  decodeFile,
  decodeAndSave
};
