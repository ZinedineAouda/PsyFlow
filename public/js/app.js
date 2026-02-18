let currentMode = 'reading';
let pendingConfirmAction = null;
let searchTimeout = null;
let patientCache = {};

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
  document.getElementById('mode-reading').classList.toggle('hidden', mode !== 'reading');
  document.getElementById('mode-register').classList.toggle('hidden', mode !== 'register');
  document.getElementById('mode-manage').classList.toggle('hidden', mode !== 'manage');
  clearAlerts();
  if (mode === 'reading') {
    document.getElementById('read-rfid-input').focus();
    document.getElementById('read-result').classList.add('hidden');
  } else if (mode === 'register') {
    document.getElementById('reg-rfid-input').focus();
    document.getElementById('reg-form-container').classList.add('hidden');
  } else if (mode === 'manage') {
    loadPatients();
  }
}

function showAlert(msg, type = 'error') {
  const container = document.getElementById('alert-container');
  const icons = { error: '\u26A0\uFE0F', success: '\u2705', warning: '\u26A0\uFE0F', info: '\u2139\uFE0F' };
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  const span = document.createElement('span');
  span.textContent = icons[type] || '';
  div.appendChild(span);
  div.appendChild(document.createTextNode(' ' + msg));
  container.innerHTML = '';
  container.appendChild(div);
  if (type === 'success') {
    setTimeout(() => { if (div.parentNode) div.remove(); }, 4000);
  }
}

function clearAlerts() {
  document.getElementById('alert-container').innerHTML = '';
}

async function apiCall(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function scanCard() {
  clearAlerts();
  const uid = document.getElementById('read-rfid-input').value.trim();
  if (!uid) { showAlert('Please scan or enter an RFID UID'); return; }
  try {
    const data = await apiCall('/api/patients/scan', 'POST', { rfid_uid: uid });
    const container = document.getElementById('read-result');
    container.classList.remove('hidden');
    if (data.found) {
      container.innerHTML = renderPatientView(data.patient);
      bindPatientViewEvents(container, data.patient);
    } else if (data.deactivated) {
      container.innerHTML = '';
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = '<div class="empty-state"><div class="icon">\u26A0\uFE0F</div><h3>Card Deactivated</h3><p>This card was previously deactivated.</p></div>';
      container.appendChild(card);
    } else {
      container.innerHTML = '';
      const card = document.createElement('div');
      card.className = 'card';
      const inner = document.createElement('div');
      inner.className = 'empty-state';
      inner.innerHTML = '<div class="icon">\uD83D\uDCCB</div><h3>Card Not Registered</h3><p>This RFID card is not linked to any patient. Switch to Registration mode to register it.</p>';
      const actions = document.createElement('div');
      actions.className = 'actions-bar';
      actions.style.cssText = 'justify-content:center;margin-top:16px;';
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.textContent = 'Register This Card';
      btn.addEventListener('click', () => registerFromScan(uid));
      actions.appendChild(btn);
      inner.appendChild(actions);
      card.appendChild(inner);
      container.appendChild(card);
    }
  } catch (err) {
    showAlert(err.message);
  }
}

function registerFromScan(uid) {
  switchMode('register');
  document.getElementById('reg-rfid-input').value = uid;
  checkCardForRegistration();
}

function renderPatientView(p) {
  const customFields = typeof p.custom_fields === 'string' ? JSON.parse(p.custom_fields) : (p.custom_fields || {});
  let customHtml = '';
  for (const [key, val] of Object.entries(customFields)) {
    if (key && val) {
      customHtml += `<div class="field-label">${escapeHtml(key)}</div><div class="field-value">${escapeHtml(val)}</div>`;
    }
  }
  return `
    <div class="card patient-display">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div>
          <span class="rfid-badge">${escapeHtml(p.rfid_uid)}</span>
          <span class="status-badge ${p.is_active ? 'status-active' : 'status-inactive'}">${p.is_active ? 'Active' : 'Inactive'}</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-sm" data-action="edit" data-id="${p.id}">Edit</button>
        </div>
      </div>
      <div class="form-row">
        <div><div class="field-label">Full Name</div><div class="field-value">${escapeHtml(p.full_name)}</div></div>
        <div><div class="field-label">Age</div><div class="field-value">${p.age || 'N/A'}</div></div>
      </div>
      <div class="form-row">
        <div><div class="field-label">Gender</div><div class="field-value">${p.gender || 'N/A'}</div></div>
        <div><div class="field-label">Diagnosis</div><div class="field-value">${escapeHtml(p.diagnosis || 'N/A')}</div></div>
      </div>
      <div class="field-label">Notes</div>
      <div class="field-value" style="white-space:pre-wrap;">${escapeHtml(p.notes || 'No notes')}</div>
      ${customHtml ? `<div class="custom-fields-section"><h4 style="margin-bottom:12px;">Additional Fields</h4>${customHtml}</div>` : ''}
      <div style="margin-top:12px;font-size:0.8rem;color:var(--text-muted);">
        Registered: ${new Date(p.created_at).toLocaleDateString()} | Last updated: ${new Date(p.updated_at).toLocaleDateString()}
      </div>
    </div>`;
}

function bindPatientViewEvents(container, patient) {
  container.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
  });
}

