// ─────────────────────────────────────────────────────────────
//  Generates scoped CSS for a Rack3D instance from theme + opts
// ─────────────────────────────────────────────────────────────

export function buildCSS(scope, theme, opts) {
  const c = theme.css;
  const sbW = opts.sidebar.width;
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

/* ── SIDEBAR ── */
#${scope} .r3-sb {
  width:${sbW}px; min-width:${sbW}px;
  border-${sbPos==='right'?'left':'right'}:1px solid var(--r3-border);
  display:flex; flex-direction:column; overflow-y:auto; background:var(--r3-panel);
  scrollbar-width:thin; scrollbar-color:var(--r3-border) transparent;
}
#${scope} .r3-sb::-webkit-scrollbar { width:4px; }
#${scope} .r3-sb::-webkit-scrollbar-thumb { background:var(--r3-border); border-radius:2px; }
#${scope} .r3-pnl   { padding:8px 10px; border-bottom:1px solid var(--r3-border); }
#${scope} .r3-pl    { font-family:'Share Tech Mono',monospace; color:var(--r3-dim); font-size:10px; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
#${scope} .r3-pl::before { content:''; display:inline-block; width:3px; height:3px; background:var(--r3-accent); border-radius:50%; }
#${scope} .r3-rw    { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
#${scope} .r3-inp   { background:${c.bg}; border:1px solid var(--r3-border); color:var(--r3-text); border-radius:2px; padding:4px 7px; font-size:11px; font-family:var(--r3-font); width:100%; transition:border-color .2s; }
#${scope} .r3-inp:focus  { outline:none; border-color:${c.accent}66; }
#${scope} .r3-lbl   { color:var(--r3-dim); font-size:11px; min-width:62px; font-family:'Share Tech Mono',monospace; }

/* ── STAT CARDS ── */
#${scope} .r3-stat  { background:${c.bg}; border:1px solid var(--r3-border); border-radius:3px; padding:7px 10px; margin-bottom:5px; position:relative; overflow:hidden; }
#${scope} .r3-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,${c.accent}55,transparent); }
#${scope} .r3-sv    { font-size:20px; font-weight:700; font-family:'Orbitron',monospace; color:${c.text}; }
#${scope} .r3-sl    { font-family:'Share Tech Mono',monospace; color:var(--r3-dim); font-size:9px; letter-spacing:1px; text-transform:uppercase; margin-top:2px; }
#${scope} .r3-sbar  { margin-top:5px; height:2px; background:${c.bg}; border-radius:1px; overflow:hidden; }
#${scope} .r3-sfill { height:100%; border-radius:1px; transition:width .5s,background .5s; }

/* ── DEVICE LIST ── */
#${scope} .r3-dc    { display:flex; align-items:center; gap:7px; padding:5px 8px; margin-bottom:2px; border-radius:3px; border:1px solid var(--r3-border); background:${c.bg}; cursor:pointer; transition:all .15s; }
#${scope} .r3-dc:hover  { background:${c.panel}; border-color:${c.border}cc; }
#${scope} .r3-dc.sel    { border-color:var(--r3-selcol,var(--r3-accent)); background:color-mix(in srgb,var(--r3-selcol,var(--r3-accent)) 8%,${c.bg}); }
#${scope} .r3-dot   { width:8px; height:8px; border-radius:1px; flex-shrink:0; }
#${scope} .r3-dn    { color:${c.text}; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; font-family:'Share Tech Mono',monospace; }
#${scope} .r3-dm    { color:var(--r3-dim); font-size:10px; }
#${scope} .r3-xb    { background:none; border:none; color:${c.border}; cursor:pointer; font-size:14px; padding:0 2px; line-height:1; flex-shrink:0; transition:color .15s; }
#${scope} .r3-xb:hover  { color:var(--r3-red); }
#${scope} .r3-ab    { border-radius:2px; padding:3px 8px; cursor:pointer; font-size:9px; font-weight:600; font-family:'Share Tech Mono',monospace; letter-spacing:.5px; margin:2px; transition:all .2s; }
#${scope} .r3-ab:hover  { filter:brightness(1.3); }

/* ── EDIT PANEL ── */
#${scope} .r3-ep    { padding:8px 10px; border-bottom:1px solid var(--r3-border); background:${c.bg}; }

/* ── UNIT MAP ── */
#${scope} .r3-um    { border:1px solid var(--r3-border); border-radius:2px; overflow:hidden; }
#${scope} .r3-ur    { height:17px; display:flex; align-items:center; gap:4px; padding:0 5px; border-bottom:1px solid ${c.bg}; transition:background .1s; }
#${scope} .r3-ur.ov { background:${c.accent}22; }

/* ── LEGEND ── */
#${scope} .r3-legend { display:flex; flex-direction:column; gap:2px; }
#${scope} .r3-lrow   { display:flex; align-items:center; gap:8px; font-size:12px; font-family:'Share Tech Mono',monospace; color:var(--r3-text); padding:3px 0; }
#${scope} .r3-lswatch{ width:13px; height:13px; border-radius:2px; flex-shrink:0; }

