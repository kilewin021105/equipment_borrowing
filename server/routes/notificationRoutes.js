const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, notificationController.getUserNotifications);
router.patch('/:id/read', authenticateToken, notificationController.markAsRead);
router.delete('/', authenticateToken, notificationController.clearNotifications);

module.exports = router;

