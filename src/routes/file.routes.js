const { Router } = require("express");
const { shareFile, getSentFiles, getReceivedFiles, downloadFile, saveEncodedFile, getEncodedFiles, viewEncodedFile, deleteEncodedFile } = require("../controllers/file.controller");
const authenticateToken = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

const router = Router();

router.use(authenticateToken);

router.post("/share", upload.single("file"), shareFile);
router.get("/files/sent", getSentFiles);
router.get("/files/received", getReceivedFiles);
router.get("/files/download/:file_id", downloadFile);

// New endpoints for encoded/decoded files
router.post("/save-encoded", saveEncodedFile);
router.get("/encoded-files", getEncodedFiles);
router.get("/view-encoded/:file_id", viewEncodedFile);
router.delete("/delete-encoded/:file_id", deleteEncodedFile);

module.exports = router;
