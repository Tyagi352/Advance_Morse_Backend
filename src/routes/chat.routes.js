const { Router } = require("express");
const { getChatHistory } = require("../controllers/chat.controller");
const authenticateToken = require("../middlewares/auth.middleware");

const router = Router();

// Get chat history with a specific user
router.get("/history/:userId", authenticateToken, getChatHistory);

module.exports = router;
