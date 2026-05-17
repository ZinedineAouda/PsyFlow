/**
 * PsyFlow — Genogram SVG Renderer (v3)
 * Complete visual rendering with all relationship types + preview SVGs.
 */

export const NODE_W = 44;
export const NODE_H = 44;
export const GRID   = 20;

const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/* ════════════════════════════════════════════════════════════
   COUPLE STYLES — 20 types
   ════════════════════════════════════════════════════════════ */
export const COUPLE_STYLES = {
  marriage:                { stroke:'#374151', dash:'',          w:2.5, label:'gr_marriage' },
  engagement:              { stroke:'#2563eb', dash:'8,5',       w:2,   label:'gr_engagement' },
  legal_cohabitation:      { stroke:'#2563eb', dash:'4,3,1,3',   w:2,   label:'gr_legal_cohabitation',        house:true },
  cohabitation:            { stroke:'#16a34a', dash:'2,3',       w:2,   label:'gr_cohabitation',              house:true },
  casual_relationship:     { stroke:'#9ca3af', dash:'2,4',       w:1.5, label:'gr_casual_relationship' },
  divorce:                 { stroke:'#ef4444', dash:'',          w:2.5, label:'gr_divorce',                   slashes:2 },
  engagement_cohabitation: { stroke:'#2563eb', dash:'8,5',       w:2,   label:'gr_engagement_cohabitation',   house:true },
  legal_cohab_sep_fact:    { stroke:'#2563eb', dash:'4,3,1,3',   w:2,   label:'gr_legal_cohab_sep_fact',     house:true, slashes:1 },
  cohabitation_separation: { stroke:'#16a34a', dash:'2,3',       w:2,   label:'gr_cohab_sep',                 house:true, slashes:1 },
  casual_relationship_sep: { stroke:'#9ca3af', dash:'2,4',       w:1.5, label:'gr_casual_rel_sep',            slashes:1 },
  separation_fact:         { stroke:'#374151', dash:'',          w:2.5, label:'gr_sep_fact',                  slashes:1 },
  engagement_separation:   { stroke:'#2563eb', dash:'8,5',       w:2,   label:'gr_engagement_sep',            slashes:1 },
  legal_cohab_legal_sep:   { stroke:'#2563eb', dash:'4,3,1,3',   w:2,   label:'gr_legal_cohab_sep',           house:true, slashes:2 },
  nonsentimental_cohab:    { stroke:'#9ca3af', dash:'4,3,1,3',   w:2,   label:'gr_non_sent_cohab',            house:true },
  temporary_relation:      { stroke:'#9ca3af', dash:'6,3,1,3',   w:1.5, label:'gr_temporary_relation' },
  legal_separation:        { stroke:'#374151', dash:'',          w:2.5, label:'gr_legal_separation',           slashes:2 },
  nullity:                 { stroke:'#ef4444', dash:'',          w:2.5, label:'gr_nullity',                    slashes:3 },
  long_term_relationship:  { stroke:'#2563eb', dash:'12,4',      w:2,   label:'gr_long_term_rel' },
  nonsentimental_cohab_sep:{ stroke:'#9ca3af', dash:'4,3,1,3',   w:2,   label:'gr_non_sent_cohab_sep',        house:true, slashes:1 },
  love_affair:             { stroke:'#f472b6', dash:'3,4',       w:1.5, label:'gr_love_affair' },
};

/* ════════════════════════════════════════════════════════════
   CHILD STYLES — 5 types
   ════════════════════════════════════════════════════════════ */
export const CHILD_STYLES = {
  biological:    { stroke:'#6b7280', dash:'',      w:2,   label:'gr_bio_child' },
  adopted:       { stroke:'#2563eb', dash:'10,6',  w:2.5, label:'gr_adopted_child' },
  foster:        { stroke:'#16a34a', dash:'3,4',   w:2.5, label:'gr_foster_child' },
  multicultural: { stroke:'#6b7280', dash:'',      w:2,   label:'gr_multicultural',  wave:true },
  immigration:   { stroke:'#6b7280', dash:'',      w:2,   label:'gr_immigration',    wave:true, arrow:true },
};

/* ════════════════════════════════════════════════════════════
   EMOTIONAL STYLES — 29 types
   Colors: green=positive, red=negative, blue=abuse, gray=neutral
   ════════════════════════════════════════════════════════════ */
