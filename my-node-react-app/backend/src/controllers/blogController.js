const db = require('../config/db');

exports.createBlog = async (req, res) => {
  const { title, content, image, author, tags } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO blogs (title, content, image, author, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, content, image, author, tags]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getBlogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const result = await db.query(
      'SELECT * FROM blogs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    // Also fetch the total count for frontend calculations
    const countResult = await db.query('SELECT COUNT(*) FROM blogs');
    const totalBlogs = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      meta: {
        total: totalBlogs,
        page,
        limit,
        totalPages: Math.ceil(totalBlogs / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getBlogById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM blogs WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Blog not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateBlog = async (req, res) => {
  const { id } = req.params;
  const { title, content, image, author, tags } = req.body;
  try {
    const result = await db.query(
      'UPDATE blogs SET title = $1, content = $2, image = $3, author = $4, tags = $5 WHERE id = $6 RETURNING *',
      [title, content, image, author, tags, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Blog not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM blogs WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
