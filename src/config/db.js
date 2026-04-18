const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        username      VARCHAR(255) UNIQUE NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        fernet_key    TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS shared_files (
        id            SERIAL PRIMARY KEY,
        sender_id     INTEGER NOT NULL REFERENCES users(id),
        recipient_id  INTEGER NOT NULL REFERENCES users(id),
        file_name     VARCHAR(255) NOT NULL,
        file_path     TEXT NOT NULL,
        shared_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[DB] Tables ready (Neon PostgreSQL)");
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
