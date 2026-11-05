const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, equipmentController.getAllEquipment);
router.get('/:id', optionalAuth, equipmentController.getEquipmentById);
router.post('/', authenticateToken, requireRole('staff', 'admin'), equipmentController.createEquipment);
router.put('/:id', authenticateToken, requireRole('staff', 'admin'), equipmentController.updateEquipment);
router.delete('/:id', authenticateToken, requireRole('admin'), equipmentController.deleteEquipment);

module.exports = router;

