const db = require('../config/db');

exports.getTeamMembers = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM team_members ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addTeamMember = async (req, res) => {
  const { name, title, bio } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
  if (!name || !title || !bio) return res.status(400).json({ error: 'Name, title and bio required' });

  try {
    const result = await db.query(
      'INSERT INTO team_members (name, title, image, bio) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, title, imagePath, bio]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error saving team member' });
  }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM team_members WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Team member not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting team member' });
  }
};
