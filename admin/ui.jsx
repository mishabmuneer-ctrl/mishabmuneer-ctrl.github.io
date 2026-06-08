/* ============================================================
   PLANYET — Enquiry Dashboard · UI PRIMITIVES
   Icons, auth gate, status pill, source tag, avatar, modal, toast.
   ============================================================ */
const { statusMeta, sourceMeta, avatarColor, initials, STATUSES, CONFIG, login, currentUser } = window.PlanyetData;

/* ---------- thin-line icons (1.6px, round caps) ---------- */
const ICONS = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.3-4.3',
  plus: 'M12 5v14M5 12h14',
  refresh: 'M20 11A8 8 0 0 0 6.3 6.3L4 8.5M4 4v4.5H8.5M4 13a8 8 0 0 0 13.7 4.7L20 15.5M20 20v-4.5h-4.5',
  close: 'M6 6l12 12M18 6 6 18',
  phone: 'M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5L15.5 12l4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  table: 'M4 6h16M4 12h16M4 18h16',
  board: 'M5 4h4v16H5zM15 4h4v9h-4z',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  check: 'M4 12l5 5L20 6',
  trash: 'M5 7h14M9 7V5h6v2M6 7l1 13h10l1-13',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
};
function Icon({ name, style }) {
  const wa = name === 'whatsapp';
  return (
    <svg viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true">
      {wa
        ? <path d="M12 3a9 9 0 0 0-7.7 13.65L3 21l4.5-1.2A9 9 0 1 0 12 3Z M8.5 8.2c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4-.1.5l-.5.6c-.1.1-.2.3-.1.5a5 5 0 0 0 2.4 2.4c.2.1.4 0 .5-.1l.6-.6c.1-.1.3-.2.5-.1l1.6.7c.4.2.4.4.4.6v.5c0 .3-.3.6-.6.7-.4.2-1 .3-2.4-.2a8 8 0 0 1-4.5-4.5c-.5-1.4-.4-2 .3-2.9Z"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        : <path d={ICONS[name]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

/* ============================================================
   AUTH GATE
   ============================================================ */
const AUTH_KEY = 'planyet_admin_unlocked';
function AuthGate({ children }) {
  const [user, setUser] = React.useState(() => currentUser());
  const [u, setU] = React.useState('');
  const [p, setP] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef(null);
  React.useEffect(() => { if (!user && inputRef.current) inputRef.current.focus(); }, [user]);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr('');
    const name = await login(u, p);
    setBusy(false);
    if (name) { setUser(name); }
    else { setErr('That username or password didn’t match.'); setP(''); }
  }
  if (user) return children;
  return (
    <div className="auth">
      <div className="auth-card">
        <img className="auth-logo" src="assets/planyet-logo-red.png" alt="Planyet" />
        <span className="lbl auth-eyebrow" style={{ color: 'var(--red)' }}>Studio access</span>
        <h1>Enquiry desk</h1>
        <p>Sign in with your studio login to view and manage enquiries.</p>
        <form className="auth-form" onSubmit={submit}>
          <input ref={inputRef} className="auth-input auth-user" type="text"
                 autoCapitalize="none" autoCorrect="off" spellCheck="false" placeholder="Username"
                 value={u} onChange={(e) => { setU(e.target.value); setErr(''); }} />
          <input className="auth-input" type="password" placeholder="Password"
                 value={p} onChange={(e) => { setP(e.target.value); setErr(''); }} />
          <div className="auth-err">{err}</div>
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ justifyContent: 'center', padding: '13px', opacity: busy ? 0.75 : 1 }}>
            {busy ? 'Signing in…' : <React.Fragment>Sign in <Icon name="arrowRight" style={{ width: 16, height: 16 }} /></React.Fragment>}
          </button>
        </form>
        <p className="auth-note">This is a private studio tool. Keep your login within the team.</p>
      </div>
    </div>
  );
}

/* ============================================================
   STATUS PILL (read-only or editable dropdown)
   ============================================================ */
function StatusPill({ status, onChange, size }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const m = statusMeta(status);
  React.useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  const pill = (
    <span className={'pill' + (onChange ? ' pill-btn' : '')}
          style={{ background: m.tint, color: m.color, borderColor: onChange ? m.color + '33' : 'transparent' }}
          onClick={onChange ? (e) => { e.stopPropagation(); setOpen(o => !o); } : undefined}>
      <span className="sw" style={{ background: m.color }}></span>{status}
    </span>
  );
  if (!onChange) return pill;
  return (
    <span className="pill-select" ref={ref}>
      {pill}
      {open && (
        <div className="pill-menu" onClick={(e) => e.stopPropagation()}>
          {STATUSES.map(s => (
            <div key={s.name} className={'pill-opt' + (s.name === status ? ' sel' : '')}
                 onClick={() => { onChange(s.name); setOpen(false); }}>
              <span className="sw" style={{ background: s.color }}></span>{s.name}
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

/* ============================================================
   SOURCE TAG · AVATAR
   ============================================================ */
function SourceTag({ source }) {
  const m = sourceMeta(source);
  return <span className="src"><span className="sd" style={{ background: m.color }}></span>{source}</span>;
}
function Avatar({ name, size }) {
  const un = !name || name === 'Unassigned';
  return (
    <span className={'ava' + (size === 'sm' ? ' sm' : '') + (un ? ' unassigned' : '')}
          style={un ? {} : { background: avatarColor(name) }} title={name || 'Unassigned'}>
      {initials(name)}
    </span>
  );
}

/* ============================================================
   MODAL SHELL
   ============================================================ */
function Modal({ children, onClose, eyebrow, title }) {
  React.useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, []);
  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            {eyebrow && <span className="eyebrow-sm">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   TOAST
   ============================================================ */
let _toastTimer;
function useToast() {
  const [msg, setMsg] = React.useState('');
  const [show, setShow] = React.useState(false);
  const fire = React.useCallback((m) => {
    setMsg(m); setShow(true);
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => setShow(false), 2400);
  }, []);
  const node = (
    <div className={'toast' + (show ? ' show' : '')}>
      <Icon name="check" />{msg}
    </div>
  );
  return [node, fire];
}

Object.assign(window, {
  Icon, AuthGate, StatusPill, SourceTag, Avatar, Modal, useToast,
});
