import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  ChevronDown,
  TrendingUp,
  Bus,
  MapPin,
  Phone,
  MessageSquare,
  DollarSign,
  Ticket,
  ArrowUpRight,
  BarChart3,
  Activity,
  Maximize2,
  Minus,
  Plus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Fix for default Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom bus marker icon
const busIcon = new L.Icon({
  iconUrl: '/bus.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const revenueData = [
  { name: 'Mar', val: 1200 }, { name: 'Apr', val: 900 },
  { name: 'May', val: 1800 }, { name: 'Jun', val: 1400 },
  { name: 'Jul', val: 2200 }, { name: 'Aug', val: 1900 },
  { name: 'Sep', val: 2800 }, { name: 'Oct', val: 2400 },
  { name: 'Nov', val: 3100 },
];

const sparkData = [
  { v: 30 }, { v: 45 }, { v: 35 }, { v: 60 }, { v: 50 },
  { v: 70 }, { v: 55 }, { v: 80 }, { v: 65 }, { v: 90 },
  { v: 75 }, { v: 85 },
];

const Overview = () => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    passengers: 0, buses: 0, bookings: 0, revenue: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Realtime Live Trips State
  const [liveTrips, setLiveTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    // 1. Fetch Stats
    const fetchStats = async () => {
      try {
        const { count: passengerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'PASSENGER');
        const { count: busCount } = await supabase.from('buses').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
        const { count: bookingCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
        const { data: revenueRows } = await supabase.from('bookings').select('total_fare').in('status', ['CONFIRMED', 'SCANNED']);
        const totalRevenue = revenueRows?.reduce((acc, c) => acc + Number(c.total_fare), 0) || 0;
        setStats({ passengers: passengerCount || 0, buses: busCount || 0, bookings: bookingCount || 0, revenue: totalRevenue });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    // 2. Fetch Live Trips
    const fetchLiveTrips = async () => {
      try {
        const { data, error } = await supabase
          .from('trip_schedules')
          .select(`id, live_lat, live_lng, driver_id, buses ( vehicle_reg_number ), routes ( route_name )`)
          .eq('status', 'LIVE');
          
        if (!error && data) {
          const driverIds = [...new Set(data.filter(s => s.driver_id).map(s => s.driver_id))];
          let driverMap = {};
          if (driverIds.length > 0) {
            const { data: dData } = await supabase.from('profiles').select('id, full_name').in('id', driverIds);
            (dData || []).forEach(d => { driverMap[d.id] = d.full_name; });
          }

          const parsed = data.map(s => ({
            id: s.id,
            lat: Number(s.live_lat) || 7.8731,
            lng: Number(s.live_lng) || 80.7718,
            regNumber: s.buses?.vehicle_reg_number || 'Unknown Bus',
            driverName: driverMap[s.driver_id] || 'Unassigned',
            routeName: s.routes?.route_name || 'Unknown Route'
          }));
          
          setLiveTrips(parsed);
          if (parsed.length > 0) {
            setSelectedTrip(curr => curr ? parsed.find(p => p.id === curr.id) || parsed[0] : parsed[0]);
          } else {
            setSelectedTrip(null);
          }
        }
      } catch (e) {
        console.error('Error fetching live trips:', e);
      }
    };

    fetchStats();
    fetchLiveTrips();

    // 3. Subscribe to Realtime Location Updates
    const channel = supabase.channel('live_locations_overview')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trip_schedules' }, payload => {
        const newRow = payload.new;
        if (newRow.status === 'LIVE') {
          setLiveTrips(prev => {
            const idx = prev.findIndex(t => t.id === newRow.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], lat: Number(newRow.live_lat), lng: Number(newRow.live_lng) };
              setSelectedTrip(curr => curr?.id === newRow.id ? updated[idx] : curr);
              return updated;
            } else {
              // A new trip went live, re-fetch to get relations (driver name, bus reg, etc)
              fetchLiveTrips();
              return prev;
            }
          });
        } else if (newRow.status === 'COMPLETED' || newRow.status === 'CANCELLED') {
          setLiveTrips(prev => {
            const updated = prev.filter(t => t.id !== newRow.id);
            setSelectedTrip(curr => curr?.id === newRow.id ? (updated[0] || null) : curr);
            return updated;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const tileUrl = isDarkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="overview">
      {/* ═══════════ MAP SECTION ═══════════ */}
      <div className="map-section">
        <div className="map-overlay-controls">
          <div className="map-search-bar">
            <Search size={16} />
            <input type="text" placeholder="Colombo, Sri Lanka" />
          </div>
          <div className="map-filter-pill">
            <span>Sort by</span>
            <strong>In Transit</strong>
            <ChevronDown size={14} />
          </div>
        </div>

        <MapContainer
          center={selectedTrip ? [selectedTrip.lat, selectedTrip.lng] : [7.8731, 80.7718]}
          zoom={selectedTrip ? 12 : 7}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          key={selectedTrip?.id || 'map'}
          zoomControl={false}
        >
          <TileLayer
            url={tileUrl}
            attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
          />
          {liveTrips.map((trip) => (
            <Marker
              key={trip.id}
              position={[trip.lat, trip.lng]}
              icon={busIcon}
              eventHandlers={{
                click: () => {
                  setSelectedTrip(trip);
                },
              }}
            >
              <Popup>
                <strong>{trip.regNumber}</strong><br />
                {trip.routeName}<br />
                <em>{trip.driverName}</em>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="map-corner-controls">
          <button className="map-ctrl-btn"><Maximize2 size={16} /></button>
          <button className="map-ctrl-btn"><Plus size={16} /></button>
          <button className="map-ctrl-btn"><Minus size={16} /></button>
        </div>
      </div>

      {/* ═══════════ CARDS GRID ═══════════ */}
      <div className="cards-grid">

        {/* ── Card 1: Booking Volume ── */}
        <motion.div className="ov-card card-booking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="card-top">
            <div className="card-label"><Activity size={16} /> Booking volume</div>
            <button className="card-icon-btn"><BarChart3 size={14} /></button>
          </div>

          <div className="sparkline-container">
            <ResponsiveContainer width="100%" height={50}>
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone" dataKey="v"
                  stroke="var(--primary)" strokeWidth={2}
                  fill="url(#sparkGrad)" dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="big-stats-row">
            <div className="big-stat">
              <span className="big-num">{loading ? '...' : (stats.bookings || 1544).toLocaleString()}</span>
              <span className="big-label">Booked this month</span>
            </div>
            <div className="big-stat">
              <span className="big-num">96%</span>
              <span className="big-label">Successful trips</span>
            </div>
          </div>

          <div className="mini-stats-grid">
            <div className="mini-stat">
              <span className="mini-label">Trips in transit</span>
              <div className="mini-val-row">
                <span className="mini-val">{loading ? '...' : (stats.buses || 482)}</span>
                <TrendingUp size={14} className="mini-chart-icon" />
              </div>
            </div>
            <div className="mini-stat">
              <div className="mini-label">Delayed trips</div>
              <div className="mini-val-row">
                <span className="mini-val">14</span>
                <span className="mini-badge warn">4% of all</span>
              </div>
            </div>
            <div className="mini-stat">
              <span className="mini-label">Fuel cost this month</span>
              <span className="mini-val">Rs.18,420</span>
            </div>
            <div className="mini-stat">
              <span className="mini-label">Avg. trip time</span>
              <span className="mini-val">2d 24h 16m</span>
            </div>
          </div>
        </motion.div>

        {/* ── Card 2: Fleet / Vehicles ── */}
        <motion.div className="ov-card card-fleet" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="card-top">
            <div className="card-label"><Bus size={16} /> Fleet</div>
            <span className="card-count">{loading ? '...' : stats.buses || 66} Total</span>
          </div>

          <div className="fleet-stats-row">
            <div className="fleet-stat-circle">
              <span className="fleet-stat-num">128</span>
              <span className="fleet-stat-label">Trips</span>
            </div>
            <div className="fleet-stat-circle">
              <span className="fleet-stat-num">92%</span>
              <span className="fleet-stat-label">On-time</span>
            </div>
            <div className="fleet-stat-circle">
              <span className="fleet-stat-num">1,840</span>
              <span className="fleet-stat-label">Distance (km)</span>
            </div>
          </div>

          <div className="fleet-vehicle-preview">
            <img src="/truck.png" alt="Bus" className="vehicle-img" />
            <div className="vehicle-label">
              <span>{selectedTrip ? selectedTrip.regNumber : 'No Bus Selected'} • <span className="active-dot">{selectedTrip ? 'Active' : 'N/A'}</span></span>
            </div>
          </div>

          <div className="fleet-driver-row">
            <div className="driver-avatar-sm">{selectedTrip ? selectedTrip.driverName.charAt(0) : '?'}</div>
            <div className="driver-meta">
              <strong>{selectedTrip ? selectedTrip.driverName : 'Unassigned'}</strong>
              <span>Driver</span>
            </div>
            <div className="driver-actions-sm">
              <button className="act-circle"><MapPin size={14} /></button>
              <button className="act-circle"><Phone size={14} /></button>
              <button className="act-circle"><MessageSquare size={14} /></button>
            </div>
          </div>
        </motion.div>

        {/* ── Card 3: Right Column (stacked) ── */}
        <div className="card-right-col">
          {/* Latest Booking */}
          <motion.div className="ov-card card-latest" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="card-top">
              <div className="card-label"><Ticket size={16} /> Latest Booking</div>
              <span className="see-all-link">See all</span>
            </div>
            <div className="latest-booking-row">
              <div className="latest-info">
                <h4>#RT-{(stats.bookings || 846134).toString().padStart(6, '0')}</h4>
                <span className="latest-status-pill">In Transit</span>
                <p className="latest-address">Colombo Fort → Maharagama</p>
              </div>
              <div className="latest-mini-map">
                <MapPin size={24} className="mini-map-pin" />
              </div>
            </div>
          </motion.div>

          {/* Revenue Overview */}
          <motion.div className="ov-card card-revenue" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="card-top">
              <div className="card-label"><DollarSign size={16} /> Revenue Overview</div>
              <span className="card-date-range">16 Jun - 1 Sep</span>
            </div>
            <div className="revenue-big-row">
              <h2 className="revenue-amount">
                Rs.{loading ? '...' : (stats.revenue || 223465).toLocaleString()}.40
              </h2>
              <span className="revenue-badge up"><ArrowUpRight size={12} /> +32.2%</span>
            </div>
            <div className="revenue-chart">
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={revenueData} barSize={6}>
                  <Bar dataKey="val" radius={[3, 3, 0, 0]}>
                    {revenueData.map((_, i) => (
                      <Cell key={i} fill={i === revenueData.length - 1 ? 'var(--primary)' : 'var(--border)'} />
                    ))}
                  </Bar>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .overview {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ═══ MAP SECTION ═══ */
        .map-section {
          position: relative;
          height: 420px;
          border-radius: var(--radius-xl);
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
        }

        .map-overlay-controls {
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 999;
          display: flex;
          gap: 12px;
        }

        .map-search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 40px;
          padding: 10px 20px;
          min-width: 220px;
          box-shadow: var(--shadow-md);
          color: var(--text-muted);
        }
        .map-search-bar input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-main);
          width: 100%;
        }

        .map-filter-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 40px;
          padding: 10px 18px;
          font-size: 13px;
          color: var(--text-muted);
          box-shadow: var(--shadow-md);
          cursor: pointer;
        }
        .map-filter-pill strong {
          color: var(--text-main);
          font-weight: 700;
        }

        .map-corner-controls {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 999;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .map-ctrl-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: all 0.15s ease;
        }
        .map-ctrl-btn:hover {
          color: var(--primary);
          border-color: var(--primary);
        }

        /* Leaflet overrides */
        .map-section :global(.leaflet-container) {
          background: var(--bg-main);
        }
        .map-section :global(.leaflet-control-attribution) {
          display: none;
        }

        /* ═══ CARDS GRID ═══ */
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }

        .ov-card {
          padding: 24px;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .card-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
        }
        .card-icon-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .card-count {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
        }
        .see-all-link {
          font-size: 12px;
          font-weight: 600;
          color: var(--primary);
          cursor: pointer;
        }
        .card-date-range {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* ── Card 1: Booking Volume ── */
        .sparkline-container {
          margin-bottom: 16px;
        }
        .big-stats-row {
          display: flex;
          gap: 32px;
          margin-bottom: 20px;
        }
        .big-stat {
          display: flex;
          flex-direction: column;
        }
        .big-num {
          font-size: 32px;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.1;
        }
        .big-label {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
          margin-top: 4px;
        }
        .mini-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .mini-stat {
          background: var(--bg-main);
          border-radius: var(--radius-sm);
          padding: 14px;
          border: 1px solid var(--border-light);
        }
        .mini-label {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
          margin-bottom: 6px;
          display: block;
        }
        .mini-val-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mini-val {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-main);
        }
        .mini-chart-icon {
          color: var(--primary);
        }
        .mini-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .mini-badge.warn {
          background: rgba(255, 122, 34, 0.12);
          color: var(--accent-orange);
        }

        /* ── Card 2: Fleet ── */
        .fleet-stats-row {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
          gap: 12px;
        }
        .fleet-stat-circle {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 2px solid var(--border);
          transition: var(--transition);
        }
        .fleet-stat-circle:hover {
          border-color: var(--primary);
        }
        .fleet-stat-num {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-main);
        }
        .fleet-stat-label {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 500;
          margin-top: 2px;
        }

        .fleet-vehicle-preview {
          text-align: center;
          margin-bottom: 16px;
          position: relative;
        }
        .vehicle-img {
          width: 85%;
          max-width: 280px;
          height: auto;
          object-fit: contain;
          border-radius: var(--radius-md);
        }
        .vehicle-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 8px;
        }
        .active-dot {
          color: var(--accent-green);
          font-weight: 700;
        }

        .fleet-driver-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .driver-avatar-sm {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;
        }
        .driver-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .driver-meta strong {
          font-size: 13px;
          color: var(--text-main);
        }
        .driver-meta span {
          font-size: 11px;
          color: var(--text-muted);
        }
        .driver-actions-sm {
          display: flex;
          gap: 6px;
        }
        .act-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .act-circle:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        /* ── Card 3: Right Column ── */
        .card-right-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Latest Booking */
        .latest-booking-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .latest-info {
          flex: 1;
        }
        .latest-info h4 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .latest-status-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          background: rgba(0, 102, 255, 0.1);
          color: var(--primary);
          margin-bottom: 8px;
        }
        .latest-address {
          font-size: 12px;
          color: var(--text-muted);
        }
        .latest-mini-map {
          width: 72px;
          height: 72px;
          border-radius: var(--radius-md);
          background: var(--secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .mini-map-pin {
          color: var(--primary);
        }

        /* Revenue */
        .revenue-big-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 12px;
        }
        .revenue-amount {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-main);
        }
        .revenue-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 3px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
        }
        .revenue-badge.up {
          background: rgba(16, 185, 129, 0.12);
          color: var(--accent-green);
        }
        .revenue-chart {
          margin-top: 4px;
        }

        /* ═══ RESPONSIVE ═══ */
        @media (max-width: 1200px) {
          .cards-grid {
            grid-template-columns: 1fr 1fr;
          }
          .card-right-col {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 768px) {
          .map-section { height: 280px; }
          .cards-grid {
            grid-template-columns: 1fr;
          }
          .card-right-col {
            grid-template-columns: 1fr;
          }
          .big-num { font-size: 24px; }
          .fleet-stats-row { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
};

export default Overview;
