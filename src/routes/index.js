const { Router } = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const morseRoutes = require("./morse.routes");
const fileRoutes = require("./file.routes");

const router = Router();

// Root level auth & morse routes from the original app structure
router.use("/", authRoutes);
router.use("/", morseRoutes);

// Namespaced API routes from original app structure
router.use("/api/users", userRoutes);
router.use("/api", fileRoutes);

module.exports = router;
