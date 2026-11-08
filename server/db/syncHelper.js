const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { supabase } = require('./supabaseClient');

async function syncBorrowRequest(row) {
  if (!process.env.SUPABASE_URL || !supabase) return;
  try {
    const payload = {
      id: row.id,
      reference_code: row.reference_code,
      user_id: row.user_id,
      equipment_id: row.equipment_id,
      quantity: row.quantity,
      borrow_date: row.borrow_date,
      return_date: row.return_date,
      actual_return_date: row.actual_return_date || null,
      purpose: row.purpose,
      course_code: row.course_code || null,
      faculty_sponsor: row.faculty_sponsor || null,
      notes: row.notes || null,
      status: row.status,
      approver_id: row.approver_id || null,
      approval_notes: row.approval_notes || null,
      approved_at: row.approved_at || null,
      dispatched_by: row.dispatched_by || null,
      dispatched_at: row.dispatched_at || null,
      returned_to: row.returned_to || null,
      return_condition: row.return_condition || null,
      damage_notes: row.damage_notes || null,
      fine_amount: row.fine_amount || 0.0,
      updated_at: new Date().toISOString()
    };
    await supabase.from('borrow_requests').upsert(payload);
  } catch (err) {
    console.warn('Notice: Background Supabase borrow request sync:', err.message);
  }
}

async function syncEquipment(equip) {
  if (!process.env.SUPABASE_URL || !supabase) return;
  try {
    const payload = {
      id: equip.id,
      category_id: equip.category_id,
      name: equip.name,
      asset_tag: equip.asset_tag,
      model_number: equip.model_number || null,
      description: equip.description || null,
      location: equip.location,
      total_quantity: equip.total_quantity,
      available_quantity: equip.available_quantity,
      condition: equip.condition,
      status: equip.status,
      image_url: equip.image_url || null,
      max_borrow_days: equip.max_borrow_days || 7,
      updated_at: new Date().toISOString()
    };
    await supabase.from('equipment').upsert(payload);
  } catch (err) {
    console.warn('Notice: Background Supabase equipment sync:', err.message);
  }
}

module.exports = {
  syncBorrowRequest,
  syncEquipment
};