/* ── 3D CANVAS ── */
#${scope} .r3-cv    { flex:1; position:relative; min-width:0; min-height:0; overflow:hidden; background:${c.bg}; }
#${scope} .r3-canvas{ position:absolute; top:0; left:0; width:100%; height:100%; display:block; }
#${scope} .r3-scan  { position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.025) 2px,rgba(0,0,0,.025) 4px); z-index:1; }

/* ── FLOATING LABELS ── */
#${scope} .r3-labels { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; }
#${scope} .r3-label  {
  position:absolute; font-family:'Share Tech Mono',monospace; font-size:11px;
  white-space:nowrap; pointer-events:none; display:flex; align-items:center;
  opacity:0; transition:opacity .25s; transform:translateY(-50%);
}
/* side-left:  dot at RIGHT (at rack post), card extends RIGHT (outward) */
#${scope} .r3-label.side-left  { flex-direction:row; }
/* side-right: dot at LEFT  (at rack post), card extends LEFT (outward) */
#${scope} .r3-label.side-right { flex-direction:row-reverse; }

#${scope} .r3-lcard { display:flex; flex-direction:column; }
#${scope} .r3-label.side-left  .r3-lcard { align-items:flex-start; }
#${scope} .r3-label.side-right .r3-lcard { align-items:flex-end; }

/* Name tag — main label chip */
#${scope} .r3-ltag  { display:flex; align-items:center; gap:5px; background:${c.bg}f0; border:1px solid; border-radius:3px 3px 0 0; padding:3px 9px 3px 7px; backdrop-filter:blur(6px); }
#${scope} .r3-lname { color:${c.text}; font-size:11px; font-weight:700; letter-spacing:.3px; }
#${scope} .r3-ltype { font-size:10px; opacity:.7; margin-left:2px; }

/* Detail block — single card containing all meta + custom rows */
#${scope} .r3-ldetail { background:${c.bg}ee; border:1px solid; border-top:none; border-radius:0 0 3px 3px; padding:3px 8px 3px 8px; display:flex; flex-direction:column; gap:2px; min-width:0; }
#${scope} .r3-ldetail-row { font-size:10px; display:flex; align-items:center; gap:4px; white-space:nowrap; }

/* Connector line — solid at dot end, fades toward card */
#${scope} .r3-lhline { height:1px; flex-shrink:0; }
/* side-left row-reverse: dot on RIGHT, card on LEFT → gradient solid-right fading-left */
#${scope} .r3-label.side-left  .r3-lhline { background:linear-gradient(to right, transparent, currentColor); }
/* side-right row: dot on LEFT, card on RIGHT → gradient solid-left fading-right */
#${scope} .r3-label.side-right .r3-lhline { background:linear-gradient(to left, transparent, currentColor); }

/* Anchor dot */
#${scope} .r3-ldot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; border:1px solid currentColor; background:${c.bg}; box-shadow:0 0 5px currentColor; }

/* ── TIP ── */
#${scope} .r3-tip   { position:absolute; bottom:10px; left:50%; transform:translateX(-50%); background:${c.bg}bb; border:1px solid var(--r3-border); border-radius:2px; padding:5px 14px; font-size:11px; color:var(--r3-dim); pointer-events:none; white-space:nowrap; font-family:'Share Tech Mono',monospace; letter-spacing:.5px; z-index:3; }

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
#${scope} .r3-2d-num  { width:32px; text-align:right; font-size:10px; color:var(--r3-dim); padding-right:5px; flex-shrink:0; }
#${scope} .r3-2d-bar  { flex:1; display:flex; align-items:center; padding:0 6px; font-size:11px; font-weight:600; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
#${scope} .r3-2d-half { transition:background .1s; }
#${scope} .r3-2d-empty{ background:transparent !important; }
#${scope} .r3-2d-wrap { flex:1; overflow:auto; display:flex; align-items:flex-start; justify-content:center; padding:20px; background:${c.bg}; }
#${scope} .r3-dh      { background:${c.accent}22 !important; outline:1px dashed ${c.accent}88; }
#${scope} .r3-2d-tb   { display:flex; align-items:center; gap:8px; padding:6px 14px; border-bottom:1px solid var(--r3-border); background:${c.panel}; flex-shrink:0; }

/* ── CATALOG ── */
#${scope} .r3-cat-list { display:flex; flex-direction:column; gap:2px; }
#${scope} .r3-cat-item { cursor:grab; }
#${scope} .r3-cat-item:active { cursor:grabbing; }

/* ── ZOOM BUTTONS ── */
#${scope} .r3-zoom-btns { position:absolute; bottom:44px; right:12px; display:flex; flex-direction:column; gap:4px; z-index:6; }
#${scope} .r3-zoom-btn  { width:30px; height:30px; background:var(--r3-panel); border:1px solid var(--r3-border); color:var(--r3-text); border-radius:4px; cursor:pointer; font-size:18px; line-height:1; display:flex; align-items:center; justify-content:center; transition:all .2s; }
#${scope} .r3-zoom-btn:hover { border-color:var(--r3-accent); color:var(--r3-accent); background:var(--r3-accent)11; }

/* ── LABEL TOGGLE ── */
#${scope} .r3-ltoggle { pointer-events:all !important; }
`;

}
