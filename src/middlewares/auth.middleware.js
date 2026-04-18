const { decodeJwtToken } = require("../utils/jwt.util");
const { pool } = require("../config/db");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = parts[1];
  const payload = decodeJwtToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [payload.username]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error("[auth middleware]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = authenticateToken;
