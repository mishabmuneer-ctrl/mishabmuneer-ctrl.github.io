/* ============================================================
   PLANYET — Enquiry Dashboard · DATA LAYER
   Store + constants + Google-Sheet (live) / localStorage (local) sync.
   ============================================================ */

/* ============================================================
   ░░ CONFIG — edit these ░░
   ------------------------------------------------------------
   endpoint : your Google Apps Script Web App /exec URL. Leave '' to
              run fully in the browser (demo / local mode).
   team     : fallback assignee names, used before the live "Team"
              sheet loads (and in demo mode). NOT secret — just names.
   ============================================================ */
const CONFIG = {
  endpoint: 'https://script.google.com/macros/s/AKfycby8TRo7eLrbEsEgT38kvEGnLqT_msSbihhhXK73kqV8HLJH6IPfDLN1cxq2a8nszdFE/exec',  // same Google Sheet web app as the website form
  team: ['Mishab', 'Bezeem', 'Irfan','Rohan'], // fallback only; the live list comes from the restricted "Team" sheet
  currency: '₹',
};

/* ----------------------------------------------------------------
   LOGINS LIVE IN THE GOOGLE SHEET, NOT IN THIS FILE.
   Usernames + passwords are stored in a separate, access-restricted
   "Team" sheet and checked by the Apps Script server-side — so they
   are never visible in this public file. Edit people in that sheet.

   DEMO_USERS below is ONLY used when endpoint is '' (offline preview).
   It contains no real credentials. */
const DEMO_USERS = [
  { name: 'Demo', user: 'demo', pass: 'demo' },
];

/* ---------- auth (per-person login, validated by the Sheet) ---------- */
const SESS_USER = 'planyet_admin_user';
async function login(user, pass) {
  user = String(user || '').trim();
  pass = String(pass || '');
  if (CONFIG.endpoint) {
    try {
      const r = await jsonpFetch(CONFIG.endpoint, { action: 'login', user, pass });
      if (r && r.ok && r.name) { sessionStorage.setItem(SESS_USER, r.name); return r.name; }
      return null;
    } catch (e) { return null; }
  }
  // offline / demo fallback (no endpoint configured)
  const u = DEMO_USERS.find(x => x.user === user.toLowerCase() && x.pass === pass);
  if (u) { sessionStorage.setItem(SESS_USER, u.name); return u.name; }
  return null;
}
function currentUser() { return sessionStorage.getItem(SESS_USER) || ''; }
function logout() { sessionStorage.removeItem(SESS_USER); }
function getTeam() { return (_state.team && _state.team.length) ? _state.team : CONFIG.team; }

/* ---------- pipeline statuses (order = board columns) ---------- */
const STATUSES = [
  { name: 'New',               color: '#E8473F', tint: '#FDEBE9' },
  { name: 'Contacted',         color: '#C98A2B', tint: '#FAF1DF' },
  { name: 'In planning',       color: '#3F6DA8', tint: '#E8EFF8' },
  { name: 'Quote sent',        color: '#7A55A6', tint: '#F0EAF7' },
  { name: 'Confirmed / Won',   color: '#2E7D5B', tint: '#E4F2EB' },
  { name: 'Lost / Cancelled',  color: '#8A7570', tint: '#EFE9E6' },
];
const OPEN_STATUSES = ['New', 'Contacted', 'In planning', 'Quote sent'];

/* ---------- where an enquiry came from ---------- */
const SOURCES = [
  { name: 'Website form',  color: '#3F6DA8' },
  { name: 'Phone call',    color: '#2E7D5B' },
  { name: 'WhatsApp',      color: '#1DA851' },
  { name: 'Email',         color: '#5A6B7A' },
  { name: 'Instagram DM',  color: '#C13584' },
];

