import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../supabaseClient';
import { useTheme } from '../context/ThemeContext';
import { getCoordinate } from '../utils/locationCoordinates';
import {
  Search, Phone, MessageSquare, Clock, CheckCircle,
  Navigation, User, ChevronRight, RefreshCw, Layers, X,
  ArrowUpDown, Plus, Minus, Locate, Volume2
} from 'lucide-react';
import { generateNarration, playAudio } from '../services/aiService';

// Fix default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// ── Math: Calculate Bearing/Heading between coordinates ──
const calculateBearing = (start, end) => {
  if (!start || !end) return 0;
  const lat1 = start[0] * Math.PI / 180;
  const lat2 = end[0] * Math.PI / 180;
  const lon1 = start[1] * Math.PI / 180;
  const lon2 = end[1] * Math.PI / 180;
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
};

// Find closest point on path to compute bearing
const findRouteBearing = (busCoord, path) => {
  if (!busCoord || !path || path.length < 2) return 0;

  let minDistance = Infinity;
  let closestIndex = 0;
  const [busLat, busLng] = busCoord;

  for (let i = 0; i < path.length; i++) {
    const [pLat, pLng] = path[i];
    const dist = Math.pow(pLat - busLat, 2) + Math.pow(pLng - busLng, 2);
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  let nextIndex = closestIndex + 1;
  if (nextIndex >= path.length) {
    nextIndex = closestIndex;
    closestIndex = closestIndex - 1 >= 0 ? closestIndex - 1 : 0;
  }

  return calculateBearing(path[closestIndex], path[nextIndex]);
};

// ── Premium Map Custom Markers ──

// Translucent Origin Marker (Orange)
export const originIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
      <circle cx="15" cy="15" r="11" fill="#F97316" fill-opacity="0.2"/>
      <circle cx="15" cy="15" r="5.5" fill="#F97316" stroke="white" stroke-width="2.5"/>
    </svg>
  `,
  className: 'custom-map-marker', iconSize: [30, 30], iconAnchor: [15, 15]
});

// Translucent Destination Marker (Green)
export const destIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
      <circle cx="15" cy="15" r="11" fill="#10B981" fill-opacity="0.2"/>
      <circle cx="15" cy="15" r="5.5" fill="#10B981" stroke="white" stroke-width="2.5"/>
    </svg>
  `,
  className: 'custom-map-marker', iconSize: [30, 30], iconAnchor: [15, 15]
});

