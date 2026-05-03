const { Router } = require("express");
const { encodeText, encodeAndSave, decodeFile, decodeAndSave, getSupportedLanguagesList, detectLanguage } = require("../controllers/morse.controller");
const authenticateToken = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

const router = Router();

// Public routes (no auth required)
router.get("/supported-languages", getSupportedLanguagesList);
router.post("/detect-language", detectLanguage);

// Protected routes
router.use(authenticateToken);

router.post("/encode", encodeText);
router.post("/encode-save", encodeAndSave);
router.post("/decode", upload.single("file"), decodeFile);
router.post("/decode-save", upload.single("file"), decodeAndSave);

module.exports = router;

