const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

const uploadsDir = path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB max

router.get('/', teamController.getTeamMembers);
router.post('/', authenticateAdmin, upload.single('image'), teamController.addTeamMember);
router.delete('/:id', authenticateAdmin, teamController.deleteTeamMember);

module.exports = router;
