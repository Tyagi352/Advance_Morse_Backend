const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");
const { UPLOAD_FOLDER } = require("../middlewares/upload.middleware");

async function shareFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const recipient_id = req.body.recipient_id;
    if (!recipient_id) {
      return res.status(400).json({ error: "Recipient is required" });
    }

    const unique_filename = `${req.user.id}_${recipient_id}_${Date.now()}_${req.file.originalname}`;
    const destPath = path.join(UPLOAD_FOLDER, unique_filename);
    
    // Rename/move file from temp multer path to final path
    fs.renameSync(req.file.path, destPath);

    await pool.query(
      "INSERT INTO shared_files (sender_id, recipient_id, file_name, file_path) VALUES ($1, $2, $3, $4)",
      [req.user.id, recipient_id, req.file.originalname, destPath]
    );

    return res.json({ message: "File shared successfully" });
  } catch (err) {
    console.error("[api/share]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function getSentFiles(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT sf.id, u.username AS recipient, sf.file_name, sf.shared_at
       FROM shared_files sf
       JOIN users u ON sf.recipient_id = u.id
       WHERE sf.sender_id = $1
       ORDER BY sf.shared_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("[api/files/sent]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function getReceivedFiles(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT sf.id, u.username AS sender, sf.file_name, sf.shared_at
       FROM shared_files sf
       JOIN users u ON sf.sender_id = u.id
       WHERE sf.recipient_id = $1
       ORDER BY sf.shared_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("[api/files/received]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function downloadFile(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM shared_files WHERE id = $1", [
      req.params.file_id,
    ]);
    const fileInfo = rows[0];
    
    if (!fileInfo) {
      return res.status(404).json({ error: "File not found" });
    }

    // Security: Only sender or recipient can download
    if (req.user.id !== fileInfo.sender_id && req.user.id !== fileInfo.recipient_id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.download(fileInfo.file_path, fileInfo.file_name);
  } catch (err) {
    console.error("[api/files/download]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  shareFile,
  getSentFiles,
  getReceivedFiles,
  downloadFile
};
