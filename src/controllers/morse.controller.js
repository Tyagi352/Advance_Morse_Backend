const fs = require("fs");
const path = require("path");
const { encodeToMorse, decodeFromMorse, getSupportedLanguages } = require("../utils/morse.util");
const { fernetEncrypt, fernetDecrypt } = require("../utils/fernet.util");
const { detectLanguageWithGemini, validateLanguageConsistency, translateToEnglish } = require("../utils/language.util");
const { pool } = require("../config/db");
const { UPLOAD_FOLDER } = require("../middlewares/upload.middleware");

async function encodeText(req, res) {
  try {
    const { text, language = null } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    let detectedLanguage = language?.toLowerCase() || "english";
    
    // If no language provided, auto-detect using Gemini
    if (!language) {
      try {
        detectedLanguage = await detectLanguageWithGemini(text.trim());
      } catch (error) {
        console.error("[Auto-detect error]", error);
        detectedLanguage = "english"; // Fallback
      }
    }

    // Validate language is supported
    const supportedLangs = getSupportedLanguages();
    if (!supportedLangs.includes(detectedLanguage)) {
      return res.status(400).json({ 
        error: `Language "${detectedLanguage}" not supported`, 
        supportedLanguages: supportedLangs 
      });
    }

    try {
      const morse = encodeToMorse(text.trim(), detectedLanguage);
      
      if (!morse) {
        return res.status(400).json({ error: "Unable to encode text with selected language" });
      }

      const payload = JSON.stringify({ 
        language: detectedLanguage, 
        data: morse,
        originalText: text.trim(),
        encodedAt: new Date().toISOString()
      });
      const encrypted = fernetEncrypt(req.user.fernet_key, payload);

      res.setHeader("Content-Disposition", 'attachment; filename="morse.enc"');
      res.setHeader("Content-Type", "application/octet-stream");
      return res.send(Buffer.from(encrypted));
    } catch (encodeError) {
      console.error("[Encoding error]", encodeError);
      return res.status(400).json({ error: `Encoding error: ${encodeError.message}` });
    }
  } catch (err) {
    console.error("[encode]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Encode and save to database
async function encodeAndSave(req, res) {
  try {
    const { text, language = null, fileName } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    let detectedLanguage = language?.toLowerCase() || "english";
    
    // If no language provided, auto-detect using Gemini
    if (!language) {
      try {
        detectedLanguage = await detectLanguageWithGemini(text.trim());
      } catch (error) {
        console.error("[Auto-detect error]", error);
        detectedLanguage = "english"; // Fallback
      }
    }

    // Validate language is supported
    const supportedLangs = getSupportedLanguages();
    if (!supportedLangs.includes(detectedLanguage)) {
      return res.status(400).json({ 
        error: `Language "${detectedLanguage}" not supported`, 
        supportedLanguages: supportedLangs 
      });
    }

    try {
      const morse = encodeToMorse(text.trim(), detectedLanguage);
      
      if (!morse) {
        return res.status(400).json({ error: "Unable to encode text with selected language" });
      }

      const payload = JSON.stringify({ 
        language: detectedLanguage, 
        data: morse,
        originalText: text.trim(),
        encodedAt: new Date().toISOString()
      });
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
        file_id: rows[0].id,
        language: detectedLanguage,
        charactersEncoded: text.trim().length
      });
    } catch (encodeError) {
      console.error("[Encoding error]", encodeError);
      return res.status(400).json({ error: `Encoding error: ${encodeError.message}` });
    }
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
      return res.status(400).json({ error: "Decryption failed - invalid file or wrong user key" });
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(decrypted);
    } catch (e) {
      // Graceful fallback for older files lacking metadata
      parsedPayload = { language: "english", data: decrypted };
    }

    // Check if language matches (if payload has language info)
    if (parsedPayload.language && parsedPayload.language !== language) {
      return res.status(400).json({ 
        error: `Language mismatch! File is encoded in "${parsedPayload.language}" but you selected "${language}"`,
        fileLanguage: parsedPayload.language,
        selectedLanguage: language
      });
    }

    try {
      const decoded_text = decodeFromMorse(parsedPayload.data, language);
      
      if (!decoded_text) {
        return res.status(400).json({ error: "Unable to decode file - invalid morse code" });
      }

      return res.json({ 
        decoded_text,
        language: language,
        charactersDecoded: decoded_text.length,
        originalTextMatch: parsedPayload.originalText ? (decoded_text === parsedPayload.originalText) : null
      });
    } catch (decodeError) {
      console.error("[Decoding error]", decodeError);
      return res.status(400).json({ error: `Decoding error: ${decodeError.message}` });
    }
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
      return res.status(400).json({ error: "Decryption failed - invalid file or wrong user key" });
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(decrypted);
    } catch (e) {
      parsedPayload = { language: "english", data: decrypted };
    }

    // Check if language matches
    if (parsedPayload.language && parsedPayload.language !== language) {
      return res.status(400).json({ 
        error: `Language mismatch! File is encoded in "${parsedPayload.language}" but you selected "${language}"`,
        fileLanguage: parsedPayload.language,
        selectedLanguage: language
      });
    }

    try {
      const decoded_text = decodeFromMorse(parsedPayload.data, language);

      if (!decoded_text) {
        return res.status(400).json({ error: "Unable to decode file - invalid morse code" });
      }

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
        file_id: rows[0].id,
        language: language,
        charactersDecoded: decoded_text.length
      });
    } catch (decodeError) {
      console.error("[Decoding error]", decodeError);
      return res.status(400).json({ error: `Decoding error: ${decodeError.message}` });
    }
  } catch (err) {
    console.error("[decode-save]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * Get list of all supported languages and their details
 */
async function getSupportedLanguagesList(req, res) {
  try {
    const languages = getSupportedLanguages();
    
    const languageDetails = languages.map(lang => ({
      code: lang,
      name: require("../utils/language.util").getLanguageName(lang),
      supportedCharacters: Object.keys(require("../utils/morse.util").MORSE_CODES[lang] || {}).length
    }));

    return res.json({
      message: "Supported languages",
      count: languages.length,
      languages: languageDetails
    });
  } catch (err) {
    console.error("[get-languages]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * Auto-detect language of provided text
 */
async function detectLanguage(req, res) {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required for language detection" });
    }

    try {
      const detectedLanguage = await detectLanguageWithGemini(text.trim());
      return res.json({
        message: "Language detected",
        text: text.trim(),
        detectedLanguage: detectedLanguage,
        languageName: require("../utils/language.util").getLanguageName(detectedLanguage)
      });
    } catch (detectError) {
      console.error("[Detection error]", detectError);
      return res.status(400).json({ error: `Detection error: ${detectError.message}` });
    }
  } catch (err) {
    console.error("[detect-language]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  encodeText,
  encodeAndSave,
  decodeFile,
  decodeAndSave,
  getSupportedLanguagesList,
  detectLanguage
};

