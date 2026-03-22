/**
 * PsyFlow — Genogram Maker Controller (v2)
 * Full workspace: drag/drop symbols, snap grid, connect nodes,
 * bracket couple lines, child links, emotional links, properties panel.
 */

import { GenogramDataModel } from './models.js';
import {
  createPersonNode, createCoupleEdge, createChildEdge, createEmotionalEdge,
  COUPLE_STYLES, CHILD_STYLES, EMOTIONAL_STYLES,
  generateCouplePreview, generateEmotionalPreview, generateChildPreview,
  NODE_W, NODE_H, GRID,
} from './renderer.js';

export class GenogramMaker {
  constructor(containerId) {
    this.containerId = containerId;
    this.model       = new GenogramDataModel();

    // State
    this._selected       = null;   // person id
    this._dragging       = null;   // person id being dragged
    this._dragOffset     = { x: 0, y: 0 };
    this._connecting     = null;   // person id we're drawing a line from
    this._tempLine       = null;
    this._pendingRel     = null;
    this._editingRel     = null;
    this._pendingChild   = null;
    this._scale          = 1;
    this._tx             = 0;
    this._ty             = 0;
    this._isPanning      = false;
    this._panStart       = null;
    this._genogramId     = null;   // database id if loaded
    this._genogramName   = '';
    this._linkedPatientId= null;
    this._dirty          = false;

    this._init();
  }

  /* ── Initialization ─────────────────────────────────────────── */
  _init() {
    const root = document.getElementById(this.containerId);
    if (!root) return;
    root.innerHTML = this._buildHTML();

    this._svg       = root.querySelector('.geno-canvas');
    this._layer     = root.querySelector('.geno-layer');
    this._propsPanel= root.querySelector('.geno-props-panel');
    this._symbolPanel = root.querySelector('.geno-symbols');

    this._bindCanvas();
    this._bindToolbar(root);
    this._bindPropsPanel();
    this._bindSymbolDrag();
    this._bindModals(root);

    // Baseline
    this.model._history = [this.model._snapshot()];
    this._render();
  }

