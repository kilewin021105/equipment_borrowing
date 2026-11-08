const crypto = require('crypto');
const { db, logAudit, createNotification } = require('../db/database');
const { syncBorrowRequest } = require('../db/syncHelper');

// Helper to generate readable college borrow reference
function generateReferenceCode() {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BRW-${year}-${rand}`;
}

exports.createBorrowRequest = (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      equipment_id,
      quantity = 1,
      borrow_date,
      return_date,
      purpose,
      course_code,
      faculty_sponsor,
      notes
    } = req.body;

    if (!equipment_id || !borrow_date || !return_date || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Equipment, borrow date, return date, and purpose are required.'
      });
    }

    const reqQty = parseInt(quantity, 10) || 1;
    if (reqQty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1 unit.' });
    }

    // Verify equipment exists and is available
    const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipment_id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Selected equipment was not found.' });
    }

    if (equipment.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `This equipment is currently marked as '${equipment.status}' and cannot be borrowed.`
      });
    }

    if (equipment.available_quantity < reqQty) {
      return res.status(400).json({
        success: false,
        message: `Requested ${reqQty} unit(s), but only ${equipment.available_quantity} unit(s) are currently available.`
      });
    }

    // Validate dates
    const bDate = new Date(borrow_date);
    const rDate = new Date(return_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(bDate.getTime()) || isNaN(rDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid borrow or return date format.' });
    }

    if (rDate < bDate) {
      return res.status(400).json({ success: false, message: 'Return date cannot be before the borrow date.' });
    }

    // Check maximum borrow duration
    const diffDays = Math.ceil((rDate - bDate) / (1000 * 60 * 60 * 24));
    if (diffDays > equipment.max_borrow_days) {
      return res.status(400).json({
        success: false,
        message: `Loan duration (${diffDays} days) exceeds maximum allowed for this item (${equipment.max_borrow_days} days).`
      });
    }

    // Check active pending/dispatched loans for same user and equipment to prevent duplicates
    const duplicate = db.prepare(`
      SELECT id FROM borrow_requests 
      WHERE user_id = ? AND equipment_id = ? AND status IN ('pending', 'approved', 'dispatched')
    `).get(userId, equipment_id);

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active or pending borrow request for this equipment.'
      });
    }

    let refCode = generateReferenceCode();
    // Ensure uniqueness
    while (db.prepare('SELECT id FROM borrow_requests WHERE reference_code = ?').get(refCode)) {
      refCode = generateReferenceCode();
    }

    const stmt = db.prepare(`
      INSERT INTO borrow_requests (
        reference_code, user_id, equipment_id, quantity, borrow_date,
        return_date, purpose, course_code, faculty_sponsor, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
      refCode,
      userId,
      equipment_id,
      reqQty,
      borrow_date,
      return_date,
      purpose.trim(),
      course_code ? course_code.trim() : null,
      faculty_sponsor ? faculty_sponsor.trim() : null,
      notes ? notes.trim() : null
    );

    const newRequestId = Number(result.lastInsertRowid);

    // Audit log
    logAudit(userId, 'SUBMIT_BORROW_REQUEST', 'borrow_requests', newRequestId, {
      reference_code: refCode,
      equipment: equipment.name,
      quantity: reqQty,
      borrow_date,
      return_date
    });

    // Notify borrower
    createNotification(
      userId,
      'Borrow Request Submitted',
      `Your request for ${reqQty}x ${equipment.name} (Ref: ${refCode}) is pending custodian approval.`,
      'info',
      `/dashboard?tab=requests`
    );

    // Fetch complete request
    const created = db.prepare(`
      SELECT 
        br.*,
        e.name AS equipment_name,
        e.asset_tag,
        e.location,
        e.image_url,
        c.name AS category_name,
        u.name AS borrower_name,
        u.email AS borrower_email,
        u.department,
        u.student_id
      FROM borrow_requests br
      JOIN equipment e ON br.equipment_id = e.id
      LEFT JOIN categories c ON e.category_id = c.id
      JOIN users u ON br.user_id = u.id
      WHERE br.id = ?
    `).get(newRequestId);

    syncBorrowRequest(created);

    res.status(201).json({
      success: true,
      message: 'Borrow request submitted successfully!',
      data: created
    });
  } catch (err) {
    next(err);
  }
};

