require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { initDB } = require("./src/config/db");
const routes = require("./src/routes");
const handleSocketConnections = require("./src/socket/chat.handlers");

// ── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/", routes);

// ── WebSockets ───────────────────────────────────────────────────────────────
handleSocketConnections(io);

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await initDB();
  server.listen(PORT, () => {
    console.log(`\nMorseCode App (Node.js)  ->  http://localhost:${PORT}\n`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
