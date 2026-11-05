const { db } = require('../db/database');

exports.getSummaryStats = (req, res, next) => {
  try {
    const totalEquipment = db.prepare('SELECT COUNT(*) as count FROM equipment').get().count;
    const stockStats = db.prepare('SELECT COALESCE(SUM(total_quantity), 0) as total, COALESCE(SUM(available_quantity), 0) as available FROM equipment').get();
    
    const pendingRequests = db.prepare(`SELECT COUNT(*) as count FROM borrow_requests WHERE status = 'pending'`).get().count;
    const activeLoans = db.prepare(`SELECT COUNT(*) as count FROM borrow_requests WHERE status = 'dispatched'`).get().count;
    const overdueLoans = db.prepare(`SELECT COUNT(*) as count FROM borrow_requests WHERE status = 'dispatched' AND date('now') > date(return_date)`).get().count;
    const returnedLoans = db.prepare(`SELECT COUNT(*) as count FROM borrow_requests WHERE status = 'returned'`).get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    res.json({
      success: true,
      data: {
        totalEquipment,
        totalUnits: stockStats.total,
        availableUnits: stockStats.available,
        borrowedUnits: stockStats.total - stockStats.available,
        pendingRequests,
        activeLoans,
        overdueLoans,
        returnedLoans,
        totalUsers
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getAnalyticsCharts = (req, res, next) => {
  try {
    // 1. Category Distribution
    const categoryDistribution = db.prepare(`
      SELECT 
        c.name AS category,
        COALESCE(c.icon, 'Package') AS icon,
        COUNT(e.id) AS equipment_count,
        COALESCE(SUM(e.total_quantity), 0) AS total_units,
        COALESCE(SUM(e.available_quantity), 0) AS available_units
      FROM categories c
      LEFT JOIN equipment e ON c.id = e.category_id
      GROUP BY c.id
      ORDER BY total_units DESC
    `).all();

    // 2. Department Borrowing Volume
    const departmentDistribution = db.prepare(`
      SELECT 
        u.department,
        COUNT(br.id) AS borrow_count
      FROM borrow_requests br
      JOIN users u ON br.user_id = u.id
      GROUP BY u.department
      ORDER BY borrow_count DESC
      LIMIT 6
    `).all();

    // 3. Status Breakdown
    const statusBreakdown = db.prepare(`
      SELECT 
        status,
        COUNT(*) AS count
      FROM borrow_requests
      GROUP BY status
    `).all();

    // 4. Most Borrowed Equipment
    const popularEquipment = db.prepare(`
      SELECT 
        e.id,
        e.name,
        e.asset_tag,
        c.name AS category_name,
        COUNT(br.id) AS borrow_count,
        e.available_quantity,
        e.total_quantity
      FROM equipment e
      LEFT JOIN categories c ON e.category_id = c.id
      JOIN borrow_requests br ON e.id = br.equipment_id
      GROUP BY e.id
      ORDER BY borrow_count DESC
      LIMIT 5
    `).all();

    // 5. Recent System Activity
    const recentActivity = db.prepare(`
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.details,
        al.created_at,
        u.name AS actor_name,
        u.role AS actor_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `).all();

    res.json({
      success: true,
      data: {
        categoryDistribution,
        departmentDistribution,
        statusBreakdown,
        popularEquipment,
        recentActivity
      }
    });
  } catch (err) {
    next(err);
  }
};