const EXPERIENCES = [
  'Romantic date', 'Anniversary celebration', 'Proposal setup',
  'Bachelor / bachelorette party', 'Birthday celebration',
  'Festive celebration', 'Friends get-together', 'Corporate event',
  'Destination event', 'Staycation', 'Weekend getaway',
  'Strangers meetup / camping', 'Other',
];
const BUDGETS = [
  'Under ₹10,000', '₹10,000 – ₹25,000', '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000', '₹1,00,000+', 'Not sure yet',
];

const statusMeta = (n) => STATUSES.find(s => s.name === n) || STATUSES[0];
const sourceMeta = (n) => SOURCES.find(s => s.name === n) || { name: n || '—', color: '#8A7570' };

/* ============================================================
   HELPERS
   ============================================================ */
function pad6(n) { return String(n).padStart(6, '0'); }
function enFmt(n) { return 'EN' + pad6(n); }
function enNum(id) { const m = /(\d+)/.exec(id || ''); return m ? parseInt(m[1], 10) : 0; }
function nextEn(list) {
  const max = list.reduce((m, e) => Math.max(m, enNum(e.id)), 0);
  return enFmt(max + 1);
}
function uid() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function fmtMoney(n) {
  if (n === '' || n === null || n === undefined || isNaN(Number(n)) || Number(n) === 0) return '—';
  return CONFIG.currency + Number(n).toLocaleString('en-IN');
}
function fmtDate(d) {
  if (!d) return '—';
  if (d === 'Flexible' || d === 'flexible') return 'Flexible';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d) {
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' · ' +
         dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function daysUntil(d) {
  if (!d || d === 'Flexible') return null;
  const dt = new Date(d); if (isNaN(dt)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((dt - today) / 86400000);
}
const AVA_COLORS = ['#E8473F', '#C98A2B', '#3F6DA8', '#7A55A6', '#2E7D5B', '#B5546E'];
function avatarColor(name) {
  if (!name || name === 'Unassigned') return '#C0AEAA';
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVA_COLORS[Math.abs(h) % AVA_COLORS.length];
}
function initials(name) {
  if (!name || name === 'Unassigned') return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/* ============================================================
   SEED DATA (used in local mode / as fallback)
   ============================================================ */
function iso(daysAgo) { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString(); }
function eventDate(daysAhead) { const d = new Date(); d.setDate(d.getDate() + daysAhead); return d.toISOString().slice(0, 10); }

const SEED = [
  { id: 'EN000001', createdAt: iso(1), name: 'Rohan Mehta', mobile: '9876543210', email: '', experience: 'Proposal setup', eventDate: eventDate(12), city: 'Bangalore', budget: '₹50,000 – ₹1,00,000', value: 85000, source: 'Website form', status: 'New', assignee: 'Unassigned', followUp: eventDate(1), notes: 'She loves the beach and sunsets. Wants it to be a surprise.', log: [] },
  { id: 'EN000002', createdAt: iso(2), name: 'Ananya Iyer', mobile: '9123456780', email: 'ananya@example.com', experience: 'Anniversary celebration', eventDate: eventDate(20), city: 'Mumbai', budget: '₹25,000 – ₹50,000', value: 42000, source: 'WhatsApp', status: 'Contacted', assignee: 'Aysha', followUp: eventDate(2), notes: '', log: [{ ts: iso(1), author: 'Aysha', text: 'Called — keen on a rooftop dinner. Sending two concepts tomorrow.' }] },
  { id: 'EN000003', createdAt: iso(3), name: 'Vikram & Priya', mobile: '9988776655', email: '', experience: 'Destination event', eventDate: eventDate(55), city: 'Goa', budget: '₹1,00,000+', value: 240000, source: 'Phone call', status: 'In planning', assignee: 'Mishab', followUp: eventDate(4), notes: '40 guests, 2-day itinerary.', log: [{ ts: iso(2), author: 'Mishab', text: 'Venue shortlist shared. Awaiting confirmation on dates.' }, { ts: iso(0), author: 'Mishab', text: 'Priya prefers the villa over the resort.' }] },
  { id: 'EN000004', createdAt: iso(4), name: 'Sneha Kapoor', mobile: '9001122334', email: '', experience: 'Birthday celebration', eventDate: eventDate(9), city: 'Pune', budget: '₹10,000 – ₹25,000', value: 22000, source: 'Instagram DM', status: 'Quote sent', assignee: 'Aysha', followUp: eventDate(1), notes: 'Surprise 30th. Theme: retro.', log: [{ ts: iso(1), author: 'Aysha', text: 'Quote ₹22k sent. Following up Monday.' }] },
  { id: 'EN000005', createdAt: iso(6), name: 'Arjun Nair', mobile: '9445566778', email: 'arjun.n@example.com', experience: 'Corporate event', eventDate: eventDate(30), city: 'Bangalore', budget: '₹1,00,000+', value: 320000, source: 'Website form', status: 'In planning', assignee: 'Mishab', followUp: eventDate(3), notes: 'Team offsite, ~60 pax.', log: [] },
  { id: 'EN000006', createdAt: iso(8), name: 'Meera Joshi', mobile: '9332211009', email: '', experience: 'Romantic date', eventDate: eventDate(5), city: 'Hyderabad', budget: '₹25,000 – ₹50,000', value: 38000, source: 'WhatsApp', status: 'Confirmed / Won', assignee: 'Aysha', followUp: '', notes: 'Candlelight terrace dinner, anniversary.', log: [{ ts: iso(5), author: 'Aysha', text: 'Confirmed & advance received. Locking vendor.' }] },
  { id: 'EN000007', createdAt: iso(10), name: 'Karthik Reddy', mobile: '9776655443', email: '', experience: 'Friends get-together', eventDate: 'Flexible', city: 'Chennai', budget: 'Not sure yet', value: 0, source: 'Phone call', status: 'Lost / Cancelled', assignee: 'Rahul', followUp: '', notes: '', log: [{ ts: iso(7), author: 'Rahul', text: 'Went with a cheaper option. Mark lost.' }] },
  { id: 'EN000008', createdAt: iso(0), name: 'Divya Sharma', mobile: '9665544332', email: '', experience: 'Bachelor / bachelorette party', eventDate: eventDate(40), city: 'Goa', budget: '₹50,000 – ₹1,00,000', value: 0, source: 'Website form', status: 'New', assignee: 'Unassigned', followUp: eventDate(0), notes: '8 girls, 3 days. Wants a yacht afternoon.', log: [] },
  { id: 'EN000009', createdAt: iso(5), name: 'Aditya Verma', mobile: '9554433221', email: '', experience: 'Anniversary celebration', eventDate: eventDate(16), city: 'Delhi', budget: '₹25,000 – ₹50,000', value: 46000, source: 'Instagram DM', status: 'Contacted', assignee: 'Mishab', followUp: eventDate(2), notes: '25th anniversary for parents.', log: [{ ts: iso(3), author: 'Mishab', text: 'Shared mood board. Loves the garden setup.' }] },
  { id: 'EN000010', createdAt: iso(13), name: 'Ishaan & Tara', mobile: '9443322110', email: '', experience: 'Proposal setup', eventDate: eventDate(2), city: 'Bangalore', budget: '₹50,000 – ₹1,00,000', value: 72000, source: 'WhatsApp', status: 'Confirmed / Won', assignee: 'Aysha', followUp: eventDate(1), notes: 'Rooftop, string quartet, this Saturday.', log: [{ ts: iso(10), author: 'Aysha', text: 'Booked. Final walkthrough Friday.' }] },
  { id: 'EN000011', createdAt: iso(7), name: 'Pooja Menon', mobile: '9332244556', email: '', experience: 'Staycation', eventDate: eventDate(25), city: 'Kochi', budget: '₹10,000 – ₹25,000', value: 0, source: 'Website form', status: 'New', assignee: 'Unassigned', followUp: eventDate(-1), notes: '', log: [] },
  { id: 'EN000012', createdAt: iso(9), name: 'Sameer Khan', mobile: '9112233445', email: '', experience: 'Weekend getaway', eventDate: eventDate(34), city: 'Mumbai', budget: '₹50,000 – ₹1,00,000', value: 60000, source: 'Phone call', status: 'Quote sent', assignee: 'Rahul', followUp: eventDate(3), notes: 'Couple, hill station, pet-friendly stay.', log: [] },
];

/* ============================================================
   STORE (module-level, with React subscription)
   ============================================================ */
const LS_KEY = 'planyet_enquiries_v1';
let _state = { list: [], team: CONFIG.team, sync: 'local', loading: true };
const _subs = new Set();
function _emit() { _subs.forEach(fn => fn(_state)); }
function _set(patch) { _state = { ..._state, ...patch }; _emit(); }

function _loadLocal() {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return null;
}
function _saveLocal(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {} }

/* sort newest first */
function _sort(list) { return [...list].sort((a, b) => enNum(b.id) - enNum(a.id)); }

/* ---- JSONP read (works around Apps Script CORS for GET) ----
   params override the query — defaults to the enquiry list. */
function jsonpFetch(url, params) {
  return new Promise((resolve, reject) => {
    const cb = 'plycb_' + Math.random().toString(36).slice(2);
    let done = false;
    const cleanup = () => { delete window[cb]; if (s.parentNode) s.remove(); };
    window[cb] = (data) => { done = true; cleanup(); resolve(data); };
    const q = Object.assign({ action: 'list' }, params || {}, { callback: cb });
    const qs = Object.keys(q).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(q[k])).join('&');
    const s = document.createElement('script');
    s.src = url + (url.includes('?') ? '&' : '?') + qs;
    s.onerror = () => { cleanup(); reject(new Error('network')); };
    document.body.appendChild(s);
    setTimeout(() => { if (!done) { cleanup(); reject(new Error('timeout')); } }, 12000);
  });
}
/* ---- POST write (fire-and-forget; Apps Script needs no-cors) ---- */
function postWrite(payload) {
  if (!CONFIG.endpoint) return Promise.resolve();
  return fetch(CONFIG.endpoint, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

function normalize(raw) {
  return {
    id: raw.id || '', createdAt: raw.createdAt || raw.ts || new Date().toISOString(),
    name: raw.name || '', mobile: String(raw.mobile || raw.phone || ''), email: raw.email || '',
    experience: raw.experience || raw.exp || '', eventDate: raw.eventDate || raw.date || '',
    city: raw.city || '', budget: raw.budget || '', value: Number(raw.value || 0) || 0,
    source: raw.source || 'Website form', status: raw.status || 'New',
    assignee: raw.assignee || 'Unassigned', followUp: raw.followUp || '',
    notes: raw.notes || '', log: Array.isArray(raw.log) ? raw.log : (raw.log ? JSON.parse(raw.log) : []),
  };
}

async function refresh() {
  if (!CONFIG.endpoint) return;
  _set({ sync: 'syncing' });
  try {
    const data = await jsonpFetch(CONFIG.endpoint);
    const list = _sort((Array.isArray(data) ? data : (data.rows || [])).map(normalize));
    _saveLocal(list);
    _set({ list, sync: 'live', loading: false });
  } catch (e) {
    _set({ sync: 'error', loading: false });
  }
}

/* ---- pull the assignable team names from the restricted "Team" sheet ---- */
async function fetchTeam() {
  if (!CONFIG.endpoint) return;
  try {
    const data = await jsonpFetch(CONFIG.endpoint, { action: 'team' });
    const raw = Array.isArray(data) ? data : (data && data.team) || [];
    const names = raw.filter(x => typeof x === 'string' && x.trim());
    if (names.length) _set({ team: names });
  } catch (e) {}
}

function init() {
  const local = _loadLocal();
  if (CONFIG.endpoint) {
    // render instantly from cache (if any), then sync from the Sheet —
    // never block the desk on the network.
    if (local && local.length) _set({ list: _sort(local.map(normalize)), loading: false, sync: 'syncing' });
    else _set({ list: [], loading: false, sync: 'syncing' });
    refresh();
    fetchTeam();
  } else {
    const list = _sort((local && local.length ? local : SEED).map(normalize));
    _saveLocal(list);
    _set({ list, sync: 'local', loading: false });
  }
}

/* ---------- mutations (optimistic) ---------- */
function addEnquiry(data) {
  const rec = normalize({
    ...data,
    id: nextEn(_state.list),
    createdAt: new Date().toISOString(),
    log: [],
  });
  const list = _sort([rec, ..._state.list]);
  _set({ list }); _saveLocal(list);
  if (CONFIG.endpoint) { postWrite({ action: 'add', record: { ...rec, id: '' } }); setTimeout(refresh, 1600); }
  return rec;
}
function updateEnquiry(id, patch) {
  const list = _state.list.map(e => e.id === id ? { ...e, ...patch } : e);
  _set({ list }); _saveLocal(list);
  if (CONFIG.endpoint) postWrite({ action: 'update', id, patch });
}
/* moving an enquiry to another stage NEVER removes the record — it
   updates the status and writes the move into the history log, so the
   full trail of where an enquiry has been is always preserved. */
function setStatus(id, status) {
  const rec = _state.list.find(e => e.id === id);
  if (!rec || rec.status === status) return;
  const note = {
    ts: new Date().toISOString(),
    author: currentUser() || 'Team',
    text: 'Stage moved: ' + rec.status + ' \u2192 ' + status,
    kind: 'status',
  };
  const list = _state.list.map(e => e.id === id
    ? { ...e, status, log: [...(e.log || []), note] } : e);
  _set({ list }); _saveLocal(list);
  if (CONFIG.endpoint) {
    const r = list.find(e => e.id === id);
    postWrite({ action: 'update', id, patch: { status, log: r.log } });
  }
}
function addNote(id, text, author) {
  const note = { ts: new Date().toISOString(), author: author || 'Team', text };
  const list = _state.list.map(e => e.id === id ? { ...e, log: [...(e.log || []), note] } : e);
  _set({ list }); _saveLocal(list);
  if (CONFIG.endpoint) { const rec = list.find(e => e.id === id); postWrite({ action: 'update', id, patch: { log: rec.log } }); }
}
function deleteEnquiry(id) {
  const list = _state.list.filter(e => e.id !== id);
  _set({ list }); _saveLocal(list);
  if (CONFIG.endpoint) postWrite({ action: 'delete', id });
}
function resetDemo() { localStorage.removeItem(LS_KEY); init(); }

/* ---------- React hook ---------- */
function useEnquiries() {
  const [s, setS] = React.useState(_state);
  React.useEffect(() => {
    const fn = (st) => setS(st);
    _subs.add(fn);
    return () => _subs.delete(fn);
  }, []);
  return s;
}

/* ---------- CSV export ---------- */
function exportCSV(list) {
  const cols = ['id', 'createdAt', 'name', 'mobile', 'email', 'experience', 'eventDate', 'city', 'budget', 'value', 'source', 'status', 'assignee', 'followUp', 'notes'];
  const head = ['Enquiry No', 'Received', 'Name', 'Mobile', 'Email', 'Experience', 'Event date', 'City', 'Budget', 'Value', 'Source', 'Status', 'Assigned to', 'Follow-up', 'Notes'];
  const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = list.map(e => cols.map(c => esc(e[c])).join(','));
  const csv = [head.join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'planyet-enquiries-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click(); URL.revokeObjectURL(a.href);
}

init();

window.PlanyetData = {
  CONFIG, STATUSES, OPEN_STATUSES, SOURCES, EXPERIENCES, BUDGETS,
  statusMeta, sourceMeta, fmtMoney, fmtDate, fmtDateTime, daysUntil,
  avatarColor, initials, enFmt,
  login, currentUser, logout, getTeam,
  useEnquiries, addEnquiry, updateEnquiry, setStatus, addNote, deleteEnquiry, refresh, resetDemo, exportCSV,
};