export const EMOTIONAL_STYLES = {
  indifferent:      { stroke:'#9ca3af', dash:'2,4',   w:1.5, label:'gr_indifferent' },
  harmony:          { stroke:'#16a34a', dash:'',      w:2.5, label:'gr_harmony' },
  hostile:          { stroke:'#ef4444', dash:'',      w:2,   label:'gr_hostile' },
  violence:         { stroke:'#ef4444', dash:'',      w:3,   label:'gr_violence' },
  abuse:            { stroke:'#2563eb', dash:'',      w:2,   label:'gr_abuse' },
  manipulative:     { stroke:'#ef4444', dash:'',      w:2,   label:'gr_manipulative' },
  distant_poor:     { stroke:'#9ca3af', dash:'6,5',   w:1.5, label:'gr_distant_poor' },
  close:            { stroke:'#16a34a', dash:'',      w:2,   label:'gr_close' },
  distant_hostile:  { stroke:'#ef4444', dash:'6,4',   w:2,   label:'gr_distant_hostile' },
  distant_violence: { stroke:'#ef4444', dash:'6,4',   w:3,   label:'gr_distant_violence' },
  physical_abuse:   { stroke:'#2563eb', dash:'',      w:3,   label:'gr_physical_abuse' },
  controlling:      { stroke:'#ef4444', dash:'',      w:2,   label:'gr_controlling' },
  cutoff:           { stroke:'#ef4444', dash:'6,4',   w:2,   label:'gr_cutoff' },
  very_close:       { stroke:'#16a34a', dash:'',      w:2,   label:'gr_very_close' },
  close_hostile:    { stroke:'#ef4444', dash:'',      w:2,   label:'gr_close_hostile' },
  close_violence:   { stroke:'#ef4444', dash:'',      w:3,   label:'gr_close_violence' },
  emotional_abuse:  { stroke:'#2563eb', dash:'',      w:2,   label:'gr_emotional_abuse' },
  focused_on:       { stroke:'#6b7280', dash:'',      w:2,   label:'gr_focused_on' },
  conflict:         { stroke:'#ef4444', dash:'4,4',   w:2.5, label:'gr_conflict' },
  love:             { stroke:'#16a34a', dash:'',      w:2,   label:'gr_love' },
  fused_hostile:    { stroke:'#ef4444', dash:'',      w:3,   label:'gr_fused_hostile' },
  fused_violence:   { stroke:'#ef4444', dash:'',      w:3.5, label:'gr_fused_violence' },
  sexual_abuse:     { stroke:'#2563eb', dash:'',      w:3,   label:'gr_sexual_abuse' },
  fan_admirer:      { stroke:'#6b7280', dash:'',      w:2,   label:'gr_fan_admirer' },
  hate:             { stroke:'#ef4444', dash:'5,3',   w:3,   label:'gr_hate' },
  in_love:          { stroke:'#16a34a', dash:'',      w:2,   label:'gr_in_love' },
  distrust:         { stroke:'#ef4444', dash:'',      w:2,   label:'gr_distrust' },
  fused:            { stroke:'#ef4444', dash:'',      w:4,   label:'gr_fused' },
  neglect_abuse:    { stroke:'#2563eb', dash:'6,4',   w:2,   label:'gr_neglect' },
  limerence:        { stroke:'#6b7280', dash:'',      w:2,   label:'gr_limerence' },
};

/* ══════════════════════════════════════════════════════════
   PREVIEW SVG GENERATORS — for modal buttons
   ══════════════════════════════════════════════════════════ */
function _previewShell(inner) {
  return `<svg width="110" height="32" viewBox="0 0 110 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="8" width="14" height="14" rx="1" fill="none" stroke="#374151" stroke-width="1.5"/>
    <circle cx="96" cy="15" r="7" fill="none" stroke="#374151" stroke-width="1.5"/>
    ${inner}
  </svg>`;
}

function _zigzagPath(x1, x2, y, amp, step) {
  let d = `M ${x1} ${y}`;
  let up = true;
  for (let x = x1; x < x2; x += step) {
    const nx = Math.min(x + step, x2);
    d += ` L ${nx} ${up ? y - amp : y + amp}`;
    up = !up;
  }
  d += ` L ${x2} ${y}`;
  return d;
}

