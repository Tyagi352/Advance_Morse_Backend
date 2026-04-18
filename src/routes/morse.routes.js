const { Router } = require("express");
const { encodeText, encodeAndSave, decodeFile, decodeAndSave } = require("../controllers/morse.controller");
const authenticateToken = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

const router = Router();

// Both routes are protected
router.use(authenticateToken);

router.post("/encode", encodeText);
router.post("/encode-save", encodeAndSave);
router.post("/decode", upload.single("file"), decodeFile);
router.post("/decode-save", upload.single("file"), decodeAndSave);

module.exports = router;
