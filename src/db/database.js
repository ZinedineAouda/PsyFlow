const fs = require('fs').promises;
const path = require('path');

let DB_FILE;
if (process.versions && process.versions.electron) {
  const { app } = require('electron');
  DB_FILE = path.join(app.getPath('userData'), 'psyflow_db.json');
} else {
  DB_FILE = path.join(__dirname, '..', '..', 'psyflow_db.json');
}

// In-memory cache
let db = {
  patients: [],
  visits: [],
  documents: [],
  genograms: []
};

async function initDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    db = JSON.parse(data);
    console.log('JSON Database loaded successfully.');
  } catch (err) {
    console.log('No existing database found. Initializing a new fresh JSON database.');
    await saveDb();
  }
}

async function saveDb() {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

function genId(table) {
  if (!db[table] || db[table].length === 0) return 1;
  return Math.max(...db[table].map(r => r.id)) + 1;
}

// === PATIENTS ===
async function findPatientByRfid(rfidUid) {
  return db.patients.find(p => p.rfid_uid === rfidUid && p.is_active) || null;
}

async function findPatientById(id) {
  return db.patients.find(p => p.id === parseInt(id)) || null;
}

async function createPatient(data) {
  const newPatient = {
    id: genId('patients'),
    rfid_uid: data.rfid_uid,
    full_name: data.full_name,
    age: data.age || null,
    gender: data.gender || null,
    diagnosis: data.diagnosis || null,
    notes: data.notes || null,
    custom_fields: data.custom_fields || '{}',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.patients.push(newPatient);
  await saveDb();
  return newPatient;
}

async function updatePatient(id, data) {
  const p = await findPatientById(id);
  if (!p) return null;
  p.full_name = data.full_name;
  p.age = data.age || null;
  p.gender = data.gender || null;
  p.diagnosis = data.diagnosis || null;
  p.notes = data.notes || null;
  p.custom_fields = data.custom_fields || '{}';
  p.updated_at = new Date().toISOString();
  await saveDb();
  return p;
}

async function deactivatePatient(id) {
  const p = await findPatientById(id);
  if (p) {
    p.is_active = false;
    p.updated_at = new Date().toISOString();
    await saveDb();
  }
  return p;
}

async function deletePatient(id) {
  const idx = db.patients.findIndex(p => p.id === parseInt(id));
  if (idx > -1) {
    const deleted = db.patients.splice(idx, 1)[0];
    db.visits = db.visits.filter(v => v.patient_id !== parseInt(id));
    db.documents = db.documents.filter(d => d.patient_id !== parseInt(id));
    db.genograms = db.genograms.filter(g => g.patient_id !== parseInt(id));
    await saveDb();
    return deleted;
  }
  return null;
}

async function reactivatePatient(id) {
  const p = await findPatientById(id);
  if (p) {
    p.is_active = true;
    p.updated_at = new Date().toISOString();
    await saveDb();
  }
  return p;
}

async function getAllPatients(includeInactive = false) {
  let list = db.patients;
  if (!includeInactive) list = list.filter(p => p.is_active);
  return list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
}

async function searchPatients(term) {
  const low = term.toLowerCase();
  return db.patients.filter(p => p.is_active && (
    p.full_name.toLowerCase().includes(low) || 
    p.rfid_uid.toLowerCase().includes(low) || 
    (p.diagnosis && p.diagnosis.toLowerCase().includes(low))
  )).sort((a,b) => a.full_name.localeCompare(b.full_name));
}

async function getDashboardStats() {
  const total = db.patients.length;
  const active = db.patients.filter(p => p.is_active).length;
  const inactive = db.patients.filter(p => !p.is_active).length;
  const lastScanned = db.patients.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at))[0] || null;
  return { 
    total_patients: total, 
    active_cards: active, 
    inactive_cards: inactive,
    last_scanned: lastScanned ? { rfid_uid: lastScanned.rfid_uid, full_name: lastScanned.full_name, updated_at: lastScanned.updated_at } : null
  };
}

async function checkRfidExists(rfidUid) {
  const patient = db.patients.find(p => p.rfid_uid === rfidUid);
  if (patient) {
    return { id: patient.id, is_active: patient.is_active };
  }
  return null;
}