function _wavyPath(x1, x2, y, amp, step) {
  let d = `M ${x1} ${y}`;
  for (let x = x1; x < x2; x += step) {
    const cx = x + step/2;
    const nx = Math.min(x + step, x2);
    d += ` Q ${cx} ${y - amp} ${nx} ${y}`;
    amp = -amp;
  }
  return d;
}

export function generateCouplePreview(key) {
  const s = COUPLE_STYLES[key];
  if (!s) return '';
  const x1 = 18, x2 = 86, y = 15, mx = 52;
  let inner = '';
  // Main line
  inner += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${s.stroke}" stroke-width="${s.w}" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''} stroke-linecap="round"/>`;
  // House icon
  if (s.house) {
    inner += `<polygon points="${mx-5},${y-2} ${mx},${y-7} ${mx+5},${y-2}" fill="none" stroke="${s.stroke}" stroke-width="1.2"/>`;
    inner += `<rect x="${mx-3}" y="${y-2}" width="6" height="5" fill="none" stroke="${s.stroke}" stroke-width="1"/>`;
  }
  // Slashes
  if (s.slashes) {
    for (let i = 0; i < s.slashes; i++) {
      const ox = mx + (i - (s.slashes-1)/2) * 8;
      inner += `<line x1="${ox-4}" y1="${y+5}" x2="${ox+4}" y2="${y-5}" stroke="${s.stroke}" stroke-width="1.5"/>`;
    }
  }
  return _previewShell(inner);
}

export function generateEmotionalPreview(key) {
  const s = EMOTIONAL_STYLES[key];
  if (!s) return '';
  const x1 = 18, x2 = 86, y = 15, mx = 52;
  let inner = '';
  const linesCount = s.lines || 1;
  const step = s.dense ? 4 : 6;

  for (let li = 0; li < linesCount; li++) {
    const ly = y + (li - (linesCount-1)/2) * 4;
    if (s.zigzag) {
      inner += `<path d="${_zigzagPath(x1, x2, ly, 4, step)}" fill="none" stroke="${s.stroke}" stroke-width="${s.w}" stroke-linecap="round"/>`;
    } else if (s.wavy) {
      inner += `<path d="${_wavyPath(x1, x2, ly, 4, s.dense ? 6 : 8)}" fill="none" stroke="${s.stroke}" stroke-width="${s.w}" stroke-linecap="round"/>`;
    } else {
      inner += `<line x1="${x1}" y1="${ly}" x2="${x2}" y2="${ly}" stroke="${s.stroke}" stroke-width="${s.w}" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''} stroke-linecap="round"/>`;
    }
  }
  // Arrow
  if (s.arrow) {
    inner += `<polygon points="${x2},${y} ${x2-7},${y-4} ${x2-7},${y+4}" fill="${s.stroke}"/>`;
  }
  // Bars (cutoff)
  if (s.bars) {
    inner += `<line x1="${mx-2}" y1="${y-6}" x2="${mx-2}" y2="${y+6}" stroke="${s.stroke}" stroke-width="2"/>`;
    inner += `<line x1="${mx+2}" y1="${y-6}" x2="${mx+2}" y2="${y+6}" stroke="${s.stroke}" stroke-width="2"/>`;
  }
  // Circle (love)
  if (s.circle) {
    inner += `<circle cx="${mx}" cy="${y}" r="4" fill="none" stroke="${s.stroke}" stroke-width="1.5"/>`;
    if (s.double_circle) {
      inner += `<circle cx="${mx+12}" cy="${y}" r="4" fill="none" stroke="${s.stroke}" stroke-width="1.5"/>`;
    }
  }
  // X mark (manipulative)
  if (s.xmark) {
    inner += `<line x1="${mx-4}" y1="${y-4}" x2="${mx+4}" y2="${y+4}" stroke="${s.stroke}" stroke-width="2"/>`;
    inner += `<line x1="${mx+4}" y1="${y-4}" x2="${mx-4}" y2="${y+4}" stroke="${s.stroke}" stroke-width="2"/>`;
  }
  // Xbox (controlling)
  if (s.xbox) {
    inner += `<rect x="${mx-5}" y="${y-5}" width="10" height="10" fill="none" stroke="${s.stroke}" stroke-width="1.5"/>`;
    inner += `<line x1="${mx-3}" y1="${y-3}" x2="${mx+3}" y2="${y+3}" stroke="${s.stroke}" stroke-width="1.5"/>`;
    inner += `<line x1="${mx+3}" y1="${y-3}" x2="${mx-3}" y2="${y+3}" stroke="${s.stroke}" stroke-width="1.5"/>`;
  }
  return _previewShell(inner);
}

