// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IVisualizer = any // temporary — replaced by full interface when Rack3DVisualizer.ts is created

export class CssBuilder {
  constructor(private readonly viz: IVisualizer) {}

  buildCSS(scope: string, theme: { css: Record<string, string> }, opts: { sidebar: { position: string } }): string {
    const self = this.viz;
    void self;
    const c     = theme.css;
    const sbPos = opts.sidebar.position;

    return `
/* ── Rack3D Visualizer — scoped to #${scope} ── */
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;800&family=IBM+Plex+Mono:wght@300;400;600&display=swap');

#${scope} {
  --r3-bg:     ${c.bg};
  --r3-panel:  ${c.panel};
  --r3-border: ${c.border};
  --r3-accent: ${c.accent};
  --r3-text:   ${c.text};
  --r3-dim:    ${c.dim};
  --r3-green:  ${c.green};
  --r3-amber:  ${c.amber};
  --r3-red:    ${c.red};
  --r3-font:   ${c.font};
  display:flex; flex-direction:column;
  width:100%; height:100%;
  background:var(--r3-bg); color:var(--r3-text);
  font-family:var(--r3-font); overflow:hidden;
  box-sizing:border-box;
}
#${scope} *, #${scope} *::before, #${scope} *::after { box-sizing:border-box; }

/* ── HEADER ── */
#${scope} .r3-hdr {
  display:flex; align-items:center; gap:10px; padding:0 14px; height:44px;
  background:linear-gradient(90deg,${c.bg} 0%,${c.panel} 50%,${c.bg} 100%);
  border-bottom:1px solid var(--r3-border); flex-shrink:0; position:relative;
}
#${scope} .r3-hdr::after {
  content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,${c.accent}44,transparent);
}
#${scope} .r3-logo { font-family:'Orbitron',monospace; font-size:11px; font-weight:800; color:var(--r3-accent); letter-spacing:3px; text-transform:uppercase; }
#${scope} .r3-logo span { color:var(--r3-text); font-weight:400; }
#${scope} .r3-sep  { width:1px; height:20px; background:var(--r3-border); }
#${scope} .r3-spacer { flex:1; }
#${scope} .r3-badge {
  padding:2px 8px; border-radius:2px; font-size:10px; font-weight:600;
  font-family:'Share Tech Mono',monospace; letter-spacing:.5px; border:1px solid;
}
#${scope} .r3-btn {
  background:transparent; border:1px solid var(--r3-border); color:var(--r3-dim);
  border-radius:2px; padding:3px 10px; cursor:pointer; font-size:10px;
  font-family:'Share Tech Mono',monospace; letter-spacing:1px; text-transform:uppercase;
  transition:all .2s;
}
#${scope} .r3-btn:hover  { border-color:${c.accent}88; color:${c.accent}88; }
#${scope} .r3-btn.on     { border-color:var(--r3-accent); color:var(--r3-accent); background:${c.accent}11; box-shadow:0 0 8px ${c.accent}33; }

/* ── BODY ── */
#${scope} .r3-body { display:flex; flex:1; overflow:hidden; min-height:0; flex-direction:${sbPos==='right'?'row-reverse':'row'}; }

/* ── SIDEBARS ── */
#${scope} .r3-sb {
  border-${sbPos==='right'?'left':'right'}:1px solid var(--r3-border);
  display:flex; flex-direction:column; overflow-y:auto; background:var(--r3-panel);
  scrollbar-width:thin; scrollbar-color:var(--r3-border) transparent;
  position:relative; flex-shrink:0;
}
#${scope} .r3-sb::-webkit-scrollbar { width:4px; }
#${scope} .r3-sb::-webkit-scrollbar-thumb { background:var(--r3-border); border-radius:2px; }

/* ── SIDEBAR RESIZE HANDLE ── */
#${scope} .r3-sb-handle {
  width:4px; flex-shrink:0; align-self:stretch;
  cursor:col-resize; z-index:20; background:transparent; transition:background .15s;
}
#${scope} .r3-sb-handle:hover, #${scope} .r3-sb-handle.r3-resizing { background:var(--r3-accent)66; }

/* ── SIDEBAR TOGGLE BUTTONS ── */
#${scope} .r3-sb-toggle {
  background:transparent; border:1px solid transparent; color:var(--r3-border);
  border-radius:2px; padding:3px 7px; cursor:pointer; font-size:14px;
  transition:all .2s; line-height:1;
}
#${scope} .r3-sb-toggle:hover  { color:var(--r3-dim); border-color:var(--r3-border); }
#${scope} .r3-sb-toggle.on     { color:var(--r3-accent); border-color:${c.accent}44; background:${c.accent}11; }
#${scope} .r3-pnl   { padding:8px 10px; border-bottom:1px solid var(--r3-border); }
#${scope} .r3-pl    { font-family:'Share Tech Mono',monospace; font-size:10px; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
#${scope} .r3-pl::before { content:''; display:inline-block; width:3px; height:3px; background:var(--r3-accent); border-radius:50%; }
#${scope} .r3-rw    { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
#${scope} .r3-inp   { background:${c.bg}; border:1px solid var(--r3-border); color:var(--r3-text); border-radius:2px; padding:4px 7px; font-size:11px; font-family:var(--r3-font); width:100%; transition:border-color .2s; }
#${scope} .r3-inp:focus  { outline:none; border-color:${c.accent}66; }
#${scope} .r3-lbl   { font-size:11px; min-width:62px; font-family:'Share Tech Mono',monospace; }

/* ── STAT CARDS ── */
#${scope} .r3-stat  { background:${c.bg}; border:1px solid var(--r3-border); border-radius:3px; padding:7px 10px; margin-bottom:5px; position:relative; overflow:hidden; }
#${scope} .r3-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,${c.accent}55,transparent); }
#${scope} .r3-sv    { font-size:20px; font-weight:700; font-family:'Orbitron',monospace; color:${c.text}; }
#${scope} .r3-sl    { font-family:'Share Tech Mono',monospace; font-size:9px; letter-spacing:1px; text-transform:uppercase; margin-top:2px; }
#${scope} .r3-sbar  { margin-top:5px; height:2px; background:${c.bg}; border-radius:1px; overflow:hidden; }
#${scope} .r3-sfill { height:100%; border-radius:1px; transition:width .5s,background .5s; }

/* ── DEVICE LIST ── */
#${scope} .r3-dc    { display:flex; align-items:center; gap:7px; padding:5px 8px; margin-bottom:2px; border-radius:3px; border:1px solid var(--r3-border); background:${c.bg}; cursor:pointer; transition:all .15s; }
#${scope} .r3-dc:hover  { background:${c.panel}; border-color:${c.border}cc; }
#${scope} .r3-dc.sel    { border-color:var(--r3-selcol,var(--r3-accent)); background:color-mix(in srgb,var(--r3-selcol,var(--r3-accent)) 8%,${c.bg}); }
#${scope} .r3-dot   { width:8px; height:8px; border-radius:1px; flex-shrink:0; }
#${scope} .r3-dn    { color:${c.text}; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; font-family:'Share Tech Mono',monospace; }
#${scope} .r3-dm    { font-size:10px; }
#${scope} .r3-xb    { background:none; border:none; color:${c.border}; cursor:pointer; font-size:14px; padding:0 2px; line-height:1; flex-shrink:0; transition:color .15s; }
#${scope} .r3-xb:hover  { color:var(--r3-red); }
#${scope} .r3-no-rack { font-size:10px; font-family:'Share Tech Mono',monospace; padding:10px 6px; opacity:.6; text-align:center; }

/* ── EDIT PANEL ── */
#${scope} .r3-ep    { padding:8px 10px; border-bottom:1px solid var(--r3-border); background:${c.bg}; }

/* ── UNIT MAP ── */
#${scope} .r3-um    { border:1px solid var(--r3-border); border-radius:2px; overflow:hidden; }
#${scope} .r3-ur    { height:17px; display:flex; align-items:center; gap:4px; padding:0 5px; border-bottom:1px solid ${c.bg}; transition:background .1s; }
#${scope} .r3-ur.ov { background:${c.accent}22; }

/* ── 3D CANVAS ── */
#${scope} .r3-cv    { flex:1; position:relative; min-width:0; min-height:0; overflow:hidden; background:${c.bg}; }
#${scope} .r3-canvas{ position:absolute; top:0; left:0; width:100%; height:100%; display:block; cursor:crosshair; }
#${scope} .r3-scan  { position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.025) 2px,rgba(0,0,0,.025) 4px); z-index:1; }

/* ── FLOATING LABELS ── */
#${scope} .r3-labels { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; }
#${scope} .r3-label  {
  position:absolute; font-family:'Share Tech Mono',monospace; font-size:11px;
  white-space:nowrap; pointer-events:none; display:flex; align-items:center;
  opacity:0; transition:opacity .25s; transform:translateY(-50%);
}
#${scope} .r3-label.side-left  { flex-direction:row; }
#${scope} .r3-label.side-right { flex-direction:row-reverse; }
#${scope} .r3-lcard { display:flex; flex-direction:column; }
#${scope} .r3-label.side-left  .r3-lcard { align-items:flex-start; }
#${scope} .r3-label.side-right .r3-lcard { align-items:flex-end; }
#${scope} .r3-ltag  { display:flex; align-items:center; gap:5px; background:${c.bg}f0; border:1px solid; border-radius:3px 3px 0 0; padding:3px 9px 3px 7px; backdrop-filter:blur(6px); }
#${scope} .r3-lname { color:${c.text}; font-size:11px; font-weight:700; letter-spacing:.3px; }
#${scope} .r3-ltype { font-size:10px; opacity:.7; margin-left:2px; }
#${scope} .r3-ldetail { background:${c.bg}ee; border:1px solid; border-top:none; border-radius:0 0 3px 3px; padding:3px 8px; display:flex; flex-direction:column; gap:2px; min-width:0; }
#${scope} .r3-ldetail-row { font-size:10px; display:flex; align-items:center; gap:4px; white-space:nowrap; }
#${scope} .r3-lhline { height:1px; flex-shrink:0; }
#${scope} .r3-label.side-left  .r3-lhline { background:linear-gradient(to right, transparent, currentColor); }
#${scope} .r3-label.side-right .r3-lhline { background:linear-gradient(to left, transparent, currentColor); }
#${scope} .r3-ldot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; border:1px solid currentColor; background:${c.bg}; box-shadow:0 0 5px currentColor; }
#${scope} .r3-ltoggle { pointer-events:all !important; }

/* ── TIP ── */
#${scope} .r3-tip   { position:absolute; bottom:10px; left:50%; transform:translateX(-50%); background:${c.bg}bb; border:1px solid var(--r3-border); border-radius:2px; padding:5px 14px; font-size:11px; pointer-events:none; white-space:nowrap; font-family:'Share Tech Mono',monospace; letter-spacing:.5px; z-index:3; }

/* ── JSON PANEL ── */
#${scope} .r3-jp    { position:absolute; top:10px; right:10px; bottom:30px; width:300px; background:${c.bg}f5; border:1px solid var(--r3-border); border-radius:3px; display:flex; flex-direction:column; z-index:10; backdrop-filter:blur(10px); }
#${scope} .r3-jh    { padding:7px 10px; border-bottom:1px solid var(--r3-border); display:flex; justify-content:space-between; align-items:center; font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--r3-accent); letter-spacing:1px; }
#${scope} .r3-jta   { flex:1; background:${c.bg}; border:none; color:${c.green}; font-family:'Share Tech Mono',monospace; font-size:10px; padding:10px; resize:none; outline:none; line-height:1.6; }
#${scope} .r3-je    { padding:3px 10px; color:var(--r3-red); font-size:9px; min-height:18px; font-family:'Share Tech Mono',monospace; }
#${scope} .r3-jf    { padding:7px 10px; border-top:1px solid var(--r3-border); display:flex; gap:6px; }

/* ── 2D MODE ── */
#${scope} .r3-2d-rack { display:flex; flex-direction:column; align-items:stretch; border:2px solid var(--r3-border); border-radius:3px; overflow:hidden; font-family:'Share Tech Mono',monospace; }
#${scope} .r3-2d-unit { display:flex; align-items:center; height:26px; border-bottom:1px solid ${c.bg}; position:relative; transition:background .1s; }
#${scope} .r3-2d-unit.r3-2d-half-row { align-items:stretch; }
#${scope} .r3-2d-unit:last-child { border-bottom:none; }
#${scope} .r3-2d-num  { width:32px; text-align:right; font-size:10px; padding-right:5px; flex-shrink:0; }
#${scope} .r3-2d-bar  { flex:1; display:flex; align-items:center; padding:0 6px; font-size:11px; font-weight:600; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
#${scope} .r3-2d-half { transition:background .1s; }
#${scope} .r3-2d-empty{ background:transparent !important; }
#${scope} .r3-2d-wrap { flex:1; overflow:auto; display:flex; align-items:flex-start; justify-content:center; padding:20px; background:${c.bg}; }
#${scope} .r3-dh      { background:${c.accent}22 !important; outline:1px dashed ${c.accent}88; }
#${scope} .r3-2d-tb   { display:flex; align-items:center; gap:8px; padding:6px 14px; border-bottom:1px solid var(--r3-border); background:${c.panel}; flex-shrink:0; }

/* ── CATALOG ── */
#${scope} .r3-cat-list { display:flex; flex-direction:column; gap:2px; }
#${scope} .r3-cat-group { margin-bottom:2px; }
#${scope} .r3-cat-group-hdr {
  display:flex; align-items:center; gap:5px; padding:3px 6px;
  cursor:pointer; user-select:none; border-radius:2px;
  font-family:'Share Tech Mono',monospace; font-size:10px;
  letter-spacing:1px; text-transform:uppercase;
  transition:background .1s;
}
#${scope} .r3-cat-group-hdr:hover { background:${c.bg}; }
#${scope} .r3-cat-group-arrow { transition:transform .2s; display:inline-block; font-size:12px; }
#${scope} .r3-cat-group-body  { padding-left:4px; }
#${scope} .r3-cat-item { cursor:grab; padding:3px 6px !important; }
#${scope} .r3-cat-item:active { cursor:grabbing; }
#${scope} .r3-cat-item .r3-dn { font-size:11px; }
#${scope} .r3-cat-item .r3-dm { font-size:10px; }
#${scope} .r3-cat-add-btn {
  background:none; border:1px solid var(--r3-border); color:var(--r3-dim);
  cursor:pointer; font-size:13px; padding:0 5px; line-height:1; flex-shrink:0;
  border-radius:2px; transition:all .15s; font-weight:700;
}
#${scope} .r3-cat-add-btn:hover { border-color:var(--r3-green); color:var(--r3-green); }

/* ── TABS ── */
#${scope} .r3-tab-pnl { padding-bottom:2px; }
#${scope} .r3-tab-bar {
  display:flex; align-items:center; gap:2px; margin-bottom:6px;
  border-bottom:1px solid var(--r3-border);
}
#${scope} .r3-tab {
  background:transparent; border:1px solid transparent; color:var(--r3-dim);
  border-radius:2px 2px 0 0; padding:3px 10px; cursor:pointer; font-size:10px;
  font-family:'Share Tech Mono',monospace; letter-spacing:1px; text-transform:uppercase;
  transition:all .15s; margin-bottom:-1px; border-bottom-color:var(--r3-border);
}
#${scope} .r3-tab:hover { color:var(--r3-text); }
#${scope} .r3-tab.active {
  border-color:var(--r3-border); border-bottom-color:var(--r3-panel);
  color:var(--r3-accent); background:var(--r3-panel);
}

/* ── RACK LIST ── */
#${scope} .r3-rack-item {
  display:flex; align-items:center; gap:6px; padding:5px 8px; margin-bottom:2px;
  border-radius:3px; border:1px solid var(--r3-border); background:${c.bg};
  cursor:pointer; transition:all .15s; font-size:11px; font-family:'Share Tech Mono',monospace;
}
#${scope} .r3-rack-item:hover  { border-color:${c.accent}55; }
#${scope} .r3-rack-item.sel    { border-color:var(--r3-accent); background:${c.accent}11; color:var(--r3-accent); }
#${scope} .r3-rack-badge {
  font-size:9px; padding:1px 5px; border-radius:1px; border:1px solid;
  font-family:'Share Tech Mono',monospace;
}
#${scope} .r3-fly-btn {
  display:none; background:transparent; border:1px solid var(--r3-border); color:var(--r3-dim);
  border-radius:2px; cursor:pointer; font-size:10px; padding:1px 4px; line-height:1; flex-shrink:0;
  transition:color .15s, border-color .15s;
}
#${scope} .r3-fly-btn:hover { color:var(--r3-accent); border-color:var(--r3-accent); }
#${scope} .r3-rack-item:hover .r3-fly-btn { display:block; }

/* ── RIGHT SIDEBAR ── */
#${scope} .r3-sb-right {
  width:260px; min-width:260px;
  border-left:1px solid var(--r3-border);
  display:flex; flex-direction:column; overflow-y:auto; background:var(--r3-panel);
  scrollbar-width:thin; scrollbar-color:var(--r3-border) transparent;
}
#${scope} .r3-sb-right::-webkit-scrollbar { width:4px; }
#${scope} .r3-sb-right::-webkit-scrollbar-thumb { background:var(--r3-border); border-radius:2px; }

/* ── PANEL SYSTEM ── */
#${scope} .r3-panel { border-bottom:1px solid var(--r3-border); }
#${scope} .r3-panel.r3-panel-hidden { display:none; }
#${scope} .r3-panel.r3-tab-hidden  { display:none !important; }

/* ── SIDEBAR TAB BAR ── */
#${scope} .r3-sbtab-bar {
  display:flex; flex-wrap:nowrap; align-items:flex-end; gap:2px; padding:4px 6px 0;
  border-bottom:1px solid var(--r3-border);
  background:${c.bg}dd; position:sticky; top:0; z-index:10; flex-shrink:0; overflow-x:auto;
}
#${scope} .r3-sbtab-bar::-webkit-scrollbar { height:0; }
#${scope} .r3-sbtab-item { display:flex; align-items:flex-end; flex-shrink:0; }
#${scope} .r3-sbtab {
  display:flex; align-items:center; gap:4px;
  background:${c.bg}; border:1px solid var(--r3-border); border-bottom:1px solid var(--r3-border);
  color:var(--r3-dim); border-radius:3px 3px 0 0; padding:3px 8px; cursor:pointer; font-size:9px;
  font-family:'Share Tech Mono',monospace; letter-spacing:.5px; text-transform:uppercase;
  transition:all .15s; white-space:nowrap; max-width:100px; position:relative;
  margin-bottom:-1px; z-index:1;
}
#${scope} .r3-sbtab:hover { border-color:${c.accent}66; color:${c.accent}88; }
#${scope} .r3-sbtab.active {
  border-color:var(--r3-accent); border-bottom-color:var(--r3-panel);
  color:var(--r3-accent); background:var(--r3-panel); z-index:2;
}
#${scope} .r3-sbtab-name { overflow:hidden; text-overflow:ellipsis; max-width:70px; }
#${scope} .r3-sbtab-x {
  flex-shrink:0; opacity:0; font-size:11px; line-height:1; color:var(--r3-dim);
  padding:0 1px; transition:opacity .15s, color .15s; pointer-events:none;
}
#${scope} .r3-sbtab:hover .r3-sbtab-x { opacity:1; pointer-events:auto; }
#${scope} .r3-sbtab-x:hover { color:var(--r3-red); }
#${scope} .r3-sbtab-add {
  background:transparent; border:1px dashed var(--r3-border); color:var(--r3-dim);
  border-radius:3px 3px 0 0; padding:3px 7px; cursor:pointer; font-size:12px; line-height:1;
  transition:all .15s; margin-bottom:-1px; flex-shrink:0;
}
#${scope} .r3-sbtab-add:hover { border-color:${c.accent}88; color:${c.accent}88; }
#${scope} .r3-ph-tab-btn { font-size:10px; opacity:0.5; }
#${scope} .r3-ph-tab-btn:hover { opacity:1; color:var(--r3-accent); }

/* ── PROFILE DROPDOWN ── */
#${scope} .r3-profile-dd-wrap { position:relative; display:flex; align-items:center; }
#${scope} .r3-profile-dd {
  position:absolute; top:calc(100% + 4px); right:0; z-index:10000;
  background:var(--r3-panel); border:1px solid var(--r3-border); border-radius:4px;
  padding:10px; width:260px; box-shadow:0 8px 24px rgba(0,0,0,.6);
}

/* ── PROFILES ── */
#${scope} .r3-profile-item {
  display:flex; align-items:center; justify-content:space-between; gap:6px;
  padding:5px 0; border-bottom:1px solid var(--r3-border);
}
#${scope} .r3-profile-item:last-child { border-bottom:none; }
#${scope} .r3-profile-info { display:flex; flex-direction:column; gap:1px; min-width:0; flex:1; overflow:hidden; }
#${scope} .r3-profile-name {
  font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--r3-text);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
#${scope} .r3-profile-date { font-size:8px; color:var(--r3-dim); }
#${scope} .r3-ph {
  display:flex; align-items:center; gap:6px; padding:5px 8px;
  background:var(--r3-panel); cursor:default; user-select:none;
  position:relative;
}
#${scope} .r3-ph::after {
  content:''; position:absolute; bottom:0; left:8px; right:8px; height:1px;
  background:var(--r3-border);
}
#${scope} .r3-ph-drag {
  cursor:grab; color:var(--r3-border); font-size:14px; line-height:1;
  letter-spacing:-1px; padding:0 2px; flex-shrink:0; transition:color .15s;
}
#${scope} .r3-ph:hover .r3-ph-drag { color:var(--r3-dim); }
#${scope} .r3-ph-drag:active { cursor:grabbing; }
#${scope} .r3-ph-title {
  flex:1; font-family:'Share Tech Mono',monospace; font-size:10px; letter-spacing:2px;
  text-transform:uppercase; color:var(--r3-dim);
}
#${scope} .r3-ph-title::before {
  content:''; display:inline-block; width:3px; height:3px; background:var(--r3-accent);
  border-radius:50%; margin-right:6px; vertical-align:middle;
}
#${scope} .r3-ph-btn {
  background:none; border:none; color:var(--r3-border); cursor:pointer;
  font-size:11px; padding:0 3px; line-height:1; flex-shrink:0;
  transition:all .2s; transform-origin:center;
}
#${scope} .r3-ph-btn:hover { color:var(--r3-dim); }
#${scope} .r3-pb { padding:8px 10px; overflow-y:auto; max-height:260px; min-height:40px; }
#${scope} .r3-panel.r3-collapsed .r3-pb { display:none; }
#${scope} .r3-pb-resize {
  height:5px; cursor:ns-resize; background:transparent; flex-shrink:0;
  border-top:1px solid var(--r3-border); transition:background .15s;
}
#${scope} .r3-panel.r3-collapsed .r3-pb-resize { display:none; }
#${scope} .r3-pb-resize:hover, #${scope} .r3-pb-resize.r3-resizing { background:${c.accent}44; }
#${scope} .r3-panel.r3-collapsed .r3-ph-btn { transform:rotate(-90deg); }
#${scope} .r3-panel.r3-panel-dragging { opacity:0.4; }
#${scope} .r3-panel.r3-panel-drop-before { border-top:2px solid var(--r3-accent); }

/* ── ENV CONFIG PANEL ── */
#${scope} .r3-env-sec {
  font-family:'Share Tech Mono',monospace; font-size:9px; letter-spacing:2px;
  text-transform:uppercase; color:var(--r3-accent); margin:8px 0 5px;
  padding-bottom:3px; border-bottom:1px solid ${c.accent}33;
}
#${scope} .r3-env-row { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
#${scope} .r3-range {
  flex:1; -webkit-appearance:none; appearance:none; height:3px;
  background:var(--r3-border); border-radius:2px; outline:none; cursor:pointer;
}
#${scope} .r3-range::-webkit-slider-thumb {
  -webkit-appearance:none; width:11px; height:11px; border-radius:50%;
  background:var(--r3-accent); cursor:pointer; border:none;
  box-shadow:0 0 4px ${c.accent}55;
}
#${scope} .r3-range::-moz-range-thumb {
  width:11px; height:11px; border-radius:50%; background:var(--r3-accent);
  cursor:pointer; border:none;
}
#${scope} .r3-val {
  font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--r3-text);
  min-width:30px; text-align:right;
}
#${scope} .r3-env-toggles { display:flex; flex-direction:column; gap:3px; margin:4px 0; }
#${scope} .r3-sw-label { display:flex; align-items:center; justify-content:space-between; gap:6px; }
#${scope} .r3-sw { position:relative; display:inline-flex; align-items:center; cursor:pointer; flex-shrink:0; }
#${scope} .r3-sw input { position:absolute; opacity:0; width:0; height:0; }
#${scope} .r3-sw-track {
  width:28px; height:14px; background:var(--r3-border); border-radius:7px;
  position:relative; transition:background .2s;
}
#${scope} .r3-sw input:checked ~ .r3-sw-track { background:var(--r3-accent); }
#${scope} .r3-sw-thumb {
  position:absolute; top:2px; left:2px; width:10px; height:10px;
  background:#fff; border-radius:50%; transition:left .2s;
  box-shadow:0 1px 3px rgba(0,0,0,.3);
}
#${scope} .r3-sw input:checked ~ .r3-sw-track .r3-sw-thumb { left:16px; }

/* ── ENV NUMBER INPUTS ── */
#${scope} .r3-env-num { width:60px; text-align:right; flex-shrink:0; }
#${scope} .r3-inp-xs  { padding:2px 4px; font-size:10px; width:36px; }

/* ── CUSTOM LIGHTS ── */
#${scope} .r3-cl-labels {
  display:flex; gap:3px; padding:2px 0; margin-bottom:2px;
  font-family:'Share Tech Mono',monospace; font-size:9px; color:var(--r3-dim);
}
#${scope} .r3-cl-labels span:first-child { width:76px; flex-shrink:0; }
#${scope} .r3-cl-labels span:not(:first-child):not(:last-child) { width:38px; flex-shrink:0; text-align:center; }
#${scope} .r3-cl-row {
  display:flex; align-items:center; gap:3px; margin-bottom:3px;
  padding:3px 0; border-bottom:1px solid ${c.bg};
}
#${scope} .r3-color-pick {
  width:24px; height:22px; padding:1px; cursor:pointer;
  background:none; border:1px solid var(--r3-border); border-radius:2px;
  flex-shrink:0;
}

/* ── ZOOM BUTTONS ── */
#${scope} .r3-zoom-btns { position:absolute; bottom:44px; right:12px; display:flex; flex-direction:column; gap:4px; z-index:6; }
#${scope} .r3-zoom-btn  { width:30px; height:30px; background:var(--r3-panel); border:1px solid var(--r3-border); color:var(--r3-text); border-radius:4px; cursor:pointer; font-size:18px; line-height:1; display:flex; align-items:center; justify-content:center; transition:all .2s; }
#${scope} .r3-zoom-btn:hover { border-color:var(--r3-accent); color:var(--r3-accent); background:${c.accent}11; }

/* ── MINIMAP ── */
#${scope} .r3-minimap-wrap {
  position:absolute; bottom:10px; right:50px; z-index:6;
  display:flex; flex-direction:column; align-items:stretch;
  border:1px solid ${c.accent}44; border-radius:5px; overflow:hidden;
  box-shadow:0 4px 18px rgba(0,0,0,0.55);
}
#${scope} .r3-minimap-hdr {
  display:flex; justify-content:space-between; align-items:center;
  padding:3px 8px;
  background:${c.panel}f0; border-bottom:1px solid var(--r3-border);
  font-family:'Share Tech Mono',monospace; font-size:9px; letter-spacing:1px;
  color:var(--r3-accent); user-select:none;
}
#${scope} .r3-minimap-pos { color:var(--r3-text); opacity:0.55; font-size:8px; }
#${scope} .r3-minimap {
  border:none; border-radius:0; display:block;
  background:${c.bg}dd; backdrop-filter:blur(4px);
  cursor:crosshair; opacity:0.92; transition:opacity .2s;
}
#${scope} .r3-minimap:hover { opacity:1; }
#${scope} .r3-minimap-hint {
  text-align:center; padding:2px 0 3px;
  font-family:'Share Tech Mono',monospace; font-size:8px; letter-spacing:0.5px;
  color:var(--r3-accent); opacity:0.5;
  background:${c.panel}f0; border-top:1px solid var(--r3-border);
  user-select:none; pointer-events:none;
}

/* ── AXIS GIZMO ── */
#${scope} .r3-axis-gizmo {
  position:absolute; top:12px; left:12px;
  width:64px; height:64px; pointer-events:none; z-index:4; opacity:0.82;
}

/* ── COMPASS ── */
#${scope} .r3-compass {
  position:absolute; top:12px; right:12px; width:56px; height:56px;
  pointer-events:none; z-index:4; opacity:0.85;
}
#${scope} .r3-compass-ring {
  width:100%; height:100%; border-radius:50%;
  border:1.5px solid var(--r3-border);
  background:${c.bg}cc; backdrop-filter:blur(4px);
  position:relative; display:flex; align-items:center; justify-content:center;
}
#${scope} .r3-compass-n {
  position:absolute; top:3px; left:50%; transform:translateX(-50%);
  font-family:'Share Tech Mono',monospace; font-size:10px; font-weight:700;
  color:${c.accent}; line-height:1;
  text-shadow:0 0 6px ${c.accent}88;
}
#${scope} .r3-compass-e, #${scope} .r3-compass-s, #${scope} .r3-compass-w {
  position:absolute; font-family:'Share Tech Mono',monospace; font-size:9px;
  line-height:1;
}
#${scope} .r3-compass-e { right:3px; top:50%; transform:translateY(-50%); }
#${scope} .r3-compass-s { bottom:3px; left:50%; transform:translateX(-50%); }
#${scope} .r3-compass-w { left:3px; top:50%; transform:translateY(-50%); }
#${scope} .r3-compass-svg {
  position:absolute; top:50%; left:50%;
  width:40px; height:40px; margin-left:-20px; margin-top:-20px;
  transform-origin:50% 50%; overflow:visible; pointer-events:none;
}

/* ── LEGEND OVERLAY ── */
#${scope} .r3-legend-overlay {
  position:absolute; bottom:44px; left:12px; z-index:6;
  display:flex; flex-direction:column; align-items:flex-start; gap:4px;
}
#${scope} .r3-legend-toggle-btn {
  background:${c.panel}cc; border:1px solid var(--r3-border); color:var(--r3-dim);
  border-radius:2px; padding:4px 9px; cursor:pointer; font-size:9px;
  font-family:'Share Tech Mono',monospace; letter-spacing:1px; text-transform:uppercase;
  transition:all .2s; backdrop-filter:blur(6px);
}
#${scope} .r3-legend-toggle-btn:hover { border-color:${c.accent}88; color:${c.accent}88; }
#${scope} .r3-legend-body {
  background:${c.panel}ee; border:1px solid var(--r3-border); border-radius:3px;
  padding:6px 10px; backdrop-filter:blur(8px);
}
#${scope} .r3-legend { display:flex; flex-direction:column; gap:2px; }
#${scope} .r3-lrow   { display:flex; align-items:center; gap:8px; font-size:11px; font-family:'Share Tech Mono',monospace; color:var(--r3-text); padding:2px 0; }
#${scope} .r3-lswatch{ width:12px; height:12px; border-radius:2px; flex-shrink:0; }

/* ── VM PANEL ── */
#${scope} .r3-vm-card {
  border:1px solid var(--r3-border); border-radius:5px; padding:7px 8px;
  margin-bottom:6px; background:${c.bg}99; position:relative;
}
#${scope} .r3-vm-card.r3-vm-running { border-color:${c.green}55; }
#${scope} .r3-vm-card.r3-vm-stopped { border-color:${c.red}44; }
#${scope} .r3-vm-card.r3-vm-paused  { border-color:${c.amber}44; }
#${scope} .r3-vm-hdr {
  display:flex; align-items:center; gap:6px; margin-bottom:5px;
}
#${scope} .r3-vm-status {
  width:7px; height:7px; border-radius:50%; flex-shrink:0;
}
#${scope} .r3-vm-status.running { background:${c.green}; box-shadow:0 0 5px ${c.green}88; }
#${scope} .r3-vm-status.stopped { background:${c.red}; }
#${scope} .r3-vm-status.paused  { background:${c.amber}; }
#${scope} .r3-vm-name {
  font-family:'Share Tech Mono',monospace; font-size:11px; font-weight:700;
  color:${c.text}; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
#${scope} .r3-vm-tech {
  font-size:9px; color:${c.accent}; font-family:'Share Tech Mono',monospace;
  letter-spacing:.5px; padding:1px 4px; border:1px solid ${c.accent}44; border-radius:2px;
  flex-shrink:0;
}
#${scope} .r3-vm-actions { display:flex; gap:4px; margin-left:auto; }
#${scope} .r3-vm-body { display:flex; flex-direction:column; gap:3px; }
#${scope} .r3-vm-row {
  display:flex; align-items:center; gap:4px; font-size:10px;
  font-family:'Share Tech Mono',monospace; color:var(--r3-dim);
}
#${scope} .r3-vm-key { min-width:52px; flex-shrink:0; font-size:9px; }
#${scope} .r3-vm-val { color:${c.text}; flex:1; }
#${scope} .r3-vm-chips { display:flex; gap:3px; flex-wrap:wrap; }
#${scope} .r3-vm-chip {
  font-size:9px; padding:1px 5px; border-radius:10px;
  font-family:'Share Tech Mono',monospace; border:1px solid;
}
#${scope} .r3-vm-chip.open  { color:${c.green}; border-color:${c.green}44; background:${c.green}11; }
#${scope} .r3-vm-chip.close { color:${c.red};   border-color:${c.red}44;   background:${c.red}11; }
#${scope} .r3-vm-res {
  display:flex; gap:5px; margin-top:2px;
}
#${scope} .r3-vm-res-item {
  flex:1; text-align:center; background:${c.panel}; border:1px solid var(--r3-border);
  border-radius:3px; padding:3px 2px;
}
#${scope} .r3-vm-res-val {
  font-family:'Share Tech Mono',monospace; font-size:11px; font-weight:700;
  color:${c.accent}; display:block;
}
#${scope} .r3-vm-res-lbl {
  font-family:'Share Tech Mono',monospace; font-size:8px; color:var(--r3-dim);
  text-transform:uppercase; letter-spacing:.5px; display:block;
}
#${scope} .r3-vm-expand { cursor:pointer; }
#${scope} .r3-vm-detail { margin-top:5px; border-top:1px solid var(--r3-border); padding-top:5px; }
#${scope} .r3-vm-edit-form { margin-top:5px; border-top:1px solid var(--r3-border); padding-top:5px; display:flex; flex-direction:column; gap:4px; }
#${scope} .r3-vm-port-row { display:flex; gap:3px; align-items:center; flex-wrap:wrap; }
#${scope} .r3-vm-add-bar {
  display:flex; align-items:center; gap:6px; padding:4px 0;
  border-top:1px solid var(--r3-border); margin-top:4px;
}

/* ── GROUP RINGS ── */
#${scope} .r3-group-ring { pointer-events: none; }

/* ── HELP MODAL ── */
#${scope} .r3-help-modal {
  position:absolute; inset:0; z-index:100;
  display:flex; align-items:center; justify-content:center;
  background:${c.bg}cc; backdrop-filter:blur(6px);
}
#${scope} .r3-help-box {
  background:${c.panel}; border:1px solid var(--r3-border); border-radius:6px;
  width:420px; max-width:92vw; max-height:80vh;
  display:flex; flex-direction:column; box-shadow:0 8px 40px #00000066;
}
#${scope} .r3-help-hdr {
  display:flex; align-items:center; gap:8px;
  padding:10px 14px; border-bottom:1px solid var(--r3-border);
  font-family:'Share Tech Mono',monospace; color:var(--r3-text);
}
#${scope} .r3-help-body {
  padding:12px 14px; overflow-y:auto; flex:1;
  font-family:'Share Tech Mono',monospace; font-size:12px; color:var(--r3-text);
}
#${scope} .r3-help-sec {
  font-size:11px; letter-spacing:1.5px; text-transform:uppercase;
  color:var(--r3-accent); margin:10px 0 5px;
}
#${scope} .r3-help-row {
  display:flex; align-items:flex-start; gap:8px; padding:3px 0;
  border-bottom:1px solid var(--r3-border)11;
  font-size:12px; line-height:1.5;
}
#${scope} .r3-help-key {
  min-width:90px; flex-shrink:0;
  font-size:11px; padding-top:1px;
}
.r3-ctx-menu {
  position:fixed; z-index:9999;
  background:${c.panel}; border:1px solid ${c.border};
  border-radius:5px; padding:3px 0; min-width:170px;
  box-shadow:0 4px 18px rgba(0,0,0,0.55);
  font-family:${c.font}; user-select:none;
}
.r3-ctx-item {
  padding:5px 13px; cursor:pointer; font-size:10px; color:${c.text};
  white-space:nowrap;
}
.r3-ctx-item:hover { background:${c.accent}18; color:${c.accent}; }
.r3-ctx-sep { height:1px; background:${c.border}; margin:3px 0; }
`;
  }
}
