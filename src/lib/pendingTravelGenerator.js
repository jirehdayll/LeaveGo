import * as ExcelJSModule from 'exceljs/dist/exceljs.min.js';
const ExcelJS = ExcelJSModule.default || ExcelJSModule;
import { saveAs } from 'file-saver';

/**
 * Generates an Excel report for pending TRAVEL FORM applications
 * Format: Landscape, Times New Roman font, centered header, table with specific columns
 */
export const generatePendingTravelExcel = async (pendingTravelForms) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Pending Travel Forms');

  // Set page orientation to landscape
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 0;

  // Set column widths
  worksheet.columns = [
    { key: 'number', width: 10 },
    { key: 'name', width: 30 },
    { key: 'destination', width: 25 },
    { key: 'startDate', width: 15 },
    { key: 'endDate', width: 15 },
    { key: 'purpose', width: 30 },
    { key: 'signature', width: 20 },
  ];

  // Add header
  worksheet.mergeCells('A1:G1');
  const headerCell = worksheet.getCell('A1');
  headerCell.value = 'REPORTS OF TRAVEL FORM FROM CENRO-OLONGAPO CITY';
  headerCell.font = { name: 'Times New Roman', size: 14, bold: true };
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Add table header row
  const headerRow = worksheet.getRow(3);
  headerRow.height = 25;
  
  const headers = ['Number', 'Name', 'Destination', 'Start Date', 'End Date', 'Purpose', 'Signature'];
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { name: 'Times New Roman', size: 11, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Add data rows
  pendingTravelForms.forEach((form, index) => {
    const details = form.details || {};
    const row = worksheet.getRow(index + 4);
    row.height = 20;

    const rowData = [
      index + 1,
      form.user_name || details.name || 'N/A',
      details.destination || 'N/A',
      details.departure_date || details.start_date || 'N/A',
      details.arrival_date || details.end_date || 'N/A',
      details.purpose || 'N/A',
      '' // Signature column (empty for now)
    ];

    rowData.forEach((value, cellIndex) => {
      const cell = row.getCell(cellIndex + 1);
      cell.value = value;
      cell.font = { name: 'Times New Roman', size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Pending_Travel_Forms_${new Date().toISOString().split('T')[0]}.xlsx`);
};
