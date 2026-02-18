/* ======================================================
   RFID Patient Manager — Application Logic
   Theme system, RFID state machine, CRUD, accessibility
   ====================================================== */

let currentMode = 'dashboard';
let pendingConfirmAction = null;
let searchTimeout = null;
let patientCache = {};

const PAGE_CONFIG = {
  dashboard: { title: 'Dashboard',       subtitle: "Overview of your clinic's patient records" },
  reading:   { title: 'Read Card',        subtitle: "Scan a patient's RFID card to view their profile" },
  manage:    { title: 'Manage Patients',  subtitle: 'Search, edit, and manage all patient records' },
};

/* --- THEME SYSTEM --- */
function initTheme() {
  const saved = localStorage.getItem('rfid-theme');
  const theme = saved || 'light';
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('rfid-theme', theme);
  const icon = document.getElementById('theme-icon');
  const label = document.querySelector('.theme-label');
  if (theme === 'dark') {
    icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    label.textContent = t('lightMode');
  } else {
    icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    label.textContent = t('darkMode');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* --- RFID SCAN STATE MACHINE --- */
const ScanState = { IDLE: 'idle', SCANNING: 'scanning', FOUND: 'found', NOT_FOUND: 'notfound', ERROR: 'error' };

function setScanState(state, target = 'scan-illustration') {
  const el = document.getElementById(target);
  if (!el) return;
  el.className = 'scan-illustration';
  el.classList.add('scan-state-' + state);

  const statusDot = document.querySelector('#rfid-status .status-dot');
  const statusText = document.querySelector('#rfid-status .status-text');

  switch (state) {
    case ScanState.SCANNING:
      statusDot.className = 'status-dot status-dot-scanning';
      statusText.textContent = t('scanning');
      break;
    case ScanState.FOUND:
      statusDot.className = 'status-dot status-dot-ready';
      statusText.textContent = t('cardDetected');
      setTimeout(() => {
        statusText.textContent = t('readerReady');
      }, 3000);
      break;
    case ScanState.NOT_FOUND:
    case ScanState.ERROR:
      statusDot.className = 'status-dot status-dot-error';
      statusText.textContent = state === ScanState.ERROR ? t('scanError') : t('unknownCard');
      setTimeout(() => {
        statusDot.className = 'status-dot status-dot-ready';
        statusText.textContent = t('readerReady');
      }, 3000);
      break;
    default:
      statusDot.className = 'status-dot status-dot-ready';
      statusText.textContent = t('readerReady');
  }
}

/* --- NAVIGATION --- */
function switchMode(mode) {
  currentMode = mode;

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    n.removeAttribute('aria-current');
  });
  const activeNav = document.querySelector(`.nav-item[data-mode="${mode}"]`);
  if (activeNav) {
    activeNav.classList.add('active');
    activeNav.setAttribute('aria-current', 'page');
  }

  document.querySelectorAll('.mode-section').forEach(s => s.classList.remove('mode-active'));
  const section = document.getElementById('mode-' + mode);
  if (section) section.classList.add('mode-active');

  const config = PAGE_CONFIG[mode];
  if (config) {
    document.getElementById('page-title').textContent = config.title;
    document.getElementById('page-subtitle').textContent = config.subtitle;
  }

  clearAlerts();

  if (mode === 'dashboard') {
    loadDashboard();
  } else if (mode === 'reading') {
    document.getElementById('read-rfid-input').focus();
    document.getElementById('read-result').classList.add('hidden');
    document.getElementById('reg-form-container').classList.add('hidden');
    setScanState(ScanState.IDLE);
  } else if (mode === 'manage') {
    loadPatients();
  }
}

