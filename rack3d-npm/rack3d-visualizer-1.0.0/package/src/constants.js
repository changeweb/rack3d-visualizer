// ─────────────────────────────────────────────────────────────
//  Device type registry — extend with custom types via options
// ─────────────────────────────────────────────────────────────
export const DEVICE_TYPES = {
  server:   { color: '#2288ff', hex: 0x2288ff, label: 'Server',      icon: '▣' },
  firewall: { color: '#ff3344', hex: 0xff3344, label: 'Firewall',    icon: '⬡' },
  router:   { color: '#00cc77', hex: 0x00cc77, label: 'Router',      icon: '◈' },
  switch:   { color: '#ffaa00', hex: 0xffaa00, label: 'Switch',      icon: '⬢' },
  security: { color: '#ff55cc', hex: 0xff55cc, label: 'Security',    icon: '◆' },
  storage:  { color: '#9966ff', hex: 0x9966ff, label: 'Storage',     icon: '▤' },
  pdu:      { color: '#00ddcc', hex: 0x00ddcc, label: 'PDU',         icon: '⚡' },
  patch:    { color: '#888888', hex: 0x888888, label: 'Patch Panel', icon: '⊞' },
  ups:      { color: '#ff8800', hex: 0xff8800, label: 'UPS',         icon: '🔋' },
  kvm:      { color: '#44aaff', hex: 0x44aaff, label: 'KVM',         icon: '⌨'  },
  loadbal:  { color: '#cc44ff', hex: 0xcc44ff, label: 'Load Balancer',icon:'⚖' },
};

// Temperature thresholds → color
export const TEMP_COLORS = [
  { max: 35,  color: '#00ff88', hex: 0x00ff88 },
  { max: 50,  color: '#ffaa00', hex: 0xffaa00 },
  { max: 60,  color: '#ff6600', hex: 0xff6600 },
  { max: Infinity, color: '#ff2233', hex: 0xff2233 },
];

export function tempColor(t) {
  return (TEMP_COLORS.find(c => t < c.max) || TEMP_COLORS[TEMP_COLORS.length - 1]).color;
}

export function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export function hexStrToNum(hex) {
  return parseInt(hex.replace('#', ''), 16);
}
