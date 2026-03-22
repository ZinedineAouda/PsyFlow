/**
 * PsyFlow — Genogram Data Models (v2)
 * Clinical genogram data structures with undo/redo.
 */

let _uid = 0;
function uid(prefix = 'n') {
  return `${prefix}_${Date.now().toString(36)}_${(++_uid).toString(36)}`;
}

/* ── Person ─────────────────────────────────────────────────────── */
export class Person {
  constructor(data = {}) {
    this.id          = data.id          || uid('p');
    this.gender      = data.gender      || 'male';   // 'male' | 'female'
    this.name        = data.name        || '';
    this.dob         = data.dob         || '';        // YYYY-MM-DD
    this.isDeceased  = data.isDeceased  || false;
    this.dod         = data.dod         || '';        // YYYY-MM-DD
    this.isIndexPatient = data.isIndexPatient || false;
    this.x           = data.x ?? 0;
    this.y           = data.y ?? 0;
  }
}

/* ── CoupleLink — a relationship between two partners ───────── */
export class CoupleLink {
  constructor(data = {}) {
    this.id           = data.id           || uid('c');
    this.partnerA     = data.partnerA;                // Person id
    this.partnerB     = data.partnerB;                // Person id
    this.relationType = data.relationType || 'marriage';
  }
}

/* ── ChildLink — connects a child to a CoupleLink ──────────── */
export class ChildLink {
  constructor(data = {}) {
    this.id          = data.id          || uid('ch');
    this.coupleLinkId= data.coupleLinkId;             // CoupleLink id
    this.childId     = data.childId;                  // Person id
    this.childType   = data.childType   || 'biological';
  }
}

/* ── EmotionalLink — between any two people ─────────────────── */
export class EmotionalLink {
  constructor(data = {}) {
    this.id           = data.id           || uid('e');
    this.sourceId     = data.sourceId;                // Person id
    this.targetId     = data.targetId;                // Person id
    this.relationType = data.relationType || 'close';
  }
}

/* ── Main Data Model ────────────────────────────────────────── */
export class GenogramDataModel {
  constructor() {
    this.people         = new Map();
    this.coupleLinks    = new Map();
    this.childLinks     = [];
    this.emotionalLinks = [];
    this._history = [];
    this._future  = [];
  }

  /* Snapshot / Undo / Redo */
  _snapshot() { return JSON.stringify(this.toJSON()); }

  _commit() {
    this._history.push(this._snapshot());
    if (this._history.length > 60) this._history.shift();
    this._future = [];
  }

  undo() {
    if (this._history.length < 2) return false;
    this._future.push(this._history.pop());
    this.fromJSON(JSON.parse(this._history[this._history.length - 1]));
    return true;
  }

  redo() {
    if (!this._future.length) return false;
    const snap = this._future.pop();
    this._history.push(snap);
    this.fromJSON(JSON.parse(snap));
    return true;
  }

  /* People */
  addPerson(data = {}) {
    this._commit();
    const p = new Person(data);
    this.people.set(p.id, p);
    return p;
  }

  updatePerson(id, patch = {}) {
    this._commit();
    const p = this.people.get(id);
    if (!p) return null;
    Object.assign(p, patch);
    return p;
  }

  removePerson(id) {
    this._commit();
    this.people.delete(id);
    // Remove couple links referencing this person
    for (const [cid, cl] of this.coupleLinks) {
      if (cl.partnerA === id || cl.partnerB === id) {
        this.coupleLinks.delete(cid);
        this.childLinks = this.childLinks.filter(l => l.coupleLinkId !== cid);
      }
    }
    this.childLinks = this.childLinks.filter(l => l.childId !== id);
    this.emotionalLinks = this.emotionalLinks.filter(
      r => r.sourceId !== id && r.targetId !== id
    );
  }

  /* Couple Links */
  addCoupleLink(data = {}) {
    this._commit();
    const cl = new CoupleLink(data);
    this.coupleLinks.set(cl.id, cl);
    return cl;
  }

  removeCoupleLink(id) {
    this._commit();
    this.coupleLinks.delete(id);
    this.childLinks = this.childLinks.filter(l => l.coupleLinkId !== id);
  }

  /* Child Links */
  addChildLink(data = {}) {
    this._commit();
    const cl = new ChildLink(data);
    this.childLinks.push(cl);
    return cl;
  }

  removeChildLink(id) {
    this._commit();
    this.childLinks = this.childLinks.filter(l => l.id !== id);
  }

  /* Emotional Links */
  addEmotionalLink(data = {}) {
    this._commit();
    const el = new EmotionalLink(data);
    this.emotionalLinks.push(el);
    return el;
  }

  removeEmotionalLink(id) {
    this._commit();
    this.emotionalLinks = this.emotionalLinks.filter(r => r.id !== id);
  }

  /* Couple-link midpoint (bracket center) */
  getCoupleMidpoint(coupleLink) {
    const pA = this.people.get(coupleLink.partnerA);
    const pB = this.people.get(coupleLink.partnerB);
    if (!pA || !pB) return null;
    return {
      x: (pA.x + pB.x) / 2,
      y: Math.min(pA.y, pB.y),
    };
  }

  /* Serialization */
  toJSON() {
    return {
      people:         [...this.people.values()],
      coupleLinks:    [...this.coupleLinks.values()],
      childLinks:     this.childLinks,
      emotionalLinks: this.emotionalLinks,
    };
  }

  fromJSON(data) {
    this.people      = new Map();
    this.coupleLinks = new Map();
    (data.people || []).forEach(p => this.people.set(p.id, Object.assign(new Person(), p)));
    (data.coupleLinks || []).forEach(c => this.coupleLinks.set(c.id, Object.assign(new CoupleLink(), c)));
    this.childLinks     = (data.childLinks || []).map(l => Object.assign(new ChildLink(), l));
    this.emotionalLinks = (data.emotionalLinks || []).map(l => Object.assign(new EmotionalLink(), l));
  }

  clear() {
    this._commit();
    this.people.clear();
    this.coupleLinks.clear();
    this.childLinks = [];
    this.emotionalLinks = [];
  }
}
