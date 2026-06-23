import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import {
  Bus,
  Ticket,
  ArrowUpRight,
  BarChart3,
  Activity,
  DollarSign,
  Users,
  Calendar,
  CreditCard
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
  LineChart,
  Line
} from 'recharts';


const Overview = () => {
  const [stats, setStats] = useState({
    passengers: 0, buses: 0, bookings: 0, revenue: 0
  });
  const [loading, setLoading] = useState(true);

  // Dynamic Chart States
  const [chartRevenueData, setChartRevenueData] = useState([]);
  const [chartTrafficData, setChartTrafficData] = useState([]);
  const [chartBusStatusData, setChartBusStatusData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [activeBusesList, setActiveBusesList] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Basic Counts
        const { count: passengerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'PASSENGER');
        const { count: busCount } = await supabase.from('buses').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
        const { count: bookingCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
        
        // 2. Revenue & Traffic Data from Bookings
        const { data: revenueRows } = await supabase.from('bookings').select('created_at, total_fare').in('status', ['CONFIRMED', 'SCANNED']);
        
        const totalRevenue = revenueRows?.reduce((acc, c) => acc + Number(c.total_fare || 0), 0) || 0;
        
        // Aggregate Revenue by Month
        const revMap = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach(m => revMap[m] = 0);
        
        // Aggregate Traffic by Hour
        const trafficMap = {};

        revenueRows?.forEach(r => {
           const d = new Date(r.created_at);
           const m = months[d.getMonth()];
           revMap[m] += Number(r.total_fare || 0);

           const hr = d.getHours().toString().padStart(2, '0') + ':00';
           trafficMap[hr] = (trafficMap[hr] || 0) + 1;
        });

        setChartRevenueData(months.map(m => ({ name: m, val: revMap[m] })));
        
        const tData = Object.keys(trafficMap).sort().map(k => ({ time: k, passengers: trafficMap[k] }));
        // If empty, supply a flatline to prevent chart crash
        setChartTrafficData(tData.length > 0 ? tData : [{ time: '00:00', passengers: 0 }]);

        // 3. Bus Status Data
        const { data: busData } = await supabase.from('buses').select('status');
        const stMap = {};
        busData?.forEach(b => {
          const s = (b.status || 'UNKNOWN').toUpperCase();
          stMap[s] = (stMap[s] || 0) + 1;
        });
        setChartBusStatusData([
          { name: 'In Transit', value: stMap['ACTIVE'] || 0, color: '#6366F1' },
          { name: 'Maintenance', value: stMap['MAINTENANCE'] || 0, color: '#EF4444' },
          { name: 'Available', value: stMap['AVAILABLE'] || 0, color: '#10B981' }
        ]);

        // 4. Recent Transactions
        const { data: recentBk } = await supabase.from('bookings')
          .select(`id, booking_reference, total_fare, trip_schedules(routes(origin, destination))`)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentTransactions(recentBk || []);

        // 5. Active Buses List
        const { data: aBuses } = await supabase.from('buses')
          .select('vehicle_reg_number, bus_type, routes(route_name, origin, destination)')
          .eq('status', 'ACTIVE')
          .limit(5);
        setActiveBusesList(aBuses || []);

        setStats({ passengers: passengerCount || 0, buses: busCount || 0, bookings: bookingCount || 0, revenue: totalRevenue });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="stat-card-icon" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={22} />
      </div>
      <div className="stat-card-content">
        <h3>{title}</h3>
        <h2>{loading ? '...' : value}</h2>
        <div className="stat-card-footer">
          <span className={`trend ${trend >= 0 ? 'up' : 'down'}`}>
            <ArrowUpRight size={14} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </span>
          <span className="subtitle">{subtitle}</span>
        </div>
      </div>
    </motion.div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="label">{label}</p>
          <p className="value">
            {payload[0].name === 'val' ? 'Rs.' : ''}
            {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Analytics Overview</h1>
          <p className="page-subtitle">Monitor your system performance and metrics</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="date-picker-btn">
            <Calendar size={16} />
            <span>Last 30 Days</span>
          </div>
        </div>
      </div>

      {/* ─── Top Stats Grid ─── */}
      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={`Rs.${stats.revenue.toLocaleString()}`}
          subtitle="vs last month"
          icon={DollarSign}
          color="#10B981"
          trend={12.5}
        />
        <StatCard
          title="Total Bookings"
          value={stats.bookings.toLocaleString()}
          subtitle="vs last month"
          icon={Ticket}
          color="#6366F1"
          trend={8.2}
        />
        <StatCard
          title="Active Passengers"
          value={stats.passengers.toLocaleString()}
          subtitle="vs last month"
          icon={Users}
          color="#F59E0B"
          trend={-2.4}
        />
        <StatCard
          title="Active Fleet"
          value={stats.buses.toLocaleString()}
          subtitle="Available for trips"
          icon={Bus}
          color="#3B82F6"
          trend={5.1}
        />
      </div>

      {/* ─── Main Charts Area ─── */}
      <div className="charts-grid-main">
        {/* Revenue Area Chart */}
        <motion.div className="chart-card wide" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <div className="chart-header">
            <div>
              <h3>Revenue Growth</h3>
              <p>Monthly earnings performance</p>
            </div>
            <button className="chart-action"><BarChart3 size={16} /></button>
          </div>
          <div className="chart-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `Rs.${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="val" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Fleet Status Pie Chart */}
        <motion.div className="chart-card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <div className="chart-header">
            <div>
              <h3>Fleet Status</h3>
              <p>Current state of all buses</p>
            </div>
            <button className="chart-action"><Activity size={16} /></button>
          </div>
          <div className="chart-body flex-center" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartBusStatusData}
                  cx="50%" cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartBusStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="custom-legend">
              {chartBusStatusData.map((item, i) => (
                <div key={i} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-val">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Bottom Grid ─── */}
      <div className="charts-grid-bottom">
        {/* Passenger Traffic Line Chart */}
        <motion.div className="chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="chart-header">
            <div>
              <h3>Passenger Traffic</h3>
              <p>Peak hours today</p>
            </div>
          </div>
          <div className="chart-body" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="smooth" dataKey="passengers" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Transactions List */}
        <motion.div className="chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="chart-header">
            <div>
              <h3>Recent Transactions</h3>
              <p>Latest ticket purchases</p>
            </div>
          </div>
          <div className="transaction-list">
            {recentTransactions.map((tx, i) => (
              <div key={i} className="transaction-item">
                <div className="tx-icon">
                  <CreditCard size={16} />
                </div>
                <div className="tx-details">
                  <h4>Booking {tx.booking_reference}</h4>
                  <p>{tx.trip_schedules?.routes?.origin} → {tx.trip_schedules?.routes?.destination}</p>
                </div>
                <div className="tx-amount">
                  +Rs. {Number(tx.total_fare || 0).toLocaleString()}
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && <p className="text-muted" style={{ fontSize: 13 }}>No recent transactions.</p>}
          </div>
        </motion.div>
        
        {/* Active Fleet List */}
        <motion.div className="chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="chart-header">
            <div>
              <h3>Active Fleet</h3>
              <p>Buses currently running</p>
            </div>
          </div>
          <div className="transaction-list">
            {activeBusesList.map((bus, i) => (
              <div key={i} className="transaction-item">
                <div className="tx-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                  <Bus size={16} />
                </div>
                <div className="tx-details">
                  <h4>{bus.vehicle_reg_number}</h4>
                  <p>{bus.routes ? `${bus.routes.origin} → ${bus.routes.destination}` : 'Unassigned Route'}</p>
                </div>
                <div className="tx-amount" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-main)', background: 'var(--bg-main)', padding: '4px 8px', borderRadius: 12 }}>
                  {bus.bus_type}
                </div>
              </div>
            ))}
            {activeBusesList.length === 0 && <p className="text-muted" style={{ fontSize: 13 }}>No active buses right now.</p>}
          </div>
        </motion.div>
      </div>

      <style>{`
        .analytics-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Header */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .page-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 4px;
        }
        .page-subtitle {
          font-size: 14px;
          color: var(--text-muted);
        }
        .date-picker-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: 8px;
          color: var(--text-main);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .date-picker-btn:hover { border-color: var(--primary); }

        /* Top Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          box-shadow: var(--shadow-sm);
        }
        .stat-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-card-content { flex: 1; }
        .stat-card-content h3 {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 6px;
        }
        .stat-card-content h2 {
          font-size: 26px;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 8px;
        }
        .stat-card-footer {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .trend {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 12px;
          font-weight: 700;
        }
        .trend.up { color: #10B981; }
        .trend.down { color: #EF4444; }
        .rotate-180 { transform: rotate(90deg); }
        .subtitle {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Charts Main Grid */
        .charts-grid-main {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }
        .charts-grid-bottom {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        /* Chart Cards */
        .chart-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .chart-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 4px;
        }
        .chart-header p {
          font-size: 13px;
          color: var(--text-muted);
        }
        .chart-action {
          background: var(--bg-main);
          border: 1px solid var(--border);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          cursor: pointer;
        }

        /* Custom Tooltip */
        .chart-tooltip {
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 10px 14px;
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
        }
        .chart-tooltip .label {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .chart-tooltip .value {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
        }

        /* Legend */
        .custom-legend {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 16px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .legend-label { font-size: 12px; color: var(--text-muted); }
        .legend-val { font-size: 12px; font-weight: 700; color: var(--text-main); }
        
        .flex-center { position: relative; display: flex; flex-direction: column; }

        /* Lists */
        .transaction-list, .insights-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }
        .transaction-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-light);
        }
        .transaction-item:last-child { border-bottom: none; padding-bottom: 0; }
        .tx-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.1);
          color: #6366F1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tx-details { flex: 1; }
        .tx-details h4 { font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 2px; }
        .tx-details p { font-size: 11px; color: var(--text-muted); }
        .tx-amount { font-size: 14px; font-weight: 700; color: #10B981; }

        .insight-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: var(--bg-main);
          padding: 14px;
          border-radius: var(--radius-md);
        }
        .insight-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .insight-item p {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-muted);
        }
        .insight-item p strong { color: var(--text-main); }

        /* Responsive */
        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .charts-grid-main { grid-template-columns: 1fr; }
          .charts-grid-bottom { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr; }
          .charts-grid-bottom { grid-template-columns: 1fr; }
          .dashboard-header { flex-direction: column; align-items: flex-start; gap: 16px; }
        }
      `}</style>
    </div>
  );
};

export default Overview;
