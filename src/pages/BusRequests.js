import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { Check, X as XIcon, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

const BusRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const seedData = [
    { id: '1', driver_name: 'Sunil Shantha', bus_reg: 'WP NB-4521', status: 'PENDING', driver_note: 'My regular bus is in maintenance.', created_at: '2026-05-04' },
    { id: '2', driver_name: 'Kamal Perera', bus_reg: 'SP ND-1209', status: 'APPROVED', driver_note: 'Requesting for the long trip.', created_at: '2026-05-02' },
    { id: '3', driver_name: 'Nimal Silva', bus_reg: 'CP NA-3321', status: 'REJECTED', driver_note: 'Need a bus with more seats.', created_at: '2026-05-01' },
  ];

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bus_assignment_requests')
        .select('*');
      if (error) throw error;
      setRequests(data && data.length > 0 ? data : seedData);
    } catch {
      setRequests(seedData);
    } finally {
      setLoading(false);
    }
  }, [seedData]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const updateStatus = async (row, newStatus) => {
    try {
      const { error } = await supabase
        .from('bus_assignment_requests')
        .update({ status: newStatus })
        .eq('id', row.id);
      if (error) throw error;
      notify(`Request ${newStatus.toLowerCase()}!`);
      fetchRequests();
    } catch {
      // Fallback: update local state
      setRequests(prev => prev.map(r => r.id === row.id ? { ...r, status: newStatus } : r));
      notify(`Request ${newStatus.toLowerCase()} (local)`, 'success');
    }
  };

  const columns = [
    { header: 'Driver', accessor: 'driver_name' },
    { header: 'Requested Bus', accessor: 'bus_reg' },
    {
      header: 'Status', accessor: 'status',
      render: (v) => <span className={`rq-pill ${(v || '').toLowerCase()}`}>{v}</span>
    },
    { header: 'Note', accessor: 'driver_note' },
    {
      header: 'Date', accessor: 'created_at',
      render: (v) => v ? new Date(v).toLocaleDateString() : '—'
    },
    {
      header: 'Actions', accessor: 'id',
      render: (_, row) => (
        <div className="rq-actions">
          {row.status === 'PENDING' && (
            <>
              <button className="rq-btn approve" onClick={() => updateStatus(row, 'APPROVED')} title="Approve">
                <Check size={14} />
              </button>
              <button className="rq-btn reject" onClick={() => updateStatus(row, 'REJECTED')} title="Reject">
                <XIcon size={14} />
              </button>
            </>
          )}
          {row.status !== 'PENDING' && <span className="rq-done">—</span>}
        </div>
      )
    }
  ];

  const tableActions = (
    <button className="btn btn-secondary" onClick={fetchRequests}><RefreshCw size={14} /> Refresh</button>
  );

  return (
    <div className="page-requests">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {loading ? (
        <div className="loading-state">Loading requests...</div>
      ) : (
        <DataTable title="Bus Assignment Requests" columns={columns} data={requests} actions={tableActions} />
      )}

      <style jsx>{`
        .rq-pill { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
        .rq-pill.pending { background: #FFF7ED; color: #C2410C; }
        .rq-pill.approved { background: #DCFCE7; color: #166534; }
        .rq-pill.rejected { background: #FEF2F2; color: #B91C1C; }
        .rq-actions { display: flex; gap: 6px; }
        .rq-btn {
          width: 30px; height: 30px; border-radius: 8px; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s ease;
        }
        .rq-btn.approve { background: #DCFCE7; color: #166534; }
        .rq-btn.approve:hover { background: #166534; color: white; }
        .rq-btn.reject { background: #FEF2F2; color: #B91C1C; }
        .rq-btn.reject:hover { background: #B91C1C; color: white; }
        .rq-done { color: var(--text-muted); font-size: 12px; }
        .toast { position: fixed; top: 20px; right: 20px; padding: 14px 22px; border-radius: var(--radius-sm); color: white; font-weight: 600; font-size: 13px; z-index: 3000; box-shadow: var(--shadow-lg); animation: slideIn 0.3s ease; }
        .toast.success { background: var(--accent-green); }
        .toast.error { background: var(--accent-red); }
        @keyframes slideIn { from { transform: translateY(-16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default BusRequests;
