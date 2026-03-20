const db = require('../config/db');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');

exports.uploadMedia = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext = path.extname(req.file.filename).toLowerCase();
  let type = 'unknown';
  if ([".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext)) type = 'video';
  else if ([".mp3", ".wav", ".ogg", ".m4a"].includes(ext)) type = 'audio';
  else if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext)) type = 'image';

  if (type === 'unknown') return res.status(400).json({ error: 'Unsupported file type' });

  const caption = req.body.caption || '';
  const category = req.body.category || 'Uncategorized';
  const filePath = req.file.filename;
  const PORT = process.env.PORT || 5000;
  const url = `http://localhost:${PORT}/uploads/${filePath}`;

  try {
    const result = await db.query(
      'INSERT INTO media (url, type, caption, filePath, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [url, type, caption, filePath, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: 'Failed to save media' });
  }
};

exports.getMedia = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM media ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching media' });
  }
};

exports.getMediaByCategory = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM media WHERE category = $1', [req.params.category]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMedia = async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Missing filePath' });
  const fullPath = path.join(uploadsDir, filePath);

  try {
    await db.query('DELETE FROM media WHERE filePath = $1', [filePath]);
    fs.unlink(fullPath, err => {
      // Ignore if file is already deleted physically
      if (err && err.code !== 'ENOENT') {
         console.error(err);
      }
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting media' });
  }
};

exports.getCategories = (req, res) => {
  res.json(['Stressed', 'Lonely', 'Anxious', 'Encouraged', 'Hopeful', 'Other']);
};