exports.getBorrowRequests = (req, res, next) => {
  try {
    const user = req.user;
    const { status, search, overdue_only } = req.query;

    let query = `
      SELECT 
        br.*,
        e.name AS equipment_name,
        e.asset_tag,
        e.location,
        e.image_url,
        c.name AS category_name,
        u.name AS borrower_name,
        u.email AS borrower_email,
        u.department,
        u.student_id,
        u.phone AS borrower_phone,
        app.name AS approver_name,
        disp.name AS dispatcher_name,
        ret.name AS return_receiver_name,
        CASE 
          WHEN br.status = 'dispatched' AND date('now') > date(br.return_date) THEN 1
          ELSE 0
        END AS is_overdue
      FROM borrow_requests br
      JOIN equipment e ON br.equipment_id = e.id
      LEFT JOIN categories c ON e.category_id = c.id
      JOIN users u ON br.user_id = u.id
      LEFT JOIN users app ON br.approver_id = app.id
      LEFT JOIN users disp ON br.dispatched_by = disp.id
      LEFT JOIN users ret ON br.returned_to = ret.id
      WHERE 1=1
    `;
    const params = [];

    // Borrower only sees their own requests
    if (user.role === 'borrower') {
      query += ` AND br.user_id = ?`;
      params.push(user.id);
    }

    if (status) {
      query += ` AND br.status = ?`;
      params.push(status);
    }

    if (overdue_only === 'true') {
      query += ` AND br.status = 'dispatched' AND date('now') > date(br.return_date)`;
    }

    if (search && search.trim()) {
      query += ` AND (
        br.reference_code LIKE ? OR 
        e.name LIKE ? OR 
        e.asset_tag LIKE ? OR 
        u.name LIKE ? OR 
        u.student_id LIKE ? OR
        br.purpose LIKE ?
      )`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    query += ` ORDER BY br.created_at DESC`;

    const requests = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (err) {
    next(err);
  }
};

exports.getBorrowRequestById = (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const request = db.prepare(`
      SELECT 
        br.*,
        e.name AS equipment_name,
        e.asset_tag,
        e.location,
        e.image_url,
        e.model_number,
        c.name AS category_name,
        u.name AS borrower_name,
        u.email AS borrower_email,
        u.department,
        u.student_id,
        u.phone AS borrower_phone,
        app.name AS approver_name,
        disp.name AS dispatcher_name,
        ret.name AS return_receiver_name,
        CASE 
          WHEN br.status = 'dispatched' AND date('now') > date(br.return_date) THEN 1
          ELSE 0
        END AS is_overdue
      FROM borrow_requests br
      JOIN equipment e ON br.equipment_id = e.id
      LEFT JOIN categories c ON e.category_id = c.id
      JOIN users u ON br.user_id = u.id
      LEFT JOIN users app ON br.approver_id = app.id
      LEFT JOIN users disp ON br.dispatched_by = disp.id
      LEFT JOIN users ret ON br.returned_to = ret.id
      WHERE br.id = ? OR br.reference_code = ?
    `).get(id, id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Borrow request not found.' });
    }

    // Access control: only owner, staff, or admin
    if (user.role === 'borrower' && request.user_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this borrow record.' });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (err) {
    next(err);
  }
};

exports.updateRequestStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      action, // 'approve', 'reject', 'dispatch', 'return'
      approval_notes,
      rejection_reason,
      return_condition, // 'excellent', 'good', 'fair', 'damaged', 'missing_parts'
      damage_notes,
      fine_amount
    } = req.body;

    const request = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Borrow request not found.' });
    }

    const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(request.equipment_id);
    const borrower = db.prepare('SELECT * FROM users WHERE id = ?').get(request.user_id);

    const now = new Date().toISOString();

    if (action === 'approve') {
      if (request.status !== 'pending') {
        return res.status(400).json({ success: false, message: `Cannot approve request with status '${request.status}'.` });
      }

      db.prepare(`
        UPDATE borrow_requests 
        SET status = 'approved',
            approver_id = ?,
            approval_notes = ?,
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.id, approval_notes || 'Approved for checkout.', id);

      logAudit(req.user.id, 'APPROVE_REQUEST', 'borrow_requests', id, {
        reference_code: request.reference_code,
        notes: approval_notes
      });

      createNotification(
        request.user_id,
        'Borrow Request Approved! 🎉',
        `Your request for ${equipment.name} (Ref: ${request.reference_code}) has been approved. Please proceed to ${equipment.location} for pickup.`,
        'success',
        `/dashboard?ref=${request.reference_code}`
      );

      const updatedReq = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(id);
      syncBorrowRequest(updatedReq);

      return res.json({ success: true, message: 'Request approved successfully.' });
    }

    if (action === 'reject') {
      if (request.status !== 'pending' && request.status !== 'approved') {
        return res.status(400).json({ success: false, message: `Cannot reject request with status '${request.status}'.` });
      }

      db.prepare(`
        UPDATE borrow_requests 
        SET status = 'rejected',
            approver_id = ?,
            approval_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.id, rejection_reason || 'Request rejected by lab custodian.', id);

      logAudit(req.user.id, 'REJECT_REQUEST', 'borrow_requests', id, {
        reference_code: request.reference_code,
        reason: rejection_reason
      });

      createNotification(
        request.user_id,
        'Borrow Request Rejected',
        `Your request for ${equipment.name} (Ref: ${request.reference_code}) was rejected. Reason: ${rejection_reason || 'Not specified.'}`,
        'danger',
        `/dashboard`
      );

      const updatedReq = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(id);
      syncBorrowRequest(updatedReq);

      return res.json({ success: true, message: 'Request rejected.' });
    }

    if (action === 'dispatch') {
      // Handing out the physical equipment
      if (request.status !== 'approved' && request.status !== 'pending') {
        return res.status(400).json({ success: false, message: `Cannot dispatch request with status '${request.status}'. Must be approved first.` });
      }

      if (equipment.available_quantity < request.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory! Available units: ${equipment.available_quantity}, requested: ${request.quantity}`
        });
      }

      // Deduct from available quantity
      db.prepare(`
        UPDATE equipment 
        SET available_quantity = available_quantity - ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(request.quantity, equipment.id);

      // Update borrow request
      db.prepare(`
        UPDATE borrow_requests 
        SET status = 'dispatched',
            dispatched_by = ?,
            dispatched_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.id, id);

      logAudit(req.user.id, 'DISPATCH_EQUIPMENT', 'borrow_requests', id, {
        reference_code: request.reference_code,
        equipment: equipment.name,
        quantity: request.quantity
      });

      createNotification(
        request.user_id,
        'Equipment Checked Out',
        `You have received ${request.quantity}x ${equipment.name} (Ref: ${request.reference_code}). Expected return: ${request.return_date}.`,
        'info',
        `/dashboard`
      );

      const updatedReq = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(id);
      syncBorrowRequest(updatedReq);

      return res.json({ success: true, message: 'Equipment successfully dispatched to borrower.' });
    }

    if (action === 'return') {
      // Physical return and condition inspection
      if (request.status !== 'dispatched') {
        return res.status(400).json({ success: false, message: `Cannot return request with status '${request.status}'. It is not currently checked out.` });
      }

      const fine = parseFloat(fine_amount) || 0.0;
      const condition = return_condition || 'good';

      // Restore equipment stock
      db.prepare(`
        UPDATE equipment 
        SET available_quantity = available_quantity + ?,
            condition = CASE WHEN ? IN ('damaged', 'missing_parts') THEN 'maintenance' ELSE condition END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(request.quantity, condition, equipment.id);

      // Update borrow request
      db.prepare(`
        UPDATE borrow_requests 
        SET status = 'returned',
            actual_return_date = CURRENT_TIMESTAMP,
            returned_to = ?,
            return_condition = ?,
            damage_notes = ?,
            fine_amount = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.id, condition, damage_notes || null, fine, id);

      logAudit(req.user.id, 'RETURN_EQUIPMENT', 'borrow_requests', id, {
        reference_code: request.reference_code,
        condition,
        fine,
        notes: damage_notes
      });

      createNotification(
        request.user_id,
        'Equipment Return Verified ✅',
        `Return completed for ${equipment.name} (Ref: ${request.reference_code}). Condition: ${condition}. Thank you for returning university property!`,
        'success',
        `/dashboard`
      );

      const updatedReq = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(id);
      syncBorrowRequest(updatedReq);

      return res.json({ success: true, message: 'Equipment successfully returned and inventory restored.' });
    }

    return res.status(400).json({ success: false, message: `Unknown action: '${action}'.` });
  } catch (err) {
    next(err);
  }
};

exports.cancelBorrowRequest = (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const request = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Borrow request not found.' });
    }

    if (request.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only cancel your own requests.' });
    }

    if (request.status !== 'pending' && request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request with status '${request.status}'. Active loans must be returned to the counter.`
      });
    }

    db.prepare(`
      UPDATE borrow_requests 
      SET status = 'cancelled',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    const updatedReq = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(id);
    syncBorrowRequest(updatedReq);

    logAudit(userId, 'CANCEL_REQUEST', 'borrow_requests', id, { reference_code: request.reference_code });

    res.json({
      success: true,
      message: 'Borrow request cancelled successfully.'
    });
  } catch (err) {
    next(err);
  }
};

