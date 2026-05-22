// App.jsx
import { useEffect, useRef } from 'react';
import { Rack3DVisualizer } from 'rack3d-visualizer';

const ROOM_DATA = {
  layout: { rows: 1, cols: 3, colSpacing: 8, rowSpacing: 12 },
  room_items: [
    { id: 'ri-1', type: 'ups',     name: 'UPS-Main',   label: 'Primary UPS',  x: -20, y: 0, z: -8,  angle: 0,   color: '#2a3a50' },
    { id: 'ri-2', type: 'battery', name: 'BAT-01',     label: 'Battery Bank', x: -20, y: 0, z: 0,   angle: 0,   color: '#111a11' },
    { id: 'ri-3', type: 'aircon',  name: 'CRAC-01',    label: 'Cooling Unit', x: 18,  y: 0, z: -5,  angle: 180, color: '#2d4055', width: 4, height: 12, depth: 2 },
    { id: 'ri-4', type: 'sensor',  name: 'TEMP-01',    label: 'Temp Sensor',  x: 0,   y: 0, z: -18, angle: 0 },
    { id: 'ri-5', type: 'pdu',     name: 'PDU-Floor',  label: 'Floor PDU',    x: -8,  y: 0, z: 10,  angle: 90 },
    { id: 'ri-6', type: 'shelf',   name: 'SHELF-01',   label: 'Cable Shelf',  x: 8,   y: 0, z: 10,  angle: 0,  layers: 4 },
  ],
  racks: [
    {
      id: 'rack-a', row: 0, col: 0,
      name: 'RACK-A', units: 42,
      rackTemp: 38, pduCapacity: 4000, pduLoad: 2100,
      devices: [
        { id: 'd1',  name: 'Core Router',   type: 'router',   startUnit: 1,  heightUnits: 2, watts: 450 },
        { id: 'd2',  name: 'Firewall FW-1', type: 'firewall', startUnit: 3,  heightUnits: 2, watts: 320 },
        { id: 'd3',  name: 'Patch Panel A', type: 'patch',    startUnit: 5,  heightUnits: 1, watts: 0   },
        { id: 'd4',  name: 'Switch 48p',    type: 'switch',   startUnit: 6,  heightUnits: 1, watts: 180 },
        { id: 'd5',  name: 'Web Server 01', type: 'server',   startUnit: 7,  heightUnits: 2, watts: 620,
          vms: [
            { id:'vm-1', name:'nginx-prod', label:'Production Web', technology:'KVM/QEMU', os:'Ubuntu 22.04 LTS',
              status:'running', ips:{ local:'192.168.1.10', public:'203.0.113.10' },
              ports:[{port:80,protocol:'TCP',status:'open',service:'HTTP'},{port:443,protocol:'TCP',status:'open',service:'HTTPS'},{port:22,protocol:'TCP',status:'closed',service:'SSH'}],
              resources:{ vcpu:4, memory:8192, disk:100 } },
            { id:'vm-2', name:'redis-cache', label:'Cache Layer', technology:'KVM/QEMU', os:'Alpine Linux 3.18',
              status:'running', ips:{ local:'192.168.1.11' },
              ports:[{port:6379,protocol:'TCP',status:'open',service:'Redis'}],
              resources:{ vcpu:2, memory:4096, disk:20 } },
            { id:'vm-3', name:'monitor-vm', label:'Monitoring', technology:'Docker', os:'Debian 12',
              status:'paused', ips:{ local:'192.168.1.12' },
              ports:[{port:9090,protocol:'TCP',status:'open',service:'Prometheus'},{port:3000,protocol:'TCP',status:'open',service:'Grafana'}],
              resources:{ vcpu:2, memory:2048, disk:50 } },
          ]
        },
        { id: 'd6',  name: 'DB Server',     type: 'server',   startUnit: 9,  heightUnits: 4, watts: 850 },
        { id: 'd7',  name: 'NAS Storage',   type: 'storage',  startUnit: 14, heightUnits: 3, watts: 290 },
        { id: 'd8',  name: 'IDS Sensor',    type: 'security', startUnit: 18, heightUnits: 1, watts: 95  },
        { id: 'd9',  name: 'Backup Server', type: 'server',   startUnit: 20, heightUnits: 2, watts: 410 },
        { id: 'd10', name: 'PDU-A',         type: 'pdu',      startUnit: 23, heightUnits: 1, watts: 30  },
      ],
    },
    {
      id: 'rack-b', row: 0, col: 1,
      name: 'RACK-B', units: 14,
      rackTemp: 52, pduCapacity: 4000, pduLoad: 3800,
      devices: [
        { id: 'b1', name: 'Load Balancer', type: 'loadbal', startUnit: 1, heightUnits: 1, watts: 200,
          imageUrl: '/images/cisco-router.jpg', status: 'up', ip: '10.0.0.1',
          fields: [{ icon: '🏷', label: 'Model', value: 'ASR-1001-X' }, { icon: '📡', label: 'VLAN', value: '100' }] },
        { id: 'b2', name: 'App Server 01', type: 'server',  startUnit: 2, heightUnits: 2, watts: 620, ip: '10.0.0.254' },
        { id: 'b3', name: 'App Server 02', type: 'server',  startUnit: 4, heightUnits: 2, watts: 620 },
        { id: 'b4', name: 'NAS Storage',   type: 'storage', startUnit: 6, heightUnits: 3, watts: 290 },
        { id: 'b5', name: 'PDU-B',         type: 'pdu',     startUnit: 9, heightUnits: 1, watts: 30  },
        { id: 'b6', name: 'Patch-L',   type: 'patch', startUnit: 10, heightUnits: 1, watts: 0, halfWidth: 'left'  },
        { id: 'b7', name: 'Patch-R',   type: 'patch', startUnit: 10, heightUnits: 1, watts: 0, halfWidth: 'right' },
        { id: 'b8', name: 'KVM Switch', type: 'kvm',  startUnit: 11, heightUnits: 1, watts: 45 },
      ],
    },
    {
      id: 'rack-c', row: 0, col: 2,
      position: { x: 8, z: 2 },   // explicit world position overrides row/col
      name: 'RACK-C', units: 12,
      rackTemp: 29, pduCapacity: 4000, pduLoad: 800,
      devices: [
        { id: 'c1', name: 'IDS Sensor',    type: 'security', startUnit: 1, heightUnits: 1, watts: 95  },
        { id: 'c2', name: 'Patch Panel A', type: 'patch',    startUnit: 2, heightUnits: 1, watts: 0   },
        { id: 'c3', name: 'KVM Switch',    type: 'kvm',      startUnit: 3, heightUnits: 1, watts: 45  },
        { id: 'c4', name: 'Backup Server', type: 'server',   startUnit: 4, heightUnits: 2, watts: 410 },
        { id: 'c5', name: 'UPS Unit',      type: 'ups',      startUnit: 7, heightUnits: 3, watts: 180 },
      ],
    },
  ],
};

