const bcrypt = require('bcryptjs');
const { db, logAudit } = require('../db/database');

exports.getAllUsers = (req, res, next) => {
  try {
    const { role, search, status } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.student_id, u.department, u.phone, u.status, u.created_at,
        COUNT(br.id) AS total_borrow_count,
        SUM(CASE WHEN br.status = 'dispatched' THEN 1 ELSE 0 END) AS active_loans_count
      FROM users u
      LEFT JOIN borrow_requests br ON u.id = br.user_id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.student_id LIKE ? OR u.department LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const users = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, status, department, name, phone } = req.body;

    const current = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Safety: prevent admin from demoting themselves if they are the only admin
    if (req.user.id === Number(id) && role && role !== 'admin') {
      const adminCount = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND status = 'active'`).get();
      if (adminCount.count <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the sole active administrator.' });
      }
    }

    db.prepare(`
      UPDATE users 
      SET role = COALESCE(?, role),
          status = COALESCE(?, status),
          department = COALESCE(?, department),
          name = COALESCE(?, name),
          phone = COALESCE(?, phone)
      WHERE id = ?
    `).run(role || null, status || null, department || null, name || null, phone || null, id);

    logAudit(req.user.id, 'UPDATE_USER', 'users', id, { previousRole: current.role, newRole: role, status });

    const updated = db.prepare('SELECT id, name, email, role, student_id, department, phone, status FROM users WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'User details updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = (req, res, next) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account.' });
    }

    const current = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    logAudit(req.user.id, 'DELETE_USER', 'users', id, { email: current.email });

    res.json({
      success: true,
      message: `User '${current.name}' deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
};

