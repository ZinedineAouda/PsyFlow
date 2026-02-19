const express = require('express');
const router = express.Router();
const db = require('../db/database');

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
    const { notes } = req.body;
    const patient = await db.findPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const visit = await db.createVisit(req.params.id, notes);
    res.json({ success: true, visit });
  } catch (err) {
    console.error('Visit create error:', err);
    res.status(500).json({ error: 'Failed to record visit' });
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
