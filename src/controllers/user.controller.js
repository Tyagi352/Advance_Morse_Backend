const { pool } = require("../config/db");

async function getUsers(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, username, email FROM users WHERE id != $1",
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("[api/users]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function getCurrentUser(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (err) {
    console.error("[api/me]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  getUsers,
  getCurrentUser
};
