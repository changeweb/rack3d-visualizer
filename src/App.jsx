// App.jsx
import { useEffect, useRef } from 'react';
import { Rack3DVisualizer } from 'rack3d-visualizer';
import { ROOM_DATA } from './roomData.js';

function RoomInstance({ data, theme = 'light' }) {
  const containerRef = useRef(null);
  const vizRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let liveInterval = null;
    vizRef.current = new Rack3DVisualizer(containerRef.current, {
      theme,
      camera: { mode: 'fps', fpsSpeed: 0.14, azimuth: Math.PI, elevation: 0.15, distance: 'auto',
                initialPos: { x: 0, y: 16, z: -38 } },
      sidebar: { width: 240 },
      lighting: {
        shadows: true,
        overheadCount: 10,
        overheadIntensity: 6.5,
        ambientIntensity: 5.5,
        exposure: 4.1,
      },
      labels: { enabled: true, side: 'auto' },
      room: {
        enabled:         true,
        width:           140,
        depth:           100,
        height:          35,
        floorTiles:      true,
        tileSize:        2,
        ceilingGrid:     true,
        stripLights:     true,
        baseboardLights: true,
        exitSign:        false,
        cableTrays:      false,
        fogNear:         60,
        fogFar:          140,
      },
      onReady: (viz) => {
        liveInterval = setInterval(() => {
          data.racks.forEach(r => {
            viz.updateRackStats(r.id, {
              rackTemp: +(18 + Math.random() * 25).toFixed(1),
              pduLoad:  Math.floor(r.pduCapacity * (0.3 + Math.random() * 0.7)),
            });
            (r.devices || []).slice(0, 3).forEach(dev => {
              const s = ['up', 'up', 'up', 'warn', 'down'][Math.floor(Math.random() * 5)];
              viz.updateDeviceFields(r.id, dev.id, {
                status: s,
                fields: [
                  { icon: '💻', label: 'CPU', value: Math.round(Math.random() * 100) + '%' },
                  { icon: '💾', label: 'MEM', value: Math.round(Math.random() * 100) + '%' },
                ],
              });
            });
          });
        }, 2000);
      },
    });
    vizRef.current.setRoomData(data);

    return () => { clearInterval(liveInterval); vizRef.current?.destroy(); vizRef.current = null; };
  }, []);

  useEffect(() => { vizRef.current?.setRoomData(data); }, [data]);
  useEffect(() => { vizRef.current?.setTheme(theme);   }, [theme]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

export default function App() {
  return (
    <div style={{ height: '100vh', background: '#f0f4f8' }}>
      <RoomInstance data={ROOM_DATA} theme="light" />
    </div>
  );
}