function RoomInstance({ data, theme = 'dark' }) {
  const containerRef = useRef(null);
  const vizRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    vizRef.current = new Rack3DVisualizer(containerRef.current, {
      theme,
      camera: { mode: 'fps', fpsSpeed: 0.12, azimuth: Math.PI, elevation: 0.15, distance: 'auto' },
      sidebar: { width: 240 },
      lighting: { shadows: true, overheadCount: 10, overheadIntensity: 9.5, ambientIntensity: 17, exposure: 2.3 },
      labels: { enabled: true, side: 'auto' },
      room: {
        enabled:         true,
        width:           60,
        depth:           60,
        height:          35,
        floorTiles:      true,
        tileSize:        2,
        ceilingGrid:     true,
        stripLights:     true,
        baseboardLights: true,
        exitSign:        false,
        cableTrays:      false,
        fogNear:         35,
        fogFar:          110,
      },
    });
    vizRef.current.setRoomData(data);
    return () => { vizRef.current?.destroy(); vizRef.current = null; };
  }, []);

  useEffect(() => { vizRef.current?.setRoomData(data); }, [data]);
  useEffect(() => { vizRef.current?.setTheme(theme);   }, [theme]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

export default function App() {
  return (
    <div style={{ height: '100vh', background: '#070c14' }}>
      <RoomInstance data={ROOM_DATA} theme="light" />
    </div>
  );
}
