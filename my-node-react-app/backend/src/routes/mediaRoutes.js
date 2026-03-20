const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticateAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/wav', 'video/webm', 'video/quicktime'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type.'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }); // 50 MB max for video

router.post('/upload', authenticateAdmin, upload.single('file'), mediaController.uploadMedia);
router.get('/', mediaController.getMedia);
router.get('/categories', mediaController.getCategories);
router.get('/:category', mediaController.getMediaByCategory);
router.post('/delete', authenticateAdmin, mediaController.deleteMedia);

module.exports = router;
