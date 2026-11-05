const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/summary', authenticateToken, statsController.getSummaryStats);
router.get('/analytics', authenticateToken, requireRole('staff', 'admin'), statsController.getAnalyticsCharts);

module.exports = router;

