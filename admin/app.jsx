/* ============================================================
   PLANYET — Enquiry Dashboard · APP SHELL
   Topbar · summary · toolbar · filters · view switch · drawer · modal
   ============================================================ */
function Dashboard() {
  const { list, sync, loading } = PD.useEnquiries();
  const me = PD.currentUser();
  const [toastNode, toast] = useToast();

  const [view, setView] = React.useState(() => localStorage.getItem('planyet_admin_view') || 'table');
  const [query, setQuery] = React.useState('');
  const [statusF, setStatusF] = React.useState('All');
  const [sourceF, setSourceF] = React.useState('All');
  const [ownerF, setOwnerF] = React.useState('All');
  const [openId, setOpenId] = React.useState(null);
  const [form, setForm] = React.useState(null); // {mode:'add'} | {mode:'edit', rec}

  React.useEffect(() => { localStorage.setItem('planyet_admin_view', view); }, [view]);

  const setViewSafe = (v) => setView(v);

  /* ---- filtering ---- */
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter(e => {
      if (sourceF !== 'All' && e.source !== sourceF) return false;
      if (ownerF !== 'All' && e.assignee !== ownerF) return false;
      if (view === 'table' && statusF !== 'All' && e.status !== statusF) return false;
      if (q) {
        const hay = [e.id, e.name, e.mobile, e.city, e.experience, e.assignee].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [list, query, statusF, sourceF, ownerF, view]);

  /* ---- summary ---- */
  const sum = React.useMemo(() => {
    const now = new Date(); const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const open = list.filter(e => PD.OPEN_STATUSES.includes(e.status));
    const wonMonth = list.filter(e => e.status === 'Confirmed / Won' && new Date(e.createdAt) >= mStart);
    const newCount = list.filter(e => e.status === 'New').length;
    const pipeline = open.reduce((s, e) => s + (Number(e.value) || 0), 0);
    return { total: list.length, newCount, open: open.length, wonMonth: wonMonth.length, pipeline };
  }, [list]);

  const statusCounts = React.useMemo(() => {
    const base = view === 'table'
      ? list.filter(e => (sourceF === 'All' || e.source === sourceF) && (ownerF === 'All' || e.assignee === ownerF))
      : list;
    const m = {}; PD.STATUSES.forEach(s => m[s.name] = 0);
    base.forEach(e => { if (m[e.status] != null) m[e.status]++; });
    return { all: base.length, m };
  }, [list, sourceF, ownerF, view]);

  const openRec = openId ? list.find(e => e.id === openId) : null;
  React.useEffect(() => { if (openId && !openRec) setOpenId(null); }, [openId, openRec]);

  const syncLabel = { live: 'Live · synced', syncing: 'Syncing…', local: 'Local (demo)', error: 'Offline — cached' }[sync] || 'Local';

  return (
    <div className="adm">
      {/* ---------- TOP BAR ---------- */}
      <header className="adm-top">
        <div className="adm-top-inner">
          <div className="adm-brand">
            <img className="adm-logo" src="assets/planyet-logo-red.png" alt="Planyet" />
            <span className="adm-brand-div"></span>
            <span className="adm-title">Enquiries<span className="dot">.</span></span>
          </div>
          <div className="adm-top-actions">
            <span className={'adm-sync ' + (sync === 'local' ? 'local' : sync === 'error' ? 'err' : '')}>
              <span className="pulse"></span>{syncLabel}
            </span>
            {PD.CONFIG.endpoint
              ? <button className={'icon-btn' + (sync === 'syncing' ? ' spin' : '')} title="Refresh" onClick={() => PD.refresh()}><Icon name="refresh" /></button>
              : <button className="btn btn-ghost btn-sm" title="Reset the demo data" onClick={() => { if (confirm('Reset demo data to the original sample set?')) { PD.resetDemo(); toast('Demo data reset'); } }}>Reset demo</button>}
            <button className="btn btn-primary" onClick={() => setForm({ mode: 'add' })}>
              <Icon name="plus" /> Add enquiry
            </button>
            <span className="adm-user" title={'Signed in as ' + me}><Avatar name={me} size="sm" /></span>
            <button className="icon-btn" title="Sign out" onClick={() => { PD.logout(); location.reload(); }}><Icon name="lock" /></button>
          </div>
        </div>
      </header>

      <main className="adm-main">
        {/* ---------- SUMMARY ---------- */}
        <div className="summary">
          <div className="sum-tile">
            <div className="sum-lbl-row"><span className="num sum-num">{sum.total}</span></div>
            <span className="lbl">Total enquiries</span>
          </div>
          <div className="sum-tile accent">
            <div className="sum-lbl-row"><span className="num sum-num">{sum.newCount}</span></div>
            <span className="lbl">New · needs action</span>
          </div>
          <div className="sum-tile">
            <div className="sum-lbl-row"><span className="num sum-num">{sum.open}</span></div>
            <span className="lbl">Active in pipeline</span>
          </div>
          <div className="sum-tile">
            <div className="sum-lbl-row"><span className="num sum-num">{sum.wonMonth}</span></div>
            <span className="lbl">Won this month</span>
          </div>
          <div className="sum-tile">
            <div className="sum-lbl-row"><span className="num sum-num red" style={{ fontSize: 30, alignSelf: 'flex-end' }}>{PD.fmtMoney(sum.pipeline)}</span></div>
            <span className="lbl">Open pipeline value</span>
          </div>
        </div>

        {/* ---------- TOOLBAR ---------- */}
        <div className="toolbar">
          <div className="search">
            <Icon name="search" />
            <input placeholder="Search name, mobile, EN no., city…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="tb-spacer"></div>
          <div className="tb-filter">
            <select className="tb-select" value={sourceF} onChange={(e) => setSourceF(e.target.value)}>
              <option value="All">All sources</option>
              {PD.SOURCES.map(s => <option key={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="tb-filter">
            <select className="tb-select" value={ownerF} onChange={(e) => setOwnerF(e.target.value)}>
              <option value="All">All owners</option>
              {['Unassigned', ...PD.getTeam()].map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="seg">
            <button className={view === 'table' ? 'on' : ''} onClick={() => setViewSafe('table')}><Icon name="table" /> Table</button>
            <button className={view === 'board' ? 'on' : ''} onClick={() => setViewSafe('board')}><Icon name="board" /> Board</button>
          </div>
          <button className="icon-btn" title="Export CSV" onClick={() => { PD.exportCSV(filtered); toast('CSV downloaded'); }}><Icon name="download" /></button>
        </div>

        {/* ---------- STATUS CHIPS (table view) ---------- */}
        {view === 'table' && (
          <div className="chips">
            <button className={'chip' + (statusF === 'All' ? ' on' : '')} onClick={() => setStatusF('All')}>
              All <span className="cnt">{statusCounts.all}</span>
            </button>
            {PD.STATUSES.map(s => (
              <button key={s.name} className={'chip' + (statusF === s.name ? ' on' : '')} onClick={() => setStatusF(s.name)}>
                <span className="sw" style={{ background: s.color }}></span>{s.name} <span className="cnt">{statusCounts.m[s.name]}</span>
              </button>
            ))}
          </div>
        )}

        {/* ---------- VIEW ---------- */}
        {loading
          ? <div className="table-wrap"><div className="empty"><p>Loading enquiries…</p></div></div>
          : view === 'table'
            ? <TableView list={filtered} onOpen={(e) => setOpenId(e.id)} />
            : <BoardView list={filtered} onOpen={(e) => setOpenId(e.id)} />}
      </main>

      {/* ---------- DRAWER ---------- */}
      {openRec && (
        <DetailDrawer rec={openRec} toast={toast}
          onClose={() => setOpenId(null)}
          onEdit={() => setForm({ mode: 'edit', rec: openRec })} />
      )}

      {/* ---------- ADD / EDIT MODAL ---------- */}
      {form && (
        <EnquiryForm initial={form.mode === 'edit' ? form.rec : null}
          onClose={() => setForm(null)}
          onSaved={(msg, rec) => { toast(msg); if (form.mode === 'add') setOpenId(rec.id); }} />
      )}

      {toastNode}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthGate><Dashboard /></AuthGate>
);
