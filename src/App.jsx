// App.jsx
import { useEffect, useRef } from 'react';
import { Rack3DVisualizer } from 'rack3d-visualizer';

const ROOM_DATA = {
  name: 'DC-MAIN / Level-1',
  layout: { rows: 1, cols: 1, colSpacing: 8, rowSpacing: 10 },

  room_pillars: [
    { id: 'pil-1', x: -55, z: -35, shape: 'square', width: 3.5, depth: 3.5, height: 35, color: '#c8cfd8' },
    { id: 'pil-2', x:  55, z: -35, shape: 'square', width: 3.5, depth: 3.5, height: 35, color: '#c8cfd8' },
    { id: 'pil-3', x: -55, z:  35, shape: 'square', width: 3.5, depth: 3.5, height: 35, color: '#c8cfd8' },
    { id: 'pil-4', x:  55, z:  35, shape: 'square', width: 3.5, depth: 3.5, height: 35, color: '#c8cfd8' },
    { id: 'pil-5', x:   0, z: -35, shape: 'square', width: 3.5, depth: 3.5, height: 35, color: '#c8cfd8' },
  ],

  room_items: [
    // ── Left-wall battery banks ──────────────────────────────────
    // sh-1: 4 layers, height=8
    { id: 'sh-1', type: 'shelf', name: 'BAT-SHELF-1', label: 'Battery Bank 1',
      x: -55, y: 0, z: -22, angle: 90, color: '#3a4a5a', width: 7, height: 8, depth: 2.2, layers: 4 },
    ...Array.from({ length: 4 }, (_, layer) =>
      Array.from({ length: 3 }, (_, col) => ({
        id: `bat-1-${layer}-${col}`, type: 'battery',
        name: `BAT-1-${layer * 3 + col + 1}`, label: `BAT-1-${layer * 3 + col + 1}`,
        x: -55, y: layer * 2.0 + 0.06, z: -22 + (col - 1) * 1.85,
        angle: 90, color: '#1a2a1a', width: 1.7, height: 1.45, depth: 1.3,
      }))
    ).flat(),

    // sh-2: 3 layers, height=6.5
    { id: 'sh-2', type: 'shelf', name: 'BAT-SHELF-2', label: 'Battery Bank 2',
      x: -55, y: 0, z: -10, angle: 90, color: '#3a4a5a', width: 7, height: 6.5, depth: 2.2, layers: 3 },
    ...Array.from({ length: 3 }, (_, layer) =>
      Array.from({ length: 3 }, (_, col) => ({
        id: `bat-2-${layer}-${col}`, type: 'battery',
        name: `BAT-2-${layer * 3 + col + 1}`, label: `BAT-2-${layer * 3 + col + 1}`,
        x: -55, y: layer * (6.5 / 3) + 0.06, z: -10 + (col - 1) * 1.85,
        angle: 90, color: '#1a2a1a', width: 1.7, height: 1.45, depth: 1.3,
      }))
    ).flat(),

    // sh-3: 4 layers, height=9
    { id: 'sh-3', type: 'shelf', name: 'BAT-SHELF-3', label: 'Battery Bank 3',
      x: -55, y: 0, z: 6, angle: 90, color: '#3a4a5a', width: 7, height: 9, depth: 2.2, layers: 4 },
    ...Array.from({ length: 4 }, (_, layer) =>
      Array.from({ length: 3 }, (_, col) => ({
        id: `bat-3-${layer}-${col}`, type: 'battery',
        name: `BAT-3-${layer * 3 + col + 1}`, label: `BAT-3-${layer * 3 + col + 1}`,
        x: -55, y: layer * 2.25 + 0.06, z: 6 + (col - 1) * 1.85,
        angle: 90, color: '#1a2a1a', width: 1.7, height: 1.45, depth: 1.3,
      }))
    ).flat(),

    // ── Back-wall battery banks ──────────────────────────────────
    // sh-4: 3 layers, height=6.5
    { id: 'sh-4', type: 'shelf', name: 'BAT-SHELF-4', label: 'Battery Bank 4',
      x: -30, y: 0, z: 43, angle: 0, color: '#3a4a5a', width: 7, height: 6.5, depth: 2.2, layers: 3 },
    ...Array.from({ length: 3 }, (_, layer) =>
      Array.from({ length: 3 }, (_, col) => ({
        id: `bat-4-${layer}-${col}`, type: 'battery',
        name: `BAT-4-${layer * 3 + col + 1}`, label: `BAT-4-${layer * 3 + col + 1}`,
        x: -30 + (col - 1) * 1.85, y: layer * (6.5 / 3) + 0.06, z: 43,
        angle: 0, color: '#1a2a1a', width: 1.7, height: 1.45, depth: 1.3,
      }))
    ).flat(),

    // sh-5: 4 layers, height=8
    { id: 'sh-5', type: 'shelf', name: 'BAT-SHELF-5', label: 'Battery Bank 5',
      x: -15, y: 0, z: 43, angle: 0, color: '#3a4a5a', width: 7, height: 8, depth: 2.2, layers: 4 },
    ...Array.from({ length: 4 }, (_, layer) =>
      Array.from({ length: 3 }, (_, col) => ({
        id: `bat-5-${layer}-${col}`, type: 'battery',
        name: `BAT-5-${layer * 3 + col + 1}`, label: `BAT-5-${layer * 3 + col + 1}`,
        x: -15 + (col - 1) * 1.85, y: layer * 2.0 + 0.06, z: 43,
        angle: 0, color: '#1a2a1a', width: 1.7, height: 1.45, depth: 1.3,
      }))
    ).flat(),

    // ── UPS units ────────────────────────────────────────────────
    { id: 'ri-ups-1', type: 'ups', name: 'UPS-A', label: 'UPS Primary',
      x: -50, y: 0, z: -32, angle: 90, color: '#2a3a50', width: 3.5, height: 9, depth: 2 },
    { id: 'ri-ups-2', type: 'ups', name: 'UPS-B', label: 'UPS Redundant',
      x: -50, y: 0, z: -27, angle: 90, color: '#2a3a50', width: 3.5, height: 9, depth: 2 },

    // ── CRAC cooling units ───────────────────────────────────────
    { id: 'ri-crac-1', type: 'aircon', name: 'CRAC-1', label: 'Cooling Unit 1',
      x: 55, y: 0, z: -15, angle: 180, color: '#2d4055', width: 4.5, height: 13, depth: 2.2 },
    { id: 'ri-crac-2', type: 'aircon', name: 'CRAC-2', label: 'Cooling Unit 2',
      x: 55, y: 0, z:   5, angle: 180, color: '#2d4055', width: 4.5, height: 13, depth: 2.2 },
  ],

  racks: [
    // ── Row A – 8× 42U production racks (z=-10) ─────────────────
    {
      id: 'rack-a1', name: 'PROD-01', units: 42,
      position: { x: -28, z: -10 }, facingAngle: 0,
      rackTemp: 36, pduCapacity: 6000, pduLoad: 4800,
      devices: [
        { id: 'a1-d1',  name: 'Core Router',    type: 'router',   startUnit: 1,  heightUnits: 2, watts: 480 },
        { id: 'a1-d2',  name: 'Firewall FW-A',  type: 'firewall', startUnit: 3,  heightUnits: 2, watts: 340 },
        { id: 'a1-d3',  name: 'Patch Panel A',  type: 'patch',    startUnit: 5,  heightUnits: 1, watts: 0 },
        { id: 'a1-d4',  name: 'Core Switch 1',  type: 'switch',   startUnit: 6,  heightUnits: 1, watts: 195 },
        { id: 'a1-d5',  name: 'Web Svr 01',     type: 'server',   startUnit: 7,  heightUnits: 2, watts: 650,
          vms: [
            { id: 'vm-1', name: 'nginx-prod', label: 'Production Web', technology: 'KVM/QEMU', os: 'Ubuntu 22.04',
              status: 'running', ips: { local: '192.168.1.10', public: '203.0.113.10' },
              ports: [{ port: 80, protocol: 'TCP', status: 'open', service: 'HTTP' }, { port: 443, protocol: 'TCP', status: 'open', service: 'HTTPS' }],
              resources: { vcpu: 4, memory: 8192, disk: 100 } },
            { id: 'vm-2', name: 'redis-cache', label: 'Cache Layer', technology: 'KVM/QEMU', os: 'Alpine 3.18',
              status: 'running', ips: { local: '192.168.1.11' },
              ports: [{ port: 6379, protocol: 'TCP', status: 'open', service: 'Redis' }],
              resources: { vcpu: 2, memory: 4096, disk: 20 } },
          ] },
        { id: 'a1-d6',  name: 'App Svr 01',     type: 'server',   startUnit: 9,  heightUnits: 2, watts: 620 },
        { id: 'a1-d7',  name: 'App Svr 02',     type: 'server',   startUnit: 11, heightUnits: 2, watts: 620 },
        { id: 'a1-d8',  name: 'DB Primary',     type: 'server',   startUnit: 13, heightUnits: 4, watts: 890 },
        { id: 'a1-d9',  name: 'NAS Storage A',  type: 'storage',  startUnit: 17, heightUnits: 3, watts: 310 },
        { id: 'a1-d10', name: 'IDS Sensor',     type: 'security', startUnit: 20, heightUnits: 1, watts: 95 },
        { id: 'a1-d11', name: 'Backup Svr',     type: 'server',   startUnit: 21, heightUnits: 2, watts: 430 },
        { id: 'a1-d12', name: 'Compute Node 1', type: 'server',   startUnit: 23, heightUnits: 2, watts: 610 },
        { id: 'a1-d13', name: 'HPC Node 1',     type: 'server',   startUnit: 25, heightUnits: 4, watts: 740 },
        { id: 'a1-d14', name: 'App Svr 03',     type: 'server',   startUnit: 29, heightUnits: 2, watts: 600 },
        { id: 'a1-d15', name: 'Tape Library',   type: 'storage',  startUnit: 31, heightUnits: 3, watts: 290 },
        { id: 'a1-d16', name: 'Log Collector',  type: 'server',   startUnit: 34, heightUnits: 2, watts: 380 },
        { id: 'a1-d17', name: 'SAN Array A',    type: 'storage',  startUnit: 36, heightUnits: 4, watts: 420 },
        { id: 'a1-d18', name: 'KVM Console',    type: 'kvm',      startUnit: 40, heightUnits: 1, watts: 45 },
      ],
    },
    {
      id: 'rack-a2', name: 'PROD-02', units: 42,
      position: { x: -20, z: -10 }, facingAngle: 0,
      rackTemp: 38, pduCapacity: 6000, pduLoad: 4600,
      devices: [
        { id: 'a2-d1',  name: 'Load Balancer',  type: 'loadbal',  startUnit: 1,  heightUnits: 1, watts: 220 },
        { id: 'a2-d2',  name: 'App Svr 04',     type: 'server',   startUnit: 2,  heightUnits: 2, watts: 640 },
        { id: 'a2-d3',  name: 'App Svr 05',     type: 'server',   startUnit: 4,  heightUnits: 2, watts: 640 },
        { id: 'a2-d4',  name: 'App Svr 06',     type: 'server',   startUnit: 6,  heightUnits: 2, watts: 640 },
        { id: 'a2-d5',  name: 'DB Replica',     type: 'server',   startUnit: 8,  heightUnits: 4, watts: 870 },
        { id: 'a2-d6',  name: 'Cache Cluster',  type: 'server',   startUnit: 12, heightUnits: 2, watts: 520 },
        { id: 'a2-d7',  name: 'NAS Storage B',  type: 'storage',  startUnit: 14, heightUnits: 3, watts: 310 },
        { id: 'a2-d8',  name: 'KVM Switch',     type: 'kvm',      startUnit: 17, heightUnits: 1, watts: 45 },
        { id: 'a2-d9',  name: 'Patch Panel B',  type: 'patch',    startUnit: 18, heightUnits: 1, watts: 0 },
        { id: 'a2-d10', name: 'Auth Server',    type: 'server',   startUnit: 19, heightUnits: 2, watts: 380 },
        { id: 'a2-d11', name: 'API Gateway',    type: 'server',   startUnit: 21, heightUnits: 4, watts: 560 },
        { id: 'a2-d12', name: 'Metrics Svr',    type: 'server',   startUnit: 25, heightUnits: 2, watts: 350 },
        { id: 'a2-d13', name: 'Container Host', type: 'server',   startUnit: 27, heightUnits: 4, watts: 720 },
        { id: 'a2-d14', name: 'Deploy Server',  type: 'server',   startUnit: 31, heightUnits: 2, watts: 310 },
        { id: 'a2-d15', name: 'Object Store B', type: 'storage',  startUnit: 33, heightUnits: 3, watts: 280 },
        { id: 'a2-d16', name: 'SAN Array B',    type: 'storage',  startUnit: 36, heightUnits: 4, watts: 420 },
        { id: 'a2-d17', name: 'WAF Appliance',  type: 'security', startUnit: 40, heightUnits: 1, watts: 110 },
      ],
    },
    {
      id: 'rack-a3', name: 'PROD-03', units: 42,
      position: { x: -12, z: -10 }, facingAngle: 0,
      rackTemp: 33, pduCapacity: 6000, pduLoad: 4200,
      devices: [
        { id: 'a3-d1',  name: 'Firewall FW-B',  type: 'firewall', startUnit: 1,  heightUnits: 2, watts: 340 },
        { id: 'a3-d2',  name: 'Core Switch 2',  type: 'switch',   startUnit: 3,  heightUnits: 1, watts: 195 },
        { id: 'a3-d3',  name: 'Monitor Svr',    type: 'server',   startUnit: 4,  heightUnits: 2, watts: 480 },
        { id: 'a3-d4',  name: 'Log Aggregator', type: 'server',   startUnit: 6,  heightUnits: 2, watts: 520 },
        { id: 'a3-d5',  name: 'Object Storage', type: 'storage',  startUnit: 8,  heightUnits: 3, watts: 290 },
        { id: 'a3-d6',  name: 'IDS Cluster',    type: 'security', startUnit: 11, heightUnits: 2, watts: 190 },
        { id: 'a3-d7',  name: 'Vault Server',   type: 'server',   startUnit: 13, heightUnits: 2, watts: 320 },
        { id: 'a3-d8',  name: 'SIEM Node',      type: 'security', startUnit: 15, heightUnits: 2, watts: 350 },
        { id: 'a3-d9',  name: 'PKI Server',     type: 'server',   startUnit: 17, heightUnits: 2, watts: 280 },
        { id: 'a3-d10', name: 'Container Host', type: 'server',   startUnit: 19, heightUnits: 4, watts: 720 },
        { id: 'a3-d11', name: 'GitLab Runner',  type: 'server',   startUnit: 23, heightUnits: 2, watts: 450 },
        { id: 'a3-d12', name: 'CI/CD Node',     type: 'server',   startUnit: 25, heightUnits: 4, watts: 680 },
        { id: 'a3-d13', name: 'Config Mgmt',    type: 'server',   startUnit: 29, heightUnits: 2, watts: 310 },
        { id: 'a3-d14', name: 'Artifact Store', type: 'storage',  startUnit: 31, heightUnits: 3, watts: 260 },
        { id: 'a3-d15', name: 'Test Cluster',   type: 'server',   startUnit: 34, heightUnits: 4, watts: 700 },
        { id: 'a3-d16', name: 'KVM Console B',  type: 'kvm',      startUnit: 38, heightUnits: 1, watts: 45 },
        { id: 'a3-d17', name: 'NTP/DNS Svr',    type: 'server',   startUnit: 39, heightUnits: 2, watts: 210 },
      ],
    },
    {
      id: 'rack-a4', name: 'PROD-04', units: 42,
      position: { x: -4, z: -10 }, facingAngle: 0,
      rackTemp: 35, pduCapacity: 6000, pduLoad: 4700,
      devices: [
        { id: 'a4-d1',  name: 'Core Switch 3',  type: 'switch',   startUnit: 1,  heightUnits: 1, watts: 175 },
        { id: 'a4-d2',  name: 'Patch Panel C',  type: 'patch',    startUnit: 2,  heightUnits: 1, watts: 0 },
        { id: 'a4-d3',  name: 'Web Svr 04',     type: 'server',   startUnit: 3,  heightUnits: 2, watts: 650 },
        { id: 'a4-d4',  name: 'Web Svr 05',     type: 'server',   startUnit: 5,  heightUnits: 2, watts: 650 },
        { id: 'a4-d5',  name: 'App Svr 07',     type: 'server',   startUnit: 7,  heightUnits: 2, watts: 630 },
        { id: 'a4-d6',  name: 'App Svr 08',     type: 'server',   startUnit: 9,  heightUnits: 2, watts: 630 },
        { id: 'a4-d7',  name: 'App Svr 09',     type: 'server',   startUnit: 11, heightUnits: 2, watts: 630 },
        { id: 'a4-d8',  name: 'Compute Node 2', type: 'server',   startUnit: 13, heightUnits: 4, watts: 760 },
        { id: 'a4-d9',  name: 'Compute Node 3', type: 'server',   startUnit: 17, heightUnits: 2, watts: 680 },
        { id: 'a4-d10', name: 'Compute Node 4', type: 'server',   startUnit: 19, heightUnits: 2, watts: 680 },
        { id: 'a4-d11', name: 'Compute Node 5', type: 'server',   startUnit: 21, heightUnits: 4, watts: 780 },
        { id: 'a4-d12', name: 'Compute Node 6', type: 'server',   startUnit: 25, heightUnits: 2, watts: 670 },
        { id: 'a4-d13', name: 'Compute Node 7', type: 'server',   startUnit: 27, heightUnits: 2, watts: 670 },
        { id: 'a4-d14', name: 'Compute Node 8', type: 'server',   startUnit: 29, heightUnits: 4, watts: 770 },
        { id: 'a4-d15', name: 'Scheduler Svr',  type: 'server',   startUnit: 33, heightUnits: 2, watts: 340 },
        { id: 'a4-d16', name: 'Local Store C',  type: 'storage',  startUnit: 35, heightUnits: 3, watts: 260 },
        { id: 'a4-d17', name: 'Infra Svr 01',   type: 'server',   startUnit: 38, heightUnits: 2, watts: 480 },
        { id: 'a4-d18', name: 'Node Monitor',   type: 'security', startUnit: 40, heightUnits: 1, watts: 80 },
      ],
    },
    {
      id: 'rack-a5', name: 'PROD-05', units: 42,
      position: { x: 4, z: -10 }, facingAngle: 0,
      rackTemp: 30, pduCapacity: 6000, pduLoad: 3900,
      devices: [
        { id: 'a5-d1',  name: 'Switch 4',       type: 'switch',   startUnit: 1,  heightUnits: 1, watts: 175 },
        { id: 'a5-d2',  name: 'Patch Panel D',  type: 'patch',    startUnit: 2,  heightUnits: 1, watts: 0 },
        { id: 'a5-d3',  name: 'Storage Ctrl 1', type: 'server',   startUnit: 3,  heightUnits: 2, watts: 420 },
        { id: 'a5-d4',  name: 'SAN Array C',    type: 'storage',  startUnit: 5,  heightUnits: 4, watts: 490 },
        { id: 'a5-d5',  name: 'SAN Array D',    type: 'storage',  startUnit: 9,  heightUnits: 4, watts: 490 },
        { id: 'a5-d6',  name: 'SAN Array E',    type: 'storage',  startUnit: 13, heightUnits: 4, watts: 490 },
        { id: 'a5-d7',  name: 'Storage Ctrl 2', type: 'server',   startUnit: 17, heightUnits: 2, watts: 410 },
        { id: 'a5-d8',  name: 'NAS Array A',    type: 'storage',  startUnit: 19, heightUnits: 4, watts: 460 },
        { id: 'a5-d9',  name: 'NAS Array B',    type: 'storage',  startUnit: 23, heightUnits: 3, watts: 350 },
        { id: 'a5-d10', name: 'Backup Ctrl',    type: 'server',   startUnit: 26, heightUnits: 2, watts: 380 },
        { id: 'a5-d11', name: 'Tape Array A',   type: 'storage',  startUnit: 28, heightUnits: 4, watts: 310 },
        { id: 'a5-d12', name: 'Object Store C', type: 'storage',  startUnit: 32, heightUnits: 3, watts: 270 },
        { id: 'a5-d13', name: 'Archive Ctrl',   type: 'server',   startUnit: 35, heightUnits: 2, watts: 360 },
        { id: 'a5-d14', name: 'Tape Array B',   type: 'storage',  startUnit: 37, heightUnits: 4, watts: 310 },
      ],
    },
    {
      id: 'rack-a6', name: 'PROD-06', units: 42,
      position: { x: 12, z: -10 }, facingAngle: 0,
      rackTemp: 39, pduCapacity: 6000, pduLoad: 4900,
      devices: [
        { id: 'a6-d1',  name: 'DB Switch',      type: 'switch',   startUnit: 1,  heightUnits: 1, watts: 175 },
        { id: 'a6-d2',  name: 'DB Cluster 01',  type: 'server',   startUnit: 2,  heightUnits: 2, watts: 580 },
        { id: 'a6-d3',  name: 'DB Primary 02',  type: 'server',   startUnit: 4,  heightUnits: 4, watts: 920 },
        { id: 'a6-d4',  name: 'DB Replica 03',  type: 'server',   startUnit: 8,  heightUnits: 4, watts: 900 },
        { id: 'a6-d5',  name: 'DB Archive 04',  type: 'server',   startUnit: 12, heightUnits: 4, watts: 870 },
        { id: 'a6-d6',  name: 'DB Storage 01',  type: 'storage',  startUnit: 16, heightUnits: 3, watts: 380 },
        { id: 'a6-d7',  name: 'Analytics 01',   type: 'server',   startUnit: 19, heightUnits: 4, watts: 820 },
        { id: 'a6-d8',  name: 'DB Admin',       type: 'server',   startUnit: 23, heightUnits: 2, watts: 360 },
        { id: 'a6-d9',  name: 'DB Storage 02',  type: 'storage',  startUnit: 25, heightUnits: 3, watts: 360 },
        { id: 'a6-d10', name: 'OLAP Node 01',   type: 'server',   startUnit: 28, heightUnits: 4, watts: 840 },
        { id: 'a6-d11', name: 'DB Monitor',     type: 'server',   startUnit: 32, heightUnits: 2, watts: 320 },
        { id: 'a6-d12', name: 'DB Backup',      type: 'storage',  startUnit: 34, heightUnits: 3, watts: 290 },
        { id: 'a6-d13', name: 'ETL Server',     type: 'server',   startUnit: 37, heightUnits: 2, watts: 440 },
        { id: 'a6-d14', name: 'DB Firewall',    type: 'security', startUnit: 39, heightUnits: 1, watts: 95 },
        { id: 'a6-d15', name: 'KVM Console D',  type: 'kvm',      startUnit: 40, heightUnits: 1, watts: 45 },
      ],
    },
    {
      id: 'rack-a7', name: 'PROD-07', units: 42,
      position: { x: 20, z: -10 }, facingAngle: 0,
      rackTemp: 34, pduCapacity: 6000, pduLoad: 4500,
      devices: [
        { id: 'a7-d1',  name: 'Load Bal 02',    type: 'loadbal',  startUnit: 1,  heightUnits: 2, watts: 240 },
        { id: 'a7-d2',  name: 'Switch 5',       type: 'switch',   startUnit: 3,  heightUnits: 1, watts: 175 },
        { id: 'a7-d3',  name: 'Firewall FW-C',  type: 'firewall', startUnit: 4,  heightUnits: 2, watts: 340 },
        { id: 'a7-d4',  name: 'Web Svr 06',     type: 'server',   startUnit: 6,  heightUnits: 2, watts: 650 },
        { id: 'a7-d5',  name: 'Web Svr 07',     type: 'server',   startUnit: 8,  heightUnits: 2, watts: 650 },
        { id: 'a7-d6',  name: 'Web Svr 08',     type: 'server',   startUnit: 10, heightUnits: 2, watts: 650 },
        { id: 'a7-d7',  name: 'App Svr 10',     type: 'server',   startUnit: 12, heightUnits: 2, watts: 630 },
        { id: 'a7-d8',  name: 'App Svr 11',     type: 'server',   startUnit: 14, heightUnits: 2, watts: 630 },
        { id: 'a7-d9',  name: 'Micro Cluster',  type: 'server',   startUnit: 16, heightUnits: 4, watts: 760 },
        { id: 'a7-d10', name: 'App Svr 12',     type: 'server',   startUnit: 20, heightUnits: 2, watts: 620 },
        { id: 'a7-d11', name: 'App Svr 13',     type: 'server',   startUnit: 22, heightUnits: 2, watts: 620 },
        { id: 'a7-d12', name: 'App Svr 14',     type: 'server',   startUnit: 24, heightUnits: 2, watts: 620 },
        { id: 'a7-d13', name: 'App Svr 15',     type: 'server',   startUnit: 26, heightUnits: 2, watts: 620 },
        { id: 'a7-d14', name: 'K8s Master',     type: 'server',   startUnit: 28, heightUnits: 4, watts: 780 },
        { id: 'a7-d15', name: 'App Cache',      type: 'storage',  startUnit: 32, heightUnits: 3, watts: 280 },
        { id: 'a7-d16', name: 'Session Store',  type: 'server',   startUnit: 35, heightUnits: 2, watts: 350 },
        { id: 'a7-d17', name: 'API Svr 01',     type: 'server',   startUnit: 37, heightUnits: 2, watts: 510 },
        { id: 'a7-d18', name: 'Patch Panel E',  type: 'patch',    startUnit: 39, heightUnits: 1, watts: 0 },
        { id: 'a7-d19', name: 'KVM Console E',  type: 'kvm',      startUnit: 40, heightUnits: 1, watts: 45 },
      ],
    },
    {
      id: 'rack-a8', name: 'PROD-08', units: 42,
      position: { x: 28, z: -10 }, facingAngle: 0,
      rackTemp: 37, pduCapacity: 6000, pduLoad: 4600,
      devices: [
        { id: 'a8-d1',  name: 'Switch 6',       type: 'switch',   startUnit: 1,  heightUnits: 1, watts: 175 },
        { id: 'a8-d2',  name: 'Router B',       type: 'router',   startUnit: 2,  heightUnits: 1, watts: 210 },
        { id: 'a8-d3',  name: 'Patch Panel F',  type: 'patch',    startUnit: 3,  heightUnits: 1, watts: 0 },
        { id: 'a8-d4',  name: 'App Svr 16',     type: 'server',   startUnit: 4,  heightUnits: 2, watts: 630 },
        { id: 'a8-d5',  name: 'App Svr 17',     type: 'server',   startUnit: 6,  heightUnits: 2, watts: 630 },
        { id: 'a8-d6',  name: 'HPC Node 2',     type: 'server',   startUnit: 8,  heightUnits: 4, watts: 920 },
        { id: 'a8-d7',  name: 'App Svr 18',     type: 'server',   startUnit: 12, heightUnits: 2, watts: 630 },
        { id: 'a8-d8',  name: 'App Svr 19',     type: 'server',   startUnit: 14, heightUnits: 2, watts: 630 },
        { id: 'a8-d9',  name: 'HPC Node 3',     type: 'server',   startUnit: 16, heightUnits: 4, watts: 910 },
        { id: 'a8-d10', name: 'Batch Ctrl',     type: 'server',   startUnit: 20, heightUnits: 2, watts: 420 },
        { id: 'a8-d11', name: 'SAN Array F',    type: 'storage',  startUnit: 22, heightUnits: 3, watts: 340 },
        { id: 'a8-d12', name: 'Worker Node 1',  type: 'server',   startUnit: 25, heightUnits: 2, watts: 680 },
        { id: 'a8-d13', name: 'Worker Node 2',  type: 'server',   startUnit: 27, heightUnits: 4, watts: 760 },
        { id: 'a8-d14', name: 'Worker Node 3',  type: 'server',   startUnit: 31, heightUnits: 2, watts: 680 },
        { id: 'a8-d15', name: 'NAS Store D',    type: 'storage',  startUnit: 33, heightUnits: 3, watts: 290 },
        { id: 'a8-d16', name: 'HPC Node 4',     type: 'server',   startUnit: 36, heightUnits: 4, watts: 900 },
        { id: 'a8-d17', name: 'Fabric Switch',  type: 'security', startUnit: 40, heightUnits: 1, watts: 130 },
      ],
    },

    // ── Row D – 5× 42U production racks (z=-26) ─────────────────
    {
      id: 'rack-d1', name: 'PROD-09', units: 42,
      position: { x: -28, z: -26 }, facingAngle: 0,
      rackTemp: 28, pduCapacity: 6000, pduLoad: 3400,
      devices: [
        { id: 'd1-d1',  name: 'Switch DR',      type: 'switch',   startUnit: 1,  heightUnits: 1, watts: 175 },
        { id: 'd1-d2',  name: 'Patch Panel G',  type: 'patch',    startUnit: 2,  heightUnits: 1, watts: 0 },
        { id: 'd1-d3',  name: 'DR Archive 1',   type: 'storage',  startUnit: 3,  heightUnits: 4, watts: 380 },
        { id: 'd1-d4',  name: 'DR Archive 2',   type: 'storage',  startUnit: 7,  heightUnits: 4, watts: 380 },
        { id: 'd1-d5',  name: 'DR Archive 3',   type: 'storage',  startUnit: 11, heightUnits: 4, watts: 380 },
        { id: 'd1-d6',  name: 'DR Ctrl Svr 1',  type: 'server',   startUnit: 15, heightUnits: 2, watts: 360 },
        { id: 'd1-d7',  name: 'DR NAS 01',      type: 'storage',  startUnit: 17, heightUnits: 3, watts: 290 },
        { id: 'd1-d8',  name: 'DR Tape 01',     type: 'storage',  startUnit: 20, heightUnits: 4, watts: 310 },
        { id: 'd1-d9',  name: 'DR Ctrl Svr 2',  type: 'server',   startUnit: 24, heightUnits: 2, watts: 350 },
        { id: 'd1-d10', name: 'DR NAS 02',      type: 'storage',  startUnit: 26, heightUnits: 3, watts: 280 },
        { id: 'd1-d11', name: 'DR Vault Svr',   type: 'server',   startUnit: 29, heightUnits: 2, watts: 320 },
        { id: 'd1-d12', name: 'DR Tape 02',     type: 'storage',  startUnit: 31, heightUnits: 4, watts: 310 },
        { id: 'd1-d13', name: 'DR Monitor',     type: 'server',   startUnit: 35, heightUnits: 2, watts: 300 },
        { id: 'd1-d14', name: 'DR Object Store',type: 'storage',  startUnit: 37, heightUnits: 3, watts: 260 },
        { id: 'd1-d15', name: 'DR Security',    type: 'security', startUnit: 40, heightUnits: 1, watts: 90 },
      ],
    },
    {
      id: 'rack-d2', name: 'PROD-10', units: 42,
      position: { x: -20, z: -26 }, facingAngle: 0,
      rackTemp: 36, pduCapacity: 6000, pduLoad: 4600,
      devices: [
        { id: 'd2-d1',  name: 'Analytics Sw',   type: 'switch',   startUnit: 1,  heightUnits: 1, watts: 175 },
        { id: 'd2-d2',  name: 'Patch Panel H',  type: 'patch',    startUnit: 2,  heightUnits: 1, watts: 0 },
        { id: 'd2-d3',  name: 'Stream Ingest',  type: 'server',   startUnit: 3,  heightUnits: 2, watts: 520 },
        { id: 'd2-d4',  name: 'Hadoop Node 1',  type: 'server',   startUnit: 5,  heightUnits: 4, watts: 820 },
        { id: 'd2-d5',  name: 'Hadoop Node 2',  type: 'server',   startUnit: 9,  heightUnits: 4, watts: 820 },
        { id: 'd2-d6',  name: 'Spark Node 1',   type: 'server',   startUnit: 13, heightUnits: 4, watts: 800 },
        { id: 'd2-d7',  name: 'Query Engine',   type: 'server',   startUnit: 17, heightUnits: 2, watts: 560 },
        { id: 'd2-d8',  name: 'Spark Node 2',   type: 'server',   startUnit: 19, heightUnits: 4, watts: 800 },
        { id: 'd2-d9',  name: 'Data Proc 01',   type: 'server',   startUnit: 23, heightUnits: 2, watts: 580 },
        { id: 'd2-d10', name: 'Data Proc 02',   type: 'server',   startUnit: 25, heightUnits: 2, watts: 580 },
        { id: 'd2-d11', name: 'Spark Node 3',   type: 'server',   startUnit: 27, heightUnits: 4, watts: 800 },
        { id: 'd2-d12', name: 'Report Svr',     type: 'server',   startUnit: 31, heightUnits: 2, watts: 410 },
        { id: 'd2-d13', name: 'ML Training 1',  type: 'server',   startUnit: 33, heightUnits: 4, watts: 850 },
        { id: 'd2-d14', name: 'Data Catalog',   type: 'server',   startUnit: 37, heightUnits: 2, watts: 360 },
        { id: 'd2-d15', name: 'Analytics Sec',  type: 'security', startUnit: 39, heightUnits: 1, watts: 85 },
        { id: 'd2-d16', name: 'KVM Console F',  type: 'kvm',      startUnit: 40, heightUnits: 1, watts: 45 },
      ],
    },
    {
      id: 'rack-d3', name: 'PROD-11', units: 42,
      position: { x: -12, z: -26 }, facingAngle: 0,
      rackTemp: 40, pduCapacity: 6000, pduLoad: 5200,
      devices: [
        { id: 'd3-d1',  name: 'GPU Switch',     type: 'switch',   startUnit: 1,  heightUnits: 1, watts: 195 },
        { id: 'd3-d2',  name: 'Patch Panel I',  type: 'patch',    startUnit: 2,  heightUnits: 1, watts: 0 },
        { id: 'd3-d3',  name: 'GPU Node 1',     type: 'server',   startUnit: 3,  heightUnits: 4, watts: 1200 },
        { id: 'd3-d4',  name: 'GPU Node 2',     type: 'server',   startUnit: 7,  heightUnits: 4, watts: 1200 },
        { id: 'd3-d5',  name: 'GPU Node 3',     type: 'server',   startUnit: 11, heightUnits: 4, watts: 1200 },
        { id: 'd3-d6',  name: 'GPU Node 4',     type: 'server',   startUnit: 15, heightUnits: 4, watts: 1200 },
        { id: 'd3-d7',  name: 'GPU Node 5',     type: 'server',   startUnit: 19, heightUnits: 4, watts: 1200 },
        { id: 'd3-d8',  name: 'ML Ctrl Svr',    type: 'server',   startUnit: 23, heightUnits: 2, watts: 480 },
        { id: 'd3-d9',  name: 'CPU Node 1',     type: 'server',   startUnit: 25, heightUnits: 4, watts: 860 },
        { id: 'd3-d10', name: 'Infer Node',     type: 'server',   startUnit: 29, heightUnits: 2, watts: 520 },
        { id: 'd3-d11', name: 'CPU Node 2',     type: 'server',   startUnit: 31, heightUnits: 4, watts: 860 },
        { id: 'd3-d12', name: 'Model Store',    type: 'storage',  startUnit: 35, heightUnits: 3, watts: 310 },
        { id: 'd3-d13', name: 'Train Monitor',  type: 'server',   startUnit: 38, heightUnits: 2, watts: 360 },
        { id: 'd3-d14', name: 'Patch Panel J',  type: 'patch',    startUnit: 40, heightUnits: 1, watts: 0 },
      ],
    },
    {
      id: 'rack-d4', name: 'PROD-12', units: 42,
      position: { x: -4, z: -26 }, facingAngle: 0,
      rackTemp: 31, pduCapacity: 6000, pduLoad: 3800,
      devices: [
        { id: 'd4-d1',  name: 'Core Router A',  type: 'router',   startUnit: 1,  heightUnits: 2, watts: 480 },
        { id: 'd4-d2',  name: 'Core Router B',  type: 'router',   startUnit: 3,  heightUnits: 2, watts: 480 },
        { id: 'd4-d3',  name: 'Firewall A',     type: 'firewall', startUnit: 5,  heightUnits: 2, watts: 340 },
        { id: 'd4-d4',  name: 'Firewall B',     type: 'firewall', startUnit: 7,  heightUnits: 2, watts: 340 },
        { id: 'd4-d5',  name: 'Core Switch A',  type: 'switch',   startUnit: 9,  heightUnits: 1, watts: 195 },
        { id: 'd4-d6',  name: 'Core Switch B',  type: 'switch',   startUnit: 10, heightUnits: 1, watts: 195 },
        { id: 'd4-d7',  name: 'Dist Switch A',  type: 'switch',   startUnit: 11, heightUnits: 1, watts: 175 },
        { id: 'd4-d8',  name: 'Patch Panel K',  type: 'patch',    startUnit: 12, heightUnits: 1, watts: 0 },
        { id: 'd4-d9',  name: 'DNS Server 1',   type: 'server',   startUnit: 13, heightUnits: 2, watts: 280 },
        { id: 'd4-d10', name: 'DHCP Server',    type: 'server',   startUnit: 15, heightUnits: 2, watts: 260 },
        { id: 'd4-d11', name: 'Load Bal 03',    type: 'loadbal',  startUnit: 17, heightUnits: 2, watts: 240 },
        { id: 'd4-d12', name: 'NTP Master',     type: 'server',   startUnit: 19, heightUnits: 2, watts: 220 },
        { id: 'd4-d13', name: 'NetFlow Coll',   type: 'security', startUnit: 21, heightUnits: 1, watts: 110 },
        { id: 'd4-d14', name: 'IPS Appliance',  type: 'security', startUnit: 22, heightUnits: 2, watts: 240 },
        { id: 'd4-d15', name: 'Patch Panel L',  type: 'patch',    startUnit: 24, heightUnits: 1, watts: 0 },
        { id: 'd4-d16', name: 'Proxy Server',   type: 'server',   startUnit: 25, heightUnits: 2, watts: 360 },
        { id: 'd4-d17', name: 'KVM Console G',  type: 'kvm',      startUnit: 27, heightUnits: 2, watts: 45 },
        { id: 'd4-d18', name: 'DNS Server 2',   type: 'server',   startUnit: 29, heightUnits: 2, watts: 280 },
        { id: 'd4-d19', name: 'IPAM Server',    type: 'server',   startUnit: 31, heightUnits: 2, watts: 300 },
        { id: 'd4-d20', name: 'Net Monitor',    type: 'storage',  startUnit: 33, heightUnits: 4, watts: 340 },
        { id: 'd4-d21', name: 'BGP Relay',      type: 'server',   startUnit: 37, heightUnits: 2, watts: 390 },
        { id: 'd4-d22', name: 'Packet Broker',  type: 'security', startUnit: 39, heightUnits: 1, watts: 140 },
        { id: 'd4-d23', name: 'Patch Panel M',  type: 'patch',    startUnit: 40, heightUnits: 1, watts: 0 },
      ],
    },
    {
      id: 'rack-d5', name: 'PROD-13', units: 42,
      position: { x: 4, z: -26 }, facingAngle: 0,
      rackTemp: 32, pduCapacity: 6000, pduLoad: 4000,
      devices: [
        { id: 'd5-d1',  name: 'Sec Switch',     type: 'switch',   startUnit: 1,  heightUnits: 1, watts: 175 },
        { id: 'd5-d2',  name: 'NGFW Primary',   type: 'firewall', startUnit: 2,  heightUnits: 2, watts: 420 },
        { id: 'd5-d3',  name: 'NGFW Secondary', type: 'firewall', startUnit: 4,  heightUnits: 2, watts: 420 },
        { id: 'd5-d4',  name: 'IDS Node 1',     type: 'security', startUnit: 6,  heightUnits: 2, watts: 220 },
        { id: 'd5-d5',  name: 'IPS Node 1',     type: 'security', startUnit: 8,  heightUnits: 2, watts: 240 },
        { id: 'd5-d6',  name: 'WAF Cluster',    type: 'security', startUnit: 10, heightUnits: 1, watts: 160 },
        { id: 'd5-d7',  name: 'Patch Panel N',  type: 'patch',    startUnit: 11, heightUnits: 1, watts: 0 },
        { id: 'd5-d8',  name: 'SIEM Node 1',    type: 'server',   startUnit: 12, heightUnits: 2, watts: 480 },
        { id: 'd5-d9',  name: 'SOC Server',     type: 'server',   startUnit: 14, heightUnits: 2, watts: 420 },
        { id: 'd5-d10', name: 'Forensics Svr',  type: 'server',   startUnit: 16, heightUnits: 4, watts: 680 },
        { id: 'd5-d11', name: 'Threat Intel',   type: 'server',   startUnit: 20, heightUnits: 2, watts: 380 },
        { id: 'd5-d12', name: 'Vuln Scanner',   type: 'server',   startUnit: 22, heightUnits: 2, watts: 340 },
        { id: 'd5-d13', name: 'SOAR Platform',  type: 'server',   startUnit: 24, heightUnits: 4, watts: 620 },
        { id: 'd5-d14', name: 'Cert Manager',   type: 'server',   startUnit: 28, heightUnits: 2, watts: 280 },
        { id: 'd5-d15', name: 'Evidence Store', type: 'storage',  startUnit: 30, heightUnits: 3, watts: 260 },
        { id: 'd5-d16', name: 'DLP Server',     type: 'server',   startUnit: 33, heightUnits: 2, watts: 360 },
        { id: 'd5-d17', name: 'Log Archive',    type: 'server',   startUnit: 35, heightUnits: 4, watts: 540 },
        { id: 'd5-d18', name: 'KVM Console H',  type: 'kvm',      startUnit: 39, heightUnits: 1, watts: 45 },
        { id: 'd5-d19', name: 'Compliance Svr', type: 'server',   startUnit: 40, heightUnits: 2, watts: 310 },
      ],
    },

    // ── Row B – 15U edge / network racks ────────────────────────
    {
      id: 'rack-b1', name: 'EDGE-01', units: 15,
      position: { x: -28, z: 4 }, facingAngle: Math.PI,
      rackTemp: 28, pduCapacity: 3000, pduLoad: 1400,
      devices: [
        { id: 'b1-d1', name: 'Edge Router',    type: 'router',   startUnit: 1,  heightUnits: 1, watts: 210 },
        { id: 'b1-d2', name: 'Edge Switch',    type: 'switch',   startUnit: 2,  heightUnits: 1, watts: 160 },
        { id: 'b1-d3', name: 'Patch Panel C',  type: 'patch',    startUnit: 3,  heightUnits: 1, watts: 0 },
        { id: 'b1-d4', name: 'VPN Appliance',  type: 'firewall', startUnit: 4,  heightUnits: 1, watts: 180 },
        { id: 'b1-d5', name: 'NTP Server',     type: 'server',   startUnit: 5,  heightUnits: 1, watts: 120 },
        { id: 'b1-d6', name: 'Edge Monitor',   type: 'server',   startUnit: 6,  heightUnits: 2, watts: 280 },
        { id: 'b1-d7', name: 'Access Switch',  type: 'switch',   startUnit: 8,  heightUnits: 1, watts: 140 },
        { id: 'b1-d8', name: 'Edge Security',  type: 'security', startUnit: 9,  heightUnits: 1, watts: 95 },
        { id: 'b1-d9', name: 'Console Svr',    type: 'server',   startUnit: 10, heightUnits: 1, watts: 90 },
        { id: 'b1-d10',name: 'Patch Panel P',  type: 'patch',    startUnit: 11, heightUnits: 1, watts: 0 },
        { id: 'b1-d11',name: 'Edge Storage',   type: 'storage',  startUnit: 12, heightUnits: 2, watts: 180 },
        { id: 'b1-d12',name: 'Edge KVM',       type: 'kvm',      startUnit: 14, heightUnits: 1, watts: 45 },
      ],
    },
    {
      id: 'rack-b2', name: 'EDGE-02', units: 15,
      position: { x: -20, z: 4 }, facingAngle: Math.PI,
      rackTemp: 25, pduCapacity: 3000, pduLoad: 1100,
      devices: [
        { id: 'b2-d1', name: 'SD-WAN Node',    type: 'router',   startUnit: 1,  heightUnits: 1, watts: 180 },
        { id: 'b2-d2', name: 'Access Switch',  type: 'switch',   startUnit: 2,  heightUnits: 1, watts: 140 },
        { id: 'b2-d3', name: 'Patch Panel Q',  type: 'patch',    startUnit: 3,  heightUnits: 1, watts: 0 },
        { id: 'b2-d4', name: 'VPN Backup',     type: 'firewall', startUnit: 4,  heightUnits: 1, watts: 160 },
        { id: 'b2-d5', name: 'Probe Server',   type: 'server',   startUnit: 5,  heightUnits: 2, watts: 260 },
        { id: 'b2-d6', name: 'QoS Appliance',  type: 'security', startUnit: 7,  heightUnits: 1, watts: 110 },
        { id: 'b2-d7', name: 'WAN Switch',     type: 'switch',   startUnit: 8,  heightUnits: 1, watts: 140 },
        { id: 'b2-d8', name: 'Netflow Gen',    type: 'server',   startUnit: 9,  heightUnits: 1, watts: 90 },
        { id: 'b2-d9', name: 'Patch Panel R',  type: 'patch',    startUnit: 10, heightUnits: 1, watts: 0 },
        { id: 'b2-d10',name: 'WAN Storage',    type: 'storage',  startUnit: 11, heightUnits: 2, watts: 160 },
        { id: 'b2-d11',name: 'WAN KVM',        type: 'kvm',      startUnit: 13, heightUnits: 1, watts: 45 },
      ],
    },

    // ── Row C – 10U management racks ─────────────────────────────
    {
      id: 'rack-c1', name: 'MGMT-01', units: 10,
      position: { x: -28, z: 18 }, facingAngle: 0,
      rackTemp: 22, pduCapacity: 2000, pduLoad: 900,
      devices: [
        { id: 'c1-d1', name: 'Mgmt Switch',    type: 'switch',   startUnit: 1,  heightUnits: 1, watts: 95 },
        { id: 'c1-d2', name: 'IPMI Gateway',   type: 'server',   startUnit: 2,  heightUnits: 1, watts: 80 },
        { id: 'c1-d3', name: 'Console Server', type: 'server',   startUnit: 3,  heightUnits: 1, watts: 60 },
        { id: 'c1-d4', name: 'Ansible Ctrl',   type: 'server',   startUnit: 4,  heightUnits: 2, watts: 320 },
        { id: 'c1-d5', name: 'Patch Panel S',  type: 'patch',    startUnit: 6,  heightUnits: 1, watts: 0 },
        { id: 'c1-d6', name: 'Mgmt Monitor',   type: 'security', startUnit: 7,  heightUnits: 2, watts: 180 },
        { id: 'c1-d7', name: 'Mgmt KVM',       type: 'kvm',      startUnit: 9,  heightUnits: 1, watts: 45 },
      ],
    },
    {
      id: 'rack-c2', name: 'MGMT-02', units: 10,
      position: { x: -20, z: 18 }, facingAngle: 0,
      rackTemp: 21, pduCapacity: 2000, pduLoad: 750,
      devices: [
        { id: 'c2-d1', name: 'Ansible Ctrl',   type: 'server',   startUnit: 1,  heightUnits: 2, watts: 320 },
        { id: 'c2-d2', name: 'Vault Server',   type: 'security', startUnit: 3,  heightUnits: 1, watts: 95 },
        { id: 'c2-d3', name: 'Terraform Svr',  type: 'server',   startUnit: 4,  heightUnits: 2, watts: 290 },
        { id: 'c2-d4', name: 'Patch Panel T',  type: 'patch',    startUnit: 6,  heightUnits: 1, watts: 0 },
        { id: 'c2-d5', name: 'Inventory Svr',  type: 'server',   startUnit: 7,  heightUnits: 2, watts: 260 },
        { id: 'c2-d6', name: 'Mgmt KVM 2',     type: 'kvm',      startUnit: 9,  heightUnits: 1, watts: 45 },
      ],
    },

    // ── Wall rack ─────────────────────────────────────────────────
    {
      id: 'rack-wall', name: 'OOB-WALL', units: 6,
      position: { x: 30, z: 44 }, facingAngle: Math.PI,
      rackTemp: 24, pduCapacity: 800, pduLoad: 280,
      devices: [
        { id: 'wl-d1', name: 'OOB Switch',     type: 'switch',   startUnit: 1,  heightUnits: 1, watts: 60 },
        { id: 'wl-d2', name: 'Remote KVM',     type: 'kvm',      startUnit: 2,  heightUnits: 1, watts: 45 },
        { id: 'wl-d3', name: 'OOB Monitor',    type: 'server',   startUnit: 3,  heightUnits: 2, watts: 120 },
        { id: 'wl-d4', name: 'OOB Security',   type: 'security', startUnit: 5,  heightUnits: 1, watts: 55 },
      ],
    },
  ],
};

function RoomInstance({ data, theme = 'light' }) {
  const containerRef = useRef(null);
  const vizRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
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
    <div style={{ height: '100vh', background: '#f0f4f8' }}>
      <RoomInstance data={ROOM_DATA} theme="light" />
    </div>
  );
}
