const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, borrowController.getBorrowRequests);
router.get('/:id', authenticateToken, borrowController.getBorrowRequestById);
router.post('/', authenticateToken, borrowController.createBorrowRequest);
router.patch('/:id/status', authenticateToken, requireRole('staff', 'admin'), borrowController.updateRequestStatus);
router.patch('/:id/cancel', authenticateToken, borrowController.cancelBorrowRequest);

module.exports = router;