async function checkCardForRegistration() {
  clearAlerts();
  const uid = document.getElementById('reg-rfid-input').value.trim();
  if (!uid) { showAlert('Please scan or enter an RFID UID'); return; }
  try {
    const data = await apiCall('/api/patients/scan', 'POST', { rfid_uid: uid });
    if (data.found) {
      showAlert('This card is already registered to: ' + data.patient.full_name, 'warning');
      document.getElementById('reg-form-container').classList.add('hidden');
      return;
    }
    if (data.deactivated) {
      showAlert('This card was previously deactivated. Please use a new card or reactivate it from Manage.', 'warning');
      document.getElementById('reg-form-container').classList.add('hidden');
      return;
    }
    showAlert('Card is available for registration!', 'success');
    document.getElementById('reg-rfid-uid').value = uid.toUpperCase();
    document.getElementById('reg-form-container').classList.remove('hidden');
    document.getElementById('reg-name').focus();
  } catch (err) {
    showAlert(err.message);
  }
}

async function registerPatient(e) {
  e.preventDefault();
  clearAlerts();
  const customFields = collectCustomFields('reg');
  const body = {
    rfid_uid: document.getElementById('reg-rfid-uid').value,
    full_name: document.getElementById('reg-name').value,
    age: document.getElementById('reg-age').value ? parseInt(document.getElementById('reg-age').value) : null,
    gender: document.getElementById('reg-gender').value || null,
    diagnosis: document.getElementById('reg-diagnosis').value || null,
    notes: document.getElementById('reg-notes').value || null,
    custom_fields: customFields,
  };
  try {
    await apiCall('/api/patients/register', 'POST', body);
    showAlert('Patient registered successfully!', 'success');
    document.getElementById('registration-form').reset();
    document.getElementById('reg-rfid-input').value = '';
    document.getElementById('reg-form-container').classList.add('hidden');
    document.getElementById('reg-custom-fields').innerHTML = '';
  } catch (err) {
    showAlert(err.message);
  }
}

function cancelRegistration() {
  document.getElementById('reg-form-container').classList.add('hidden');
  document.getElementById('registration-form').reset();
  document.getElementById('reg-custom-fields').innerHTML = '';
  clearAlerts();
}

async function loadPatients() {
  const searchTerm = document.getElementById('search-input').value.trim();
  const container = document.getElementById('patient-list-container');
  try {
    const url = searchTerm
      ? `/api/patients?search=${encodeURIComponent(searchTerm)}&include_inactive=true`
      : '/api/patients?include_inactive=true';
    const data = await apiCall(url);
    if (!data.patients.length) {
      container.innerHTML = '';
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `<div class="icon">\uD83D\uDCCB</div><h3>No patients found</h3><p>${searchTerm ? 'Try a different search term' : 'Register patients using the Registration tab'}</p>`;
      container.appendChild(empty);
      return;
    }
    patientCache = {};
    data.patients.forEach(p => { patientCache[p.id] = p; });

    const list = document.createElement('div');
    list.className = 'patient-list';

    data.patients.forEach(p => {
      const item = document.createElement('div');
      item.className = 'patient-list-item';
      item.addEventListener('click', () => openEditModal(p.id));

      const info = document.createElement('div');
      const nameEl = document.createElement('div');
      nameEl.className = 'name';
      nameEl.textContent = p.full_name;
      const uidEl = document.createElement('div');
      uidEl.className = 'uid';
      uidEl.textContent = p.rfid_uid;
      info.appendChild(nameEl);
      info.appendChild(uidEl);

      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;align-items:center;gap:12px;';

      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = p.diagnosis || 'No diagnosis';

      const badge = document.createElement('span');
      badge.className = `status-badge ${p.is_active ? 'status-active' : 'status-inactive'}`;
      badge.textContent = p.is_active ? 'Active' : 'Inactive';

      actions.appendChild(meta);
      actions.appendChild(badge);

      if (p.is_active) {
        const deactBtn = document.createElement('button');
        deactBtn.className = 'btn btn-danger btn-sm';
        deactBtn.textContent = 'Deactivate';
        deactBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          confirmDeactivate(p.id, p.full_name);
        });
        actions.appendChild(deactBtn);
      } else {
        const reactBtn = document.createElement('button');
        reactBtn.className = 'btn btn-success btn-sm';
        reactBtn.textContent = 'Reactivate';
        reactBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          confirmReactivate(p.id, p.full_name);
        });
        actions.appendChild(reactBtn);
      }

      item.appendChild(info);
      item.appendChild(actions);
      list.appendChild(item);
    });

    container.innerHTML = '';
    container.appendChild(list);
  } catch (err) {
    showAlert(err.message);
  }
}

function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadPatients, 300);
}

