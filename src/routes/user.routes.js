const { Router } = require("express");
const { getUsers, getCurrentUser } = require("../controllers/user.controller");
const authenticateToken = require("../middlewares/auth.middleware");

const router = Router();

// Get current user info (protected)
router.get("/me", authenticateToken, getCurrentUser);

// Retrieve all users (protected)
router.get("/", authenticateToken, getUsers);

module.exports = router;
