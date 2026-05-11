// App.jsx
import { useEffect, useRef } from 'react';
import { Rack3DVisualizer } from 'rack3d-visualizer';

const RACK_A = {
  name: 'RACK-A', units: 42,
  rackTemp: 38, pduCapacity: 4000, pduLoad: 2100,
  devices: [
    { id: 'd1', name: 'Core Router',   type: 'router',   startUnit: 1,  heightUnits: 2, watts: 450 },
    { id: 'd2', name: 'Firewall FW-1', type: 'firewall', startUnit: 3,  heightUnits: 2, watts: 320 },
    { id: 'd3', name: 'Patch Panel A', type: 'patch',    startUnit: 5,  heightUnits: 1, watts: 0   },
    { id: 'd4', name: 'Switch 48p',    type: 'switch',   startUnit: 6,  heightUnits: 1, watts: 180 },
    { id: 'd5', name: 'Web Server 01', type: 'server',   startUnit: 7,  heightUnits: 2, watts: 620 },
    { id: 'd6', name: 'DB Server',     type: 'server',   startUnit: 9,  heightUnits: 4, watts: 850 },
    { id: 'd7', name: 'NAS Storage',   type: 'storage',  startUnit: 14, heightUnits: 3, watts: 290 },
    { id: 'd8', name: 'IDS Sensor',    type: 'security', startUnit: 18, heightUnits: 1, watts: 95  },
    { id: 'd9', name: 'Backup Server', type: 'server',   startUnit: 20, heightUnits: 2, watts: 410 },
    { id: 'd10',name: 'PDU-A',         type: 'pdu',      startUnit: 23, heightUnits: 1, watts: 30  }
  ],
};

const RACK_B = {
  name: 'RACK-B', units: 14,
  rackTemp: 52, pduCapacity: 4000, pduLoad: 3800,
  devices: [
    { id: 'b1', name: 'Load Balancer', type: 'loadbal',
      startUnit: 1, heightUnits: 1, watts: 200,
      imageUrl: '/images/cisco-router.jpg',
      status:   'up',
      ip:       '10.0.0.1',
      fields: [
        { icon: '🏷',  label: 'Model',  value: 'ASR-1001-X' },
        { icon: '📡',  label: 'VLAN',   value: '100' }
      ],
    },
    { id: 'b2', name: 'App Server 01', type: 'server',
      startUnit: 2, heightUnits: 2, watts: 620,
      ip:     '10.0.0.254',
      fields: [{ icon: '🛡', label: 'Policy', value: 'PROD-FW-v3' }],
    },
    { id: 'b3', name: 'App Server 02', type: 'server',  startUnit: 4, heightUnits: 2, watts: 620 },
    { id: 'b4', name: 'NAS Storage',   type: 'storage', startUnit: 6, heightUnits: 3, watts: 290 },
    { id: 'b5', name: 'PDU-B',         type: 'pdu',     startUnit: 9, heightUnits: 1, watts: 30  },
    // Half-width demo: two patch panels sharing unit 10
    { id: 'b6', name: 'Patch-L',   type: 'patch',  startUnit: 10, heightUnits: 1, watts: 0, halfWidth: 'left'  },
    { id: 'b7', name: 'Patch-R',   type: 'patch',  startUnit: 10, heightUnits: 1, watts: 0, halfWidth: 'right' },
    { id: 'b8', name: 'KVM Switch', type: 'kvm',   startUnit: 11, heightUnits: 1, watts: 45 },
  ],
};

const RACK_C = {
  name: 'RACK-C', units: 12,
  rackTemp: 29, pduCapacity: 4000, pduLoad: 800,
  devices: [
    { id: 'c1', name: 'IDS Sensor',    type: 'security', startUnit: 1, heightUnits: 1, watts: 95  },
    { id: 'c2', name: 'Patch Panel A', type: 'patch',    startUnit: 2, heightUnits: 1, watts: 0   },
    { id: 'c3', name: 'KVM Switch',    type: 'kvm',      startUnit: 3, heightUnits: 1, watts: 45  },
    { id: 'c4', name: 'Backup Server', type: 'server',   startUnit: 4, heightUnits: 2, watts: 410 },
    { id: 'c5', name: 'UPS Unit',      type: 'ups',      startUnit: 7, heightUnits: 3, watts: 180 },
  ],
};

function RackInstance({ data, theme = 'dark' }) {
  const containerRef = useRef(null);
  const vizRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    vizRef.current = new Rack3DVisualizer(containerRef.current, {
      theme,
      camera:  { azimuth: Math.PI, elevation: 0.15, distance: 'auto' },
      sidebar: { width: 240 },
      lighting: { shadows: false, overheadCount: 2 },
      labels:  { enabled: true, side: 'auto' },
      room: {
        enabled:         true,
        width:           26,       // metres
        depth:           40,
        height:          24,
        floorTiles:      true,     // Raised floor 0.6 m tile grid
        ceilingGrid:     true,     // T-bar drop ceiling grid
        stripLights:     true,     // Emissive fluorescent strips
        baseboardLights: true,     // Blue LED floor accent
        exitSign:        false,     // Green exit sign on rear wall
        cableTrays:      false,     // Wall-mounted cable management
        fogNear:         22,       // Fog start distance
        fogFar:          55,       // Fog full-density distance
      },
    });

    vizRef.current.setData(data);

    return () => {
      vizRef.current?.destroy();
      vizRef.current = null;
    };
  }, []);

  useEffect(() => { vizRef.current?.setData(data);   }, [data]);
  useEffect(() => { vizRef.current?.setTheme(theme); }, [theme]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

export default function App() {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', background: '#070c14', gap: '1px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <RackInstance data={RACK_B} theme="light" />
      </div>
      {/* <div style={{ flex: 1, minWidth: 0 }}>
        <RackInstance data={RACK_C} theme="warm" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <RackInstance data={RACK_A} theme="oled" />
      </div> */}
    </div>
  );
}