const { db, logAudit } = require('../db/database');

exports.getAllCategories = (req, res, next) => {
  try {
    const categories = db.prepare(`
      SELECT 
        c.*,
        COUNT(e.id) AS total_items,
        COALESCE(SUM(e.total_quantity), 0) AS total_units,
        COALESCE(SUM(e.available_quantity), 0) AS available_units
      FROM categories c
      LEFT JOIN equipment e ON c.id = e.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = (req, res, next) => {
  try {
    const { name, description, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists.' });
    }

    const stmt = db.prepare(`
      INSERT INTO categories (name, description, icon)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(name.trim(), description ? description.trim() : null, icon || 'Package');
    const newId = Number(result.lastInsertRowid);

    logAudit(req.user.id, 'CREATE_CATEGORY', 'categories', newId, { name });

    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(newId);

    res.status(201).json({
      success: true,
      message: 'Category created successfully!',
      data: created
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const current = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name && name.trim() !== current.name) {
      const existing = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(name.trim(), id);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category with this name already exists.' });
      }
    }

    db.prepare(`
      UPDATE categories 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          icon = COALESCE(?, icon)
      WHERE id = ?
    `).run(name ? name.trim() : null, description !== undefined ? description : null, icon || null, id);

    logAudit(req.user.id, 'UPDATE_CATEGORY', 'categories', id, { name, description, icon });

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Category updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = (req, res, next) => {
  try {
    const { id } = req.params;

    const current = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Set category_id to NULL on equipment
    db.prepare('UPDATE equipment SET category_id = NULL WHERE category_id = ?').run(id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    logAudit(req.user.id, 'DELETE_CATEGORY', 'categories', id, { name: current.name });

    res.json({
      success: true,
      message: `Category '${current.name}' deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
};

