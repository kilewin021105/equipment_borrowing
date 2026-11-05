const { db } = require('../db/database');

exports.getUserNotifications = (req, res, next) => {
  try {
    const userId = req.user.id;

    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 25
    `).all(userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(userId).count;

    res.json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (id === 'all') {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    } else {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
    }

    res.json({ success: true, message: 'Notification(s) marked as read.' });
  } catch (err) {
    next(err);
  }
};

exports.clearNotifications = (req, res, next) => {
  try {
    const userId = req.user.id;
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
    res.json({ success: true, message: 'Notifications cleared.' });
  } catch (err) {
    next(err);
  }
};

