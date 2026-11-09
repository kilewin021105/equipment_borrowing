const bcrypt = require('bcryptjs');
const { db, logAudit } = require('../db/database');
const { supabase, supabaseUrl } = require('../db/supabaseClient');

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

    // Role Limitation / Quota Enforcements:
    // Administrator: max 5 users
    // Lab Custodian: max 7 users
    if (role && role !== current.role) {
      if (role === 'admin') {
        const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
        if (adminCount >= 5) {
          return res.status(400).json({
            success: false,
            message: 'Cannot assign role: Administrator quota reached (maximum 5 accounts allowed).'
          });
        }
      } else if (role === 'staff') {
        const staffCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'staff'").get().count;
        if (staffCount >= 7) {
          return res.status(400).json({
            success: false,
            message: 'Cannot assign role: Lab Custodian quota reached (maximum 7 accounts allowed).'
          });
        }
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

    // Sync to Supabase in background
    if (supabaseUrl && supabase) {
      try {
        supabase.from('users').update({
          role: role || current.role,
          status: status || current.status,
          department: department || current.department,
          name: name || current.name,
          phone: phone !== undefined ? phone : current.phone
        }).eq('id', id).then(() => {}).catch(e => console.warn('Supabase user update notice:', e.message));
      } catch (sbErr) {
        console.warn('Supabase client error:', sbErr.message);
      }
    }

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

    // Sync deletion to Supabase
    if (supabaseUrl && supabase) {
      try {
        supabase.from('users').delete().eq('id', id).then(() => {}).catch(e => console.warn('Supabase delete user notice:', e.message));
      } catch (sbErr) {
        console.warn('Supabase delete error:', sbErr.message);
      }
    }

    res.json({
      success: true,
      message: `User '${current.name}' deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
};