async function openEditModal(id) {
  try {
    const data = await apiCall(`/api/patients/${id}`);
    const p = data.patient;
    document.getElementById('edit-id').value = p.id;
    document.getElementById('edit-name').value = p.full_name;
    document.getElementById('edit-age').value = p.age || '';
    document.getElementById('edit-gender').value = p.gender || '';
    document.getElementById('edit-diagnosis').value = p.diagnosis || '';
    document.getElementById('edit-notes').value = p.notes || '';
    const customFieldsContainer = document.getElementById('edit-custom-fields');
    customFieldsContainer.innerHTML = '';
    const cf = typeof p.custom_fields === 'string' ? JSON.parse(p.custom_fields) : (p.custom_fields || {});
    for (const [key, val] of Object.entries(cf)) {
      addCustomFieldRow('edit', key, val);
    }
    document.getElementById('edit-modal').classList.add('active');
  } catch (err) {
    showAlert(err.message);
  }
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('active');
  document.getElementById('edit-custom-fields').innerHTML = '';
}

async function saveEdit(e) {
  e.preventDefault();
  clearAlerts();
  const id = document.getElementById('edit-id').value;
  const customFields = collectCustomFields('edit');
  const body = {
    full_name: document.getElementById('edit-name').value,
    age: document.getElementById('edit-age').value ? parseInt(document.getElementById('edit-age').value) : null,
    gender: document.getElementById('edit-gender').value || null,
    diagnosis: document.getElementById('edit-diagnosis').value || null,
    notes: document.getElementById('edit-notes').value || null,
    custom_fields: customFields,
  };
  try {
    await apiCall(`/api/patients/${id}`, 'PUT', body);
    showAlert('Patient updated successfully!', 'success');
    closeEditModal();
    if (currentMode === 'manage') loadPatients();
    if (currentMode === 'reading') {
      const uid = document.getElementById('read-rfid-input').value.trim();
      if (uid) scanCard();
    }
  } catch (err) {
    showAlert(err.message);
  }
}

function confirmDeactivate(id, name) {
  document.getElementById('confirm-title').textContent = 'Deactivate Patient Card';
  document.getElementById('confirm-message').textContent = `Are you sure you want to deactivate the card for "${name}"? The patient data will be preserved but the card will no longer work.`;
  document.getElementById('confirm-btn').className = 'btn btn-danger';
  document.getElementById('confirm-btn').textContent = 'Deactivate';
  document.getElementById('confirm-modal').classList.add('active');
  pendingConfirmAction = async () => {
    try {
      await apiCall(`/api/patients/${id}`, 'DELETE');
      showAlert('Patient card deactivated', 'success');
      loadPatients();
    } catch (err) {
      showAlert(err.message);
    }
  };
}

function confirmReactivate(id, name) {
  document.getElementById('confirm-title').textContent = 'Reactivate Patient Card';
  document.getElementById('confirm-message').textContent = `Are you sure you want to reactivate the card for "${name}"? The patient will become active again.`;
  document.getElementById('confirm-btn').className = 'btn btn-success';
  document.getElementById('confirm-btn').textContent = 'Reactivate';
  document.getElementById('confirm-modal').classList.add('active');
  pendingConfirmAction = async () => {
    try {
      await apiCall(`/api/patients/${id}/reactivate`, 'POST');
      showAlert('Patient card reactivated', 'success');
      loadPatients();
    } catch (err) {
      showAlert(err.message);
    }
  };
}

function confirmAction() {
  closeConfirmModal();
  if (pendingConfirmAction) { pendingConfirmAction(); pendingConfirmAction = null; }
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('active');
  pendingConfirmAction = null;
}

function addCustomField(prefix, key = '', val = '') {
  addCustomFieldRow(prefix, key, val);
}

function addCustomFieldRow(prefix, key = '', val = '') {
  const container = document.getElementById(`${prefix}-custom-fields`);
  const row = document.createElement('div');
  row.className = 'custom-field-row';

  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.placeholder = 'Field name';
  keyInput.className = 'cf-key';
  keyInput.value = key;

  const valInput = document.createElement('input');
  valInput.type = 'text';
  valInput.placeholder = 'Value';
  valInput.className = 'cf-val';
  valInput.value = val;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-danger btn-sm';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => row.remove());

  row.appendChild(keyInput);
  row.appendChild(valInput);
  row.appendChild(removeBtn);
  container.appendChild(row);
}

function collectCustomFields(prefix) {
  const container = document.getElementById(`${prefix}-custom-fields`);
  const rows = container.querySelectorAll('.custom-field-row');
  const fields = {};
  rows.forEach(row => {
    const key = row.querySelector('.cf-key').value.trim();
    const val = row.querySelector('.cf-val').value.trim();
    if (key) fields[key] = val;
  });
  return fields;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('read-rfid-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); scanCard(); }
});
document.getElementById('reg-rfid-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); checkCardForRegistration(); }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeEditModal();
    closeConfirmModal();
  }
});
