/* ============================================================
   PLANYET — Enquiry Dashboard · VIEWS
   EnquiryForm (add/edit) · DetailDrawer · TableView · BoardView
   ============================================================ */
const PD = window.PlanyetData;

/* ============================================================
   ENQUIRY FORM (add / edit)  — rendered inside <Modal>
   ============================================================ */
function EnquiryForm({ initial, onClose, onSaved }) {
  const editing = !!initial;
  const [f, setF] = React.useState(() => ({
    name: '', mobile: '', email: '', source: 'Phone call', experience: '',
    eventDate: '', city: '', budget: '', value: '', assignee: 'Unassigned',
    status: 'New', notes: '', ...(initial || {}),
  }));
  const [flexible, setFlexible] = React.useState(initial ? initial.eventDate === 'Flexible' : false);
  const [err, setErr] = React.useState({});
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));

  function save() {
    const e = {
      name: !f.name.trim(),
      mobile: !(String(f.mobile).length === 10 && /^\d+$/.test(f.mobile)),
      source: !f.source,
      experience: !f.experience,
    };
    setErr(e);
    if (e.name || e.mobile || e.source || e.experience) return;
    const payload = { ...f, value: Number(f.value) || 0, eventDate: flexible ? 'Flexible' : f.eventDate };
    if (editing) { PD.updateEnquiry(initial.id, payload); onSaved('Enquiry updated', { ...initial, ...payload }); }
    else { const rec = PD.addEnquiry(payload); onSaved('Enquiry ' + rec.id + ' added', rec); }
    onClose();
  }

  const sel = (k, opts, ph) => (
    <select className="adm-select" value={f[k]} onChange={set(k)}
            style={err[k] ? { borderColor: 'var(--red)' } : undefined}>
      {ph && <option value="">{ph}</option>}
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <Modal onClose={onClose} eyebrow={editing ? 'Edit · ' + initial.id : 'New enquiry'}
           title={editing ? 'Edit enquiry' : 'Add an enquiry'}>
      <div className="modal-body">
        <div className="modal-grid">
          <div className="mf">
            <label>Name <span className="req">*</span></label>
            <input className="adm-input" placeholder="e.g. Rohan Mehta" value={f.name} onChange={set('name')}
                   style={err.name ? { borderColor: 'var(--red)' } : undefined} />
          </div>
          <div className="mf">
            <label>Mobile <span className="req">*</span></label>
            <input className="adm-input" placeholder="9876543210" maxLength="10" value={f.mobile}
                   onChange={(e) => setF(s => ({ ...s, mobile: e.target.value.replace(/\D/g, '') }))}
                   style={err.mobile ? { borderColor: 'var(--red)' } : undefined} />
            {err.mobile && <span className="err-txt">Enter a valid 10-digit number</span>}
          </div>

          <div className="mf">
            <label>Source <span className="req">*</span></label>
            {sel('source', PD.SOURCES.map(s => s.name))}
          </div>
          <div className="mf">
            <label>Experience <span className="req">*</span></label>
            {sel('experience', PD.EXPERIENCES, 'Select…')}
          </div>

          <div className="mf full">
            <label>Event date</label>
            <input className="adm-input" type="date" value={flexible ? '' : f.eventDate} disabled={flexible}
                   style={{ color: (flexible || !f.eventDate) ? 'var(--placeholder)' : 'var(--ink)' }}
                   onChange={set('eventDate')} />
            <label className="adm-check" style={{ marginTop: 4 }}>
              <input type="checkbox" checked={flexible} onChange={(e) => setFlexible(e.target.checked)} />
              <span className="box"><Icon name="check" /></span>
              <span>Flexible on dates</span>
            </label>
          </div>

          <div className="mf">
            <label>City</label>
            <input className="adm-input" placeholder="e.g. Bangalore" value={f.city} onChange={set('city')} />
          </div>
          <div className="mf">
            <label>Budget range</label>
            {sel('budget', PD.BUDGETS, 'Select…')}
          </div>

          <div className="mf">
            <label>Value <span className="hint">(₹, est. or final)</span></label>
            <input className="adm-input" type="number" min="0" placeholder="0" value={f.value} onChange={set('value')} />
          </div>
          <div className="mf">
            <label>Assigned to</label>
            {sel('assignee', ['Unassigned', ...PD.getTeam()])}
          </div>

          <div className="mf">
            <label>Status</label>
            {sel('status', PD.STATUSES.map(s => s.name))}
          </div>
          <div className="mf">
            <label>Email <span className="hint">(optional)</span></label>
            <input className="adm-input" type="email" placeholder="name@email.com" value={f.email} onChange={set('email')} />
          </div>

          <div className="mf full">
            <label>Notes</label>
            <textarea className="adm-textarea" rows="3" placeholder="What they're dreaming of, context, preferences…"
                      value={f.notes} onChange={set('notes')} />
          </div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>
          {editing ? 'Save changes' : 'Add enquiry'} <Icon name="check" style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </Modal>
  );
}

/* ============================================================
   DETAIL DRAWER
   ============================================================ */
