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

// Save encoded/decoded file to database
async function saveEncodedFile(req, res) {
  try {
    const { file_name, file_content, file_type, original_name } = req.body;
    
    if (!file_name || !file_content) {
      return res.status(400).json({ error: "File name and content are required" });
    }

    const unique_filename = `${req.user.id}_${Date.now()}_${file_name}`;
    const destPath = path.join(UPLOAD_FOLDER, unique_filename);
    
    // Save file content to disk
    fs.writeFileSync(destPath, file_content);

    // Save file info to database
    const { rows } = await pool.query(
      `INSERT INTO encoded_files (user_id, original_name, file_name, file_path, file_type, is_viewable)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, file_name, created_at`,
      [req.user.id, original_name || file_name, unique_filename, destPath, file_type || "encoded"]
    );

    return res.json({ 
      message: "File saved successfully", 
      file: rows[0],
      file_id: rows[0].id
    });
  } catch (err) {
    console.error("[api/save-encoded]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Get encoded/decoded files for current user
async function getEncodedFiles(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, original_name, file_name, file_type, is_viewable, created_at
       FROM encoded_files
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json(rows);
  } catch (err) {
    console.error("[api/encoded-files]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// View/Download encoded file with view-only format
async function viewEncodedFile(req, res) {
  try {
    const { file_id } = req.params;
    const { rows } = await pool.query(
      "SELECT * FROM encoded_files WHERE id = $1",
      [file_id]
    );

    const fileInfo = rows[0];
    if (!fileInfo) {
      return res.status(404).json({ error: "File not found" });
    }

    // Security: Only owner can view
    if (req.user.id !== fileInfo.user_id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!fileInfo.is_viewable) {
      return res.status(403).json({ error: "File is not viewable" });
    }

    // Return file download
    return res.download(fileInfo.file_path, fileInfo.file_name);
  } catch (err) {
    console.error("[api/view-encoded]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Delete encoded file
async function deleteEncodedFile(req, res) {
  try {
    const { file_id } = req.params;
    const { rows } = await pool.query(
      "SELECT * FROM encoded_files WHERE id = $1",
      [file_id]
    );

    const fileInfo = rows[0];
    if (!fileInfo) {
      return res.status(404).json({ error: "File not found" });
    }

    // Security: Only owner can delete
    if (req.user.id !== fileInfo.user_id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Delete from database
    await pool.query("DELETE FROM encoded_files WHERE id = $1", [file_id]);

    // Delete file from disk
    try {
      fs.unlinkSync(fileInfo.file_path);
    } catch (e) {
      // File might not exist, continue
    }

    return res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("[api/delete-encoded]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Get sent files
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

// Get received files
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

// Download file
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
  downloadFile,
  saveEncodedFile,
  getEncodedFiles,
  viewEncodedFile,
  deleteEncodedFile
};
