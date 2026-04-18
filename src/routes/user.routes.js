const { Router } = require("express");
const { getUsers } = require("../controllers/user.controller");
const authenticateToken = require("../middlewares/auth.middleware");

const router = Router();

// Retrieve users (protected)
router.get("/", authenticateToken, getUsers);

module.exports = router;