function Field({ label, children, full }) {
  return (
    <div className={'dr-field' + (full ? ' full' : '')}>
      <span className="lbl">{label}</span>
      <span className="v">{children}</span>
    </div>
  );
}
function DetailDrawer({ rec, onClose, onEdit, toast }) {
  const [note, setNote] = React.useState('');
  const [noteAuthor, setNoteAuthor] = React.useState(PD.currentUser() || PD.getTeam()[0] || 'Team');
  if (!rec) return null;
  const waHref = 'https://wa.me/91' + rec.mobile + '?text=' + encodeURIComponent('Hi ' + rec.name.split(' ')[0] + ', this is Planyet 👋');
  const patch = (p) => PD.updateEnquiry(rec.id, p);

  function submitNote() {
    if (!note.trim()) return;
    PD.addNote(rec.id, note.trim(), noteAuthor);
    setNote(''); toast('Note added');
  }
  function del() {
    if (confirm('Delete enquiry ' + rec.id + '? This can’t be undone.')) {
      PD.deleteEnquiry(rec.id); onClose(); toast('Enquiry deleted');
    }
  }
  const log = [...(rec.log || [])].reverse();

  return (
    <React.Fragment>
      <div className="scrim" onClick={onClose}></div>
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <button className="drawer-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
          <span className="en">{rec.id}</span>
          <h2>{rec.name}</h2>
          <div className="exp">{rec.experience}{rec.city ? ' · ' + rec.city : ''}</div>
          <div className="drawer-actions">
            <a className="dr-act" href={waHref} target="_blank" rel="noopener"><Icon name="whatsapp" /> WhatsApp</a>
            <a className="dr-act" href={'tel:+91' + rec.mobile}><Icon name="phone" /> Call</a>
            {rec.email && <a className="dr-act" href={'mailto:' + rec.email}><Icon name="mail" /> Email</a>}
          </div>
        </div>

        <div className="drawer-body">
          {/* editable pipeline row */}
          <div className="dr-inline">
            <div className="dr-field">
              <span className="lbl">Status</span>
              <select className="adm-select" value={rec.status} onChange={(e) => PD.setStatus(rec.id, e.target.value)}>
                {PD.STATUSES.map(s => <option key={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="dr-field">
              <span className="lbl">Assigned to</span>
              <select className="adm-select" value={rec.assignee} onChange={(e) => patch({ assignee: e.target.value })}>
                {['Unassigned', ...PD.getTeam()].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="dr-field">
              <span className="lbl">Value (₹)</span>
              <input className="adm-input" type="number" min="0" value={rec.value || ''}
                     onChange={(e) => patch({ value: Number(e.target.value) || 0 })} />
            </div>
            <div className="dr-field">
              <span className="lbl">Next follow-up</span>
              <input className="adm-input" type="date" value={rec.followUp || ''}
                     style={{ color: rec.followUp ? 'var(--ink)' : 'var(--placeholder)' }}
                     onChange={(e) => patch({ followUp: e.target.value })} />
            </div>
          </div>

          <div className="dr-sect-title">Details</div>
          <div className="dr-grid">
            <Field label="Mobile">{rec.mobile || '—'}</Field>
            <Field label="Source"><SourceTag source={rec.source} /></Field>
            <Field label="Event date">{PD.fmtDate(rec.eventDate)}</Field>
            <Field label="Budget">{rec.budget || '—'}</Field>
            <Field label="City">{rec.city || '—'}</Field>
            <Field label="Received">{PD.fmtDateTime(rec.createdAt)}</Field>
            {rec.notes && <div className="dr-field full"><span className="lbl">Brief</span>
              <span className="v muted" style={{ lineHeight: 1.55 }}>{rec.notes}</span></div>}
          </div>

          <div className="dr-sect-title">Follow-up log</div>
          <div className="log">
            {log.length === 0 && <p className="td-muted" style={{ fontSize: 13, margin: '0 0 6px' }}>No notes yet.</p>}
            {log.map((n, i) => (
              <div className="note" key={i}>
                <span className="note-dot"></span>
                <div className="note-body">
                  <p>{n.text}</p>
                  <div className="note-meta">{n.author} · {PD.fmtDateTime(n.ts)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="note-add">
            <textarea className="adm-textarea" placeholder="Log a call, a message sent, a decision…"
                      value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="note-add-row">
              <select className="adm-select" style={{ maxWidth: 130 }} value={noteAuthor}
                      onChange={(e) => setNoteAuthor(e.target.value)}>
                {PD.getTeam().map(a => <option key={a}>{a}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={submitNote}>Add note</button>
            </div>
          </div>

          <div className="dr-danger">
            <button className="btn btn-ghost btn-sm" onClick={onEdit}><Icon name="edit" /> Edit details</button>
            <button className="link-danger" style={{ marginLeft: 12 }} onClick={del}><Icon name="trash" /> Delete</button>
          </div>
        </div>
      </aside>
    </React.Fragment>
  );
}

/* ============================================================
   FOLLOW-UP CELL
   ============================================================ */
function FollowUp({ date }) {
  const d = PD.daysUntil(date);
  if (date === 'Flexible') return <span className="td-muted">Flexible</span>;
  if (d === null) return <span className="fu-none">—</span>;
  const cls = d <= 3 ? 'fu-soon' : '';
  const label = d < 0 ? 'Overdue' : d === 0 ? 'Today' : PD.fmtDate(date);
  return <span className={cls}>{label}</span>;
}

/* ============================================================
   TABLE VIEW
   ============================================================ */
function TableView({ list, onOpen }) {
  const [sort, setSort] = React.useState({ key: 'id', dir: 'desc' });
  const sorted = React.useMemo(() => {
    const arr = [...list];
    const { key, dir } = sort; const s = dir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let av = a[key], bv = b[key];
      if (key === 'value') return (av - bv) * s;
      if (key === 'eventDate' || key === 'followUp' || key === 'createdAt')
        return ((new Date(av) || 0) - (new Date(bv) || 0)) * s;
      return String(av).localeCompare(String(bv)) * s;
    });
    return arr;
  }, [list, sort]);

  const th = (key, label, extra) => (
    <th className={'sortable ' + (extra || '')} onClick={() => setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))}>
      {label}{sort.key === key && <span className="arr">{sort.dir === 'desc' ? '▼' : '▲'}</span>}
    </th>
  );

  if (!list.length) return <Empty />;
  return (
    <div className="table-wrap">
      <div className="table-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              {th('id', 'No.')}
              {th('name', 'Customer')}
              {th('experience', 'Experience')}
              {th('eventDate', 'Event')}
              {th('value', 'Value')}
              <th>Source</th>
              <th>Owner</th>
              {th('status', 'Status')}
              {th('followUp', 'Follow-up')}
              <th className="td-actions">Contact</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(e => (
              <tr key={e.id} onClick={() => onOpen(e)}>
                <td className="td-en">{e.id}</td>
                <td className="td-name">{e.name}<span className="ph mono">{e.mobile}</span></td>
                <td className="td-sub">{e.experience}<div className="td-muted" style={{ fontSize: 11.5 }}>{e.city}</div></td>
                <td className="td-muted">{PD.fmtDate(e.eventDate)}</td>
                <td className="td-val">{PD.fmtMoney(e.value)}</td>
                <td><SourceTag source={e.source} /></td>
                <td><span className="assignee-cell"><Avatar name={e.assignee} size="sm" />{e.assignee !== 'Unassigned' ? e.assignee : ''}</span></td>
                <td onClick={(ev) => ev.stopPropagation()}>
                  <StatusPill status={e.status} onChange={(v) => PD.setStatus(e.id, v)} />
                </td>
                <td><FollowUp date={e.followUp} /></td>
                <td className="td-actions" onClick={(ev) => ev.stopPropagation()}>
                  <span className="row-acts">
                    <a className="mini wa" href={'https://wa.me/91' + e.mobile} target="_blank" rel="noopener" title="WhatsApp"><Icon name="whatsapp" /></a>
                    <a className="mini" href={'tel:+91' + e.mobile} title="Call"><Icon name="phone" /></a>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Empty() {
  return <div className="table-wrap"><div className="empty"><div className="num">0</div><p>No enquiries match your filters.</p></div></div>;
}

/* ============================================================
   BOARD VIEW (Kanban, drag to change status)
   ============================================================ */
function BoardView({ list, onOpen }) {
  const [dragId, setDragId] = React.useState(null);
  const [over, setOver] = React.useState(null);

  function drop(status) {
    if (dragId) { PD.setStatus(dragId, status); }
    setDragId(null); setOver(null);
  }
  return (
    <div className="board">
      {PD.STATUSES.map(col => {
        const items = list.filter(e => e.status === col.name);
        return (
          <div key={col.name}
               className={'bcol' + (over === col.name ? ' dragover' : '')}
               onDragOver={(e) => { e.preventDefault(); setOver(col.name); }}
               onDragLeave={(e) => { if (e.currentTarget === e.target) setOver(null); }}
               onDrop={() => drop(col.name)}>
            <div className="bcol-head">
              <span className="sw" style={{ background: col.color }}></span>
              <span className="t">{col.name}</span>
              <span className="cnt">{items.length}</span>
            </div>
            <div className="bcol-body">
              {items.map(e => (
                <div key={e.id} className={'bcard' + (dragId === e.id ? ' dragging' : '')}
                     draggable onClick={() => onOpen(e)}
                     onDragStart={() => setDragId(e.id)} onDragEnd={() => { setDragId(null); setOver(null); }}>
                  <div className="bcard-top">
                    <span className="bcard-en">{e.id}</span>
                    <SourceTag source={e.source} />
                  </div>
                  <div className="bcard-name">{e.name}</div>
                  <div className="bcard-exp">{e.experience}{e.city ? ' · ' + e.city : ''}</div>
                  <div className="bcard-meta">
                    <span className="bcard-val">{PD.fmtMoney(e.value)}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {e.followUp && e.followUp !== 'Flexible' &&
                        <span className="bcard-fu"><Icon name="calendar" style={{ width: 13, height: 13 }} />{PD.fmtDate(e.followUp)}</span>}
                      <Avatar name={e.assignee} size="sm" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { EnquiryForm, DetailDrawer, TableView, BoardView });
