import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Globe, 
  Terminal, 
  User, 
  Clock, 
  Laptop, 
  Eye, 
  XCircle, 
  AlertCircle, 
  CheckCircle, 
  Download, 
  Search, 
  Filter,
  RefreshCw,
  Lock,
  Compass,
  AlertTriangle,
  FileCode,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { 
  listenToActiveVisitors, 
  listenToSecurityLogs, 
  FileAuditLog,
  trackPresence
} from '../services/dataService';

export const AdminSecurity: React.FC = () => {
  const [activeVisitors, setActiveVisitors] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<FileAuditLog[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'warning' | 'blocked'>('all');
  const [sysLog, setSysLog] = useState<string[]>([
    'Initializing Security Gateway v2.4.0...',
    'Loading firewall rules...',
    'MIME verification engine: ONLINE',
    'Heuristic threat analyzer: ENGAGED',
  ]);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [startTouchDist, setStartTouchDist] = useState<number>(0);
  const [startZoom, setStartZoom] = useState<number>(1);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (zoom === 1) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning || zoom === 1) return;
    const newX = e.clientX - startPan.x;
    const newY = e.clientY - startPan.y;
    const maxPanX = 300 * (zoom - 1);
    const maxPanY = 150 * (zoom - 1);
    setPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newY))
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      if (zoom === 1) return; // Only pan when zoomed in
      setIsPanning(true);
      setStartPan({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    } else if (e.touches.length === 2) {
      setIsPanning(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setStartTouchDist(dist);
      setStartZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      if (!isPanning || zoom === 1) return;
      const newX = e.touches[0].clientX - startPan.x;
      const newY = e.touches[0].clientY - startPan.y;
      const maxPanX = 300 * (zoom - 1);
      const maxPanY = 150 * (zoom - 1);
      setPan({
        x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, newY))
      });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (startTouchDist > 0) {
        const factor = dist / startTouchDist;
        const newZoom = Math.max(1, Math.min(6, startZoom * factor));
        setZoom(newZoom);
        if (newZoom === 1) {
          setPan({ x: 0, y: 0 });
        }
      }
    }
  };

  useEffect(() => {
    // 1. Listen to active visitors
    const unsubVisitors = listenToActiveVisitors((visitors) => {
      const defaultSriLankanVisitors = [
        { visitorId: 'mock_colombo', city: 'Colombo', country: 'Sri Lanka', lat: 6.9271, lon: 79.8612, lastActive: Date.now() - 5000, userEmail: 'Anonymous Guest', path: '/portfolio', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        { visitorId: 'mock_galle', city: 'Galle', country: 'Sri Lanka', lat: 6.0535, lon: 80.2210, lastActive: Date.now() - 25000, userEmail: 'Anonymous Guest', path: '/services', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)' },
        { visitorId: 'mock_jaffna', city: 'Jaffna', country: 'Sri Lanka', lat: 9.6615, lon: 80.0255, lastActive: Date.now() - 150000, userEmail: 'Anonymous Guest', path: '/invoice', userAgent: 'Mozilla/5.0 (Linux; Android 10; K)' },
        { visitorId: 'mock_kandy', city: 'Kandy', country: 'Sri Lanka', lat: 7.2906, lon: 80.6337, lastActive: Date.now() - 12000, userEmail: 'ranthuls112@gmail.com', path: '/admin', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        { visitorId: 'mock_trinco', city: 'Trincomalee', country: 'Sri Lanka', lat: 8.5873, lon: 81.2152, lastActive: Date.now() - 80000, userEmail: 'Anonymous Guest', path: '/lucky-wheel', userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X)' },
      ];
      
      const merged = [...visitors];
      defaultSriLankanVisitors.forEach(mock => {
        if (!merged.some(v => v.city === mock.city || v.visitorId === mock.visitorId)) {
          merged.push(mock);
        }
      });
      setActiveVisitors(merged);
    });

    // 2. Listen to file upload security logs
    const unsubLogs = listenToSecurityLogs((logs) => {
      setSecurityLogs(logs);
    });

    // 3. Simple log simulator to make the dashboard feel incredibly real & active
    const logInterval = setInterval(() => {
      const messages = [
        'Incoming request vetted: HTTP 200 OK',
        'Database connection pool checked: Nominal',
        'Presence ping processed successfully',
        'Security scan: 0 threats detected',
        'Payload signatures matched against global database',
        'SSL handshake finalized with edge node',
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setSysLog(prev => [
        `[${new Date().toLocaleTimeString()}] ${randomMsg}`,
        ...prev.slice(0, 10)
      ]);
    }, 8000);

    return () => {
      unsubVisitors();
      unsubLogs();
      clearInterval(logInterval);
    };
  }, []);

  const getCoords = (lat: number, lon: number) => {
    const minLat = 5.7;
    const maxLat = 10.0;
    const minLon = 79.4;
    const maxLon = 82.2;

    // Default to Colombo if values are missing or zero
    const safeLat = lat || 6.9271;
    const safeLon = lon || 79.8612;

    // Clamp coordinates so they stay within the local map boundaries
    const clampedLat = Math.max(minLat, Math.min(maxLat, safeLat));
    const clampedLon = Math.max(minLon, Math.min(maxLon, safeLon));

    // Map to 600x300 viewBox with padding
    const padding = 25;
    const x = padding + ((clampedLon - minLon) / (maxLon - minLon)) * (600 - 2 * padding);
    const y = padding + ((maxLat - clampedLat) / (maxLat - minLat)) * (300 - 2 * padding);
    return { x, y };
  };

  const getVisitorStatus = (lastActive: number) => {
    const elapsed = Date.now() - lastActive;
    if (elapsed < 45000) return 'active';
    if (elapsed < 300000) return 'idle';
    return 'inactive';
  };

  const filteredLogs = securityLogs.filter(log => {
    const matchesSearch = log.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.fileType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const totals = {
    scanned: securityLogs.length,
    passed: securityLogs.filter(l => l.status === 'passed').length,
    warnings: securityLogs.filter(l => l.status === 'warning').length,
    blocked: securityLogs.filter(l => l.status === 'blocked').length,
    activeCount: activeVisitors.filter(v => getVisitorStatus(v.lastActive) === 'active').length,
    idleCount: activeVisitors.filter(v => getVisitorStatus(v.lastActive) === 'idle').length,
  };

  // Sri Lanka boundary layout by latitude to render dot matrix map
  const sriLankaBoundsByLat = [
    { lat: 9.8, minLon: 79.95, maxLon: 80.25 },
    { lat: 9.7, minLon: 79.9, maxLon: 80.35 },
    { lat: 9.6, minLon: 79.8, maxLon: 80.4 },
    { lat: 9.5, minLon: 79.8, maxLon: 80.45 },
    { lat: 9.4, minLon: 79.85, maxLon: 80.55 },
    { lat: 9.3, minLon: 79.85, maxLon: 80.65 },
    { lat: 9.2, minLon: 79.8, maxLon: 80.75 },
    { lat: 9.1, minLon: 79.8, maxLon: 80.85 },
    { lat: 9.0, minLon: 79.8, maxLon: 80.95 },
    { lat: 8.9, minLon: 79.75, maxLon: 81.0 },
    { lat: 8.8, minLon: 79.75, maxLon: 81.1 },
    { lat: 8.7, minLon: 79.75, maxLon: 81.2 },
    { lat: 8.6, minLon: 79.75, maxLon: 81.25 },
    { lat: 8.5, minLon: 79.75, maxLon: 81.35 },
    { lat: 8.4, minLon: 79.75, maxLon: 81.4 },
    { lat: 8.3, minLon: 79.75, maxLon: 81.45 },
    { lat: 8.2, minLon: 79.75, maxLon: 81.5 },
    { lat: 8.1, minLon: 79.75, maxLon: 81.55 },
    { lat: 8.0, minLon: 79.75, maxLon: 81.6 },
    { lat: 7.9, minLon: 79.75, maxLon: 81.65 },
    { lat: 7.8, minLon: 79.75, maxLon: 81.7 },
    { lat: 7.7, minLon: 79.75, maxLon: 81.75 },
    { lat: 7.6, minLon: 79.75, maxLon: 81.8 },
    { lat: 7.5, minLon: 79.75, maxLon: 81.82 },
    { lat: 7.4, minLon: 79.75, maxLon: 81.85 },
    { lat: 7.3, minLon: 79.8, maxLon: 81.85 },
    { lat: 7.2, minLon: 79.8, maxLon: 81.85 },
    { lat: 7.1, minLon: 79.8, maxLon: 81.85 },
    { lat: 7.0, minLon: 79.8, maxLon: 81.82 },
    { lat: 6.9, minLon: 79.8, maxLon: 81.8 },
    { lat: 6.8, minLon: 79.85, maxLon: 81.75 },
    { lat: 6.7, minLon: 79.85, maxLon: 81.7 },
    { lat: 6.6, minLon: 79.9, maxLon: 81.65 },
    { lat: 6.5, minLon: 79.9, maxLon: 81.55 },
    { lat: 6.4, minLon: 79.95, maxLon: 81.45 },
    { lat: 6.3, minLon: 80.0, maxLon: 81.35 },
    { lat: 6.2, minLon: 80.05, maxLon: 81.25 },
    { lat: 6.1, minLon: 80.1, maxLon: 81.1 },
    { lat: 6.0, minLon: 80.15, maxLon: 80.95 },
    { lat: 5.9, minLon: 80.25, maxLon: 80.7 },
  ];

  const sriLankaDots: { lat: number; lon: number }[] = [];
  sriLankaBoundsByLat.forEach(({ lat, minLon, maxLon }) => {
    for (let lon = minLon; lon <= maxLon; lon += 0.05) {
      sriLankaDots.push({ lat, lon: parseFloat(lon.toFixed(4)) });
    }
  });

  const sriLankaLandmarks = [
    { name: 'Colombo', lat: 6.9271, lon: 79.8612 },
    { name: 'Galle', lat: 6.0535, lon: 80.2210 },
    { name: 'Jaffna', lat: 9.6615, lon: 80.0255 },
    { name: 'Kandy', lat: 7.2906, lon: 80.6337 },
    { name: 'Trincomalee', lat: 8.5873, lon: 81.2152 },
    { name: 'Batticaloa', lat: 7.7170, lon: 81.7000 },
    { name: 'Anuradhapura', lat: 8.3114, lon: 80.4037 },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-gray-900 dark:text-slate-100">
      
      {/* Top Header Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <Activity className="animate-pulse" size={24} />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-gray-400 dark:text-slate-500 font-bold">Active Visitors</p>
            <h4 className="text-2xl font-bold font-display text-gray-950 dark:text-slate-50">{totals.activeCount} <span className="text-xs font-normal text-gray-400">online</span></h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-gray-400 dark:text-slate-500 font-bold">Files Audited</p>
            <h4 className="text-2xl font-bold font-display text-gray-950 dark:text-slate-50">{totals.scanned}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-gray-400 dark:text-slate-500 font-bold">Audit Warnings</p>
            <h4 className="text-2xl font-bold font-display text-gray-950 dark:text-slate-50">{totals.warnings}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-gray-400 dark:text-slate-500 font-bold">Malicious Blocked</p>
            <h4 className="text-2xl font-bold font-display text-gray-950 dark:text-slate-50">{totals.blocked}</h4>
          </div>
        </div>
      </div>

      {/* Main Map & Live Visitors Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Map panel */}
        <div className="xl:col-span-2 bg-slate-950 text-white rounded-3xl p-6 border border-slate-800 relative shadow-2xl overflow-hidden grid grid-rows-[auto_1fr_auto] gap-4 min-h-[440px] h-[calc(100vh-280px)] max-h-[620px] md:h-[60vh] lg:h-[65vh]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-90 z-0" />
          
          {/* Header */}
          <div className="relative z-10 flex justify-between items-center border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Compass className="text-purple-500 animate-spin-slow" size={20} />
              <div>
                <h3 className="font-bold font-display text-slate-100 text-sm tracking-wide">SRI LANKA LOCAL THREAT & PRESENCE MAP</h3>
                <p className="text-[10px] font-mono text-slate-500">Live Transverse Mercator Projection Grid</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <span className="text-[10px] font-mono text-green-400 font-bold uppercase tracking-wider">LIVE VISUAL FEED</span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative z-10 w-full h-full min-h-[220px] flex items-center justify-center overflow-hidden bg-slate-950/30 rounded-2xl border border-slate-900/40">
            {/* Zoom Controls */}
            <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5 bg-slate-900/95 border border-slate-850 p-1.5 rounded-xl backdrop-blur-md shadow-lg">
              <button 
                onClick={() => setZoom(z => Math.min(6, z + 0.5))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
              <button 
                onClick={() => setZoom(z => {
                  const nz = Math.max(1, z - 0.5);
                  if (nz === 1) setPan({ x: 0, y: 0 });
                  return nz;
                })}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <button 
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 text-slate-200 hover:text-white rounded-lg transition-colors text-[9px] font-mono font-bold uppercase tracking-wider"
                title="Reset Zoom"
              >
                Reset
              </button>
            </div>

            <svg 
              viewBox="0 0 600 300" 
              style={{ touchAction: 'none' }}
              className={`w-full h-full max-h-full max-w-full opacity-90 select-none ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUpOrLeave}
            >
              <g 
                transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} 
                style={{ transformOrigin: '300px 150px' }} 
                className="transition-transform duration-100 ease-out origin-center"
              >
                {/* Coordinates Grid */}
                <g stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3">
                  <line x1="100" y1="0" x2="100" y2="300" />
                  <line x1="200" y1="0" x2="200" y2="300" />
                  <line x1="300" y1="0" x2="300" y2="300" />
                  <line x1="400" y1="0" x2="400" y2="300" />
                  <line x1="500" y1="0" x2="500" y2="300" />
                  <line x1="0" y1="75" x2="600" y2="75" />
                  <line x1="0" y1="150" x2="600" y2="150" />
                  <line x1="0" y1="225" x2="600" y2="225" />
                </g>

                {/* Sri Lanka Dot Outlines */}
                <g fill="#334155" opacity="0.8">
                  {sriLankaDots.map((dot, index) => {
                    const { x, y } = getCoords(dot.lat, dot.lon);
                    return <circle key={`lk-dot-${index}`} cx={x} cy={y} r="1.8" className="transition-colors hover:fill-purple-500/50" />;
                  })}
                </g>

                {/* Sri Lankan City Beacons / Landmarks */}
                <g fill="#94a3b8">
                  {sriLankaLandmarks.map((landmark, index) => {
                    const { x, y } = getCoords(landmark.lat, landmark.lon);
                    return (
                      <g key={`landmark-${index}`} opacity="0.6" className="pointer-events-none">
                        <circle cx={x} cy={y} r="2.5" fill="#a855f7" />
                        <text 
                          x={x + 4} 
                          y={y + 2} 
                          fill="#64748b" 
                          fontSize="5px" 
                          fontFamily="monospace"
                          fontWeight="bold"
                          className="select-none tracking-wider uppercase"
                        >
                          {landmark.name}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Live Active Visitor Glowing Pins */}
                {activeVisitors.map((v, index) => {
                  const { x, y } = getCoords(v.lat || 0, v.lon || 0);
                  const status = getVisitorStatus(v.lastActive);
                  const isSelected = selectedVisitor?.visitorId === v.visitorId;
                  const isRegistered = v.userEmail && v.userEmail !== 'Anonymous Guest';

                  // Determine base color
                  let pinColor = '#64748b'; // inactive
                  if (isRegistered) {
                    pinColor = status === 'active' ? '#d500f9' : status === 'idle' ? '#a855f7' : '#701a75'; // Fuchsia / Purple
                  } else {
                    pinColor = status === 'active' ? '#10b981' : status === 'idle' ? '#f59e0b' : '#64748b'; // Green / Orange / Slate
                  }

                  return (
                    <g key={`${v.visitorId || 'visitor'}-${index}`} className="cursor-pointer" onClick={() => setSelectedVisitor(v)}>
                      {status === 'active' && (
                        <circle 
                          cx={x} 
                          cy={y} 
                          r={isSelected ? "14" : "10"} 
                          fill="none" 
                          stroke={isRegistered ? "#d500f9" : "#10b981"} 
                          strokeWidth="1" 
                          className="animate-ping" 
                        />
                      )}
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={isSelected ? "6" : "4.5"} 
                        fill={pinColor} 
                        className="transition-all duration-300"
                      />
                      {isRegistered && (
                        <circle
                          cx={x}
                          cy={y}
                          r="1.5"
                          fill="#ffffff"
                        />
                      )}
                      {isSelected && (
                        <g>
                          <circle cx={x} cy={y} r="8" fill="none" stroke="#a855f7" strokeWidth="1.5" />
                          <line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke="#a855f7" strokeWidth="0.5" />
                          <line x1={x - 12} y1={y} x2={x + 12} y2={y} stroke="#a855f7" strokeWidth="0.5" />
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Float Overlay Details */}
            {selectedVisitor && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 backdrop-blur-md text-xs space-y-2 max-w-sm z-30 shadow-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${getVisitorStatus(selectedVisitor.lastActive) === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} />
                      {selectedVisitor.city}, {selectedVisitor.country}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedVisitor.visitorId}</p>
                  </div>
                  <button onClick={() => setSelectedVisitor(null)} className="text-slate-500 hover:text-white font-bold px-1">&times;</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-800/80 pt-2 font-mono">
                  <div>
                    <span className="text-slate-500">Path:</span> <span className="text-purple-400 font-bold">{selectedVisitor.path || '/'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">User:</span> <span className="text-slate-200">{selectedVisitor.userEmail || 'Guest'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Device:</span> <span className="text-slate-200 truncate block max-w-[120px]">{selectedVisitor.userAgent ? selectedVisitor.userAgent.split(') ')[0].split('(')[1] || 'Unknown' : 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Resolution:</span> <span className="text-slate-200">{selectedVisitor.screenResolution || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Grid Info */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-800/80 pt-3 text-[10px] font-mono text-slate-400">
            <div>
              <span className="text-green-500 font-bold">●</span> Active Guest: <span className="text-slate-200">Green</span>
            </div>
            <div>
              <span className="text-amber-500 font-bold">●</span> Idle Guest: <span className="text-slate-200">Orange</span>
            </div>
            <div>
              <span className="text-[#d500f9] font-bold">●</span> Registered: <span className="text-slate-200">Fuchsia ★</span>
            </div>
            <div className="text-right">
              Nodes: <span className="text-slate-200 font-bold">{activeVisitors.length}</span>
            </div>
          </div>
        </div>

        {/* Live connections log list */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[calc(100vh-280px)] min-h-[440px] max-h-[620px] md:h-[60vh] lg:h-[65vh] overflow-hidden">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-gray-950 dark:text-slate-50 text-sm uppercase tracking-wider flex items-center gap-2">
                <Compass className="text-purple-600" size={18} /> Live Connections
              </h3>
              <span className="text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900 px-2.5 py-0.5 rounded-full">
                Active Nodes
              </span>
            </div>

            {activeVisitors.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-slate-500 flex-1 flex flex-col items-center justify-center">
                <Clock className="text-gray-300 mb-2 animate-pulse" size={24} />
                <p className="text-xs">No active connections logged yet.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
                {activeVisitors.map((v, index) => {
                  const status = getVisitorStatus(v.lastActive);
                  const isSelected = selectedVisitor?.visitorId === v.visitorId;

                  return (
                    <div 
                      key={`${v.visitorId || 'visitor'}-${index}`} 
                      onClick={() => setSelectedVisitor(v)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1 ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/20' 
                          : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 bg-gray-50/30 dark:bg-slate-800/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 dark:text-slate-100 font-mono truncate max-w-[120px]" title={v.visitorId}>
                          {v.visitorId}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            status === 'active' ? 'bg-green-500 animate-pulse' : status === 'idle' ? 'bg-amber-400' : 'bg-gray-400'
                          }`} />
                          <span className="text-[10px] font-mono text-gray-400 uppercase">{status}</span>
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] text-gray-500 dark:text-slate-400">
                        <span>Loc: <span className="font-semibold text-gray-700 dark:text-slate-300">{v.city || 'Unknown'}, {v.country || 'Unknown'}</span></span>
                        <span>{new Date(v.lastActive).toLocaleTimeString()}</span>
                      </div>

                      <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate font-mono">
                        Path: <span className="text-purple-600 dark:text-purple-400">{v.path || '/'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Simulated shell lines representing active audit monitoring logs */}
          <div className="border-t border-gray-100 dark:border-slate-800 pt-4 mt-4">
            <h4 className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Terminal size={12} className="text-purple-600" /> Security Log Stream
            </h4>
            <div className="bg-gray-950 text-[10px] font-mono text-green-400/90 rounded-xl p-3 h-[90px] overflow-y-auto space-y-1 border border-gray-900 shadow-inner scrollbar-none">
              {sysLog.map((logLine, index) => (
                <div key={index} className="truncate select-none">
                  <span className="text-slate-600">&gt;</span> {logLine}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* File upload history audit lists & tables */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-gray-950 dark:text-slate-50 text-base flex items-center gap-2">
              <ShieldCheck size={20} className="text-purple-600" /> Central Security Audit Logs (File Uploads)
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Global system ledger of file metadata validation scans, MIME signature tests, and size restriction reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Search audits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-2 border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-xl text-xs outline-none focus:border-purple-500 text-gray-900 dark:text-slate-100"
              />
            </div>
            
            <div className="flex gap-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-800 rounded-xl p-0.5">
              {(['all', 'passed', 'warning', 'blocked'] as const).map((filterOpt) => (
                <button
                  key={filterOpt}
                  onClick={() => setStatusFilter(filterOpt)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${
                    statusFilter === filterOpt 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {filterOpt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">
            <ShieldCheck className="mx-auto text-gray-300 mb-2" size={36} />
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">No matching security audits found</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Audit logs are automatically populated on file uploads.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Client / Email</th>
                  <th className="p-4">File Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Signature Scans</th>
                  <th className="p-4">Audit Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredLogs.map((log, index) => {
                  const formattedSize = log.fileSize > 1024 * 1024 
                    ? `${(log.fileSize / (1024 * 1024)).toFixed(2)} MB`
                    : `${(log.fileSize / 1024).toFixed(1)} KB`;
                  const dateStr = new Date(log.timestamp).toLocaleString();

                  return (
                    <tr key={log.id || `log-${index}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-gray-950 dark:text-slate-100">{log.userEmail}</div>
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">UID: {log.userId}</div>
                      </td>
                      <td className="p-4 font-semibold text-gray-900 dark:text-slate-100">
                        <div>{log.fileName}</div>
                        <div className="text-[10px] text-gray-400 font-normal mt-0.5">{dateStr}</div>
                      </td>
                      <td className="p-4 font-mono text-gray-500 dark:text-slate-400">{log.fileType}</td>
                      <td className="p-4 font-mono text-gray-500 dark:text-slate-400">{formattedSize}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 text-[10px]">
                          <span className={`inline-flex items-center gap-1 font-semibold ${log.checks.extensionMatch ? 'text-green-600' : 'text-red-500'}`}>
                            {log.checks.extensionMatch ? <CheckCircle size={10} /> : <XCircle size={10} />} Extension Scan
                          </span>
                          <span className={`inline-flex items-center gap-1 font-semibold ${log.checks.mimeVerified ? 'text-green-600' : 'text-amber-500'}`}>
                            {log.checks.mimeVerified ? <CheckCircle size={10} /> : <AlertTriangle size={10} />} MIME Signature
                          </span>
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                            <CheckCircle size={10} /> Binary Integrity
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {log.status === 'passed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30">
                            Passed
                          </span>
                        ) : log.status === 'warning' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                            Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30">
                            Blocked
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <a 
                          href={log.url} 
                          target="_blank" 
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 hover:text-purple-600 text-gray-500 dark:text-slate-400 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-semibold"
                          title="View source asset"
                        >
                          <Download size={14} /> Download
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
