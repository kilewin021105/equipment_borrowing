const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', categoryController.getAllCategories);
router.post('/', authenticateToken, requireRole('staff', 'admin'), categoryController.createCategory);
router.put('/:id', authenticateToken, requireRole('staff', 'admin'), categoryController.updateCategory);
router.delete('/:id', authenticateToken, requireRole('admin'), categoryController.deleteCategory);

module.exports = router;

