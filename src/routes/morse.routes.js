const { Router } = require("express");
const { encodeText, decodeFile } = require("../controllers/morse.controller");
const authenticateToken = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

const router = Router();

// Both routes are protected
router.use(authenticateToken);

router.post("/encode", encodeText);
router.post("/decode", upload.single("file"), decodeFile);

module.exports = router;