  /* ── Full render ────────────────────────────────────────────── */
  _render() {
    const layer = this._layer;
    layer.innerHTML = '';

    // Edge layer (behind nodes)
    const edgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    edgeG.classList.add('edge-layer');

    // Couple bracket edges
    for (const cl of this.model.coupleLinks.values()) {
      const pA = this.model.people.get(cl.partnerA);
      const pB = this.model.people.get(cl.partnerB);
      if (pA && pB) {
        const edge = createCoupleEdge(cl, pA, pB);
        // Click to select the couple relationship itself
        edge.addEventListener('click', (e) => {
          e.stopPropagation();
          this._select(cl.id);
        });
        edge.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          this._openRelationPickerForEdit(cl.id, 'couple');
        });
        
        // Hover/hit area for dropping children
        edge.querySelectorAll('.couple-hit-line').forEach(hl => {
          hl.addEventListener('mouseenter', () => {
            if (this._connecting) {
              this._openChildPicker(this._connecting, cl.id);
              this._connecting = null;
              if (this._tempLine) { this._tempLine.remove(); this._tempLine = null; }
            }
          });
        });
        edgeG.appendChild(edge);
      }
    }

    // Child edges
    for (const childLink of this.model.childLinks) {
      const cl = this.model.coupleLinks.get(childLink.coupleLinkId);
      if (!cl) continue;
      const pA = this.model.people.get(cl.partnerA);
      const pB = this.model.people.get(cl.partnerB);
      const child = this.model.people.get(childLink.childId);
      if (pA && pB && child) {
        const edge = createChildEdge(childLink, cl, pA, pB, child);
        edge.addEventListener('click', (e) => {
          e.stopPropagation();
          this._select(childLink.id);
        });
        edge.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          this._openRelationPickerForEdit(childLink.id, 'child');
        });
        edgeG.appendChild(edge);
      }
    }

    // Emotional edges
    for (const el of this.model.emotionalLinks) {
      const src = this.model.people.get(el.sourceId);
      const tgt = this.model.people.get(el.targetId);
      if (src && tgt) {
        const edge = createEmotionalEdge(el, src, tgt);
        edge.style.cursor = 'pointer';
        edge.addEventListener('click', (e) => {
          e.stopPropagation();
          this._select(el.id);
        });
        edge.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          this._openRelationPickerForEdit(el.id, 'emotional');
        });
        edgeG.appendChild(edge);
      }
    }

    layer.appendChild(edgeG);

    // Person nodes (on top)
    for (const person of this.model.people.values()) {
      const el = createPersonNode(person);
      this._bindNodeEvents(el, person);
      layer.appendChild(el);
    }

    this._applyTransform();
    this._renderPropsPanel();
    if (this._selected) {
      this._select(this._selected);
    }
  }

  _applyTransform() {
    this._layer.setAttribute('transform',
      `translate(${this._tx},${this._ty}) scale(${this._scale})`);
  }

  /* ── Canvas events ──────────────────────────────────────────── */
  _bindCanvas() {
    const svg = this._svg;

    // Panning starts on background mousedown
    svg.addEventListener('mousedown', e => {
      if (e.target.classList.contains('child-attach-handle')) {
        e.stopPropagation();
        e.preventDefault();
        const cid = e.target.getAttribute('data-child-id');
        this._select(cid);
        this._draggingHandle = cid;
        const cl = this.model.childLinks.find(c => c.id === cid);
        this._dragHandleData = { startX: this._svgPoint(e).x, startOffset: cl ? (cl.attachOffset || 0) : 0 };
        return;
      }

      if (e.target === svg || (e.target.tagName === 'rect' && e.target.getAttribute('fill')?.includes('url'))) {
        this._isPanning = true;
        this._panStart = { x: e.clientX - this._tx, y: e.clientY - this._ty };
        svg.classList.add('panning');
        this._deselectAll();
      }
    });

    // ALL move/up handling on document level — makes dragging smooth
    // even when cursor leaves the SVG or moves fast
    document.addEventListener('mousemove', e => {
      // Pan canvas
      if (this._isPanning) {
        this._tx = e.clientX - this._panStart.x;
        this._ty = e.clientY - this._panStart.y;
        this._applyTransform();
        return;
      }
      // Update connection temp-line
      if (this._connecting && this._tempLine) {
        const pt = this._svgPoint(e);
        this._tempLine.setAttribute('x2', pt.x);
        this._tempLine.setAttribute('y2', pt.y);
      }
      // Drag child attachment handle
      if (this._draggingHandle) {
        const pt = this._svgPoint(e);
        const dx = pt.x - this._dragHandleData.startX;
        const cl = this.model.childLinks.find(c => c.id === this._draggingHandle);
        if (cl) {
          let newOffset = this._dragHandleData.startOffset + dx;
          
          // Constrain within the bounding line of parents
          const coupleLink = this.model.coupleLinks.get(cl.coupleLinkId);
          if (coupleLink) {
             const pA = this.model.people.get(coupleLink.partnerA);
             const pB = this.model.people.get(coupleLink.partnerB);
             if (pA && pB) {
                const maxRange = Math.abs(pA.x - pB.x) / 2;
                newOffset = Math.max(-maxRange, Math.min(maxRange, newOffset));
             }
          }

          cl.attachOffset = newOffset;
          this._render();
        }
        return;
      }
      
      // Drag node — use fast transform update, not full re-render
      if (this._dragging) {
        const pt = this._svgPoint(e);
        const person = this.model.people.get(this._dragging);
        if (person) {
          person.x = this._snap(pt.x - this._dragOffset.x);
          person.y = this._snap(pt.y - this._dragOffset.y);
          // Fast path: just move the SVG group + re-render edges
          this._render();
        }
      }
    });

    document.addEventListener('mouseup', e => {
      // End panning
      if (this._isPanning) {
        this._isPanning = false;
        svg.classList.remove('panning');
      }
      // End tracking handle
      if (this._draggingHandle) {
        this._draggingHandle = null;
        this._dirty = true;
        this.model._commit();
      }
      // End dragging node
      if (this._dragging) {
        this._dragging = null;
        this._dirty = true;
      }
      // End connecting — check if we dropped on a person node
      if (this._connecting) {
        const pt = this._svgPoint(e);
        const targetPerson = this._hitTestPerson(pt.x, pt.y);
        if (targetPerson && targetPerson.id !== this._connecting) {
          this._openRelationPicker(this._connecting, targetPerson.id);
        }
        this._connecting = null;
        if (this._tempLine) { this._tempLine.remove(); this._tempLine = null; }
      }
    });

    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const pt = this._svgPoint(e);
      this._tx = pt.x - (pt.x - this._tx) * factor;
      this._ty = pt.y - (pt.y - this._ty) * factor;
      this._scale *= factor;
      this._scale = Math.min(Math.max(this._scale, 0.15), 5);
      this._applyTransform();
    }, { passive: false });
  }

  /* ── Hit test: find person at SVG coord ─────────────────────── */
  _hitTestPerson(x, y) {
    const half = NODE_W / 2 + 6; // small tolerance
    for (const person of this.model.people.values()) {
      if (Math.abs(x - person.x) <= half && Math.abs(y - person.y) <= half) {
        return person;
      }
    }
    return null;
  }

  /* ── Node events ────────────────────────────────────────────── */
  _bindNodeEvents(el, person) {
    // Drag node
    el.addEventListener('mousedown', e => {
      e.stopPropagation();
      // Don't start node drag if clicking the connect dot
      if (e.target.classList.contains('connect-dot')) return;
      this._select(person.id);
      const pt = this._svgPoint(e);
      this._dragging   = person.id;
      this._dragOffset = { x: pt.x - person.x, y: pt.y - person.y };
    });

    // Connect dot — start drawing a connection line
    const dot = el.querySelector('.connect-dot');
    if (dot) {
      dot.addEventListener('mousedown', e => {
        e.stopPropagation();
        e.preventDefault();
        this._connecting = person.id;
        this._dragging = null; // prevent node drag
        this._tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this._tempLine.setAttribute('x1', person.x);
        this._tempLine.setAttribute('y1', person.y);
        this._tempLine.setAttribute('x2', person.x);
        this._tempLine.setAttribute('y2', person.y);
        // Beautiful dashed orange line for drag connection
        this._tempLine.setAttribute('stroke', '#ea580c');
        this._tempLine.setAttribute('stroke-width', '3');
        this._tempLine.setAttribute('stroke-dasharray', '8,6');
        this._tempLine.setAttribute('stroke-linecap', 'round');
        this._tempLine.setAttribute('pointer-events', 'none'); // don't block mouse events
        this._layer.appendChild(this._tempLine);
      });
    }

    el.addEventListener('click', e => {
      e.stopPropagation();
      this._select(person.id);
    });
  }

  /* ── Snap to grid ───────────────────────────────────────────── */
  _snap(val) {
    return Math.round(val / GRID) * GRID;
  }

  _svgPoint(e) {
    const rect = this._svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - this._tx) / this._scale,
      y: (e.clientY - rect.top  - this._ty) / this._scale,
    };
  }

  /* ── Selection ──────────────────────────────────────────────── */
  _select(id) {
    this._selected = id;
    this._svg.querySelectorAll('.geno-node, .geno-edge').forEach(n => n.classList.remove('selected'));
    
    // Select Person
    let el = this._svg.querySelector(`[data-id="${id}"]`);
    // Select Couple
    if (!el) el = this._svg.querySelector(`[data-couple-id="${id}"]`);
    // Select Child Link
    if (!el) el = this._svg.querySelector(`[data-child-id="${id}"]`);
    // Select Emotional Link
    if (!el) el = this._svg.querySelector(`[data-emo-id="${id}"]`);
    
    if (el) el.classList.add('selected');
    this._renderPropsPanel();
  }

  _deselectAll() {
    this._selected = null;
    this._svg.querySelectorAll('.selected').forEach(n => n.classList.remove('selected'));
    this._renderPropsPanel();
  }

  /* ── Symbol Panel (drag to create) ──────────────────────────── */
  _bindSymbolDrag() {
    const panel = document.getElementById(this.containerId)?.querySelector('.geno-symbols');
    if (!panel) return;

    panel.querySelectorAll('.symbol-item').forEach(item => {
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        const gender = item.dataset.gender;
        // Place at canvas center
        const cx = (this._svg.clientWidth / 2 - this._tx) / this._scale;
        const cy = (this._svg.clientHeight / 2 - this._ty) / this._scale;
        const p = this.model.addPerson({
          gender,
          x: this._snap(cx),
          y: this._snap(cy),
          name: '',
        });
        this._dirty = true;
        this._render();
        // Start dragging immediately so it follows cursor onto the canvas
        this._select(p.id);
        this._dragging = p.id;
        this._dragOffset = { x: 0, y: 0 };
      });
    });
  }

  /* ── Relation Picker Modal ──────────────────────────────────── */
  _openRelationPicker(fromId, toId) {
    const modal = document.getElementById(`geno-rel-modal-${this.containerId}`);
    if (!modal) return;
    this._pendingRel = { fromId, toId };
    modal.classList.remove('hidden');
  }

  _openRelationPickerForEdit(linkId, type) {
    if (type === 'child') {
      const modal = document.getElementById(`geno-child-modal-${this.containerId}`);
      if (!modal) return;
      this._editingRel = { id: linkId, type };
      modal.classList.remove('hidden');
    } else {
      const modal = document.getElementById(`geno-rel-modal-${this.containerId}`);
      if (!modal) return;
      this._editingRel = { id: linkId, type };
      modal.classList.remove('hidden');
    }
  }

  _openChildPicker(childPersonId, coupleLinkId) {
    const modal = document.getElementById(`geno-child-modal-${this.containerId}`);
    if (!modal) return;
    this._pendingChild = { childPersonId, coupleLinkId };
    modal.classList.remove('hidden');
  }

  /* ── Toolbar ────────────────────────────────────────────────── */
  _bindToolbar(root) {
    const on = (sel, fn) => {
      const el = root.querySelector(sel);
      if (el) el.addEventListener('click', fn);
    };

    on('.geno-btn-undo', () => { this.model.undo(); this._render(); });
    on('.geno-btn-redo', () => { this.model.redo(); this._render(); });
    on('.geno-btn-zoomin', () => { this._scale = Math.min(this._scale * 1.2, 5); this._applyTransform(); });
    on('.geno-btn-zoomout', () => { this._scale = Math.max(this._scale * 0.8, 0.15); this._applyTransform(); });
    on('.geno-btn-zoomfit', () => this._fitView());
    on('.geno-btn-delete', () => this._deleteSelected());
    on('.geno-btn-save', () => this._handleSave());
    on('.geno-btn-load', () => this._handleLoad());
    on('.geno-btn-export', () => this._exportPNG());

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && this._selected) {
        this._deleteSelected();
      }
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.model.undo(); this._render(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this.model.redo(); this._render(); }
    });
  }

  async _handleSave() {
    if (this._linkedPatientId) {
      await this._saveToBackend(this._linkedPatientId);
      alert('Genogram successfully updated for the selected patient!');
      return;
    }

    const modal = document.getElementById(`geno-save-modal-${this.containerId}`);
    const select = document.getElementById(`geno-patient-select-${this.containerId}`);
    if (!modal || !select) return;

    try {
      const res = await fetch('/api/patients?include_inactive=false');
      const data = await res.json();
      if (!data.patients || data.patients.length === 0) {
        select.innerHTML = '<option value="">(No active patients found)</option>';
      } else {
        select.innerHTML = '<option value="">-- Choose a patient --</option>' +
          data.patients.map(p => `<option value="${p.id}">${this._esc(p.full_name)} (${this._esc(p.rfid_uid)})</option>`).join('');
      }
    } catch (err) {
      console.error(err);
      select.innerHTML = '<option value="">Error loading patients</option>';
    }
    
    modal.classList.remove('hidden');
  }

  async _handleLoad() {
    // If there are unsaved changes, prompt the user
    if (this._dirty && confirm("You have unsaved changes. Loading a new genogram will overwrite your current progress. Continue?") === false) {
      return;
    }

    const modal = document.getElementById(`geno-load-modal-${this.containerId}`);
    const select = document.getElementById(`geno-patient-load-select-${this.containerId}`);
    if (!modal || !select) return;

    try {
      const res = await fetch('/api/patients?include_inactive=false');
      const data = await res.json();
      if (!data.patients || data.patients.length === 0) {
        select.innerHTML = '<option value="">(No active patients found)</option>';
      } else {
        select.innerHTML = '<option value="">-- Choose a patient --</option>' +
          data.patients.map(p => `<option value="${p.id}">${this._esc(p.full_name)} (${this._esc(p.rfid_uid)})</option>`).join('');
      }
    } catch (err) {
      console.error(err);
      select.innerHTML = '<option value="">Error loading patients</option>';
    }
    
    modal.classList.remove('hidden');
  }

  _generateSVGDataUrl() {
    const svgEl = this._svg;
    // Clone SVG to avoid modifying the live one
    const clone = svgEl.cloneNode(true);
    // Set explicit dimensions for proper display
    clone.setAttribute('width', svgEl.clientWidth || 1200);
    clone.setAttribute('height', svgEl.clientHeight || 800);
    // Add white background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#ffffff');
    clone.insertBefore(bg, clone.firstChild);
    const xml = new XMLSerializer().serializeToString(clone);
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
  }

  async _saveToBackend(patientId) {
    try {
      const imageData = this._generateSVGDataUrl();
      const res = await fetch(`/api/patients/${patientId}/genogram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph_data: this.getGraphData(), image_data: imageData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      
      this._linkedPatientId = patientId;
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  _deleteSelected() {
    if (!this._selected) return;
    if (this.model.people.has(this._selected)) this.model.removePerson(this._selected);
    else if (this.model.coupleLinks.has(this._selected)) this.model.removeCoupleLink(this._selected);
    else if (this.model.childLinks.find(c => c.id === this._selected)) this.model.removeChildLink(this._selected);
    else if (this.model.emotionalLinks.find(e => e.id === this._selected)) this.model.removeEmotionalLink(this._selected);

    this._selected = null;
    this._dirty = true;
    this._render();
  }

  _fitView() {
    const people = [...this.model.people.values()];
    if (!people.length) {
      this._scale = 1; this._tx = 0; this._ty = 0;
      this._applyTransform();
      return;
    }
    const xs = people.map(p => p.x);
    const ys = people.map(p => p.y);
    const pad = 80;
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    const W = this._svg.clientWidth;
    const H = this._svg.clientHeight;
    this._scale = Math.min(W / (maxX - minX), H / (maxY - minY), 2);
    this._tx = (W - (maxX + minX) * this._scale) / 2;
    this._ty = (H - (maxY + minY) * this._scale) / 2;
    this._applyTransform();
  }

  /* ── Properties Panel ───────────────────────────────────────── */
  _bindPropsPanel() {
    if (!this._propsPanel) return;

    const handler = e => {
      if (!this._selected) return;
      const field = e.target.dataset.field;
      if (!field) return;
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      
      if (this.model.people.has(this._selected)) {
        this.model.updatePerson(this._selected, { [field]: val });
      } else if (this.model.coupleLinks.has(this._selected)) {
        const cl = this.model.coupleLinks.get(this._selected);
        this.model._commit();
        cl[field] = val;
      } else {
        const childLink = this.model.childLinks.find(c => c.id === this._selected);
        if (childLink) {
          this.model._commit();
          childLink[field] = val;
        } else {
          const emoLink = this.model.emotionalLinks.find(el => el.id === this._selected);
          if (emoLink) {
            this.model._commit();
            emoLink[field] = val;
          }
        }
      }
      this._dirty = true;
      this._render();
    };

    this._propsPanel.addEventListener('input', handler);
    this._propsPanel.addEventListener('change', handler);
  }

  _renderPropsPanel() {
    const panel = this._propsPanel;
    if (!panel) return;

    if (!this._selected) {
      panel.innerHTML = `<div class="props-empty"><p>Select a person or relationship<br>to edit properties.</p></div>`;
      return;
    }

    // Is it a Person?
    if (this.model.people.has(this._selected)) {
      const person = this.model.people.get(this._selected);
      panel.innerHTML = `
        <h4 class="props-title">Person Properties</h4>
        <label class="props-label">Name
          <input class="props-input" type="text" data-field="name" value="${this._esc(person.name)}" placeholder="Full name…">
        </label>
        <label class="props-label">Gender
          <select class="props-input" data-field="gender">
            <option value="male"   ${person.gender==='male'?'selected':''}>Male (□)</option>
            <option value="female" ${person.gender==='female'?'selected':''}>Female (○)</option>
          </select>
        </label>
        <label class="props-label">Date of Birth
          <input class="props-input" type="date" data-field="dob" value="${person.dob || ''}">
        </label>
        <label class="props-check">
          <input type="checkbox" data-field="isDeceased" ${person.isDeceased?'checked':''}>
          Deceased
        </label>
        ${person.isDeceased ? `
          <label class="props-label">Date of Death
            <input class="props-input" type="date" data-field="dod" value="${person.dod || ''}">
          </label>
        ` : ''}
        <label class="props-check">
          <input type="checkbox" data-field="isIndexPatient" ${person.isIndexPatient?'checked':''}>
          Index Patient
        </label>
        <button class="btn btn-sm btn-danger" id="geno-btn-delete-node" style="margin-top:12px;width:100%">
          🗑 Delete Person
        </button>`;
    } 
    // Is it a Couple Link?
    else if (this.model.coupleLinks.has(this._selected)) {
      const cl = this.model.coupleLinks.get(this._selected);
      const currentStyle = COUPLE_STYLES[cl.relationType] || { label: cl.relationType };
      panel.innerHTML = `
        <h4 class="props-title">Couple Relationship</h4>
        <div class="props-label">Current Style
          <div style="padding:8px 0;font-size:13px;color:var(--text-primary);font-weight:600">${currentStyle.label}</div>
        </div>
        <button class="btn btn-sm btn-primary" id="geno-btn-change-style" style="width:100%">
          ✏️ Change Style Visually
        </button>
        <button class="btn btn-sm btn-danger" id="geno-btn-delete-node" style="margin-top:12px;width:100%">
          🗑 Delete Relationship
        </button>`;
    }
    // Is it a Child Link?
    else if (this.model.childLinks.find(c => c.id === this._selected)) {
      const cl = this.model.childLinks.find(c => c.id === this._selected);
      const currentStyle = CHILD_STYLES[cl.childType] || { label: cl.childType };
      panel.innerHTML = `
        <h4 class="props-title">Child Link</h4>
        <div class="props-label">Current Style
          <div style="padding:8px 0;font-size:13px;color:var(--text-primary);font-weight:600">${currentStyle.label}</div>
        </div>
        <button class="btn btn-sm btn-primary" id="geno-btn-change-style" style="width:100%">
          ✏️ Change Style Visually
        </button>
        <button class="btn btn-sm btn-danger" id="geno-btn-delete-node" style="margin-top:12px;width:100%">
          🗑 Delete Child Link
        </button>`;
    }
    // Is it an Emotional Link?
    else if (this.model.emotionalLinks.find(e => e.id === this._selected)) {
      const el = this.model.emotionalLinks.find(e => e.id === this._selected);
      const currentStyle = EMOTIONAL_STYLES[el.relationType] || { label: el.relationType };
      panel.innerHTML = `
        <h4 class="props-title">Emotional Relationship</h4>
        <div class="props-label">Current Style
          <div style="padding:8px 0;font-size:13px;color:var(--text-primary);font-weight:600">${currentStyle.label}</div>
        </div>
        <button class="btn btn-sm btn-primary" id="geno-btn-change-style" style="width:100%">
          ✏️ Change Style Visually
        </button>
        <button class="btn btn-sm btn-danger" id="geno-btn-delete-node" style="margin-top:12px;width:100%">
          🗑 Delete Emotional Link
        </button>`;
    }

    panel.querySelector('#geno-btn-change-style')?.addEventListener('click', () => {
      if (this.model.coupleLinks.has(this._selected)) {
        this._openRelationPickerForEdit(this._selected, 'couple');
      } else if (this.model.childLinks.find(c => c.id === this._selected)) {
        this._openRelationPickerForEdit(this._selected, 'child');
      } else if (this.model.emotionalLinks.find(e => e.id === this._selected)) {
        this._openRelationPickerForEdit(this._selected, 'emotional');
      }
    });

    panel.querySelector('#geno-btn-delete-node')?.addEventListener('click', () => {
      this._deleteSelected();
    });
  }

  _esc(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  /* ── Export PNG ──────────────────────────────────────────────── */
  _exportPNG() {
    const svgEl = this._svg;
    const xml   = new XMLSerializer().serializeToString(svgEl);
    const blob  = new Blob([xml], { type: 'image/svg+xml' });
    const url   = URL.createObjectURL(blob);
    const img   = new Image();
    img.onload  = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = svgEl.clientWidth  || 1200;
      canvas.height = svgEl.clientHeight || 800;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a    = document.createElement('a');
      a.href     = canvas.toDataURL('image/png');
      a.download = `genogram-${this._genogramName || 'export'}.png`;
      a.click();
    };
    img.src = url;
  }

  /* ── Public API: load/save/clear ────────────────────────────── */
  loadGenogram(data) {
    this.model.fromJSON(data.graph_data || {});
    this._genogramId      = data.id || null;
    this._genogramName    = data.name || '';
    this._linkedPatientId = data.patient_id || null;
    this.model._history   = [this.model._snapshot()];
    this._dirty = false;
    this._render();
    this._fitView();
  }

  getGraphData() {
    return this.model.toJSON();
  }

  clearCanvas() {
    this.model.clear();
    this._genogramId = null;
    this._genogramName = '';
    this._linkedPatientId = null;
    this._dirty = false;
    this._selected = null;
    this._render();
  }

  /* ── Build HTML ─────────────────────────────────────────────── */
  _buildHTML() {
    // Couple relationship buttons with SVG previews
    const coupleRows = Object.entries(COUPLE_STYLES).map(([key, s]) =>
      `<button class="rel-btn rel-btn--preview" data-rel="${key}" data-cat="couple">
        <span class="rel-preview">${generateCouplePreview(key)}</span>
        <span class="rel-label">${s.label}</span>
      </button>`
    ).join('');

    // Emotional relationship buttons with SVG previews
    const emoRows = Object.entries(EMOTIONAL_STYLES).map(([key, s]) =>
      `<button class="rel-btn rel-btn--preview rel-btn--emo" data-rel="${key}" data-cat="emotional">
        <span class="rel-preview">${generateEmotionalPreview(key)}</span>
        <span class="rel-label">${s.label}</span>
      </button>`
    ).join('');

    // Child type buttons with SVG previews
    const childRows = Object.entries(CHILD_STYLES).map(([key, s]) =>
      `<button class="rel-btn rel-btn--preview rel-btn--child" data-child="${key}">
        <span class="rel-preview">${generateChildPreview(key)}</span>
        <span class="rel-label">${s.label}</span>
      </button>`
    ).join('');

    return `
<div class="geno-wrapper" id="geno-wrapper-${this.containerId}">
  <!-- Toolbar -->
  <div class="geno-toolbar">
    <div class="geno-toolbar-left">
      <button class="geno-tool geno-btn-undo"    title="Undo (Ctrl+Z)">↩ Undo</button>
      <button class="geno-tool geno-btn-redo"    title="Redo (Ctrl+Y)">↪ Redo</button>
      <span class="geno-divider"></span>
      <button class="geno-tool geno-btn-delete"  title="Delete Selected (Del)">🗑 Delete</button>
    </div>
    <div class="geno-toolbar-right">
      <button class="geno-tool geno-btn-zoomout" title="Zoom Out">−</button>
      <button class="geno-tool geno-btn-zoomin"  title="Zoom In">+</button>
      <button class="geno-tool geno-btn-zoomfit" title="Fit View">⊡ Fit</button>
      <span class="geno-divider"></span>
      <button class="geno-tool geno-tool--save geno-btn-save"    title="Save to Patient">💾 Save to Patient</button>
      <button class="geno-tool geno-tool--load geno-btn-load"    title="Load Genogram">📂 Load</button>
      <button class="geno-tool geno-tool--export geno-btn-export"  title="Export PNG">⬇ Export</button>
    </div>
  </div>

  <!-- Main layout -->
  <div class="geno-main">
    <!-- Left symbol panel -->
    <div class="geno-symbols">
      <div class="symbol-section-label">Symbols</div>
      <div class="symbol-item" data-gender="male" title="Drag to add Male">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <rect x="4" y="4" width="24" height="24" rx="2" fill="none" stroke="#2563eb" stroke-width="2.5"/>
        </svg>
        <span>Male</span>
      </div>
      <div class="symbol-item" data-gender="female" title="Drag to add Female">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="#db2777" stroke-width="2.5"/>
        </svg>
        <span>Female</span>
      </div>
    </div>

    <!-- SVG Canvas -->
    <svg class="geno-canvas" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="geno-grid-${this.containerId}" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="#d1d5db" opacity="0.4"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geno-grid-${this.containerId})"/>
      <g class="geno-layer"></g>
    </svg>

    <!-- Right properties panel -->
    <div class="geno-props-panel">
      <div class="props-empty"><p>Select a person<br>to edit properties.</p></div>
    </div>
  </div>
</div>

<!-- Relation Picker Modal -->
<div id="geno-rel-modal-${this.containerId}" class="geno-modal hidden">
  <div class="geno-modal-box">
    <div class="geno-modal-header">
      <h3>Select Relationship Type</h3>
      <button class="geno-modal-close">✕</button>
    </div>
    <div class="geno-modal-tabs">
      <div class="geno-modal-section">
        <p class="modal-cat-label">Family / Partner</p>
        <div class="rel-grid">${coupleRows}</div>
      </div>
      <div class="geno-modal-section">
        <p class="modal-cat-label">Emotional</p>
        <div class="rel-grid">${emoRows}</div>
      </div>
    </div>
  </div>
</div>

<!-- Child Type Picker Modal -->
<div id="geno-child-modal-${this.containerId}" class="geno-modal hidden">
  <div class="geno-modal-box">
    <div class="geno-modal-header">
      <h3>Select Child Relationship</h3>
      <button class="geno-modal-close">✕</button>
    </div>
    <div class="geno-modal-tabs">
      <div class="geno-modal-section">
        <p class="modal-cat-label">Child Type</p>
        <div class="rel-grid">${childRows}</div>
      </div>
    </div>
  </div>
</div>

<!-- Save to Patient Modal -->
<div id="geno-save-modal-${this.containerId}" class="geno-modal hidden">
  <div class="geno-modal-box" style="width: 400px;">
    <div class="geno-modal-header">
      <h3>Save to Patient Profile</h3>
      <button class="geno-modal-close">✕</button>
    </div>
    <div class="geno-modal-section" style="padding: 16px;">
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">Select a patient to attach this genogram to their profile.</p>
      <select id="geno-patient-select-${this.containerId}" class="props-input" style="width: 100%; margin-bottom: 16px; padding: 8px;">
        <option value="">Loading patients...</option>
      </select>
      <button id="geno-btn-confirm-save-${this.containerId}" class="btn btn-primary" style="width: 100%;">Save Genogram</button>
    </div>
  </div>
</div>

<!-- Load from Patient Modal -->
<div id="geno-load-modal-${this.containerId}" class="geno-modal hidden">
  <div class="geno-modal-box" style="width: 400px;">
    <div class="geno-modal-header">
      <h3>Load Patient Genogram</h3>
      <button class="geno-modal-close">✕</button>
    </div>
    <div class="geno-modal-section" style="padding: 16px;">
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">Select a patient to load their genogram into the editor.</p>
      <select id="geno-patient-load-select-${this.containerId}" class="props-input" style="width: 100%; margin-bottom: 16px; padding: 8px;">
        <option value="">Loading patients...</option>
      </select>
      <button id="geno-btn-confirm-load-${this.containerId}" class="btn btn-success" style="width: 100%;">Load Genogram</button>
    </div>
  </div>
</div>`;
  }

  _bindModals(root) {
    const maker = this;
    
    // --- Relation Modal ---
    const relModal = root.querySelector(`[id^="geno-rel-modal-"]`);
    if (relModal) {
      relModal.querySelector('.geno-modal-close')?.addEventListener('click', () => relModal.classList.add('hidden'));
      relModal.querySelectorAll('[data-rel]').forEach(btn => {
        btn.addEventListener('click', () => {
          const rel = btn.dataset.rel;
          const cat = btn.dataset.cat;
          if (maker._pendingRel) {
            const { fromId, toId } = maker._pendingRel;
            if (cat === 'couple') {
              maker.model.addCoupleLink({ partnerA: fromId, partnerB: toId, relationType: rel });
            } else if (cat === 'emotional') {
              maker.model.addEmotionalLink({ sourceId: fromId, targetId: toId, relationType: rel });
            }
            maker._pendingRel = null;
            maker._dirty = true;
            maker._render();
          } else if (maker._editingRel && maker._editingRel.type !== 'child') {
            const { id, type } = maker._editingRel;
            if (type === 'couple') {
               const link = maker.model.coupleLinks.get(id);
               if (link) { maker.model._commit(); link.relationType = rel; }
            } else if (type === 'emotional') {
               const link = maker.model.emotionalLinks.find(e => e.id === id);
               if (link) { maker.model._commit(); link.relationType = rel; }
            }
            maker._editingRel = null;
            maker._dirty = true;
            maker._render();
          }
          relModal.classList.add('hidden');
        });
      });
    }

    // --- Child Modal ---
    const childModal = root.querySelector(`[id^="geno-child-modal-"]`);
    if (childModal) {
      childModal.querySelector('.geno-modal-close')?.addEventListener('click', () => childModal.classList.add('hidden'));
      childModal.querySelectorAll('[data-child]').forEach(btn => {
        btn.addEventListener('click', () => {
          const childType = btn.dataset.child;
          if (maker._pendingChild) {
            const { childPersonId, coupleLinkId } = maker._pendingChild;
            const existing = maker.model.childLinks.find(c => c.childId === childPersonId && c.coupleLinkId === coupleLinkId);
            if (existing) {
               maker.model._commit();
               existing.childType = childType;
            } else {
               maker.model.addChildLink({ coupleLinkId, childId: childPersonId, childType });
            }
            maker._pendingChild = null;
            maker._dirty = true;
            maker._render();
          } else if (maker._editingRel && maker._editingRel.type === 'child') {
            const childLink = maker.model.childLinks.find(c => c.id === maker._editingRel.id);
            if (childLink) {
              maker.model._commit();
              childLink.childType = childType;
              maker._dirty = true;
              maker._render();
            }
            maker._editingRel = null;
          }
          childModal.classList.add('hidden');
        });
      });
    }

    // --- Save Modal ---
    const saveModal = root.querySelector(`[id^="geno-save-modal-"]`);
    if (saveModal) {
      saveModal.querySelector('.geno-modal-close')?.addEventListener('click', () => saveModal.classList.add('hidden'));
      root.querySelector(`[id^="geno-btn-confirm-save-"]`)?.addEventListener('click', async () => {
        const select = root.querySelector(`[id^="geno-patient-select-"]`);
        const patientId = select ? select.value : '';
        if (!patientId) {
          alert('Please select a patient first.');
          return;
        }
        try {
          await maker._saveToBackend(patientId);
          saveModal.classList.add('hidden');
          alert('Genogram successfully saved and mapped to patient!');
        } catch (err) {
          alert('Error saving genogram: ' + err.message);
        }
      });
    }

    // --- Load Modal ---
    const loadModal = root.querySelector(`[id^="geno-load-modal-"]`);
    if (loadModal) {
      loadModal.querySelector('.geno-modal-close')?.addEventListener('click', () => loadModal.classList.add('hidden'));
      root.querySelector(`[id^="geno-btn-confirm-load-"]`)?.addEventListener('click', async () => {
        const select = root.querySelector(`[id^="geno-patient-load-select-"]`);
        const patientId = select ? select.value : '';
        if (!patientId) {
          alert('Please select a patient first.');
          return;
        }
        try {
          const res = await fetch(`/api/patients/${patientId}/genogram`);
          const data = await res.json();
          const gd = data.genogram && data.genogram.graph_data ? data.genogram.graph_data : {};
          maker.loadGenogram({
            graph_data: gd,
            patient_id: patientId
          });
          loadModal.classList.add('hidden');
          alert('Genogram successfully loaded!');
        } catch (err) {
          alert('Error loading genogram: ' + err.message);
        }
      });
    }
  }
}

/* ══════════════════════════════════════════════════════════════════
   INIT: Exported utility
   ══════════════════════════════════════════════════════════════════ */
export function initGenogramMaker(containerId) {
  return new GenogramMaker(containerId);
}
/* ══════════════════════════════════════════════════════════════════
   Read-only Genogram Viewer — exact copy of maker, fully interactive
   zoom & pan, but no editing allowed.
   ══════════════════════════════════════════════════════════════════ */
export function renderReadonlyGenogram(containerId, graphData) {
  const root = document.getElementById(containerId);
  if (!root) return;

  // Create the maker (this builds the full HTML + SVG canvas)
  const viewer = new GenogramMaker(containerId);

  // Load graph data using the correct method
  if (graphData && (graphData.people || graphData.coupleLinks)) {
    viewer.model.fromJSON(graphData);
    viewer.model._history = [viewer.model._snapshot()];
  }

  // Hide toolbar, symbols panel, and properties panel
  const wrapper = root.querySelector('.geno-wrapper');
  if (wrapper) {
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.minHeight = '100%';
    wrapper.style.border = 'none';
    wrapper.style.borderRadius = '0';
  }
  const tb = root.querySelector('.geno-toolbar');
  if (tb) tb.style.display = 'none';
  const sp = root.querySelector('.geno-symbols');
  if (sp) sp.style.display = 'none';
  const pp = root.querySelector('.geno-props-panel');
  if (pp) pp.style.display = 'none';

  // Disable all node interactions (dragging, connecting, selecting)
  // by overriding the bindNodeEvents to be a no-op
  viewer._bindNodeEvents = () => {};

  // Disable double-click editing on edges
  viewer._openRelationPicker = () => {};
  viewer._openRelationPickerForEdit = () => {};
  viewer._openChildPicker = () => {};

  // Render with all colors preserved
  viewer._render();
  viewer._fitView();

  // Re-bind only zoom (wheel) — pan already works from _bindCanvas
  // But we need to prevent symbol drag and toolbar actions
  // Disable symbol dragging
  if (viewer._symbolPanel) {
    viewer._symbolPanel.style.display = 'none';
  }

  return viewer;
}
window._renderReadonlyGenogram = renderReadonlyGenogram;