/* --- DASHBOARD --- */
async function loadDashboard() {
  try {
    const stats = await apiCall('/api/patients/stats/dashboard');
    animateStatValue('stat-total-value', stats.total_patients);
    animateStatValue('stat-active-value', stats.active_cards);
    animateStatValue('stat-inactive-value', stats.inactive_cards);
    document.getElementById('stat-reader-value').textContent = t('statReady');

    const lastScanEl = document.getElementById('last-scan-info');
    if (stats.last_scanned) {
      const p = stats.last_scanned;
      const initials = p.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const timeAgo = getTimeAgo(new Date(p.updated_at));
      lastScanEl.innerHTML = '';
      const detail = document.createElement('div');
      detail.className = 'last-scan-detail';

      const avatar = document.createElement('div');
      avatar.className = 'last-scan-avatar';
      avatar.textContent = initials;

      const meta = document.createElement('div');
      meta.className = 'last-scan-meta';
      const nameEl = document.createElement('div');
      nameEl.className = 'last-scan-name';
      nameEl.textContent = p.full_name;
      const uidEl = document.createElement('div');
      uidEl.className = 'last-scan-uid';
      uidEl.textContent = p.rfid_uid;
      const timeEl = document.createElement('div');
      timeEl.className = 'last-scan-time';
      timeEl.textContent = timeAgo;

      meta.appendChild(nameEl);
      meta.appendChild(uidEl);
      meta.appendChild(timeEl);
      detail.appendChild(avatar);
      detail.appendChild(meta);
      lastScanEl.appendChild(detail);
    } else {
      lastScanEl.innerHTML = `<div class="empty-state empty-state-sm"><p>${escapeHtml(t('noPatients'))}</p></div>`;
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

function animateStatValue(elementId, targetValue) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const target = parseInt(targetValue) || 0;
  if (target === 0) { el.textContent = '0'; return; }
  const duration = 600;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return t('justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('mAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('hAgo', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('dAgo', { n: days });
  return date.toLocaleDateString();
}

/* --- ALERTS --- */
function showAlert(msg, type = 'error') {
  const container = document.getElementById('alert-container');
  const iconSvgs = {
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.setAttribute('role', 'alert');

  const iconSpan = document.createElement('span');
  iconSpan.className = 'alert-icon';
  iconSpan.innerHTML = iconSvgs[type] || iconSvgs.info;
  div.appendChild(iconSpan);

  const textSpan = document.createElement('span');
  textSpan.textContent = msg;
  div.appendChild(textSpan);

  container.innerHTML = '';
  container.appendChild(div);

  if (type === 'success') {
    setTimeout(() => { if (div.parentNode) div.remove(); }, 4000);
  }
}

function clearAlerts() {
  document.getElementById('alert-container').innerHTML = '';
}

/* --- API --- */
async function apiCall(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* --- READ CARD (Smart RFID Flow) --- */
async function scanCard() {
  clearAlerts();
  const uid = document.getElementById('read-rfid-input').value.trim();
  if (!uid) { showAlert(t('alertEnterUid')); return; }

  setScanState(ScanState.SCANNING);

  try {
    const data = await apiCall('/api/patients/scan', 'POST', { rfid_uid: uid });
    const container = document.getElementById('read-result');
    container.classList.remove('hidden');

    if (data.found) {
      setScanState(ScanState.FOUND);
      document.getElementById('reg-form-container').classList.add('hidden');
      container.innerHTML = renderPatientProfile(data.patient);
      bindPatientViewEvents(container);
    } else if (data.deactivated) {
      setScanState(ScanState.NOT_FOUND);
      document.getElementById('reg-form-container').classList.add('hidden');
      container.innerHTML = renderEmptyState(
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        t('cardDeactivatedTitle'),
        t('cardDeactivatedMsg')
      );
    } else {
      setScanState(ScanState.NOT_FOUND);
      container.classList.add('hidden');
      showRegistrationForm(uid);
    }
  } catch (err) {
    setScanState(ScanState.ERROR);
    showAlert(err.message);
  }
}

/* --- INLINE REGISTRATION FROM SCAN --- */
function showRegistrationForm(uid) {
  showAlert(t('alertCardAvailable'), 'success');
  document.getElementById('reg-rfid-uid').value = uid.toUpperCase();
  document.getElementById('reg-form-container').classList.remove('hidden');
  document.getElementById('reg-name').focus();
}

function renderEmptyState(iconHtml, title, message) {
  return `<div class="card" style="padding:0;"><div class="empty-state"><div class="empty-state-icon">${iconHtml}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p></div></div>`;
}

/* --- PATIENT PROFILE VIEW --- */
function renderPatientProfile(p) {
  const customFields = typeof p.custom_fields === 'string' ? JSON.parse(p.custom_fields) : (p.custom_fields || {});
  let customHtml = '';
  const entries = Object.entries(customFields).filter(([k, v]) => k && v);
  if (entries.length) {
    customHtml = `<div class="custom-fields-display"><h4>${escapeHtml(t('additionalFields'))}</h4><div class="profile-grid">${entries.map(([k, v]) => `<div class="profile-field"><div class="field-label">${escapeHtml(k)}</div><div class="field-value">${escapeHtml(v)}</div></div>`).join('')}</div></div>`;
  }

  return `
    <div class="patient-profile">
      <div class="profile-header">
        <div class="profile-header-left">
          <span class="rfid-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            ${escapeHtml(p.rfid_uid)}
          </span>
          <span class="status-badge ${p.is_active ? 'status-active' : 'status-inactive'}">${p.is_active ? t('active') : t('inactive')}</span>
        </div>
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${p.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          ${t('edit')}
        </button>
      </div>
      <div class="profile-body">
        <div class="profile-grid">
          <div class="profile-field"><div class="field-label">${escapeHtml(t('profileFullName'))}</div><div class="field-value">${escapeHtml(p.full_name)}</div></div>
          <div class="profile-field"><div class="field-label">${escapeHtml(t('profileAge'))}</div><div class="field-value">${p.age || t('profileNA')}</div></div>
          <div class="profile-field"><div class="field-label">${escapeHtml(t('profileGender'))}</div><div class="field-value">${escapeHtml(p.gender || t('profileNA'))}</div></div>
          <div class="profile-field"><div class="field-label">${escapeHtml(t('profileDiagnosis'))}</div><div class="field-value">${escapeHtml(p.diagnosis || t('profileNA'))}</div></div>
          <div class="profile-field" style="grid-column:1/-1;"><div class="field-label">${escapeHtml(t('profileNotes'))}</div><div class="field-value field-value-notes">${escapeHtml(p.notes || t('profileNoNotes'))}</div></div>
        </div>
        ${customHtml}
      </div>
      <div class="profile-footer">
        <span class="profile-meta">${t('profileRegistered')}: ${new Date(p.created_at).toLocaleDateString()} &middot; ${t('profileUpdated')}: ${new Date(p.updated_at).toLocaleDateString()}</span>
      </div>
    </div>`;
}

function bindPatientViewEvents(container) {
  container.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
  });
}

/* --- REGISTRATION --- */
async function registerPatient(e) {
  e.preventDefault();
  clearAlerts();

  const nameField = document.getElementById('reg-name');
  if (!nameField.value.trim()) {
    showAlert(t('alertNameRequired'), 'error');
    nameField.focus();
    return;
  }

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
    showAlert(t('alertRegistered'), 'success');
    document.getElementById('registration-form').reset();
    document.getElementById('read-rfid-input').value = '';
    document.getElementById('reg-form-container').classList.add('hidden');
    document.getElementById('reg-custom-fields').innerHTML = '';
    setScanState(ScanState.IDLE);
  } catch (err) {
    showAlert(err.message);
  }
}

function cancelRegistration() {
  document.getElementById('reg-form-container').classList.add('hidden');
  document.getElementById('registration-form').reset();
  document.getElementById('reg-custom-fields').innerHTML = '';
  document.getElementById('read-rfid-input').value = '';
  setScanState(ScanState.IDLE);
  clearAlerts();
}

/* --- MANAGE / PATIENT LIST --- */
async function loadPatients() {
  const searchTerm = document.getElementById('search-input').value.trim();
  const container = document.getElementById('patient-list-container');

  container.innerHTML = '<div class="skeleton-list"><div class="skeleton-row"><div class="skeleton-line skeleton-w60"></div><div class="skeleton-line skeleton-w30"></div></div><div class="skeleton-row"><div class="skeleton-line skeleton-w60"></div><div class="skeleton-line skeleton-w30"></div></div><div class="skeleton-row"><div class="skeleton-line skeleton-w60"></div><div class="skeleton-line skeleton-w30"></div></div></div>';

  try {
    const url = searchTerm
      ? `/api/patients?search=${encodeURIComponent(searchTerm)}&include_inactive=true`
      : '/api/patients?include_inactive=true';
    const data = await apiCall(url);

    if (!data.patients.length) {
      container.innerHTML = renderEmptyState(
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
        t('noPatientsFound'),
        searchTerm ? t('tryDifferentSearch') : t('registerFromManage')
      );
      return;
    }

    patientCache = {};
    data.patients.forEach(p => { patientCache[p.id] = p; });

    const list = document.createElement('div');
    list.className = 'patient-list';

    data.patients.forEach(p => {
      const item = document.createElement('div');
      item.className = 'patient-list-item';
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', `${t('edit')} ${p.full_name}`);
      item.addEventListener('click', () => openEditModal(p.id));
      item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEditModal(p.id); } });

      const info = document.createElement('div');
      info.className = 'patient-info';
      const nameEl = document.createElement('div');
      nameEl.className = 'patient-name';
      nameEl.textContent = p.full_name;
      const uidEl = document.createElement('div');
      uidEl.className = 'patient-uid';
      uidEl.textContent = p.rfid_uid;
      info.appendChild(nameEl);
      info.appendChild(uidEl);

      const actions = document.createElement('div');
      actions.className = 'patient-actions';

      const meta = document.createElement('span');
      meta.className = 'patient-diagnosis';
      meta.textContent = p.diagnosis || t('noDiagnosis');

      const badge = document.createElement('span');
      badge.className = `status-badge ${p.is_active ? 'status-active' : 'status-inactive'}`;
      badge.textContent = p.is_active ? t('active') : t('inactive');

      actions.appendChild(meta);
      actions.appendChild(badge);

      if (p.is_active) {
        const deactBtn = document.createElement('button');
        deactBtn.className = 'btn btn-danger btn-sm';
        deactBtn.textContent = t('deactivate');
        deactBtn.addEventListener('click', (e) => { e.stopPropagation(); confirmDeactivate(p.id, p.full_name); });
        actions.appendChild(deactBtn);
      } else {
        const reactBtn = document.createElement('button');
        reactBtn.className = 'btn btn-success btn-sm';
        reactBtn.textContent = t('reactivate');
        reactBtn.addEventListener('click', (e) => { e.stopPropagation(); confirmReactivate(p.id, p.full_name); });
        actions.appendChild(reactBtn);
      }

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-ghost btn-sm';
      deleteBtn.style.color = 'var(--danger)';
      deleteBtn.textContent = t('delete');
      deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); confirmDelete(p.id, p.full_name); });
      actions.appendChild(deleteBtn);

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

/* --- EDIT MODAL --- */
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
    document.getElementById('edit-name').focus();
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
    showAlert(t('alertUpdated'), 'success');
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

/* --- CONFIRM MODALS --- */
function confirmDeactivate(id, name) {
  document.getElementById('confirm-title').textContent = t('deactivateTitle');
  document.getElementById('confirm-message').textContent = t('deactivateMsg', { name });
  document.getElementById('confirm-btn').className = 'btn btn-danger';
  document.getElementById('confirm-btn').textContent = t('deactivate');
  document.getElementById('confirm-modal').classList.add('active');
  pendingConfirmAction = async () => {
    try {
      await apiCall(`/api/patients/${id}`, 'DELETE');
      showAlert(t('alertDeactivated'), 'success');
      loadPatients();
    } catch (err) {
      showAlert(err.message);
    }
  };
}

function confirmReactivate(id, name) {
  document.getElementById('confirm-title').textContent = t('reactivateTitle');
  document.getElementById('confirm-message').textContent = t('reactivateMsg', { name });
  document.getElementById('confirm-btn').className = 'btn btn-success';
  document.getElementById('confirm-btn').textContent = t('reactivate');
  document.getElementById('confirm-modal').classList.add('active');
  pendingConfirmAction = async () => {
    try {
      await apiCall(`/api/patients/${id}/reactivate`, 'POST');
      showAlert(t('alertReactivated'), 'success');
      loadPatients();
    } catch (err) {
      showAlert(err.message);
    }
  };
}

function confirmDelete(id, name) {
  document.getElementById('confirm-title').textContent = t('deleteTitle');
  document.getElementById('confirm-message').textContent = t('deleteMsg', { name });
  document.getElementById('confirm-btn').className = 'btn btn-danger';
  document.getElementById('confirm-btn').textContent = t('delete');
  document.getElementById('confirm-modal').classList.add('active');
  pendingConfirmAction = async () => {
    try {
      await apiCall(`/api/patients/${id}/permanent`, 'DELETE');
      showAlert(t('alertDeleted'), 'success');
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

/* --- CUSTOM FIELDS --- */
function addCustomField(prefix) {
  addCustomFieldRow(prefix, '', '');
}

function addCustomFieldRow(prefix, key = '', val = '') {
  const container = document.getElementById(`${prefix}-custom-fields`);
  const row = document.createElement('div');
  row.className = 'custom-field-row';

  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.placeholder = t('fieldName');
  keyInput.className = 'cf-key';
  keyInput.value = key;

  const valInput = document.createElement('input');
  valInput.type = 'text';
  valInput.placeholder = t('value');
  valInput.className = 'cf-val';
  valInput.value = val;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-danger btn-sm';
  removeBtn.textContent = t('remove');
  removeBtn.setAttribute('aria-label', t('remove'));
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

/* --- UTILITIES --- */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* --- EVENT BINDINGS --- */
function initEventBindings() {
  document.querySelectorAll('.nav-item[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchMode(btn.dataset.mode); } });
  });

  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  document.getElementById('lang-select').addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });

  document.getElementById('scan-btn').addEventListener('click', scanCard);
  document.getElementById('read-rfid-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); scanCard(); }
  });

  document.getElementById('registration-form').addEventListener('submit', registerPatient);
  document.getElementById('cancel-reg-btn').addEventListener('click', cancelRegistration);
  document.getElementById('add-reg-field-btn').addEventListener('click', () => addCustomField('reg'));

  document.getElementById('edit-form').addEventListener('submit', saveEdit);
  document.getElementById('edit-modal-close').addEventListener('click', closeEditModal);
  document.getElementById('edit-cancel-btn').addEventListener('click', closeEditModal);
  document.getElementById('add-edit-field-btn').addEventListener('click', () => addCustomField('edit'));

  document.getElementById('confirm-btn').addEventListener('click', confirmAction);
  document.getElementById('confirm-cancel-btn').addEventListener('click', closeConfirmModal);

  document.getElementById('search-input').addEventListener('input', debounceSearch);
  document.getElementById('refresh-btn').addEventListener('click', loadPatients);

  document.getElementById('qa-read-card').addEventListener('click', () => switchMode('reading'));
  document.getElementById('qa-manage').addEventListener('click', () => switchMode('manage'));

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        pendingConfirmAction = null;
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditModal();
      closeConfirmModal();
    }
  });
}

/* --- INIT --- */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();
  initEventBindings();
  loadDashboard();
});
