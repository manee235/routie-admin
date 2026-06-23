import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';

const DataTable = ({ title, columns, data, actions, onEdit, onDelete, onView, onBulkDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuRow, setOpenMenuRow] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
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

  useEffect(() => {
    setSelectedRowIds(new Set());
  }, [data, searchTerm, currentPage]);

  const paginatedKeys = paginatedData.map((row, idx) => row.id !== undefined ? row.id : startIdx + idx);
  const areAllSelected = paginatedKeys.length > 0 && paginatedKeys.every(key => selectedRowIds.has(key));

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      paginatedKeys.forEach(key => {
        if (checked) {
          next.add(key);
        } else {
          next.delete(key);
        }
      });
      return next;
    });
  };

  const handleSelectRow = (key) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleMenuToggle = (idx) => {
    setOpenMenuRow(openMenuRow === idx ? null : idx);
  };

  const showActionsCell = onEdit || onDelete || onView;

  return (
    <div className="dt-container ov-card">
      <div className="dt-header">
        <div className="dt-title-area">
          <h3>{title}</h3>
          <span className="dt-count">{filteredData.length} Total</span>
        </div>
        {onBulkDelete && selectedRowIds.size > 0 ? (
          <div className="dt-bulk-actions">
            <span className="dt-bulk-count">{selectedRowIds.size} Selected</span>
            <button className="btn btn-danger dt-bulk-delete-btn" onClick={() => {
              onBulkDelete(Array.from(selectedRowIds));
            }}>
              <Trash2 size={14} /> Delete Selected
            </button>
          </div>
        ) : (
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
        )}
      </div>

      <div className="dt-table-wrap">
        <table className="dt-table">
          <thead>
            <tr>
              {onBulkDelete && (
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    className="dt-checkbox"
                    checked={areAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th key={idx} style={{ width: col.width }}>{col.header}</th>
              ))}
              {showActionsCell && <th style={{ width: '50px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onBulkDelete ? 1 : 0) + (showActionsCell ? 1 : 0)} className="dt-empty">
                  No records found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const rowKey = row.id !== undefined ? row.id : startIdx + rowIdx;
                return (
                  <tr key={row.id ?? rowIdx}>
                    {onBulkDelete && (
                      <td>
                        <input
                          type="checkbox"
                          className="dt-checkbox"
                          checked={selectedRowIds.has(rowKey)}
                          onChange={() => handleSelectRow(rowKey)}
                        />
                      </td>
                    )}
                    {columns.map((col, colIdx) => (
                      <td key={colIdx}>
                        {col.render ? col.render(row[col.accessor], row) : (row[col.accessor] ?? '—')}
                      </td>
                    ))}
                    {showActionsCell && (
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
                );
              })
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
          width: 220px;
          padding: 10px 16px 10px 40px;
          border-radius: 40px;
          border: 1px solid var(--border);
          background: var(--bg-main);
          color: var(--text-main);
          font-size: 13px;
          font-weight: 500;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .dt-search input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.15);
          background: var(--bg-card);
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

        .dt-bulk-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          animation: dtSlideDown 0.2s ease;
        }
        .dt-bulk-count {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
        }
        .dt-bulk-delete-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: var(--radius-sm);
        }
        @keyframes dtSlideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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
