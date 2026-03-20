const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticateAdmin } = require('../middlewares/auth');

router.post('/', authenticateAdmin, blogController.createBlog);
router.get('/', blogController.getBlogs);
router.get('/:id', blogController.getBlogById);
router.put('/:id', authenticateAdmin, blogController.updateBlog);
router.delete('/:id', authenticateAdmin, blogController.deleteBlog);

module.exports = router;
