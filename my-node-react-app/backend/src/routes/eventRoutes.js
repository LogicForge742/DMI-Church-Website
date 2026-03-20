const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateAdmin } = require('../middlewares/auth');

router.post('/', authenticateAdmin, eventController.createEvent);
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.put('/:id', authenticateAdmin, eventController.updateEvent);
router.delete('/:id', authenticateAdmin, eventController.deleteEvent);

module.exports = router;
