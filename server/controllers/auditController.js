const { db } = require('../db/database');

exports.getAuditLogs = (req, res, next) => {
  try {
    const { action, limit = 50, page = 1 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    let query = `
      SELECT 
        al.*,
        u.name AS actor_name,
        u.email AS actor_email,
        u.role AS actor_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      query += ` AND al.action = ?`;
      params.push(action);
    }

    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), offset);

    const logs = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

    res.json({
      success: true,
      total,
      data: logs
    });
  } catch (err) {
    next(err);
  }
};

