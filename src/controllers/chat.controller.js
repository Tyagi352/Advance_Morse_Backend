const { pool } = require("../config/db");

// GET /api/chat/history/:userId — fetch chat history between current user and :userId
async function getChatHistory(req, res) {
  try {
    const currentUserId = req.user.id;
    const otherUserId = parseInt(req.params.userId, 10);

    if (isNaN(otherUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { rows } = await pool.query(
      `SELECT 
        cm.id,
        cm.sender_id,
        cm.recipient_id,
        cm.morse,
        cm.decoded_text,
        cm.created_at,
        u.username AS sender_username
       FROM chat_messages cm
       JOIN users u ON u.id = cm.sender_id
       WHERE (cm.sender_id = $1 AND cm.recipient_id = $2)
          OR (cm.sender_id = $2 AND cm.recipient_id = $1)
       ORDER BY cm.created_at ASC
       LIMIT 200`,
      [currentUserId, otherUserId]
    );

    const messages = rows.map((r) => ({
      id: r.id,
      type: r.sender_id === currentUserId ? "sent" : "received",
      from: r.sender_id,
      fromUsername: r.sender_username,
      morse: r.morse,
      decoded: r.decoded_text,
      timestamp: new Date(r.created_at).getTime(),
    }));

    res.json(messages);
  } catch (err) {
    console.error("[Chat] Failed to fetch history:", err.message);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
}

module.exports = { getChatHistory };
