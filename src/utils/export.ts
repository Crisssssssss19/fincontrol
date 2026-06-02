import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF with autoTable property types
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export class ExportService {
  /**
   * Exports data table to a professional PDF document.
   * @param title Title of the document
   * @param headers Array of header columns (e.g. ['Fecha', 'Descripción', 'Categoría', 'Importe'])
   * @param rows Array of cell string arrays (e.g. [['2026-05-31', 'Salary', 'Nomina', '2000€']])
   * @param filename Desired filename
   * @param totalLabel Label for totals (e.g. 'Total Registrado / Total Registered')
   * @param totalValue Total formatted sum (e.g. '2,400.00 EUR')
   */
  static exportToPDF(
    title: string,
    headers: string[],
    rows: string[][],
    filename: string,
    totalLabel?: string,
    totalValue?: string
  ): void {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const now = new Date();
    const formattedDate = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Title / Brand Header
    doc.setFillColor(0, 108, 73); // Deep emerald color matching brand primary
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('FinControl', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Gestión Financiera Inteligente / Smart Financial Management', 14, 28);

    // 2. Metadata / Summary Section
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, 14, 52);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Fecha de generación: ${formattedDate}`, 14, 60);

    // 3. AutoTable drawing
    autoTable(doc, {
      startY: 68,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 108, 73],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      margin: { left: 14, right: 14 },
    });

    // 4. Totals Footer
    if (totalLabel && totalValue) {
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      
      // Right-aligned rectangle box for totals
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(120, finalY - 8, 76, 14, 'F');
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(120, finalY - 8, 76, 14, 'S');

      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(totalLabel, 124, finalY);

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(totalValue, 190, finalY, { align: 'right' });
    }

    // Save
    doc.save(`${filename}.pdf`);
  }

  /**
   * Exports data arrays to a valid Excel .xlsx spreadsheet file.
   * @param data Array of objects matching row details
   * @param headersMap Mapping between key values and desired header column titles
   * @param filename Desired filename
   */
  static exportToExcel(
    data: any[],
    headersMap: Record<string, string>,
    filename: string
  ): void {
    // Format dataset with mapped keys
    const formattedData = data.map((item) => {
      const newItem: Record<string, any> = {};
      for (const [key, label] of Object.entries(headersMap)) {
        newItem[label] = item[key] !== undefined ? item[key] : '';
      }
      return newItem;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FinControl Data');

    // Auto-fit column widths
    const maxLens = formattedData.reduce((acc, row) => {
      Object.keys(row).forEach((key, i) => {
        const valLen = row[key] ? row[key].toString().length : 0;
        const keyLen = key.length;
        const max = Math.max(valLen, keyLen, acc[i] || 0);
        acc[i] = max;
      });
      return acc;
    }, [] as number[]);

    worksheet['!cols'] = maxLens.map((len: number) => ({ wch: len + 3 }));

    // Trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
}
