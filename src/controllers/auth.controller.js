const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { createJwtToken } = require("../utils/jwt.util");
const { generateFernetKey } = require("../utils/fernet.util");

async function registerUser(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password required" });
    }

    const { rows: existingUser } = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    const { rows: existingEmail } = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

    if (existingUser.length > 0 || existingEmail.length > 0) {
      return res.status(400).json({ error: "Username or email exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const fernet_key = generateFernetKey();

    await pool.query(
      "INSERT INTO users (username, email, password_hash, fernet_key) VALUES ($1, $2, $3, $4)",
      [username, email, password_hash, fernet_key]
    );

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("[register]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createJwtToken(user.username);
    return res.json({ token, username: user.username });
  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  registerUser,
  loginUser
};
