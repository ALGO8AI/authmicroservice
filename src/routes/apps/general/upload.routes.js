const { Router } = require("express");
const router = Router();
const path = require('path');
const uploadMiddleware = require("../../../middlewares/upload.middleware");
const uploadFile = require("../../../controllers/apps/general/upload.controllers");


const UPLOAD_PATH = path.resolve(__dirname, '../../../../uploads');
const upload = uploadMiddleware(UPLOAD_PATH);

router.use((req, res, next) => {
    req.uploadPath = UPLOAD_PATH;
    next();
});

router.post("/upload", upload.single('file'), uploadFile);


module.exports = router;