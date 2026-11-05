const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, requireRole('admin'), userController.getAllUsers);
router.put('/:id', authenticateToken, requireRole('admin'), userController.updateUser);
router.delete('/:id', authenticateToken, requireRole('admin'), userController.deleteUser);

module.exports = router;