export function generateChildPreview(key) {
  const s = CHILD_STYLES[key];
  if (!s) return '';
  const x1 = 10, x2 = 100, y = 15;
  let inner = '';
  if (s.wave) {
    // Draw line segments on each side, leave gap in center for S-curve
    const mx = 55;
    inner += `<line x1="${x1}" y1="${y}" x2="${mx-14}" y2="${y}" stroke="${s.stroke}" stroke-width="${s.w}" stroke-linecap="round"/>`;
    // S-curve tilde
    inner += `<path d="M ${mx-14} ${y} C ${mx-8} ${y-8}, ${mx-2} ${y-8}, ${mx} ${y} C ${mx+2} ${y+8}, ${mx+8} ${y+8}, ${mx+14} ${y}" fill="none" stroke="${s.stroke}" stroke-width="${s.w}" stroke-linecap="round"/>`;
    const lineEnd = s.arrow ? x2-8 : x2;
    inner += `<line x1="${mx+14}" y1="${y}" x2="${lineEnd}" y2="${y}" stroke="${s.stroke}" stroke-width="${s.w}" stroke-linecap="round"/>`;
  } else {
    inner += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${s.stroke}" stroke-width="${s.w}" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''} stroke-linecap="round"/>`;
  }
  if (s.arrow) {
    inner += `<polygon points="${x2},${y} ${x2-7},${y-4} ${x2-7},${y+4}" fill="${s.stroke}"/>`;
  }
  return `<svg width="110" height="30" viewBox="0 0 110 30" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

/* ══════════════════════════════════════════════════════════
   PERSON NODE RENDERER
   ══════════════════════════════════════════════════════════ */
export function createPersonNode(person) {
  const g = svgEl('g', { 'data-id': person.id, transform: `translate(${person.x},${person.y})` });
  g.classList.add('geno-node', `geno-node--${person.gender}`);
  const half = NODE_W / 2;

  let shape;
  if (person.gender === 'male') {
    shape = svgEl('rect', { x: -half, y: -half, width: NODE_W, height: NODE_H, rx: 2 });
  } else {
    shape = svgEl('circle', { r: half });
  }
  shape.classList.add('node-shape');
  if (person.isIndexPatient) shape.classList.add('is-patient');
  g.appendChild(shape);

  if (person.isDeceased) {
    const l1 = svgEl('line', { x1:-half-4, y1:-half-4, x2:half+4, y2:half+4, stroke:'#374151','stroke-width':'2.5','stroke-linecap':'round' });
    const l2 = svgEl('line', { x1:half+4, y1:-half-4, x2:-half-4, y2:half+4, stroke:'#374151','stroke-width':'2.5','stroke-linecap':'round' });
    l1.classList.add('deceased-cross'); l2.classList.add('deceased-cross');
    g.appendChild(l1); g.appendChild(l2);
  }

  const nameEl = svgEl('text', { 'text-anchor':'middle', y: half+16 });
  nameEl.classList.add('node-label');
  nameEl.textContent = person.name || '—';
  g.appendChild(nameEl);

  if (person.dob || person.dod) {
    const dateEl = svgEl('text', { 'text-anchor':'middle', y: half+30 });
    dateEl.classList.add('node-year');
    let t = '';
    if (person.dob) t += `b.${person.dob}`;
    if (person.dod) t += ` d.${person.dod}`;
    dateEl.textContent = t.trim();
    g.appendChild(dateEl);
  }

  const dot = svgEl('circle', { r:8, cx:0, cy:0 });
  dot.classList.add('connect-dot');
  g.appendChild(dot);
  return g;
}

/* ══════════════════════════════════════════════════════════
   COUPLE EDGE — bracket below partners
   ══════════════════════════════════════════════════════════ */
export function createCoupleEdge(cl, pA, pB) {
  const g = svgEl('g'); g.classList.add('geno-edge','geno-edge--couple');
  g.setAttribute('data-couple-id', cl.id);
  const s = COUPLE_STYLES[cl.relationType] || COUPLE_STYLES.marriage;

  const leftX = Math.min(pA.x,pB.x), rightX = Math.max(pA.x,pB.x);
  const leftY = pA.x<=pB.x?pA.y:pB.y, rightY = pA.x<=pB.x?pB.y:pA.y;
  const bracketY = Math.max(leftY,rightY) + NODE_H/2 + 20;
  const midX = (leftX+rightX)/2;

  const path = svgEl('path', {
    d: `M ${leftX} ${leftY+NODE_H/2} L ${leftX} ${bracketY} L ${rightX} ${bracketY} L ${rightX} ${rightY+NODE_H/2}`,
    fill:'none', stroke:s.stroke, 'stroke-width':s.w, 'stroke-linecap':'round', 'stroke-linejoin':'round',
  });
  if (s.dash) path.setAttribute('stroke-dasharray', s.dash);
  g.appendChild(path);

  // House icon
  if (s.house) {
    const hy = bracketY;
    g.appendChild(svgEl('polygon',{points:`${midX-6},${hy-2} ${midX},${hy-8} ${midX+6},${hy-2}`,fill:'none',stroke:s.stroke,'stroke-width':'1.5'}));
    g.appendChild(svgEl('rect',{x:midX-4,y:hy-2,width:8,height:6,fill:'none',stroke:s.stroke,'stroke-width':'1.2'}));
  }

  // Slashes
  if (s.slashes) {
    for (let i = 0; i < s.slashes; i++) {
      const ox = midX + (i-(s.slashes-1)/2)*10;
      g.appendChild(svgEl('line',{x1:ox-5,y1:bracketY+7,x2:ox+5,y2:bracketY-7,stroke:s.stroke,'stroke-width':'2'}));
    }
  }

  // Hit area
  g.appendChild(svgEl('line',{x1:leftX,y1:bracketY,x2:rightX,y2:bracketY,stroke:'transparent','stroke-width':'20',class:'couple-hit-line','data-couple-id':cl.id}));
  return g;
}

/* ══════════════════════════════════════════════════════════
   CHILD EDGE — drops from couple bracket midpoint
   ══════════════════════════════════════════════════════════ */
export function createChildEdge(childLink, cl, pA, pB, child) {
  const g = svgEl('g'); g.classList.add('geno-edge','geno-edge--child');
  g.setAttribute('data-child-id', childLink.id);
  const s = CHILD_STYLES[childLink.childType] || CHILD_STYLES.biological;
  
  const leftX = Math.min(pA.x,pB.x), rightX = Math.max(pA.x,pB.x);
  const leftY = pA.x<=pB.x?pA.y:pB.y, rightY = pA.x<=pB.x?pB.y:pA.y;
  const bracketY = Math.max(leftY,rightY) + NODE_H/2 + 20;
  
  const childTopY = child.y - NODE_H/2;
  const midX = (leftX + rightX) / 2;
  const attachOffset = childLink.attachOffset || 0;
  let dropX = midX + attachOffset;

  if (s.wave) {
    // Compute line direction
    const dx = child.x - dropX;
    const dy = childTopY - bracketY;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const ux = dx/len, uy = dy/len; // unit along line
    const nx = -uy, ny = ux;         // perpendicular
    const halfLen = len / 2;
    const waveSize = 10;
    const waveHalf = 14;

    // Top segment (before S-curve)
    const topEndX = dropX + ux*(halfLen - waveHalf);
    const topEndY = bracketY + uy*(halfLen - waveHalf);
    g.appendChild(svgEl('line',{x1:dropX,y1:bracketY,x2:topEndX,y2:topEndY,stroke:s.stroke,'stroke-width':s.w,'stroke-linecap':'round'}));

    // S-curve
    const sStartX = topEndX, sStartY = topEndY;
    const sMidX = dropX + ux*halfLen, sMidY = bracketY + uy*halfLen;
    const sEndX = dropX + ux*(halfLen + waveHalf), sEndY = bracketY + uy*(halfLen + waveHalf);
    const c1x = sStartX + ux*waveHalf*0.4 + nx*waveSize;
    const c1y = sStartY + uy*waveHalf*0.4 + ny*waveSize;
    const c2x = sMidX - ux*waveHalf*0.4 + nx*waveSize;
    const c2y = sMidY - uy*waveHalf*0.4 + ny*waveSize;
    const c3x = sMidX + ux*waveHalf*0.4 - nx*waveSize;
    const c3y = sMidY + uy*waveHalf*0.4 - ny*waveSize;
    const c4x = sEndX - ux*waveHalf*0.4 - nx*waveSize;
    const c4y = sEndY - uy*waveHalf*0.4 - ny*waveSize;
    const sCurve = `M ${sStartX} ${sStartY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${sMidX} ${sMidY} C ${c3x} ${c3y}, ${c4x} ${c4y}, ${sEndX} ${sEndY}`;
    g.appendChild(svgEl('path',{d:sCurve,fill:'none',stroke:s.stroke,'stroke-width':s.w,'stroke-linecap':'round'}));

    // Bottom segment (after S-curve)
    const botEndX = s.arrow ? child.x - ux*10 : child.x;
    const botEndY = s.arrow ? childTopY - uy*10 : childTopY;
    g.appendChild(svgEl('line',{x1:sEndX,y1:sEndY,x2:botEndX,y2:botEndY,stroke:s.stroke,'stroke-width':s.w,'stroke-linecap':'round'}));

    // Arrow
    if (s.arrow) {
      const p1x = child.x - ux*10 + nx*5;
      const p1y = childTopY - uy*10 + ny*5;
      const p2x = child.x - ux*10 - nx*5;
      const p2y = childTopY - uy*10 - ny*5;
      g.appendChild(svgEl('polygon',{points:`${child.x},${childTopY} ${p1x},${p1y} ${p2x},${p2y}`,fill:s.stroke}));
    }
  } else {
    // Direct straight line
    const d = `M ${dropX} ${bracketY} L ${child.x} ${childTopY}`;
    const path = svgEl('path', {
      d, fill:'none', stroke:s.stroke, 'stroke-width':s.w, 'stroke-linecap':'round', 'stroke-linejoin':'round',
    });
    if (s.dash) path.setAttribute('stroke-dasharray', s.dash);
    g.appendChild(path);
  }

  // Hit area covers the full line
  const hitD = `M ${dropX} ${bracketY} L ${child.x} ${childTopY}`;
  g.appendChild(svgEl('path', {
    d: hitD, fill:'none', stroke:'transparent', 'stroke-width':20, class:'child-hit-line'
  }));

  // Adjustable handle
  const handle = svgEl('circle', {
    cx: dropX, cy: bracketY, r: 5, fill: '#6366f1', class: 'child-attach-handle', 'data-child-id': childLink.id
  });
  handle.style.cursor = 'ew-resize';
  g.appendChild(handle);

  return g;
}

/* ══════════════════════════════════════════════════════════
   EMOTIONAL EDGE — direct styled line between two people
   ══════════════════════════════════════════════════════════ */
export function createEmotionalEdge(el, src, tgt) {
  const g = svgEl('g'); g.classList.add('geno-edge','geno-edge--emotional');
  g.setAttribute('data-emo-id', el.id);
  const s = EMOTIONAL_STYLES[el.relationType] || EMOTIONAL_STYLES.close;

  const x1=src.x, y1=src.y, x2=tgt.x, y2=tgt.y;
  const mx=(x1+x2)/2, my=(y1+y2)/2;
  const dx=x2-x1, dy=y2-y1;
  const len = Math.sqrt(dx*dx+dy*dy) || 1;
  const nx=-dy/len, ny=dx/len; // perpendicular
  const linesCount = s.lines || 1;

  for (let li = 0; li < linesCount; li++) {
    const off = (li-(linesCount-1)/2) * 4;
    const ox1=x1+nx*off, oy1=y1+ny*off, ox2=x2+nx*off, oy2=y2+ny*off;

    if (s.zigzag) {
      const step = s.dense ? 8 : 12;
      const amp = s.dense ? 6 : 5;
      let d = `M ${ox1} ${oy1}`;
      const segments = Math.max(Math.floor(len/step), 2);
      for (let i = 1; i <= segments; i++) {
        const t = i/segments;
        const px = ox1+dx*t, py = oy1+dy*t;
        const side = i%2===0 ? amp : -amp;
        d += ` L ${px+nx*side} ${py+ny*side}`;
      }
      d += ` L ${ox2} ${oy2}`;
      g.appendChild(svgEl('path',{d,fill:'none',stroke:s.stroke,'stroke-width':s.w,'stroke-linecap':'round'}));
    } else if (s.wavy) {
      const step = s.dense ? 12 : 16;
      const amp = 6;
      let d = `M ${ox1} ${oy1}`;
      const segments = Math.max(Math.floor(len/step), 2);
      let side = 1;
      for (let i = 1; i <= segments; i++) {
        const t = i/segments;
        const px = ox1+dx*t, py = oy1+dy*t;
        const ct = (i-0.5)/segments;
        const cx = ox1+dx*ct+nx*amp*side, cy = oy1+dy*ct+ny*amp*side;
        d += ` Q ${cx} ${cy} ${px} ${py}`;
        side = -side;
      }
      g.appendChild(svgEl('path',{d,fill:'none',stroke:s.stroke,'stroke-width':s.w,'stroke-linecap':'round'}));
    } else {
      const line = svgEl('line',{x1:ox1,y1:oy1,x2:ox2,y2:oy2,stroke:s.stroke,'stroke-width':s.w,'stroke-linecap':'round'});
      if (s.dash) line.setAttribute('stroke-dasharray',s.dash);
      g.appendChild(line);
    }
  }

  // Arrow
  if (s.arrow) {
    const ax = dx/len, ay = dy/len;
    const tip_x=x2-ax*(NODE_W/2+2), tip_y=y2-ay*(NODE_W/2+2);
    const p1x=tip_x-ax*8+nx*5, p1y=tip_y-ay*8+ny*5;
    const p2x=tip_x-ax*8-nx*5, p2y=tip_y-ay*8-ny*5;
    g.appendChild(svgEl('polygon',{points:`${tip_x},${tip_y} ${p1x},${p1y} ${p2x},${p2y}`,fill:s.stroke}));
  }
  // Bars
  if (s.bars) {
    g.appendChild(svgEl('line',{x1:mx+nx*7-ny*3,y1:my+ny*7+nx*3,x2:mx-nx*7-ny*3,y2:my-ny*7+nx*3,stroke:s.stroke,'stroke-width':'2.5'}));
    g.appendChild(svgEl('line',{x1:mx+nx*7+ny*3,y1:my+ny*7-nx*3,x2:mx-nx*7+ny*3,y2:my-ny*7-nx*3,stroke:s.stroke,'stroke-width':'2.5'}));
  }
  // Circle
  if (s.circle) {
    g.appendChild(svgEl('circle',{cx:mx,cy:my,r:5,fill:'none',stroke:s.stroke,'stroke-width':'1.5'}));
    if (s.double_circle) {
      g.appendChild(svgEl('circle',{cx:mx+dx/len*14,cy:my+dy/len*14,r:5,fill:'none',stroke:s.stroke,'stroke-width':'1.5'}));
    }
  }
  // X mark
  if (s.xmark) {
    g.appendChild(svgEl('line',{x1:mx-5,y1:my-5,x2:mx+5,y2:my+5,stroke:s.stroke,'stroke-width':'2.5'}));
    g.appendChild(svgEl('line',{x1:mx+5,y1:my-5,x2:mx-5,y2:my+5,stroke:s.stroke,'stroke-width':'2.5'}));
  }
  // Xbox
  if (s.xbox) {
    g.appendChild(svgEl('rect',{x:mx-6,y:my-6,width:12,height:12,fill:'none',stroke:s.stroke,'stroke-width':'1.5'}));
    g.appendChild(svgEl('line',{x1:mx-4,y1:my-4,x2:mx+4,y2:my+4,stroke:s.stroke,'stroke-width':'1.5'}));
    g.appendChild(svgEl('line',{x1:mx+4,y1:my-4,x2:mx-4,y2:my+4,stroke:s.stroke,'stroke-width':'1.5'}));
  }

  // Label
  const label = svgEl('text',{x:mx+nx*14,y:my+ny*14,'text-anchor':'middle'});
  label.classList.add('edge-label');
  label.textContent = window.t ? window.t(s.label) : s.label;
  g.appendChild(label);
  return g;
}
