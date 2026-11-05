const { db, logAudit } = require('../db/database');

exports.getAllEquipment = (req, res, next) => {
  try {
    const { search, category_id, status, condition, availability, sort } = req.query;

    let query = `
      SELECT 
        e.*,
        c.name AS category_name,
        c.icon AS category_icon,
        (e.total_quantity - e.available_quantity) AS in_use_count
      FROM equipment e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (e.name LIKE ? OR e.asset_tag LIKE ? OR e.model_number LIKE ? OR e.description LIKE ? OR e.location LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (category_id) {
      query += ` AND e.category_id = ?`;
      params.push(category_id);
    }

    if (status) {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    if (condition) {
      query += ` AND e.condition = ?`;
      params.push(condition);
    }

    if (availability === 'available') {
      query += ` AND e.available_quantity > 0 AND e.status = 'available'`;
    } else if (availability === 'unavailable') {
      query += ` AND (e.available_quantity = 0 OR e.status != 'available')`;
    }

    // Sort order
    switch (sort) {
      case 'name_desc':
        query += ` ORDER BY e.name DESC`;
        break;
      case 'quantity_desc':
        query += ` ORDER BY e.available_quantity DESC`;
        break;
      case 'newest':
        query += ` ORDER BY e.created_at DESC`;
        break;
      case 'name_asc':
      default:
        query += ` ORDER BY e.name ASC`;
        break;
    }

    const items = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    next(err);
  }
};

exports.getEquipmentById = (req, res, next) => {
  try {
    const { id } = req.params;

    const item = db.prepare(`
      SELECT 
        e.*,
        c.name AS category_name,
        c.icon AS category_icon,
        (e.total_quantity - e.available_quantity) AS in_use_count
      FROM equipment e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    // If staff or admin, also fetch current active borrowers and recent history
    let activeLoans = [];
    if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
      activeLoans = db.prepare(`
        SELECT 
          br.id, br.reference_code, br.quantity, br.borrow_date, br.return_date, br.status,
          u.name AS borrower_name, u.email AS borrower_email, u.department, u.student_id
        FROM borrow_requests br
        JOIN users u ON br.user_id = u.id
        WHERE br.equipment_id = ? AND br.status IN ('pending', 'approved', 'dispatched')
        ORDER BY br.created_at DESC
      `).all(id);
    }

    res.json({
      success: true,
      data: {
        ...item,
        activeLoans
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createEquipment = (req, res, next) => {
  try {
    const {
      name,
      category_id,
      asset_tag,
      model_number,
      description,
      location,
      total_quantity,
      condition,
      status,
      image_url,
      max_borrow_days
    } = req.body;

    if (!name || !asset_tag || !location) {
      return res.status(400).json({ success: false, message: 'Name, asset tag, and location are required.' });
    }

    const totalQty = parseInt(total_quantity, 10) || 1;
    if (totalQty < 1) {
      return res.status(400).json({ success: false, message: 'Total quantity must be at least 1.' });
    }

    // Check unique asset tag
    const existing = db.prepare('SELECT id FROM equipment WHERE asset_tag = ?').get(asset_tag.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: `Asset tag '${asset_tag}' is already assigned to another equipment.` });
    }

    let validCategoryId = null;
    if (category_id) {
      const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
      if (cat) validCategoryId = cat.id;
    }

    const stmt = db.prepare(`
      INSERT INTO equipment (
        category_id, name, asset_tag, model_number, description,
        location, total_quantity, available_quantity, condition,
        status, image_url, max_borrow_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      validCategoryId,
      name.trim(),
      asset_tag.trim().toUpperCase(),
      model_number ? model_number.trim() : null,
      description ? description.trim() : null,
      location.trim(),
      totalQty,
      totalQty, // initial available equals total
      condition || 'excellent',
      status || 'available',
      image_url || null,
      parseInt(max_borrow_days, 10) || 7
    );

    const newId = Number(result.lastInsertRowid);
    logAudit(req.user.id, 'CREATE_EQUIPMENT', 'equipment', newId, { name, asset_tag, totalQty });

    const created = db.prepare(`
      SELECT e.*, c.name AS category_name 
      FROM equipment e 
      LEFT JOIN categories c ON e.category_id = c.id 
      WHERE e.id = ?
    `).get(newId);

    res.status(201).json({
      success: true,
      message: 'Equipment created successfully!',
      data: created
    });
  } catch (err) {
    next(err);
  }
};

exports.updateEquipment = (req, res, next) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);

    if (!current) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    const {
      name,
      category_id,
      asset_tag,
      model_number,
      description,
      location,
      total_quantity,
      condition,
      status,
      image_url,
      max_borrow_days
    } = req.body;

    // Check asset tag uniqueness if modified
    if (asset_tag && asset_tag.trim().toUpperCase() !== current.asset_tag) {
      const existing = db.prepare('SELECT id FROM equipment WHERE asset_tag = ? AND id != ?').get(asset_tag.trim().toUpperCase(), id);
      if (existing) {
        return res.status(400).json({ success: false, message: `Asset tag '${asset_tag}' is already in use.` });
      }
    }

    // Safety check on total quantity: cannot be less than currently in-use quantity
    const inUseCount = current.total_quantity - current.available_quantity;
    const newTotal = total_quantity !== undefined ? parseInt(total_quantity, 10) : current.total_quantity;

    if (newTotal < inUseCount) {
      return res.status(400).json({
        success: false,
        message: `Cannot decrease total quantity to ${newTotal}. Currently ${inUseCount} units are checked out by borrowers.`
      });
    }

    // Adjust available quantity by difference in total quantity
    const delta = newTotal - current.total_quantity;
    const newAvailable = Math.max(0, current.available_quantity + delta);

    let validCategoryId = current.category_id;
    if (category_id !== undefined) {
      if (category_id === null || category_id === '') {
        validCategoryId = null;
      } else {
        const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
        validCategoryId = cat ? cat.id : null;
      }
    }

    const stmt = db.prepare(`
      UPDATE equipment SET
        category_id = ?,
        name = COALESCE(?, name),
        asset_tag = COALESCE(?, asset_tag),
        model_number = COALESCE(?, model_number),
        description = COALESCE(?, description),
        location = COALESCE(?, location),
        total_quantity = ?,
        available_quantity = ?,
        condition = COALESCE(?, condition),
        status = COALESCE(?, status),
        image_url = COALESCE(?, image_url),
        max_borrow_days = COALESCE(?, max_borrow_days),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      validCategoryId,
      name ? name.trim() : current.name,
      asset_tag ? asset_tag.trim().toUpperCase() : current.asset_tag,
      model_number !== undefined ? model_number : current.model_number,
      description !== undefined ? description : current.description,
      location ? location.trim() : current.location,
      newTotal,
      newAvailable,
      condition || current.condition,
      status || current.status,
      image_url !== undefined ? image_url : current.image_url,
      max_borrow_days !== undefined ? parseInt(max_borrow_days, 10) : current.max_borrow_days,
      id
    );

    logAudit(req.user.id, 'UPDATE_EQUIPMENT', 'equipment', id, { updatedFields: req.body });

    const updated = db.prepare(`
      SELECT e.*, c.name AS category_name 
      FROM equipment e 
      LEFT JOIN categories c ON e.category_id = c.id 
      WHERE e.id = ?
    `).get(id);

    res.json({
      success: true,
      message: 'Equipment updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteEquipment = (req, res, next) => {
  try {
    const { id } = req.params;

    const current = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    // Check active loans
    const active = db.prepare(`
      SELECT COUNT(*) as count FROM borrow_requests 
      WHERE equipment_id = ? AND status IN ('pending', 'approved', 'dispatched')
    `).get(id);

    if (active.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete equipment. There are ${active.count} active or pending borrow requests linked to it.`
      });
    }

    db.prepare('DELETE FROM equipment WHERE id = ?').run(id);
    logAudit(req.user.id, 'DELETE_EQUIPMENT', 'equipment', id, { name: current.name, asset_tag: current.asset_tag });

    res.json({
      success: true,
      message: `Equipment '${current.name}' deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
};
