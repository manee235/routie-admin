import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { Download, RefreshCw, X, FileDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { exportToPDF } from '../utils/exportPDF';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`id, booking_reference, pickup_stop, seat_count, total_fare, status,
          passenger_profiles ( profiles ( full_name ) ),
          trip_schedules ( departure_time, routes ( origin, destination ) )`);
      if (error) throw error;
      setBookings((data || []).map(b => ({
        ...b,
        passenger_name: b.passenger_profiles?.profiles?.full_name || 'Unknown',
        trip_info: b.trip_schedules?.routes
          ? `${b.trip_schedules.routes.origin} → ${b.trip_schedules.routes.destination}`
          : 'N/A',
        dep_time: b.trip_schedules?.departure_time || ''
      })));
    } catch (err) {
      console.error('Error fetching bookings:', err.message);
      notify('Error loading bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const openEdit = (row) => setModal({ data: { ...row } });

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('bookings').update({
        status: modal.data.status,
        seat_count: Number(modal.data.seat_count),
      }).eq('id', modal.data.id);
      if (error) throw error;
      notify('Booking updated!');
      setModal(null);
      fetchBookings();
    } catch (err) {
      notify('Update failed: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Cancel booking "${row.booking_reference}"?`)) return;
    try {
      const { error } = await supabase.from('bookings').update({ status: 'CANCELLED' }).eq('id', row.id);
      if (error) throw error;
      notify('Booking cancelled');
      fetchBookings();
    } catch (err) {
      notify('Failed: ' + err.message, 'error');
    }
  };

  const columns = [
    { header: 'Ref ID', accessor: 'booking_reference', width: '120px' },
    { header: 'Passenger', accessor: 'passenger_name' },
    { header: 'Trip', accessor: 'trip_info' },
    { header: 'Pickup', accessor: 'pickup_stop' },
    { header: 'Seats', accessor: 'seat_count', width: '70px' },
    {
      header: 'Amount', accessor: 'total_fare',
      render: (v) => v ? `Rs.${Number(v).toLocaleString()}` : '—'
    },
    {
      header: 'Status', accessor: 'status',
      render: (v) => <span className={`bk-pill ${(v || '').toLowerCase()}`}>{v}</span>
    },
  ];

  const pdfColumns = [
    { header: 'Ref ID', accessor: 'booking_reference' },
    { header: 'Passenger', accessor: 'passenger_name' },
    { header: 'Trip', accessor: 'trip_info' },
    { header: 'Pickup', accessor: 'pickup_stop' },
    { header: 'Seats', accessor: 'seat_count' },
    { header: 'Amount', accessor: 'total_fare' },
    { header: 'Status', accessor: 'status' },
  ];

  const tableActions = (
    <>
      <button className="btn btn-secondary" onClick={() => exportToPDF('Ticket_Bookings', pdfColumns, bookings)}><FileDown size={14} /> Export PDF</button>
      <button className="btn btn-secondary" onClick={fetchBookings}><RefreshCw size={14} /> Refresh</button>
    </>
  );

  return (
    <div className="page-bookings">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {loading ? (
        <div className="loading-state">Loading bookings...</div>
      ) : (
        <DataTable title="Ticket Bookings" columns={columns} data={bookings} actions={tableActions} onEdit={openEdit} onDelete={handleDelete} />
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box ov-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Edit Booking</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="fg"><label>Reference</label><input value={modal.data.booking_reference || ''} disabled /></div>
              <div className="fg"><label>Passenger</label><input value={modal.data.passenger_name || ''} disabled /></div>
              <div className="fg"><label>Trip</label><input value={modal.data.trip_info || ''} disabled /></div>
              <div className="fg"><label>Seats</label>
                <input type="number" value={modal.data.seat_count || 1} onChange={e => setModal(m => ({ ...m, data: { ...m.data, seat_count: e.target.value } }))} min={1} />
              </div>
              <div className="fg"><label>Status</label>
                <select value={modal.data.status || 'CONFIRMED'} onChange={e => setModal(m => ({ ...m, data: { ...m.data, status: e.target.value } }))}>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="SCANNED">SCANNED</option>
                  <option value="NO_SHOW">NO SHOW</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .bk-pill { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
        .bk-pill.confirmed { background: #E0F2FE; color: #0369A1; }
        .bk-pill.scanned { background: #DCFCE7; color: #166534; }
        .bk-pill.cancelled { background: #FEF2F2; color: #B91C1C; }
        .bk-pill.no_show { background: var(--border-light); color: var(--text-secondary); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal-box { width: 100%; max-width: 480px; padding: 28px; margin: 16px; }
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-head h3 { font-size: 18px; }
        .modal-close { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 6px; }
        .modal-close:hover { color: var(--text-main); background: var(--bg-main); }
        .modal-form { display: flex; flex-direction: column; gap: 14px; }
        .fg { display: flex; flex-direction: column; gap: 6px; }
        .fg label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .fg input, .fg select { padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-main); color: var(--text-main); font-family: inherit; font-size: 14px; }
        .fg input:focus, .fg select:focus { outline: none; border-color: var(--primary); }
        .fg input:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        .toast { position: fixed; top: 20px; right: 20px; padding: 14px 22px; border-radius: var(--radius-sm); color: white; font-weight: 600; font-size: 13px; z-index: 3000; box-shadow: var(--shadow-lg); animation: slideIn 0.3s ease; }
        .toast.success { background: var(--accent-green); }
        .toast.error { background: var(--accent-red); }
        @keyframes slideIn { from { transform: translateY(-16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Bookings;
