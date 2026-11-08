const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, logAudit, createNotification } = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, student_id, department, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Determine role (default to borrower unless explicitly permitted or seeded)
    const allowedRoles = ['borrower', 'staff', 'admin'];
    const assignedRole = allowedRoles.includes(role) ? role : 'borrower';

    // Role Limitation / Quota Enforcements:
    // Administrator: max 5 users
    // Lab Custodian: max 7 users
    if (assignedRole === 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
      if (adminCount >= 5) {
        return res.status(400).json({
          success: false,
          message: 'The maximum quota of 5 Administrator accounts has been reached. Please choose another role or contact an administrator.'
        });
      }
    } else if (assignedRole === 'staff') {
      const staffCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'staff'").get().count;
      if (staffCount >= 7) {
        return res.status(400).json({
          success: false,
          message: 'The maximum quota of 7 Lab Custodian accounts has been reached. Please choose another role.'
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, role, student_id, department, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = stmt.run(
      name.trim(),
      email.toLowerCase().trim(),
      hashedPassword,
      assignedRole,
      student_id ? student_id.trim() : null,
      department ? department.trim() : 'Bachelor Science of information technology(BSIT)',
      phone ? phone.trim() : null
    );

    const userId = Number(result.lastInsertRowid);

    // Sync to Supabase in real-time if connected
    if (process.env.SUPABASE_URL) {
      try {
        const { supabase } = require('../db/supabaseClient');
        await supabase.from('users').upsert({
          id: userId,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: assignedRole,
          student_id: student_id ? student_id.trim() : null,
          department: department ? department.trim() : 'Bachelor Science of information technology(BSIT)',
          phone: phone ? phone.trim() : null,
          status: 'active'
        });
      } catch (sbErr) {
        console.warn('Notice: Background Supabase sync:', sbErr.message);
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email: email.toLowerCase().trim(), role: assignedRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logAudit(userId, 'REGISTER', 'users', userId, { role: assignedRole, email });
    createNotification(userId, 'Welcome to CampusEquip!', 'Your account is ready. Browse equipment and start borrowing academic assets seamlessly.', 'success');

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: assignedRole,
        student_id: student_id || null,
        department: department || 'Bachelor Science of information technology(BSIT)',
        phone: phone || null,
        status: 'active'
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Please contact lab administration.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logAudit(user.id, 'LOGIN', 'users', user.id, { email: user.email });

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        student_id: user.student_id,
        department: user.department,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getCurrentUser = (req, res, next) => {
  try {
    const user = req.user;

    // Get live borrower stats
    const stats = {
      activeBorrows: 0,
      pendingRequests: 0,
      overdueBorrows: 0,
      completedBorrows: 0
    };

    if (user.role === 'borrower') {
      const activeCount = db.prepare(`SELECT COUNT(*) as count FROM borrow_requests WHERE user_id = ? AND status = 'dispatched'`).get(user.id);
      const pendingCount = db.prepare(`SELECT COUNT(*) as count FROM borrow_requests WHERE user_id = ? AND status = 'pending'`).get(user.id);
      const completedCount = db.prepare(`SELECT COUNT(*) as count FROM borrow_requests WHERE user_id = ? AND status = 'returned'`).get(user.id);
      const overdueCount = db.prepare(`
        SELECT COUNT(*) as count FROM borrow_requests 
        WHERE user_id = ? AND status = 'dispatched' AND date('now') > date(return_date)
      `).get(user.id);

      stats.activeBorrows = activeCount.count;
      stats.pendingRequests = pendingCount.count;
      stats.completedBorrows = completedCount.count;
      stats.overdueBorrows = overdueCount.count;
    }

    res.json({
      success: true,
      user,
      stats
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, department, phone, currentPassword, newPassword } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Password change verification if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);
    }

    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          department = COALESCE(?, department),
          phone = COALESCE(?, phone)
      WHERE id = ?
    `).run(name || null, department || null, phone || null, userId);

    const updatedUser = db.prepare('SELECT id, name, email, role, student_id, department, phone, status FROM users WHERE id = ?').get(userId);
    logAudit(userId, 'PROFILE_UPDATE', 'users', userId, { updatedFields: { name, department, phone } });

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

exports.getRoleLimits = (req, res, next) => {
  try {
    const adminCount = Number(db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count || 0);
    const staffCount = Number(db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'staff'").get().count || 0);
    const borrowerCount = Number(db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'borrower'").get().count || 0);

    const limits = {
      admin: {
        role: 'admin',
        title: 'Administrator',
        current: adminCount,
        max: 5,
        available: Math.max(0, 5 - adminCount),
        isFull: adminCount >= 5
      },
      staff: {
        role: 'staff',
        title: 'Lab Custodian',
        current: staffCount,
        max: 7,
        available: Math.max(0, 7 - staffCount),
        isFull: staffCount >= 7
      },
      borrower: {
        role: 'borrower',
        title: 'Student / Faculty',
        current: borrowerCount,
        max: null,
        available: null,
        isFull: false
      }
    };

    res.json({
      success: true,
      data: limits
    });
  } catch (err) {
    next(err);
  }
};


