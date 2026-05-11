/**
 * rack3d-visualizer — React wrapper component
 *
 * Usage:
 *   import RackViewer from './RackViewer';
 *   <RackViewer data={myRack} theme="dark" options={{ view: { autoRotate: true } }} />
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { Rack3DVisualizer } from 'rack3d-visualizer';

/**
 * @param {Object}   props
 * @param {Object}   props.data          - Rack JSON data object
 * @param {string}   [props.theme]       - Theme name ('dark'|'light'|'oled'|'warm'|'matrix')
 * @param {Object}   [props.options]     - Full Rack3DOptions (merged over defaults)
 * @param {Function} [props.onSelect]    - Called when a device is clicked
 * @param {Function} [props.onChange]    - Called on any data mutation
 * @param {Function} [props.onReady]     - Called when scene initialises
 * @param {string}   [props.className]   - Extra CSS class for the wrapper div
 * @param {Object}   [props.style]       - Inline style for the wrapper div
 */
export default function RackViewer({
  data,
  theme = 'dark',
  options = {},
  onSelect,
  onChange,
  onReady,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);
  const vizRef       = useRef(null);

  // ── Initialise once ──────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    vizRef.current = new Rack3DVisualizer(containerRef.current, {
      theme,
      ...options,
      onSelect: onSelect || options.onSelect,
      onChange: onChange || options.onChange,
      onReady:  onReady  || options.onReady,
    });

    if (data) vizRef.current.setData(data);

    return () => {
      if (vizRef.current) vizRef.current.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── React to data changes ────────────────────────────────
  useEffect(() => {
    if (vizRef.current && data) vizRef.current.setData(data);
  }, [data]);

  // ── React to theme changes ───────────────────────────────
  useEffect(() => {
    if (vizRef.current && theme) vizRef.current.setTheme(theme);
  }, [theme]);

  // ── React to option changes ──────────────────────────────
  useEffect(() => {
    if (vizRef.current && options) vizRef.current.setOptions(options);
  }, [options]);

  return (
    <div
      ref={containerRef}
      className={`rack3d-wrapper ${className}`}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}

// ── Usage example (standalone app) ─────────────────────────
export function RackViewerDemo() {
  const [theme, setTheme]       = React.useState('dark');
  const [autoRotate, setAutoR]  = React.useState(false);
  const [selected, setSelected] = React.useState(null);

  const rackData = {
    name: 'PROD-RACK-01', units: 24,
    rackTemp: 38, pduCapacity: 6400, pduLoad: 3215,
    devices: [
      { id: 'd1', name: 'Core Router',  type: 'router',   startUnit: 1,  heightUnits: 2, watts: 450 },
      { id: 'd2', name: 'Firewall',     type: 'firewall', startUnit: 3,  heightUnits: 2, watts: 320 },
      { id: 'd3', name: 'Switch 48p',   type: 'switch',   startUnit: 5,  heightUnits: 1, watts: 180 },
      { id: 'd4', name: 'Web Server',   type: 'server',   startUnit: 6,  heightUnits: 2, watts: 620 },
      { id: 'd5', name: 'DB Server',    type: 'server',   startUnit: 8,  heightUnits: 4, watts: 850 },
      { id: 'd6', name: 'NAS Storage',  type: 'storage',  startUnit: 13, heightUnits: 3, watts: 290 },
      { id: 'd7', name: 'IDS Sensor',   type: 'security', startUnit: 17, heightUnits: 1, watts: 95  },
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#060a10' }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid #1e2d45', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: '#00d4ff', fontFamily: 'monospace', fontSize: 12, letterSpacing: 2 }}>RACK3D REACT</span>
        {['dark','light','oled','warm','matrix'].map(t => (
          <button key={t} onClick={() => setTheme(t)}
            style={{ padding: '3px 10px', borderRadius: 3, border: `1px solid ${theme===t?'#00d4ff':'#2a3a55'}`,
              background: theme===t?'#00d4ff11':'transparent', color: theme===t?'#00d4ff':'#8b949e',
              cursor: 'pointer', fontFamily: 'monospace', fontSize: 10 }}>
            {t}
          </button>
        ))}
        <button onClick={() => setAutoR(v => !v)}
          style={{ padding: '3px 10px', borderRadius: 3, border: `1px solid ${autoRotate?'#00d4ff':'#2a3a55'}`,
            background: autoRotate?'#00d4ff11':'transparent', color: autoRotate?'#00d4ff':'#8b949e',
            cursor: 'pointer', fontFamily: 'monospace', fontSize: 10 }}>
          {autoRotate ? '⏸ STOP' : '▶ ROTATE'}
        </button>
        {selected && (
          <span style={{ color: '#ffaa00', fontFamily: 'monospace', fontSize: 10, marginLeft: 12 }}>
            Selected: {selected.name} ({selected.type})
          </span>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <RackViewer
          data={rackData}
          theme={theme}
          options={{ view: { autoRotate, autoRotateSpeed: 0.004 } }}
          onSelect={setSelected}
        />
      </div>
    </div>
  );
}