// Custom Directional Vehicle Marker
const createVehicleIcon = (heading = 0, isSelected = false) => {
  const size = isSelected ? 42 : 36;
  const color = '#6366F1';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="veh-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(99,102,241,0.3)"/>
        </filter>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="${color}" fill-opacity="0.22" filter="url(#veh-glow)"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 8}" fill="${color}" stroke="white" stroke-width="2.5"/>
      <g transform="translate(${size / 2}, ${size / 2}) rotate(${heading}) translate(-5, -5.5)">
        <path d="M5 0 L10 9 L5 6.5 L0 9 Z" fill="white" />
      </g>
    </svg>
  `;
  return L.divIcon({ html: svg, className: 'custom-map-marker', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
};

// Floating map label marker
const createLabelIcon = (title, addr, type) => {
  const dotColor = type === 'origin' ? '#F97316' : '#10B981';
  const html = `
    <div class="map-floating-label">
      <span class="label-dot" style="background-color: ${dotColor}"></span>
      <div class="label-content">
        <div class="label-title">${title}</div>
        <div class="label-subtitle">${addr}</div>
      </div>
    </div>
  `;
  return L.divIcon({ html, className: 'map-label-wrapper', iconSize: [180, 50], iconAnchor: [0, 45] });
};

// SVG Bus Graphic for Cards
const BusSilhouette = ({ type }) => {
  let color = '#64748B'; // Default
  if (type === 'INTERCITY') color = '#6366F1';
  if (type === 'CTB') color = '#EF4444';

  return (
    <svg width="42" height="26" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4C4 2.89543 4.89543 2 6 2H32C33.6569 2 35 3.34315 35 5V17C35 18.1046 34.1046 19 33 19H4C4 19 4 4 4 4Z" fill={color} />
      <path d="M35 5C35 3.34315 36.3431 2 38 2C38.5523 2 39 2.44772 39 3V15C39 15.5523 38.5523 16 38 16C36.3431 16 35 14.6569 35 13V5Z" fill="#334155" />
      <rect x="7" y="5" width="8" height="5" rx="1" fill="#E2E8F0" />
      <rect x="17" y="5" width="8" height="5" rx="1" fill="#E2E8F0" />
      <rect x="27" y="5" width="6" height="5" rx="1" fill="#E2E8F0" />
      <circle cx="9" cy="20" r="3" fill="#1E293B" stroke="white" stroke-width="1.5" />
      <circle cx="30" cy="20" r="3" fill="#1E293B" stroke="white" stroke-width="1.5" />
    </svg>
  );
};

// ── Map fly-to helper ──
const FlyToTrip = ({ trip }) => {
  const map = useMap();
  useEffect(() => {
    if (trip?.lat && trip?.lng) {
      map.flyTo([trip.lat, trip.lng], 13, { duration: 1.2 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, map]);
  return null;
};

// ── Map controller for custom external zoom/locate buttons ──
const MapController = ({ zoomInTrigger, zoomOutTrigger, locateTrigger, center }) => {
  const map = useMap();
  useEffect(() => {
    if (zoomInTrigger > 0) map.zoomIn();
  }, [zoomInTrigger, map]);

  useEffect(() => {
    if (zoomOutTrigger > 0) map.zoomOut();
  }, [zoomOutTrigger, map]);

  useEffect(() => {
    if (locateTrigger > 0 && center) {
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [locateTrigger, center, map]);

  return null;
};

const LiveTracking = () => {
  const { isDarkMode } = useTheme();
  const [liveTrips, setLiveTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [roadCoordinates, setRoadCoordinates] = useState([]);
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDest, setSearchDest] = useState('');
  const [searchRouteId, setSearchRouteId] = useState('');
  const [systemRoutes, setSystemRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [originCoord, setOriginCoord] = useState(null);
  const [destCoord, setDestCoord] = useState(null);
  const [mapTilt, setMapTilt] = useState(true);
  const [searched, setSearched] = useState(false);

  // Memoize label icons — only recompute when the text values change, NOT on position updates
  const originLabelIcon = React.useMemo(() => {
    if (!selectedTrip?.origin) return null;
    return createLabelIcon(selectedTrip.origin, selectedTrip.originAddr || 'Origin Station', 'origin');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrip?.origin, selectedTrip?.originAddr]);

  const destLabelIcon = React.useMemo(() => {
    if (!selectedTrip?.destination) return null;
    return createLabelIcon(selectedTrip.destination, selectedTrip.destAddr || 'Destination Station', 'dest');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrip?.destination, selectedTrip?.destAddr]);

  useEffect(() => {
    supabase.from('routes').select('id, route_number, route_name, origin, destination').then(({data}) => {
      if(data) setSystemRoutes(data);
    });
  }, []);

  // Custom Zoom states
  const [zoomInCount, setZoomInCount] = useState(0);
  const [zoomOutCount, setZoomOutCount] = useState(0);
  const [locateCount, setLocateCount] = useState(0);
  const [narratingBus, setNarratingBus] = useState(null);

  const tileUrl = isDarkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  // ── Fetch live trips ──
  const fetchLiveTrips = async (routeId = searchRouteId) => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      let query = supabase
        .from('trip_schedules')
        .select(`
          id, live_lat, live_lng, driver_id, origin, destination, status,
          buses ( vehicle_reg_number, bus_type, total_seats, ntc_number, status ),
          routes ( route_name, route_number, stops )
        `)
        .in('status', ['LIVE', 'SCHEDULED'])
        .eq('departure_date', todayStr);

      if (routeId) {
        query = query.eq('route_id', routeId);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const driverIds = [...new Set(data.filter(s => s.driver_id).map(s => s.driver_id))];
        let driverMap = {};
        if (driverIds.length > 0) {
          const { data: dData } = await supabase
            .from('profiles')
            .select('id, full_name, driver_profiles ( nic, driving_license_number, ntc_driver_regno, verification_status )')
            .in('id', driverIds);
          (dData || []).forEach(d => {
            driverMap[d.id] = {
              name: d.full_name,
              nic: d.driver_profiles?.nic || 'N/A',
              license: d.driver_profiles?.driving_license_number || 'N/A',
              ntcReg: d.driver_profiles?.ntc_driver_regno || 'N/A',
              status: d.driver_profiles?.verification_status || 'PENDING'
            };
          });
        }
        const parsed = data.map(s => {
          let stops = [];
          if (s.routes?.stops) {
            try { stops = Array.isArray(s.routes.stops) ? s.routes.stops : JSON.parse(s.routes.stops); } catch { }
          }
          return {
            id: s.id,
            lat: Number(s.live_lat) || 7.8731,
            lng: Number(s.live_lng) || 80.7718,
            regNumber: s.buses?.vehicle_reg_number || 'Unknown',
            ntcNumber: s.buses?.ntc_number || 'N/A',
            busType: s.buses?.bus_type || 'NORMAL',
            totalSeats: s.buses?.total_seats || 'N/A',
            driverName: driverMap[s.driver_id]?.name || 'Unassigned',
            driverInfo: driverMap[s.driver_id] || null,
            routeName: s.routes?.route_name || 'N/A',
            routeNumber: s.routes?.route_number || '',
            origin: s.origin || '', destination: s.destination || '',
            originAddr: s.origin || '', destAddr: s.destination || '',
            stops, passedStops: [], currentStop: 'In Transit',
            remainingStops: stops, isDemo: false,
            heading: 0
          };
        });
        setLiveTrips(parsed);
        setSelectedTrip(parsed[0] || null);
      } else {
        setLiveTrips([]);
        setSelectedTrip(null);
      }
    } catch (e) {
      console.error(e);
      setLiveTrips([]);
      setSelectedTrip(null);
    } finally { setLoading(false); }
  };

  const handleNarrateBusStatus = async (trip) => {
    setNarratingBus(trip.id);
    try {
      const prompt = `You are a professional dispatcher AI. Give a brief, natural status update (under 2 sentences) for Bus ${trip.regNumber} traveling from ${trip.origin || 'its origin'} to ${trip.destination || 'its destination'}. The current time is ${new Date().toLocaleTimeString()}. Make it sound professional.`;
      const text = await generateNarration(prompt);
      await playAudio(text);
    } catch (e) {
      console.error(e);
    } finally {
      setNarratingBus(null);
    }
  };

  useEffect(() => {
    fetchLiveTrips();
    const channel = supabase.channel('live_tracking_page')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trip_schedules' }, payload => {
        const r = payload.new;
        if (r.status === 'LIVE') {
          setLiveTrips(prev => {
            const idx = prev.findIndex(t => t.id === r.id);
            if (idx >= 0) {
              const u = [...prev];
              u[idx] = { ...u[idx], lat: Number(r.live_lat), lng: Number(r.live_lng) };
              setSelectedTrip(c => c?.id === r.id ? u[idx] : c);
              return u;
            }
            return prev;
          });
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── OSRM road path ──
  useEffect(() => {
    if (!selectedTrip) { setRoadCoordinates([]); setOriginCoord(null); setDestCoord(null); return; }
    const coords = [];
    const oC = getCoordinate(selectedTrip.origin);
    const dC = getCoordinate(selectedTrip.destination);
    setOriginCoord(oC); setDestCoord(dC);
    if (oC) coords.push(oC);
    if (Array.isArray(selectedTrip.stops)) selectedTrip.stops.forEach(s => { const c = getCoordinate(s); if (c) coords.push(c); });
    if (dC) coords.push(dC);
    if (coords.length < 2) { setRoadCoordinates(coords); return; }
    (async () => {
      try {
        const qs = coords.map(c => `${c[1]},${c[0]}`).join(';');
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${qs}?overview=full&geometries=geojson`);
        const json = await res.json();
        if (json.code === 'Ok' && json.routes?.[0]) {
          const pathCoords = json.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRoadCoordinates(pathCoords);
          // Set initial bearing
          const busPos = [selectedTrip.lat, selectedTrip.lng];
          const calculatedHeading = findRouteBearing(busPos, pathCoords);
          setSelectedTrip(curr => curr ? { ...curr, heading: calculatedHeading } : null);
        } else {
          setRoadCoordinates(coords);
        }
      } catch { setRoadCoordinates(coords); }
    })();
  }, [selectedTrip]);



  // ── Filtering displayed trips locally ──
  // ── Filtering displayed trips locally ──
  const displayedTrips = searched
    ? liveTrips.filter(t => {
      const o = searchOrigin.toLowerCase().trim();
      const d = searchDest.toLowerCase().trim();
      return (!o || t.origin?.toLowerCase().includes(o) || t.routeName?.toLowerCase().includes(o))
        && (!d || t.destination?.toLowerCase().includes(d) || t.routeName?.toLowerCase().includes(d));
    })
    : liveTrips;

  const handleSearch = () => {
    if (!searchRouteId && !searchOrigin && !searchDest) {
      setSearched(false);
      fetchLiveTrips('');
      return;
    }
    setSearched(true);
    fetchLiveTrips(searchRouteId);
  };

  const handleClearSearch = () => {
    setSearchRouteId('');
    setSearchOrigin('');
    setSearchDest('');
    setSearched(false);
    fetchLiveTrips('');
  };

  const swapLocations = () => {
    const temp = searchOrigin;
    setSearchOrigin(searchDest);
    setSearchDest(temp);
  };

  const fmtType = t => {
    if (t === 'INTERCITY') return 'Intercity';
    if (t === 'CTB') return 'CTB';
    return 'Normal';
  };

  const stopETA = (idx) => {
    const now = new Date(); now.setMinutes(now.getMinutes() + (idx + 1) * 12);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const passedTime = (idx, total) => {
    const now = new Date(); now.setMinutes(now.getMinutes() - (total - idx) * 10);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="lt-page">
      <div className="lt-shell">

        {/* ─── SIDEBAR ─── */}
        <aside className="lt-sidebar">
          {/* Route Search Box */}
          <div className="lt-search-box-premium">
            <div className="lt-search-title">Find Ongoing Trips</div>
            <div className="lt-search-inputs-container">
              <div className="lt-search-field-premium">
                <span className="field-dot origin-dot"></span>
                <input
                  placeholder="Enter Origin"
                  value={searchOrigin}
                  onChange={e => setSearchOrigin(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                {searchOrigin && <button className="field-clear" onClick={() => setSearchOrigin('')}><X size={12} /></button>}
              </div>

              <div className="lt-swap-divider">
                <button className="lt-swap-btn" onClick={swapLocations} title="Swap Locations">
                  <ArrowUpDown size={14} />
                </button>
              </div>

              <div className="lt-search-field-premium">
                <span className="field-dot dest-dot"></span>
                <input
                  placeholder="Enter Destination"
                  value={searchDest}
                  onChange={e => setSearchDest(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                {searchDest && <button className="field-clear" onClick={() => setSearchDest('')}><X size={12} /></button>}
              </div>
              
              <div className="lt-search-field-premium" style={{ border: '1px solid var(--border)', borderRadius: 6, marginTop: 12 }}>
                <select 
                  value={searchRouteId} 
                  onChange={e => setSearchRouteId(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: 'var(--text-main)', padding: '6px 8px' }}
                >
                  <option value="">-- All System Routes --</option>
                  {systemRoutes.map(r => (
                    <option key={r.id} value={r.id}>{r.route_number} ({r.origin} - {r.destination})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lt-search-actions" style={{ marginTop: 15 }}>
              <button className="lt-search-btn-primary" onClick={handleSearch}>
                <Search size={14} />
                <span>Search Buses</span>
              </button>
              {searched && (
                <button className="lt-search-btn-secondary" onClick={handleClearSearch}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="lt-section-head">
            <span className="lt-live-indicator" />
            <h3>Ongoing Trips</h3>
            <span className="lt-badge">{displayedTrips.length}</span>
            <button className="lt-icon-btn" onClick={fetchLiveTrips} title="Refresh"><RefreshCw size={14} /></button>
          </div>

          {/* Trip Cards */}
          <div className="lt-cards-scroll">
            {loading ? (
              <div className="lt-placeholder">Loading trips...</div>
            ) : displayedTrips.length === 0 ? (
              <div className="lt-placeholder no-buses-placeholder">No buses online at this moment</div>
            ) : displayedTrips.map(trip => {
              const isActive = selectedTrip?.id === trip.id;
              return (
                <div key={trip.id} className={`lt-card ${isActive ? 'selected' : ''}`} onClick={() => setSelectedTrip(trip)}>
                  {/* Top row: trip number + bus image */}
                  <div className="lt-card-header">
                    <div>
                      <span className="lt-card-label">Trip number</span>
                      <div className="lt-card-number">{trip.regNumber}</div>
                      <span className="lt-card-category">{fmtType(trip.busType)} · {trip.routeNumber || trip.routeName}</span>
                    </div>
                    <div className="lt-bus-sil-wrapper">
                      <BusSilhouette type={trip.busType} />
                    </div>
                  </div>

                  {/* Origin / Destination row */}
                  <div className="lt-card-route">
                    <div className="lt-card-stop">
                      <span className="lt-stop-dot origin" />
                      <div>
                        <div className="lt-stop-name">{trip.origin || 'Origin'}</div>
                        <div className="lt-stop-addr">{trip.originAddr || trip.origin || ''}</div>
                      </div>
                    </div>
                    <div className="lt-card-stop">
                      <span className="lt-stop-dot dest" />
                      <div>
                        <div className="lt-stop-name">{trip.destination || 'Destination'}</div>
                        <div className="lt-stop-addr">{trip.destAddr || trip.destination || ''}</div>
                      </div>
                    </div>
                  </div>

                  {/* Driver row */}
                  <div className="lt-card-driver">
                    <div className="lt-driver-avatar">{trip.driverName?.charAt(0) || 'D'}</div>
                    <div className="lt-driver-info">
                      <span className="lt-driver-role">Driver</span>
                      <div className="lt-driver-name">{trip.driverName}</div>
                      {trip.isSimulated && <span className="lt-demo-pill">Simulated</span>}
                    </div>
                    <div className="lt-driver-btns">
                      <button className="lt-circle-btn phone-style" title="Call"><Phone size={13} /></button>
                      <button className="lt-circle-btn msg-style" title="Message">
                        <MessageSquare size={13} />
                        <span className="lt-msg-badge" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isActive && (
                    <div className="lt-expand">
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', marginBottom: 16, display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center', height: 36, fontSize: 13 }} 
                        onClick={(e) => { e.stopPropagation(); handleNarrateBusStatus(trip); }} 
                        disabled={narratingBus === trip.id}
                      >
                        <Volume2 size={15} /> {narratingBus === trip.id ? 'Generating...' : 'AI Status Narration'}
                      </button>

                      {/* Vehicle grid */}
                      <div className="lt-info-grid">
                        <div><span className="lt-info-label">Vehicle</span><span className="lt-info-val">{trip.regNumber}</span></div>
                        <div><span className="lt-info-label">NTC No.</span><span className="lt-info-val">{trip.ntcNumber}</span></div>
                        <div><span className="lt-info-label">Seats</span><span className="lt-info-val">{trip.totalSeats}</span></div>
                        <div><span className="lt-info-label">Type</span><span className="lt-info-val">{fmtType(trip.busType)}</span></div>
                      </div>

                      {/* Driver details */}
                      {trip.driverInfo && (
                        <div className="lt-detail-block">
                          <div className="lt-detail-title"><User size={12} /> Driver Details</div>
                          <div className="lt-info-grid">
                            <div><span className="lt-info-label">NIC</span><span className="lt-info-val">{trip.driverInfo.nic}</span></div>
                            <div><span className="lt-info-label">License</span><span className="lt-info-val">{trip.driverInfo.license}</span></div>
                            <div className="lt-span2"><span className="lt-info-label">Status</span><span className={`lt-status-pill ${(trip.driverInfo.status || '').toLowerCase()}`}>{trip.driverInfo.status}</span></div>
                          </div>
                        </div>
                      )}

                      {/* Stop timeline */}
                      <div className="lt-detail-block">
                        <div className="lt-detail-title"><Clock size={12} /> Stop Timeline</div>
                        <div className="lt-timeline">
                          {(trip.passedStops || []).map((s, i) => (
                            <div className="lt-tl-item passed" key={`p${i}`}>
                              <div className="lt-tl-icon-col"><CheckCircle size={14} className="lt-tl-check" />{i < trip.passedStops.length - 1 && <div className="lt-tl-line" />}</div>
                              <div className="lt-tl-text"><span className="lt-tl-name">{s}</span><span className="lt-tl-time">{passedTime(i, trip.passedStops.length)} · Passed</span></div>
                            </div>
                          ))}
                          <div className="lt-tl-item current">
                            <div className="lt-tl-icon-col"><div className="lt-tl-current-dot"><span className="lt-tl-pulse" /><Navigation size={9} color="white" /></div>{(trip.remainingStops?.length || 0) > 0 && <div className="lt-tl-line" />}</div>
                            <div className="lt-tl-text"><span className="lt-tl-name active-name">{trip.currentStop || 'In Transit'}</span><span className="lt-tl-time active-time">Now</span></div>
                          </div>
                          {(trip.remainingStops || []).map((s, i) => (
                            <div className="lt-tl-item upcoming" key={`u${i}`}>
                              <div className="lt-tl-icon-col"><div className="lt-tl-future-dot" />{i < trip.remainingStops.length - 1 && <div className="lt-tl-line dashed" />}</div>
                              <div className="lt-tl-text"><span className="lt-tl-name">{s}</span><span className="lt-tl-time">ETA {stopETA(i)}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ─── MAP SECTION ─── */}
        <section className={`lt-map-section ${mapTilt ? 'perspective' : ''}`}>
          {/* Custom Controls */}
          <div className="lt-map-ctrls-premium">
            <button className={`lt-map-btn-premium tilt-btn ${mapTilt ? 'active' : ''}`} onClick={() => setMapTilt(!mapTilt)}>
              <Layers size={14} />
              <span>3D</span>
            </button>
          </div>

          <div className="lt-map-navigation-controls">
            <button className="nav-ctrl-btn" onClick={() => setZoomInCount(c => c + 1)} title="Zoom In"><Plus size={16} /></button>
            <button className="nav-ctrl-btn" onClick={() => setZoomOutCount(c => c + 1)} title="Zoom Out"><Minus size={16} /></button>
            <button className="nav-ctrl-btn locate-btn" onClick={() => setLocateCount(c => c + 1)} title="Locate Bus"><Locate size={16} /></button>
          </div>

          {/* Route overlay */}
          {selectedTrip && (
            <div className="lt-route-overlay-premium">
              <span className="lt-ov-origin">{selectedTrip.origin || '—'}</span>
              <ChevronRight size={14} className="lt-ov-arrow" />
              <span className="lt-ov-dest">{selectedTrip.destination || '—'}</span>
            </div>
          )}

          {/* Map container */}
          <div className="lt-map-inner">
            <MapContainer
              center={selectedTrip ? [selectedTrip.lat, selectedTrip.lng] : [7.8731, 80.7718]}
              zoom={13} scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer url={tileUrl} attribution='&copy; OpenStreetMap contributors' />
              {selectedTrip && <FlyToTrip trip={selectedTrip} />}
              <MapController
                zoomInTrigger={zoomInCount}
                zoomOutTrigger={zoomOutCount}
                locateTrigger={locateCount}
                center={selectedTrip ? [selectedTrip.lat, selectedTrip.lng] : [7.8731, 80.7718]}
              />

              {/* Glowing Route Polyline */}
              {selectedTrip && roadCoordinates.length > 1 && (
                <>
                  <Polyline positions={roadCoordinates} color="#3B82F6" weight={10} opacity={0.16} lineJoin="round" lineCap="round" />
                  <Polyline positions={roadCoordinates} color="#3B82F6" weight={4.5} opacity={0.9} lineJoin="round" lineCap="round" />
                </>
              )}

              {/* Active Bus markers */}
              {displayedTrips.map(trip => (
                <Marker
                  key={trip.id}
                  position={[trip.lat, trip.lng]}
                  icon={createVehicleIcon(trip.heading || 0, selectedTrip?.id === trip.id)}
                  eventHandlers={{ click: () => setSelectedTrip(trip) }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'Outfit,sans-serif', minWidth: 140 }}>
                      <strong style={{ fontSize: 13, color: 'var(--text-main)' }}>{trip.regNumber}</strong>
                      <div style={{ fontSize: 11, color: '#6366F1', marginTop: 2, fontWeight: 600 }}>{fmtType(trip.busType)} Bus</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{trip.routeName}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Origin Marker & Text Card Overlay */}
              {selectedTrip && originCoord && (
                <>
                  <Marker position={originCoord} icon={originIcon} />
                  {originLabelIcon && <Marker position={originCoord} icon={originLabelIcon} />}
                </>
              )}

              {/* Destination Marker & Text Card Overlay */}
              {selectedTrip && destCoord && (
                <>
                  <Marker position={destCoord} icon={destIcon} />
                  {destLabelIcon && <Marker position={destCoord} icon={destLabelIcon} />}
                </>
              )}
            </MapContainer>
          </div>
        </section>
      </div>

      <style>{`
        /* ─── Layout Shell ─── */
        .lt-page { padding: 0; height: 100vh; display: flex; flex-direction: column; }
        .lt-shell {
          display: flex; flex: 1; height: 100%;
          border-radius: var(--radius-xl); overflow: hidden;
          border: 1px solid var(--border); box-shadow: var(--shadow-lg);
          background: var(--bg-card);
        }

        /* ─── Sidebar ─── */
        .lt-sidebar {
          width: 320px; min-width: 300px;
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          background: var(--bg-card);
          z-index: 10;
        }

        /* Premium Dual Search Box */
        .lt-search-box-premium {
          padding: 20px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-card);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .lt-search-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }
        .lt-search-inputs-container {
          display: flex;
          flex-direction: column;
          position: relative;
          gap: 0px;
        }
        .lt-search-field-premium {
          display: flex;
          align-items: center;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 0 14px;
          background: var(--bg-main);
          transition: border-color 0.2s;
          height: 44px;
          z-index: 2;
        }
        .lt-search-field-premium:focus-within {
          border-color: #6366F1;
        }
        .field-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .origin-dot { background-color: #F97316; }
        .dest-dot { background-color: #6366F1; }
        
        .lt-search-field-premium input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          color: var(--text-main);
          width: 100%;
          height: 100%;
        }
        .lt-search-field-premium input::placeholder {
          color: var(--text-muted);
        }
        .field-clear {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }
        .field-clear:hover {
          color: var(--accent-red);
        }

        .lt-swap-divider {
          height: 0;
          position: relative;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding-right: 14px;
          z-index: 3;
          margin: -1px 0;
        }
        .lt-swap-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
          position: relative;
          z-index: 4;
        }
        .lt-swap-btn:hover {
          border-color: #3B82F6;
          color: #3B82F6;
          transform: rotate(180deg);
        }

        .lt-search-actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }
        .lt-search-btn-primary {
          flex: 1;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 12px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(59,130,246,0.22);
          transition: var(--transition);
        }
        .lt-search-btn-primary:hover {
          background: #2563EB;
          box-shadow: 0 6px 14px rgba(59,130,246,0.32);
          transform: translateY(-1px);
        }
        .lt-search-btn-secondary {
          background: var(--bg-main);
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .lt-search-btn-secondary:hover {
          background: var(--border-light);
          color: var(--text-main);
        }

        /* Section header */
        .lt-section-head {
          display: flex; align-items: center; gap: 8px;
          padding: 18px 20px 10px;
        }
        .lt-section-head h3 { font-size: 14px; font-weight: 700; flex: 1; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); }
        .lt-live-indicator {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22C55E;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
          animation: ltPulse 2s infinite;
        }
        @keyframes ltPulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50%     { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
        }
        .lt-badge {
          background: var(--primary-light); color: var(--primary);
          font-size: 11px; font-weight: 700;
          padding: 2px 8px; border-radius: 6px;
        }
        .lt-icon-btn {
          width: 28px; height: 28px; border-radius: 8px;
          border: 1px solid var(--border); background: transparent;
          color: var(--text-muted); display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: var(--transition);
        }
        .lt-icon-btn:hover { color: var(--primary); border-color: var(--primary); }

        /* Cards scroll */
        .lt-cards-scroll {
          flex: 1; overflow-y: auto;
          padding: 8px 16px 16px;
          display: flex; flex-direction: column; gap: 14px;
        }
        .lt-placeholder {
          padding: 60px 16px; text-align: center;
          color: var(--text-muted); font-size: 13px; font-weight: 500;
          border: 1.5px dashed var(--border);
          border-radius: var(--radius-md);
        }
        .no-buses-placeholder {
          background: var(--bg-main);
          font-weight: 600;
          color: var(--text-muted);
          border-style: solid;
        }

        /* ─── Premium Card Layout (Reference Image Style) ─── */
        .lt-card {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 20px;
          cursor: pointer;
          transition: var(--transition);
          background: var(--bg-card);
          position: relative;
          box-shadow: var(--shadow-sm);
        }
        .lt-card:hover { 
          box-shadow: var(--shadow-md); 
          border-color: rgba(99,102,241,0.25); 
        }
        .lt-card.selected {
          border-color: #6366F1;
          box-shadow: 0 0 0 1px #6366F1, var(--shadow-md);
        }

        /* Card header */
        .lt-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .lt-card-label { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 4px; font-weight: 700; }
        .lt-card-number { font-size: 17px; font-weight: 800; color: var(--text-main); letter-spacing: -0.01em; font-family: 'Outfit', sans-serif; }
        .lt-card-category { font-size: 11px; color: var(--text-muted); font-weight: 500; display: block; margin-top: 3px; }
        .lt-bus-sil-wrapper {
          padding: 4px;
          border-radius: 8px;
          background: var(--bg-main);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
        }

        /* Route stops in card */
        .lt-card-route {
          display: flex; flex-direction: column; gap: 4px;
          padding-left: 2px; margin-bottom: 20px;
          position: relative;
        }
        .lt-card-route::before {
          content: ''; position: absolute;
          left: 6px; top: 16px; bottom: 16px;
          border-left: 1.5px dashed var(--border);
        }
        .lt-card-stop { display: flex; align-items: flex-start; gap: 14px; padding: 4px 0; position: relative; z-index: 1; }
        .lt-stop-dot {
          width: 10px; height: 10px; border-radius: 50%;
          flex-shrink: 0; margin-top: 4px;
          border: 2px solid var(--bg-card);
        }
        .lt-stop-dot.origin { background: #10B981; box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
        .lt-stop-dot.dest { background: #6366F1; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
        .lt-stop-name { font-size: 13px; font-weight: 700; color: var(--text-main); }
        .lt-stop-addr { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

        /* Driver in card */
        .lt-card-driver {
          display: flex; align-items: center; gap: 12px;
          padding-top: 16px; border-top: 1px solid var(--border-light);
        }
        .lt-driver-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: #6366F1; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700;
          box-shadow: 0 2px 6px rgba(99,102,241,0.2);
        }
        .lt-driver-info { flex: 1; }
        .lt-driver-role { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: block; font-weight: 700; }
        .lt-driver-name { font-size: 13px; font-weight: 700; color: var(--text-main); }
        .lt-demo-pill {
          display: inline-block; margin-left: 6px;
          font-size: 8px; background: rgba(99,102,241,0.1); color: #6366F1;
          padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase;
        }
        .lt-driver-btns { display: flex; gap: 8px; }
        .lt-circle-btn {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--bg-main); border: 1px solid var(--border);
          color: var(--text-secondary); display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: var(--transition);
          position: relative;
        }
        .lt-circle-btn:hover {
          transform: translateY(-1px);
        }
        .lt-circle-btn.phone-style {
          color: #6366F1;
          background-color: rgba(99,102,241,0.06);
          border-color: rgba(99,102,241,0.15);
        }
        .lt-circle-btn.phone-style:hover {
          background-color: #6366F1;
          color: white;
        }
        .lt-circle-btn.msg-style {
          color: #6366F1;
          background-color: rgba(99,102,241,0.06);
          border-color: rgba(99,102,241,0.15);
        }
        .lt-circle-btn.msg-style:hover {
          background-color: #6366F1;
          color: white;
        }
        .lt-msg-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #EF4444;
          border: 1.5px solid var(--bg-card);
        }

        /* ─── Expanded panel ─── */
        .lt-expand {
          margin-top: 18px; padding-top: 18px;
          border-top: 1px solid var(--border-light);
          display: flex; flex-direction: column; gap: 14px;
          animation: ltSlide 0.2s ease-out;
        }
        @keyframes ltSlide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        .lt-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .lt-info-label { display: block; font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .lt-info-val { display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-top: 2px; }
        .lt-span2 { grid-column: 1 / -1; }
        .lt-detail-block { background: var(--bg-main); border-radius: 12px; padding: 14px; border: 1px solid var(--border-light); }
        .lt-detail-title {
          display: flex; align-items: center; gap: 6px;
          font-size: 9px; font-weight: 700; color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;
        }
        .lt-status-pill {
          display: inline-block; padding: 3px 8px; border-radius: 6px;
          font-size: 10px; font-weight: 700;
        }
        .lt-status-pill.verified { background: #DCFCE7; color: #166534; }
        .lt-status-pill.pending { background: #FFF7ED; color: #C2410C; }

        /* Timeline */
        .lt-timeline { display: flex; flex-direction: column; }
        .lt-tl-item { display: flex; align-items: flex-start; gap: 10px; }
        .lt-tl-icon-col { display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0; }
        .lt-tl-check { color: #10B981; }
        .lt-tl-line { width: 2px; height: 18px; background: var(--border); margin: 2px 0; }
        .lt-tl-line.dashed { border-left: 2px dashed var(--border); width: 0; }
        .lt-tl-current-dot {
          width: 20px; height: 20px; border-radius: 50%;
          background: #6366F1; display: flex; align-items: center;
          justify-content: center; position: relative;
        }
        .lt-tl-pulse {
          position: absolute; inset: -4px; border-radius: 50%;
          border: 2px solid #6366F1; opacity: 0.4;
          animation: ltRing 1.5s infinite;
        }
        @keyframes ltRing { 0%,100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.35); opacity: 0; } }
        .lt-tl-future-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--border); background: var(--bg-card); margin: 5px 0; }
        .lt-tl-text { padding: 2px 0 14px; }
        .lt-tl-name { font-size: 12px; font-weight: 600; color: var(--text-main); display: block; }
        .lt-tl-item.passed .lt-tl-name { color: var(--text-muted); }
        .active-name { color: #6366F1 !important; }
        .lt-tl-time { font-size: 10px; font-weight: 500; display: block; margin-top: 1px; color: var(--text-muted); }
        .lt-tl-item.passed .lt-tl-time { color: #10B981; }
        .active-time { color: #6366F1 !important; font-weight: 700; }

        /* ─── MAP SECTION ─── */
        .lt-map-section {
          flex: 1; position: relative; overflow: hidden;
          background: var(--bg-main);
        }

        /* ── 3D Perspective with Vignette ── */
        .lt-map-inner {
          width: 100%; height: 100%;
          transition: transform 0.8s cubic-bezier(0.4,0,0.2,1);
        }
        .lt-map-section.perspective {
          perspective: 800px;
          perspective-origin: 50% 20%;
        }
        .lt-map-section.perspective .lt-map-inner {
          transform: rotateX(55deg) scale(1.6);
          transform-origin: center 70%;
          transform-style: preserve-3d;
        }
        /* Horizon fade vignette */
        .lt-map-section.perspective::after {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 42%;
          background: linear-gradient(to bottom, var(--bg-main) 0%, color-mix(in srgb, var(--bg-main) 75%, transparent) 40%, transparent 100%);
          z-index: 1000; pointer-events: none;
        }
        /* Bottom fade vignette */
        .lt-map-section.perspective::before {
          content: ''; position: absolute;
          bottom: 0; left: 0; right: 0; height: 16%;
          background: linear-gradient(to top, rgba(0,0,0,0.06), transparent);
          z-index: 1000; pointer-events: none;
        }
        /* Flat view */
        .lt-map-section:not(.perspective) .lt-map-inner {
          transform: rotateX(0deg) scale(1);
          transform-origin: center center;
        }
        .lt-map-section:not(.perspective)::after,
        .lt-map-section:not(.perspective)::before { display: none; }

        .lt-map-inner .leaflet-container { height: 100%; width: 100%; }

        /* Custom Floating Map Overlay labels (Reference Style) */
        .map-label-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .map-floating-label {
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 8px 14px;
          box-shadow: var(--shadow-md);
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          pointer-events: none;
          transform: translate(-50%, -100%);
          margin-top: -12px;
          animation: ltPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes ltPop { from { opacity: 0; transform: translate(-50%, -85%) scale(0.9); } to { opacity: 1; transform: translate(-50%, -100%) scale(1); } }
        .label-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .label-content {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .label-title {
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.2;
        }
        .label-subtitle {
          font-family: 'Outfit', sans-serif;
          font-size: 9.5px;
          color: var(--text-muted);
          line-height: 1.1;
          font-weight: 500;
        }

        /* Map Controls: 3D Toggle */
        .lt-map-ctrls-premium {
          position: absolute; top: 20px; right: 20px; z-index: 1010;
        }
        .lt-map-btn-premium {
          display: flex; align-items: center; gap: 6px;
          height: 38px; padding: 0 16px; border-radius: 12px;
          border: 1px solid var(--border); background: var(--bg-card);
          color: var(--text-secondary); font-size: 12px; font-weight: 600;
          cursor: pointer; box-shadow: var(--shadow-md); transition: var(--transition);
        }
        .lt-map-btn-premium:hover { color: #3B82F6; border-color: #3B82F6; }
        .lt-map-btn-premium.active { background: #3B82F6; color: white; border-color: #3B82F6; }

        /* Map Navigation Controls: Zoom & Locate */
        .lt-map-navigation-controls {
          position: absolute; bottom: 24px; right: 24px; z-index: 1010;
          display: flex; flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: var(--bg-card);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        .nav-ctrl-btn {
          width: 38px; height: 38px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }
        .nav-ctrl-btn:not(:last-child) {
          border-bottom: 1.5px solid var(--border-light);
        }
        .nav-ctrl-btn:hover {
          background-color: var(--bg-main);
          color: #3B82F6;
        }
        .locate-btn {
          color: #3B82F6;
        }

        /* Route overlay */
        .lt-route-overlay-premium {
          position: absolute; top: 20px; left: 20px; z-index: 1010;
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 14px;
          background: var(--bg-card); border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          font-size: 14px; font-weight: 700;
          animation: ltSlide 0.3s ease;
        }
        .lt-ov-origin { color: #10B981; }
        .lt-ov-arrow { color: var(--text-muted); }
        .lt-ov-dest { color: #6366F1; }

        /* Dark mode leaflet corrections */
        [data-theme='dark'] .leaflet-control-zoom-in,
        [data-theme='dark'] .leaflet-control-zoom-out,
        [data-theme='dark'] .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(90%) contrast(85%);
        }

        @media (max-width: 900px) {
          .lt-shell { flex-direction: column; border-radius: 0; }
          .lt-sidebar {
            width: 100%; min-width: unset;
            max-height: 360px; overflow-y: auto;
            border-right: none;
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
          }
          .lt-search-box-premium { padding: 14px 16px; }
          .lt-search-field-premium input { font-size: 13px; }
          .lt-search-actions { flex-direction: row; }
          .lt-search-btn-primary { flex: 1; }
          .lt-map-section { flex: 1; min-height: 320px; }
          .lt-map-section.perspective { perspective: none; }
          .lt-map-section.perspective .lt-map-inner { transform: none; }
          .lt-map-section.perspective::after,
          .lt-map-section.perspective::before { display: none; }
          .lt-route-overlay-premium {
            top: 10px; left: 10px; right: 10px;
            font-size: 12px; padding: 8px 14px;
          }
          .lt-map-ctrls-premium { top: 10px; right: 10px; }
          .lt-map-navigation-controls { bottom: 10px; right: 10px; }
          .lt-cards-scroll { max-height: 200px; }
          .lt-section-head { padding: 10px 14px 8px; }
        }
        @media (max-width: 600px) {
          .lt-page { height: calc(100vh - 56px); }
          .lt-sidebar { max-height: 50vh; }
          .lt-map-section { min-height: 280px; }
          .lt-card { padding: 12px 14px; }
          .lt-card-number { font-size: 15px; }
          .lt-expand { padding: 10px 0 0; }
        }
      `}</style>
    </div>
  );
};

export default LiveTracking;