// === VISITS ===
async function getVisits(patientId) {
  const visits = db.visits.filter(v => v.patient_id === parseInt(patientId))
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  return visits;
}

async function getVisitCount(patientId) {
  return db.visits.filter(v => v.patient_id === parseInt(patientId)).length;
}

async function createVisit(patientId, data) {
  const pVisits = await getVisits(patientId);
  const visitNumber = pVisits.length + 1;
  const newVisit = {
    id: genId('visits'),
    patient_id: parseInt(patientId),
    visit_number: visitNumber,
    visit_date: data.visit_date || new Date().toISOString().split('T')[0],
    consultation_type: data.consultation_type || null,
    source_demande: data.source_demande || null,
    suffering_level: data.suffering_level || null,
    hypothese_clinique: data.hypothese_clinique || null,
    plan_evaluation: data.plan_evaluation || null,
    notes: data.notes || '',
    created_at: new Date().toISOString()
  };
  db.visits.push(newVisit);
  await saveDb();
  return newVisit;
}

async function updateVisit(visitId, patientId, data) {
  const v = db.visits.find(x => x.id === parseInt(visitId) && x.patient_id === parseInt(patientId));
  if (v) {
    v.notes = data.notes || v.notes;
    v.visit_date = data.visit_date || v.visit_date;
    v.consultation_type = data.consultation_type || v.consultation_type;
    v.source_demande = data.source_demande || v.source_demande;
    v.suffering_level = data.suffering_level || v.suffering_level;
    v.hypothese_clinique = data.hypothese_clinique || v.hypothese_clinique;
    v.plan_evaluation = data.plan_evaluation || v.plan_evaluation;
    await saveDb();
  }
  return v;
}

async function deleteVisit(visitId, patientId) {
  const idx = db.visits.findIndex(x => x.id === parseInt(visitId) && x.patient_id === parseInt(patientId));
  if (idx > -1) {
    const deleted = db.visits.splice(idx, 1)[0];
    await saveDb();
    return deleted;
  }
  return null;
}

// === DOCUMENTS ===
async function getDocuments(patientId) {
  return db.documents.filter(d => d.patient_id === parseInt(patientId))
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
}

async function addDocument(patientId, filename, originalName, mimeType, fileSize) {
  const newDoc = {
    id: genId('documents'),
    patient_id: parseInt(patientId),
    filename: filename,
    original_name: originalName,
    mime_type: mimeType,
    file_size: fileSize,
    created_at: new Date().toISOString()
  };
  db.documents.push(newDoc);
  await saveDb();
  return newDoc;
}

async function deleteDocument(docId, patientId) {
  const idx = db.documents.findIndex(d => d.id === parseInt(docId) && d.patient_id === parseInt(patientId));
  if (idx > -1) {
    const deleted = db.documents.splice(idx, 1)[0];
    await saveDb();
    return deleted;
  }
  return null;
}

// === GENOGRAMS ===
async function getGenogram(patientId) {
  const res = db.genograms.filter(g => g.patient_id === parseInt(patientId))
    .sort((a,b) => b.id - a.id)[0];
  return res ? { graph_data: res.graph_data, image_data: res.image_data || null } : null;
}

async function saveGenogram(patientId, graphData, imageData) {
  const existing = db.genograms.find(g => g.patient_id === parseInt(patientId));
  if (existing) {
    existing.graph_data = graphData;
    existing.image_data = imageData || existing.image_data || null;
    existing.updated_at = new Date().toISOString();
    await saveDb();
    return existing;
  } else {
    const newGeno = {
      id: genId('genograms'),
      patient_id: parseInt(patientId),
      graph_data: graphData,
      image_data: imageData || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.genograms.push(newGeno);
    await saveDb();
    return newGeno;
  }
}

module.exports = {
  initDatabase,
  findPatientByRfid,
  findPatientById,
  createPatient,
  updatePatient,
  deactivatePatient,
  deletePatient,
  reactivatePatient,
  getAllPatients,
  searchPatients,
  checkRfidExists,
  getDashboardStats,
  createVisit,
  updateVisit,
  deleteVisit,
  getVisits,
  getVisitCount,
  addDocument,
  getDocuments,
  deleteDocument,
  getGenogram,
  saveGenogram
};
