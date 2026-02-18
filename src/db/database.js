const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  const fs = require('fs');
  const path = require('path');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Database initialized successfully');
}

async function findPatientByRfid(rfidUid) {
  const result = await pool.query(
    'SELECT * FROM patients WHERE rfid_uid = $1 AND is_active = TRUE',
    [rfidUid]
  );
  return result.rows[0] || null;
}

async function findPatientById(id) {
  const result = await pool.query(
    'SELECT * FROM patients WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function createPatient(data) {
  const { rfid_uid, full_name, age, gender, diagnosis, notes, custom_fields } = data;
  const result = await pool.query(
    `INSERT INTO patients (rfid_uid, full_name, age, gender, diagnosis, notes, custom_fields)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [rfid_uid, full_name, age || null, gender || null, diagnosis || null, notes || null, custom_fields || '{}']
  );
  return result.rows[0];
}

async function updatePatient(id, data) {
  const { full_name, age, gender, diagnosis, notes, custom_fields } = data;
  const result = await pool.query(
    `UPDATE patients SET
       full_name = $1, age = $2, gender = $3, diagnosis = $4,
       notes = $5, custom_fields = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [full_name, age || null, gender || null, diagnosis || null, notes || null, custom_fields || '{}', id]
  );
  return result.rows[0];
}

async function deactivatePatient(id) {
  const result = await pool.query(
    'UPDATE patients SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
}

async function reactivatePatient(id) {
  const result = await pool.query(
    'UPDATE patients SET is_active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
}

async function getAllPatients(includeInactive = false) {
  const query = includeInactive
    ? 'SELECT * FROM patients ORDER BY created_at DESC'
    : 'SELECT * FROM patients WHERE is_active = TRUE ORDER BY created_at DESC';
  const result = await pool.query(query);
  return result.rows;
}

async function searchPatients(term) {
  const result = await pool.query(
    `SELECT * FROM patients WHERE is_active = TRUE AND
     (full_name ILIKE $1 OR rfid_uid ILIKE $1 OR diagnosis ILIKE $1)
     ORDER BY full_name`,
    [`%${term}%`]
  );
  return result.rows;
}

async function checkRfidExists(rfidUid) {
  const result = await pool.query(
    'SELECT id, is_active FROM patients WHERE rfid_uid = $1',
    [rfidUid]
  );
  return result.rows[0] || null;
}

module.exports = {
  pool,
  initDatabase,
  findPatientByRfid,
  findPatientById,
  createPatient,
  updatePatient,
  deactivatePatient,
  reactivatePatient,
  getAllPatients,
  searchPatients,
  checkRfidExists,
};
