const { Router } = require("express");
const { shareFile, getSentFiles, getReceivedFiles, downloadFile } = require("../controllers/file.controller");
const authenticateToken = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

const router = Router();

router.use(authenticateToken);

router.post("/share", upload.single("file"), shareFile);
router.get("/files/sent", getSentFiles);
router.get("/files/received", getReceivedFiles);
router.get("/files/download/:file_id", downloadFile);

module.exports = router;
