import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates and downloads a PDF from table data.
 * @param {string} title - PDF title / filename
 * @param {Array} columns - Array of { header, accessor }
 * @param {Array} data - Array of row objects
 */
export const exportToPDF = (title, columns, data) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title.replace(/_/g, ' '), 14, 20);

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
  doc.text(`Total Records: ${data.length}`, 14, 34);

  // Table headers
  const headers = columns.map(col => col.header);

  // Table rows
  const rows = data.map(row =>
    columns.map(col => {
      const val = row[col.accessor];
      if (val === null || val === undefined) return '—';
      if (Array.isArray(val)) return val.join(', ');
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      return String(val);
    })
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [0, 102, 255],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 40, left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Routie Admin — Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
