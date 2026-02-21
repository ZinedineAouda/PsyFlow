const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

router.post('/scan', async (req, res) => {
  try {
    const { rfid_uid } = req.body;
    if (!rfid_uid || !rfid_uid.trim()) {
      return res.status(400).json({ error: 'RFID UID is required' });
    }
    const uid = rfid_uid.trim().toUpperCase();
    const patient = await db.findPatientByRfid(uid);
    if (patient) {
      return res.json({ found: true, patient });
    }
    const existing = await db.checkRfidExists(uid);
    if (existing && !existing.is_active) {
      return res.json({ found: false, deactivated: true, id: existing.id, message: 'This card was previously deactivated' });
    }
    return res.json({ found: false, message: 'Card not registered' });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Failed to scan card' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { rfid_uid, full_name, age, gender, diagnosis, notes, custom_fields } = req.body;
    if (!rfid_uid || !rfid_uid.trim()) {
      return res.status(400).json({ error: 'RFID UID is required' });
    }
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Patient name is required' });
    }
    const uid = rfid_uid.trim().toUpperCase();
    const existing = await db.checkRfidExists(uid);
    if (existing) {
      if (existing.is_active) {
        return res.status(409).json({ error: 'This RFID card is already registered to a patient' });
      }
      return res.status(409).json({ error: 'This card was previously used. Please deactivate and re-register, or use a new card.', deactivated: true, id: existing.id });
    }
    const patient = await db.createPatient({
      rfid_uid: uid, full_name: full_name.trim(), age, gender, diagnosis, notes,
      custom_fields: custom_fields ? JSON.stringify(custom_fields) : '{}'
    });
    res.status(201).json({ success: true, patient });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register patient' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, age, gender, diagnosis, notes, custom_fields } = req.body;
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Patient name is required' });
    }
    const patient = await db.updatePatient(id, {
      full_name: full_name.trim(), age, gender, diagnosis, notes,
      custom_fields: custom_fields ? JSON.stringify(custom_fields) : '{}'
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ success: true, patient });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

router.delete('/:id/permanent', async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await db.deletePatient(id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ success: true, message: 'Patient permanently deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await db.deactivatePatient(id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ success: true, message: 'Patient card deactivated' });
  } catch (err) {
    console.error('Deactivation error:', err);
    res.status(500).json({ error: 'Failed to deactivate patient' });
  }
});

router.post('/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await db.reactivatePatient(id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ success: true, patient });
  } catch (err) {
    console.error('Reactivation error:', err);
    res.status(500).json({ error: 'Failed to reactivate patient' });
  }
});

router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, include_inactive } = req.query;
    let patients;
    if (search) {
      patients = await db.searchPatients(search);
    } else {
      patients = await db.getAllPatients(include_inactive === 'true');
    }
    res.json({ patients });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: 'Failed to list patients' });
  }
});

router.get('/:id/visits', async (req, res) => {
  try {
    const patient = await db.findPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const visits = await db.getVisits(req.params.id);
    const count = await db.getVisitCount(req.params.id);
    res.json({ visits, total_visits: count });
  } catch (err) {
    console.error('Visits fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

router.post('/:id/visits', async (req, res) => {
  try {
    const patient = await db.findPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const visit = await db.createVisit(req.params.id, req.body);
    res.json({ success: true, visit });
  } catch (err) {
    console.error('Visit create error:', err);
    res.status(500).json({ error: 'Failed to record visit' });
  }
});

router.put('/:id/visits/:visitId', async (req, res) => {
  try {
    const visit = await db.updateVisit(req.params.visitId, req.params.id, req.body);
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    res.json({ success: true, visit });
  } catch (err) {
    console.error('Visit update error:', err);
    res.status(500).json({ error: 'Failed to update visit' });
  }
});

router.delete('/:id/visits/:visitId', async (req, res) => {
  try {
    const visit = await db.deleteVisit(req.params.visitId, req.params.id);
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Visit delete error:', err);
    res.status(500).json({ error: 'Failed to delete visit' });
  }
});

router.get('/:id/documents', async (req, res) => {
  try {
    const patient = await db.findPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const documents = await db.getDocuments(req.params.id);
    res.json({ documents });
  } catch (err) {
    console.error('Documents fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.post('/:id/documents', upload.single('file'), async (req, res) => {
  try {
    const patient = await db.findPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const doc = await db.addDocument(
      req.params.id,
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    );
    res.json({ success: true, document: doc });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.get('/:id/documents/:docId/download', async (req, res) => {
  try {
    const documents = await db.getDocuments(req.params.id);
    const doc = documents.find(d => d.id === parseInt(req.params.docId));
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const filePath = path.join(uploadsDir, doc.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    res.download(filePath, doc.original_name);
  } catch (err) {
    console.error('Document download error:', err);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

router.delete('/:id/documents/:docId', async (req, res) => {
  try {
    const doc = await db.deleteDocument(req.params.docId, req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const filePath = path.join(uploadsDir, doc.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Document delete error:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const patient = await db.findPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const visitCount = await db.getVisitCount(req.params.id);
    res.json({ patient, visit_count: visitCount });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

module.exports = router;
