import jsPDF from 'jspdf';
import { REQUEST_TYPES } from '../constants';

/**
 * Generates a PDF report for pending TRAVEL FORM applications
 * Format: Landscape, Times New Roman font, centered header, table with specific columns
 */
export const generatePendingTravelPDF = async (pendingTravelForms) => {
  const pdf = new jsPDF('l', 'mm', 'a4'); // landscape mode
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  let yPosition = 20;
  const margin = 15;
  const tableWidth = pageWidth - (margin * 2);
  
  // Set font to Times New Roman
  pdf.setFont('times');
  
  // Add header
  pdf.setFontSize(16);
  pdf.setFont('times', 'bold');
  pdf.text('REPORTS OF TRAVEL FORM FROM CENRO-OLONGAPO CITY', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  
  // Define table columns
  const columns = [
    { header: 'Number', width: 0.10 },
    { header: 'Name', width: 0.20 },
    { header: 'Destination', width: 0.18 },
    { header: 'Start Date', width: 0.12 },
    { header: 'End Date', width: 0.12 },
    { header: 'Purpose', width: 0.18 },
    { header: 'Signature', width: 0.10 }
  ];
  
  // Draw table header
  pdf.setFontSize(11);
  pdf.setFont('times', 'bold');
  
  let xPos = margin;
  columns.forEach((col, colIndex) => {
    const colWidth = tableWidth * col.width;
    pdf.text(col.header, xPos + (colWidth / 2), yPosition + 7, { align: 'center' });
    xPos += colWidth;
  });
  
  // Draw header border with grid lines
  pdf.setLineWidth(0.1);
  pdf.rect(margin, yPosition, tableWidth, 10, 'S');
  
  // Draw vertical grid lines for header
  xPos = margin;
  columns.forEach((col, colIndex) => {
    const colWidth = tableWidth * col.width;
    if (colIndex < columns.length - 1) {
      pdf.line(xPos + colWidth, yPosition, xPos + colWidth, yPosition + 10);
    }
    xPos += colWidth;
  });
  
  yPosition += 10;
  
  // Draw data rows
  pdf.setFontSize(10);
  pdf.setFont('times', 'normal');
  
  pendingTravelForms.forEach((form, index) => {
    const details = form.details || {};
    
    // Check if we need a new page
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
      
      // Redraw header on new page
      pdf.setFontSize(16);
      pdf.setFont('times', 'bold');
      pdf.text('REPORTS OF TRAVEL FORM FROM CENRO-OLONGAPO CITY', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      pdf.setFontSize(11);
      pdf.setFont('times', 'bold');
      
      xPos = margin;
      columns.forEach((col, colIndex) => {
        const colWidth = tableWidth * col.width;
        pdf.text(col.header, xPos + (colWidth / 2), yPosition + 7, { align: 'center' });
        xPos += colWidth;
      });
      
      // Draw header border with grid lines
      pdf.setLineWidth(0.1);
      pdf.rect(margin, yPosition, tableWidth, 10, 'S');
      
      // Draw vertical grid lines for header
      xPos = margin;
      columns.forEach((col, colIndex) => {
        const colWidth = tableWidth * col.width;
        if (colIndex < columns.length - 1) {
          pdf.line(xPos + colWidth, yPosition, xPos + colWidth, yPosition + 10);
        }
        xPos += colWidth;
      });
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont('times', 'normal');
    }
    
    // Draw row border with grid lines
    pdf.setLineWidth(0.1);
    pdf.rect(margin, yPosition, tableWidth, 10, 'S');
    
    // Draw vertical grid lines
    xPos = margin;
    columns.forEach((col, colIndex) => {
      const colWidth = tableWidth * col.width;
      if (colIndex < columns.length - 1) {
        pdf.line(xPos + colWidth, yPosition, xPos + colWidth, yPosition + 10);
      }
      xPos += colWidth;
    });
    
    // Add row data
    xPos = margin;
    const rowData = [
      (index + 1).toString(),
      form.user_name || details.name || 'N/A',
      details.destination || 'N/A',
      details.departure_date || details.start_date || 'N/A',
      details.arrival_date || details.end_date || 'N/A',
      details.purpose || 'N/A',
      '' // Signature column (empty)
    ];
    
    columns.forEach((col, colIndex) => {
      const colWidth = tableWidth * col.width;
      const data = rowData[colIndex];
      
      // Center align all columns
      pdf.text(data, xPos + (colWidth / 2), yPosition + 7, { align: 'center' });
      
      xPos += colWidth;
    });
    
    yPosition += 10;
  });
  
  // Save the PDF
  pdf.save(`Pending_Travel_Forms_${new Date().toISOString().split('T')[0]}.pdf`);
};
