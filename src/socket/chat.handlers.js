const { decodeJwtToken } = require("../utils/jwt.util");
const { pool } = require("../config/db");

const onlineUsers = {}; // { userId: socketId }
const sidToUser   = {}; // { socketId: { id, username } }

async function getSocketUser(token) {
  if (!token) return null;
  const payload = decodeJwtToken(token);
  if (!payload) return null;
  
  const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [payload.username]);
  return rows[0] || null;
}

function handleSocketConnections(io) {
  io.on("connection", async (socket) => {
    const token = socket.handshake.auth?.token;
    const user = await getSocketUser(token);

    if (!user) {
      socket.disconnect(true);
      return;
    }

    const uid = user.id;
    onlineUsers[uid] = socket.id;
    sidToUser[socket.id] = { id: uid, username: user.username };

    // Broadcast updated online list
    io.emit("online_users", Object.keys(onlineUsers).map(Number));
    console.log(`[+] ${user.username} connected  (${Object.keys(onlineUsers).length} online)`);

    // Handle private message
    socket.on("private_message", (data) => {
      const sender = sidToUser[socket.id];
      if (!sender) return;

      const toUid = parseInt(data.to, 10);
      const morse = data.morse || "";
      const timestamp = data.timestamp || Date.now();

      const payload = {
        from: sender.id,
        fromUsername: sender.username,
        morse,
        timestamp,
      };

      // Deliver to recipient
      const recipientSid = onlineUsers[toUid];
      if (recipientSid) {
        io.to(recipientSid).emit("private_message", payload);
      }

      // Echo back to sender
      socket.emit("message_sent", { to: toUid, morse, timestamp });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const info = sidToUser[socket.id];
      if (info) {
        delete onlineUsers[info.id];
        delete sidToUser[socket.id];
        io.emit("online_users", Object.keys(onlineUsers).map(Number));
        console.log(`[-] ${info.username} disconnected  (${Object.keys(onlineUsers).length} online)`);
      }
    });
  });
}

module.exports = handleSocketConnections;
