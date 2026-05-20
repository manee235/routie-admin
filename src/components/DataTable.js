import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';

const DataTable = ({ title, columns, data, actions, onEdit, onDelete, onView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuRow, setOpenMenuRow] = useState(null);
  const rowsPerPage = 10;

  const filteredData = data.filter(row =>
    columns.some(col => {
      const val = row[col.accessor];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIdx, startIdx + rowsPerPage);

  const handleMenuToggle = (idx) => {
    setOpenMenuRow(openMenuRow === idx ? null : idx);
  };

  return (
    <div className="dt-container ov-card">
      <div className="dt-header">
        <div className="dt-title-area">
          <h3>{title}</h3>
          <span className="dt-count">{filteredData.length} Total</span>
        </div>
        <div className="dt-actions-area">
          <div className="dt-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          {actions}
        </div>
      </div>

      <div className="dt-table-wrap">
        <table className="dt-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={{ width: col.width }}>{col.header}</th>
              ))}
              {(onEdit || onDelete || onView) && <th style={{ width: '50px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="dt-empty">
                  No records found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
                      {col.render ? col.render(row[col.accessor], row) : (row[col.accessor] ?? '—')}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="dt-actions-cell">
                      <button
                        className="dt-menu-btn"
                        onClick={() => handleMenuToggle(startIdx + rowIdx)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenuRow === (startIdx + rowIdx) && (
                        <div className={`dt-dropdown ${rowIdx > 0 && rowIdx >= paginatedData.length - 2 ? 'up' : ''}`}>
                          {onView && (
                            <button onClick={() => { onView(row); setOpenMenuRow(null); }}>
                              <Eye size={14} /> View
                            </button>
                          )}
                          {onEdit && (
                            <button onClick={() => { onEdit(row); setOpenMenuRow(null); }}>
                              <Edit size={14} /> Edit
                            </button>
                          )}
                          {onDelete && (
                            <button className="dt-delete-btn" onClick={() => { onDelete(row); setOpenMenuRow(null); }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="dt-footer">
          <span className="dt-page-info">
            Showing {startIdx + 1} to {Math.min(startIdx + rowsPerPage, filteredData.length)} of {filteredData.length}
          </span>
          <div className="dt-page-btns">
            <button
              className="dt-pg-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`dt-pg-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="dt-pg-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Click-away listener for dropdown */}
      {openMenuRow !== null && (
        <div className="dt-click-away" onClick={() => setOpenMenuRow(null)}></div>
      )}

      <style jsx>{`
        .dt-container {
          padding: 24px;
          overflow: visible;
        }
        .dt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .dt-title-area {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dt-title-area h3 {
          font-size: 17px;
          font-weight: 700;
        }
        .dt-count {
          padding: 3px 10px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
        }
        .dt-actions-area {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .dt-search {
          position: relative;
          display: flex;
          align-items: center;
        }
        .dt-search svg {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }
        .dt-search input {
          width: 200px;
          padding: 8px 12px 8px 36px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg-main);
          color: var(--text-main);
          font-size: 13px;
          font-family: inherit;
          transition: var(--transition);
        }
        .dt-search input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .dt-table-wrap {
          overflow-x: auto;
          margin: 0 -24px;
          padding: 0 24px;
          min-height: 200px;
        }
        .dt-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .dt-table th {
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }
        .dt-table td {
          padding: 14px 16px;
          font-size: 13px;
          color: var(--text-main);
          border-bottom: 1px solid var(--border-light);
          white-space: nowrap;
        }
        .dt-table tbody tr {
          transition: background 0.15s ease;
        }
        .dt-table tbody tr:hover {
          background: var(--primary-light);
        }
        .dt-empty {
          text-align: center;
          padding: 48px 16px !important;
          color: var(--text-muted);
          font-weight: 500;
        }

        .dt-actions-cell {
          position: relative;
        }
        .dt-menu-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dt-menu-btn:hover {
          background: var(--bg-main);
          color: var(--text-main);
        }
        .dt-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          min-width: 140px;
          padding: 4px;
          display: flex;
          flex-direction: column;
        }
        .dt-dropdown.up {
          top: auto;
          bottom: 100%;
          margin-bottom: 4px;
        }
        .dt-dropdown button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-main);
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background 0.12s ease;
        }
        .dt-dropdown button:hover {
          background: var(--primary-light);
          color: var(--primary);
        }
        .dt-delete-btn:hover {
          background: rgba(239, 68, 68, 0.08) !important;
          color: #EF4444 !important;
        }
        .dt-click-away {
          position: fixed;
          inset: 0;
          z-index: 50;
        }

        .dt-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .dt-page-info {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .dt-page-btns {
          display: flex;
          gap: 4px;
        }
        .dt-pg-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dt-pg-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .dt-pg-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .dt-container { padding: 16px; }
          .dt-header { flex-direction: column; align-items: flex-start; }
          .dt-actions-area { width: 100%; }
          .dt-search { width: 100%; }
          .dt-search input { width: 100%; }
          .dt-table-wrap { margin: 0 -16px; padding: 0 16px; }
        }
      `}</style>
    </div>
  );
};

export default DataTable;
