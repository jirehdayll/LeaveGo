import * as ExcelJSModule from 'exceljs/dist/exceljs.min.js';
const ExcelJS = ExcelJSModule.default || ExcelJSModule;
import { saveAs } from 'file-saver';
import { resolveControlNumber } from './applicationNumber';
import { buildPdfDataFromRequest } from './pdfDataBuilder';
import { REQUEST_TYPES } from '../constants';

const DENR_LOGO_PATH = '/denr-logo.png';

async function addDenrLogoToWorksheet(workbook, worksheet, row, col, width = 60, height = 60) {
  try {
    const response = await fetch(DENR_LOGO_PATH);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = window.btoa(binary);
    const imageId = workbook.addImage({
      base64,
      extension: 'png',
    });
    worksheet.addImage(imageId, {
      tl: { col, row },
      ext: { width, height },
    });
  } catch (error) {
    console.warn('Failed to load DENR logo:', error);
  }
}

// Colors (ARGB for ExcelJS)
const COLORS = {
  OB_FILL: 'FFFFEE00',
  OB_TEXT: 'FF000000',
  SL_FILL: 'FFFF0000',
  SL_TEXT: '000000',
  MAT_FILL: 'FF92D050',
  MAT_TEXT: 'FF000000',
  VL_FILL: 'FF006FA6',
  VL_TEXT: '000000',
  WEEKEND_FILL: 'A033D6',
  WEEKEND_TEXT: '000000',
  GREY_FILL: 'FFC8C8C8',
  BORDER: 'FF000000',
};

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function getDaysInMonth(monthStr, year) {
  const mIdx = MONTH_NAMES.indexOf(monthStr.toLowerCase());
  return new Date(year, mIdx + 1, 0).getDate();
}

function isWeekend(day, monthStr, year) {
  const mIdx = MONTH_NAMES.indexOf(monthStr.toLowerCase());
  if (mIdx === -1) return false;
  const d = new Date(year, mIdx, day);
  const dayOfWeek = d.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function getLeaveTypeAbbreviation(leaveType) {
  if (!leaveType) return 'OB';

  const typeMap = {
    'Sick Leave': 'SL',
    'Maternity Leave': 'Maternity',
    Maternity: 'Maternity',
    'Official Business': 'OB',
    'Forced Leave': 'FL',
    'Mandatory/Forced Leave': 'FL',
    'Special Privilege Leave': 'SPL',
    'Vacation Leave': 'VL',
    'Wellness Leave': 'WL',
  };
  return typeMap[leaveType] || 'OB';
}

function getLeaveCellValue(type, controlNumber) {
  if (type === 'SL') return 'SICKLEAVE';
  if (type === 'Maternity') return 'Maternity';
  if (type === 'VL' || type === 'FL' || type === 'SPL' || type === 'WL') return type;
  if (type === 'OB') return controlNumber;
  return controlNumber;
}

function styleRange(worksheet, startRow, startCol, endRow, endCol, style) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = worksheet.getCell(r, c);
      if (style.fill) cell.fill = style.fill;
      if (style.font) cell.font = style.font;
      if (style.alignment) cell.alignment = style.alignment;
      if (style.border) cell.border = style.border;
    }
  }
}

export const generateMonthlySummaryExcel = async (monthForms, month, year, allApprovedForms = monthForms) => {
  console.log('Excel Generator - Input data:', monthForms);
  console.log('Excel Generator - Month:', month, 'Year:', year);
  console.log('Excel Generator - All approved forms:', allApprovedForms);
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 0;

  const maxDays = getDaysInMonth(month, year);
  const employeeMap = {};
  const mIdx = MONTH_NAMES.indexOf(month.toLowerCase());
  const targetYear = parseInt(year, 10);

  console.log('Excel Generator - Processing data, mIdx:', mIdx, 'targetYear:', targetYear);

  // Filter data to only include forms for the specified month/year
  const filteredData = monthForms.filter(f => {
    const d = f.details || {};
    const startStr = d.start_date || d.departure_date || f.submitted_at || f.created_at;
    const endStr = d.end_date || d.arrival_date || f.submitted_at || f.created_at;
    
    if (!startStr || !endStr) {
      const fb = new Date(f.submitted_at || f.created_at);
      return fb.getMonth() === mIdx && fb.getFullYear() === targetYear;
    }

    const start = new Date(startStr);
    const end = new Date(endStr);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const fb = new Date(f.submitted_at || f.created_at);
      return fb.getMonth() === mIdx && fb.getFullYear() === targetYear;
    }

    const startOfMonth = new Date(targetYear, mIdx, 1);
    const endOfMonth = new Date(targetYear, mIdx + 1, 0, 23, 59, 59, 999);
    
    return start <= endOfMonth && end >= startOfMonth;
  });

  console.log('Excel Generator - Filtered data:', filteredData);

  filteredData.forEach((req) => {
    const name = req.user_name || req.profiles?.full_name || req.details?.name || 'Unknown Employee';
    if (!employeeMap[name]) {
      employeeMap[name] = { name, leaves: [] };
    }

    const startDateVal = req.details?.start_date || req.details?.departure_date || req.submitted_at || req.created_at;
    const endDateVal = req.details?.end_date || req.details?.arrival_date || req.submitted_at || req.created_at;

    if (startDateVal && endDateVal) {
      const typeStr = req.details?.leave_type || (req.request_type === 'travel' ? 'Official Business' : 'Leave');
      const type = getLeaveTypeAbbreviation(typeStr);
      const controlNumber = resolveControlNumber(req, allApprovedForms);

      const start = new Date(startDateVal);
      const end = new Date(endDateVal);

      const startDay = start.getMonth() === mIdx && start.getFullYear() === targetYear ? start.getDate() : 1;
      const endDay = end.getMonth() === mIdx && end.getFullYear() === targetYear ? end.getDate() : maxDays;

      if (start.getFullYear() < targetYear || (start.getFullYear() === targetYear && start.getMonth() < mIdx)) {
        if (end.getFullYear() > targetYear || (end.getFullYear() === targetYear && end.getMonth() > mIdx)) {
          employeeMap[name].leaves.push({ start: 1, end: maxDays, type, controlNumber });
        } else if (end.getFullYear() === targetYear && end.getMonth() === mIdx) {
          employeeMap[name].leaves.push({ start: 1, end: end.getDate(), type, controlNumber });
        }
      } else if (start.getFullYear() === targetYear && start.getMonth() === mIdx) {
        if (end.getFullYear() === targetYear && end.getMonth() === mIdx) {
          employeeMap[name].leaves.push({ start: start.getDate(), end: end.getDate(), type, controlNumber });
        } else {
          employeeMap[name].leaves.push({ start: start.getDate(), end: maxDays, type, controlNumber });
        }
      }
    }
  });

  console.log('Excel Generator - Employee map after processing:', employeeMap);

  const sortedNames = Object.keys(employeeMap).sort((a, b) => a.localeCompare(b));

  const columns = [
    { key: 'idx', width: 6 },
    { key: 'name', width: 30 },
    ...Array.from({ length: 31 }, (_, i) => ({ key: `d${i + 1}`, width: 4.5 })),
    { key: 'undertime', width: 15 },
    { key: 'remarks', width: 25 },
    { key: 'extra', width: 5 },
  ];
  worksheet.columns = columns;

  worksheet.mergeCells('A1:AJ1');
  worksheet.mergeCells('A2:AJ2');

  const titleCell1 = worksheet.getCell('A1');
  titleCell1.value = 'REPORT OF ATTENDANCE OF CENRO-OLONGAPO CITY';
  titleCell1.font = { name: 'Times New Roman', size: 14, bold: true };
  titleCell1.alignment = { horizontal: 'center', vertical: 'middle' };

  const titleCell2 = worksheet.getCell('A2');
  titleCell2.value = `FOR THE MONTH OF ${month.toUpperCase()} ${year}`;
  titleCell2.font = { name: 'Times New Roman', size: 12, bold: true };
  titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.getRow(1).height = 28;
  worksheet.getRow(2).height = 22;
  worksheet.getRow(3).height = 28;
  worksheet.getRow(4).height = 12;

  const headerRowNum = 5;
  const headerRow = worksheet.getRow(headerRowNum);
  headerRow.height = 26;
  headerRow.getCell(1).value = '#';
  headerRow.getCell(2).value = 'NAME OF PERSONNEL';
  for (let d = 1; d <= 31; d++) {
    headerRow.getCell(d + 2).value = d;
  }
  headerRow.getCell(34).value = 'Undertime';
  headerRow.getCell(35).value = 'REMARKS';

  const thinBorder = {
    top: { style: 'thin', color: { argb: COLORS.BORDER } },
    left: { style: 'thin', color: { argb: COLORS.BORDER } },
    bottom: { style: 'thin', color: { argb: COLORS.BORDER } },
    right: { style: 'thin', color: { argb: COLORS.BORDER } },
  };

  styleRange(worksheet, headerRowNum, 1, headerRowNum, 35, {
    font: { name: 'Times New Roman', size: 10, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: thinBorder,
  });
  worksheet.getCell(headerRowNum, 2).alignment = { horizontal: 'left', vertical: 'middle' };

  for (let d = 1; d <= 31; d++) {
    if (d > maxDays) {
      worksheet.getCell(headerRowNum, d + 2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.GREY_FILL },
      };
    }
  }

  let curRow = headerRowNum + 1;
  sortedNames.forEach((empName, index) => {
    const row = worksheet.getRow(curRow);
    row.height = 24;

    row.getCell(1).value = index + 1;
    row.getCell(2).value = empName;
    row.getCell(34).value = '';
    row.getCell(35).value = '';

    styleRange(worksheet, curRow, 1, curRow, 35, {
      font: { name: 'Times New Roman', size: 9 },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: thinBorder,
    });

    row.getCell(1).font = { name: 'Times New Roman', size: 10, bold: true };
    row.getCell(2).font = { name: 'Times New Roman', size: 10, bold: true };
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(35).alignment = { horizontal: 'left', vertical: 'middle' };

    for (let d = 1; d <= 31; d++) {
      const cell = row.getCell(d + 2);
      if (d > maxDays) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.GREY_FILL } };
      } else if (isWeekend(d, month, year)) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.WEEKEND_FILL } };
        cell.font = { name: 'Times New Roman', size: 9, color: { argb: COLORS.WEEKEND_TEXT } };
      }
    }

    employeeMap[empName].leaves.forEach((lv) => {
      const startCol = lv.start + 2;
      const endCol = lv.end + 2;

      // Check if cells are already merged before attempting to merge
      let canMerge = true;
      for (let col = startCol; col <= endCol; col++) {
        const cell = worksheet.getCell(curRow, col);
        if (cell.isMerged) {
          canMerge = false;
          break;
        }
      }

      if (startCol < endCol && canMerge) {
        try {
          worksheet.mergeCells(curRow, startCol, curRow, endCol);
        } catch (err) {
          console.log('Cannot merge cells, likely already merged:', err);
        }
      }

      let fillColor = COLORS.OB_FILL;
      let textColor = COLORS.OB_TEXT;
      const val = getLeaveCellValue(lv.type, lv.controlNumber);

      if (lv.type === 'SL') {
        fillColor = COLORS.SL_FILL;
        textColor = COLORS.SL_TEXT;
      } else if (lv.type === 'Maternity') {
        fillColor = COLORS.MAT_FILL;
        textColor = COLORS.MAT_TEXT;
      } else if (lv.type === 'VL' || lv.type === 'FL' || lv.type === 'SPL' || lv.type === 'WL') {
        fillColor = COLORS.VL_FILL;
        textColor = COLORS.VL_TEXT;
      }

      styleRange(worksheet, curRow, startCol, curRow, endCol, {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
        font: { name: 'Times New Roman', size: 8.5, bold: true, color: { argb: textColor } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: thinBorder,
      });

      worksheet.getCell(curRow, startCol).value = val;
    });

    curRow++;
  });

  const legendRow = curRow + 1;
  worksheet.getRow(legendRow).height = 22;

  const legends = [
    { text: 'SICKLEAVE', fill: COLORS.SL_FILL, textColor: COLORS.SL_TEXT, col: 3, span: 4 },
    { text: 'Maternity', fill: COLORS.MAT_FILL, textColor: COLORS.MAT_TEXT, col: 8, span: 4 },
    { text: 'Official Business', fill: COLORS.OB_FILL, textColor: COLORS.OB_TEXT, col: 13, span: 5 },
    { text: 'FL/SPL/VL', fill: COLORS.VL_FILL, textColor: COLORS.VL_TEXT, col: 19, span: 4 },
    { text: 'Saturday/Sunday/Holiday', fill: COLORS.WEEKEND_FILL, textColor: COLORS.WEEKEND_TEXT, col: 24, span: 8 },
  ];

  legends.forEach((leg) => {
    worksheet.mergeCells(legendRow, leg.col, legendRow, leg.col + leg.span - 1);
    const cell = worksheet.getCell(legendRow, leg.col);
    cell.value = leg.text;
    cell.font = { name: 'Times New Roman', size: 8, bold: true, color: { argb: leg.textColor } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: leg.fill } };
    cell.border = thinBorder;
  });

  const sigRow = legendRow + 8;
  for (let i = 0; i < 12; i++) {
    worksheet.getRow(sigRow + i).height = 22;
  }

  worksheet.mergeCells(sigRow, 2, sigRow, 10);
  worksheet.getCell(sigRow, 2).value = 'Prepared/Reviewed by:';
  worksheet.getCell(sigRow, 2).font = { name: 'Times New Roman', size: 10 };
  worksheet.getCell(sigRow, 2).alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.mergeCells(sigRow + 5, 2, sigRow + 5, 10);
  worksheet.getCell(sigRow + 5, 2).value = 'MARICA PIA R. DIMALANTA-LICO';
  worksheet.getCell(sigRow + 5, 2).font = { name: 'Times New Roman', size: 11, bold: true, underline: true };
  worksheet.getCell(sigRow + 5, 2).alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells(sigRow + 6, 2, sigRow + 6, 12);
  worksheet.getCell(sigRow + 6, 2).value = 'FIII/Chief, CDS and in concurrent capacity as Chief, PSU';
  worksheet.getCell(sigRow + 6, 2).font = { name: 'Times New Roman', size: 9 };
  worksheet.getCell(sigRow + 6, 2).alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells(sigRow, 29, sigRow, 35);
  worksheet.getCell(sigRow, 29).value = 'Approved by:';
  worksheet.getCell(sigRow, 29).font = { name: 'Times New Roman', size: 10 };
  worksheet.getCell(sigRow, 29).alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.mergeCells(sigRow + 5, 29, sigRow + 5, 35);
  worksheet.getCell(sigRow + 5, 29).value = 'EDWARD V. SERNADILLA, RPF, DPA';
  worksheet.getCell(sigRow + 5, 29).font = { name: 'Times New Roman', size: 11, bold: true, underline: true };
  worksheet.getCell(sigRow + 5, 29).alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells(sigRow + 6, 29, sigRow + 6, 35);
  worksheet.getCell(sigRow + 6, 29).value = 'CENRO';
  worksheet.getCell(sigRow + 6, 29).font = { name: 'Times New Roman', size: 9 };
  worksheet.getCell(sigRow + 6, 29).alignment = { horizontal: 'center', vertical: 'middle' };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Monthly_Attendance_Report_${month}_${year}.xlsx`);
};

/**
 * Generates a Leave Application Excel document matching CSF No. 6 format
 * Uses the same data pipeline as PDF generator for consistency
 */
export const generateLeaveApplicationExcel = async (request, accounts = []) => {
  const data = buildPdfDataFromRequest(request, accounts);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leave Application');

  // Page setup for A4 portrait
  worksheet.pageSetup.paperSize = 9;
  worksheet.pageSetup.orientation = 'portrait';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 0;

  // Column widths - adjusted to prevent squishing
  worksheet.columns = [
    { width: 20 }, // A - spacer
    { width: 22 }, // B - field labels
    { width: 18 }, // C - values
    { width: 15 }, // D - values
    { width: 15 }, // E - values
    { width: 18 }, // F - values
    { width: 18 }, // G - values
    { width: 15 }, // H - values
  ];

  const thinBorder = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };

  const mediumBorder = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    bottom: { style: 'medium' },
    right: { style: 'medium' },
  };

  const headerStyle = {
    font: { name: 'Arial', size: 8, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCDCDC' } },
    border: thinBorder,
  };

  const normalStyle = {
    font: { name: 'Arial', size: 9 },
    alignment: { vertical: 'middle' },
    border: thinBorder,
  };

  // Header section with logo
  await addDenrLogoToWorksheet(workbook, worksheet, 0, 0, 80, 80);

  worksheet.mergeCells('B1:H1');
  worksheet.getCell('B1').value = 'Republic of the Philippines';
  worksheet.getCell('B1').font = { name: 'Arial', size: 8, bold: true };
  worksheet.getCell('B1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('B2:H2');
  worksheet.getCell('B2').value = 'Department of Environment and Natural Resources';
  worksheet.getCell('B2').font = { name: 'Arial', size: 8, bold: true };
  worksheet.getCell('B2').alignment = { horizontal: 'center' };

  worksheet.mergeCells('B3:H3');
  worksheet.getCell('B3').value = 'PROVINCIAL ENVIRONMENT AND NATURAL RESOURCES OFFICE';
  worksheet.getCell('B3').font = { name: 'Arial', size: 8, bold: true };
  worksheet.getCell('B3').alignment = { horizontal: 'center' };

  worksheet.mergeCells('B4:H4');
  worksheet.getCell('B4').value = 'REGION III, Iba, Zambales';
  worksheet.getCell('B4').font = { name: 'Arial', size: 8, bold: true };
  worksheet.getCell('B4').alignment = { horizontal: 'center' };

  // Form title
  worksheet.mergeCells('B5:H5');
  worksheet.getCell('B5').value = 'APPLICATION FOR LEAVE';
  worksheet.getCell('B5').font = { name: 'Arial', size: 14, bold: true };
  worksheet.getCell('B5').alignment = { horizontal: 'center' };

  // Control number
  if (data.control_number) {
    worksheet.mergeCells('G6:H6');
    worksheet.getCell('G6').value = `NO. ${data.control_number}`;
    worksheet.getCell('G6').font = { name: 'Arial', size: 9, bold: true };
    worksheet.getCell('G6').alignment = { horizontal: 'center' };
    worksheet.getCell('G6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEE00' } };
    worksheet.getCell('G6').border = mediumBorder;
  }

  let row = 7;

  // Row 1: Office/Department and Name
  worksheet.mergeCells('B7:C7');
  worksheet.getCell('B7').value = '1. OFFICE/DEPARTMENT';
  worksheet.getCell('B7').font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell('B7').alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell('B7').border = thinBorder;

  worksheet.mergeCells('D7:H7');
  worksheet.getCell('D7').value = data.department || '';
  worksheet.getCell('D7').font = { name: 'Arial', size: 9 };
  worksheet.getCell('D7').alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell('D7').border = thinBorder;

  row++;
  // Name field - full name merged across columns
  worksheet.mergeCells(`B${row}:H${row}`);
  worksheet.getCell(`B${row}`).value = '2. NAME:';
  worksheet.getCell(`B${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row}`).border = thinBorder;

  row++;
  // Parse full name properly
  const fullName = data.full_name || `${data.first_name || ''} ${data.middle_name || ''} ${data.surname || ''}`.trim();
  worksheet.mergeCells(`B${row}:H${row}`);
  worksheet.getCell(`B${row}`).value = fullName;
  worksheet.getCell(`B${row}`).font = { name: 'Arial', size: 9 };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row}`).border = thinBorder;

  row++;
  // Row 2: Date of Filing, Position, Salary - properly separated
  worksheet.mergeCells(`B${row}:C${row}`);
  worksheet.getCell(`B${row}`).value = '3. DATE OF FILING';
  worksheet.getCell(`B${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row}`).border = thinBorder;
  
  worksheet.getCell(`C${row}`).value = data.date_of_filing || new Date().toLocaleDateString();
  worksheet.getCell(`C${row}`).font = { name: 'Arial', size: 9 };
  worksheet.getCell(`C${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`C${row}`).border = thinBorder;

  worksheet.mergeCells(`D${row}:E${row}`);
  worksheet.getCell(`D${row}`).value = '4. POSITION';
  worksheet.getCell(`D${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`D${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`D${row}`).border = thinBorder;
  
  worksheet.getCell(`E${row}`).value = data.position || '';
  worksheet.getCell(`E${row}`).font = { name: 'Arial', size: 9 };
  worksheet.getCell(`E${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`E${row}`).border = thinBorder;

  worksheet.mergeCells(`F${row}:G${row}`);
  worksheet.getCell(`F${row}`).value = '5. SALARY';
  worksheet.getCell(`F${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`F${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`F${row}`).border = thinBorder;
  
  const salaryDisplay = data.salary ? (String(data.salary).startsWith('₱') ? data.salary : `₱ ${data.salary}`) : '';
  worksheet.getCell(`G${row}`).value = salaryDisplay;
  worksheet.getCell(`G${row}`).font = { name: 'Arial', size: 9 };
  worksheet.getCell(`G${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`G${row}`).border = thinBorder;
  
  worksheet.getCell(`H${row}`).border = thinBorder;

  row++;
  // Section 6 header
  worksheet.mergeCells(`B${row}:H${row}`);
  worksheet.getCell(`B${row}`).value = '6. DETAILS OF APPLICATION';
  worksheet.getCell(`B${row}`).font = { name: 'Arial', size: 8.5, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCDCDC' } };
  worksheet.getCell(`B${row}`).border = thinBorder;

  row++;
  // Section 6A: Type of Leave - reduced blank space
  const startDetailsRow = row;
  const endDetailsRow = row + 14; // Reduced from 18 to 14

  worksheet.mergeCells(`B${row}:E${row}`);
  worksheet.getCell(`B${row}`).value = '6A TYPE OF LEAVE TO BE AVAILED OF';
  worksheet.getCell(`B${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row}`).border = thinBorder;

  const leaveTypes = [
    'Vacation Leave',
    'Mandatory/Forced Leave',
    'Sick Leave',
    'Maternity Leave',
    'Paternity Leave',
    'Special Privilege Leave',
    'Solo Parent Leave',
    'Study Leave',
    '10-Day VAWC Leave',
    'Rehabilitation Privilege',
    'Special Leave Benefits for Women',
    'Special Emergency (Calamity) Leave',
    'Adoption Leave',
    'Wellness Leave',
  ];

  const selectedType = data.leave_type || '';
  leaveTypes.forEach((lt, idx) => {
    const currentRow = row + 1 + idx;
    worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = `[${selectedType.toLowerCase().includes(lt.toLowerCase().split(' ')[0].toLowerCase()) ? 'X' : ' '}] ${lt}`;
    worksheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 6.5 };
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`B${currentRow}`).border = thinBorder;
  });

  // Section 6B: Details of Leave
  worksheet.mergeCells(`F${row}:H${row}`);
  worksheet.getCell(`F${row}`).value = '6B DETAILS OF LEAVE';
  worksheet.getCell(`F${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`F${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`F${row}`).border = thinBorder;

  const detailLabels = [
    'Within the Philippines: [ ]',
    'Abroad (Specify): ____________',
    'In Hospital (Specify): ____________',
    'Out Patient (Specify): ____________',
    'Specify Illness: ____________',
    "Completion of Master's Degree: [ ]",
    'BAR/Board Examination Review: [ ]',
    'Monetization of Leave Credits: [ ]',
    'Terminal Leave: [ ]',
  ];

  detailLabels.forEach((label, idx) => {
    const currentRow = row + 1 + idx;
    worksheet.mergeCells(`F${currentRow}:H${currentRow}`);
    worksheet.getCell(`F${currentRow}`).value = label;
    worksheet.getCell(`F${currentRow}`).font = { name: 'Arial', size: 6.5 };
    worksheet.getCell(`F${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`F${currentRow}`).border = thinBorder;
  });

  row = endDetailsRow + 1;
  // Section 6C: Number of Working Days and Inclusive Dates
  worksheet.mergeCells(`B${row}:E${row}`);
  worksheet.getCell(`B${row}`).value = '6C NUMBER OF WORKING DAYS APPLIED FOR';
  worksheet.getCell(`B${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row}`).border = thinBorder;

  worksheet.mergeCells(`B${row + 1}:E${row + 1}`);
  const numDays = parseInt(data.num_days, 10) || 0;
  worksheet.getCell(`B${row + 1}`).value = numDays;
  worksheet.getCell(`B${row + 1}`).font = { name: 'Arial', size: 9, bold: true };
  worksheet.getCell(`B${row + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(`B${row + 1}`).border = thinBorder;
  worksheet.getCell(`B${row + 1}`).numFmt = '0';

  worksheet.mergeCells(`B${row + 2}:E${row + 2}`);
  worksheet.getCell(`B${row + 2}`).value = 'INCLUSIVE DATES';
  worksheet.getCell(`B${row + 2}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`B${row + 2}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row + 2}`).border = thinBorder;

  const dates = data.start_date && data.end_date ? `${data.start_date} to ${data.end_date}` : '';
  worksheet.mergeCells(`B${row + 3}:E${row + 3}`);
  worksheet.getCell(`B${row + 3}`).value = dates;
  worksheet.getCell(`B${row + 3}`).font = { name: 'Arial', size: 9 };
  worksheet.getCell(`B${row + 3}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row + 3}`).border = thinBorder;

  worksheet.mergeCells(`F${row}:H${row}`);
  worksheet.getCell(`F${row}`).value = '6D COMPUTATION';
  worksheet.getCell(`F${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`F${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`F${row}`).border = thinBorder;

  worksheet.mergeCells(`F${row + 1}:H${row + 1}`);
  worksheet.getCell(`F${row + 1}`).value = '[ ] Not Requested';
  worksheet.getCell(`F${row + 1}`).font = { name: 'Arial', size: 7 };
  worksheet.getCell(`F${row + 1}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`F${row + 1}`).border = thinBorder;

  worksheet.mergeCells(`F${row + 2}:H${row + 2}`);
  worksheet.getCell(`F${row + 2}`).value = '[X] Requested';
  worksheet.getCell(`F${row + 2}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`F${row + 2}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`F${row + 2}`).border = thinBorder;

  worksheet.mergeCells(`F${row + 3}:H${row + 3}`);
  worksheet.getCell(`F${row + 3}`).value = '(Signature of Applicant)';
  worksheet.getCell(`F${row + 3}`).font = { name: 'Arial', size: 6.5, italic: true };
  worksheet.getCell(`F${row + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(`F${row + 3}`).border = { bottom: { style: 'thin' } };

  row += 4;
  // Section 7 header
  worksheet.mergeCells(`B${row}:H${row}`);
  worksheet.getCell(`B${row}`).value = '7. DETAILS OF ACTION ON APPLICATION';
  worksheet.getCell(`B${row}`).font = { name: 'Arial', size: 8.5, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCDCDC' } };
  worksheet.getCell(`B${row}`).border = thinBorder;

  row++;
  // Section 7A: Certification of Leave Credits
  const startActionRow = row;
  const endActionRow = row + 10;

  worksheet.mergeCells(`B${row}:E${row}`);
  worksheet.getCell(`B${row}`).value = '7A CERTIFICATION OF LEAVE CREDITS';
  worksheet.getCell(`B${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row}`).border = thinBorder;

  worksheet.mergeCells(`B${row + 1}:E${row + 1}`);
  worksheet.getCell(`B${row + 1}`).value = 'As of _______________';
  worksheet.getCell(`B${row + 1}`).font = { name: 'Arial', size: 7 };
  worksheet.getCell(`B${row + 1}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row + 1}`).border = thinBorder;

  // Leave balance table - properly structured with headers
  const balanceStartRow = row + 2;
  worksheet.mergeCells(`B${balanceStartRow}:C${balanceStartRow}`);
  worksheet.getCell(`B${balanceStartRow}`).value = '';
  worksheet.getCell(`B${balanceStartRow}`).border = thinBorder;

  worksheet.mergeCells(`D${balanceStartRow}:D${balanceStartRow}`);
  worksheet.getCell(`D${balanceStartRow}`).value = 'Vacation Leave';
  worksheet.getCell(`D${balanceStartRow}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`D${balanceStartRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(`D${balanceStartRow}`).border = thinBorder;

  worksheet.mergeCells(`E${balanceStartRow}:E${balanceStartRow}`);
  worksheet.getCell(`E${balanceStartRow}`).value = 'Sick Leave';
  worksheet.getCell(`E${balanceStartRow}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`E${balanceStartRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(`E${balanceStartRow}`).border = thinBorder;

  const balanceLabels = ['Total Earned', 'Less this application', 'Balance'];
  const vacationBalance = data.vacation_balance || '';
  const sickBalance = data.sick_balance || '';
  const daysApplied = parseInt(data.num_days, 10) || 0;

  balanceLabels.forEach((label, idx) => {
    const currentRow = balanceStartRow + 1 + idx;
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = label;
    worksheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 7 };
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`B${currentRow}`).border = thinBorder;

    worksheet.mergeCells(`D${currentRow}:D${currentRow}`);
    if (idx === 1) {
      worksheet.getCell(`D${currentRow}`).value = daysApplied;
      worksheet.getCell(`D${currentRow}`).font = { name: 'Arial', size: 8 };
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(`D${currentRow}`).border = thinBorder;
      worksheet.getCell(`D${currentRow}`).numFmt = '0';
    } else if (idx === 2) {
      worksheet.getCell(`D${currentRow}`).value = vacationBalance;
      worksheet.getCell(`D${currentRow}`).font = { name: 'Arial', size: 8 };
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(`D${currentRow}`).border = thinBorder;
    } else {
      worksheet.getCell(`D${currentRow}`).value = '';
      worksheet.getCell(`D${currentRow}`).border = thinBorder;
    }

    worksheet.mergeCells(`E${currentRow}:E${currentRow}`);
    if (idx === 1) {
      worksheet.getCell(`E${currentRow}`).value = daysApplied;
      worksheet.getCell(`E${currentRow}`).font = { name: 'Arial', size: 8 };
      worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(`E${currentRow}`).border = thinBorder;
      worksheet.getCell(`E${currentRow}`).numFmt = '0';
    } else if (idx === 2) {
      worksheet.getCell(`E${currentRow}`).value = sickBalance;
      worksheet.getCell(`E${currentRow}`).font = { name: 'Arial', size: 8 };
      worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(`E${currentRow}`).border = thinBorder;
    } else {
      worksheet.getCell(`E${currentRow}`).value = '';
      worksheet.getCell(`E${currentRow}`).border = thinBorder;
    }
  });

  worksheet.mergeCells(`B${endActionRow - 1}:E${endActionRow - 1}`);
  worksheet.getCell(`B${endActionRow - 1}`).value = 'DAISY A. FABILEÑA';
  worksheet.getCell(`B${endActionRow - 1}`).font = { name: 'Arial', size: 8, bold: true };
  worksheet.getCell(`B${endActionRow - 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(`B${endActionRow - 1}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells(`B${endActionRow}:E${endActionRow}`);
  worksheet.getCell(`B${endActionRow}`).value = 'AO IV/HRMO';
  worksheet.getCell(`B${endActionRow}`).font = { name: 'Arial', size: 7 };
  worksheet.getCell(`B${endActionRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(`B${endActionRow}`).border = { bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  // Section 7B: Recommendation
  worksheet.mergeCells(`F${row}:H${row}`);
  worksheet.getCell(`F${row}`).value = '7B RECOMMENDATION';
  worksheet.getCell(`F${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`F${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`F${row}`).border = thinBorder;

  worksheet.mergeCells(`F${row + 1}:H${row + 1}`);
  worksheet.getCell(`F${row + 1}`).value = '[ ] For approval';
  worksheet.getCell(`F${row + 1}`).font = { name: 'Arial', size: 7 };
  worksheet.getCell(`F${row + 1}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`F${row + 1}`).border = thinBorder;

  worksheet.mergeCells(`F${row + 2}:H${row + 2}`);
  worksheet.getCell(`F${row + 2}`).value = '[X] For disapproval due to _______________________';
  worksheet.getCell(`F${row + 2}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`F${row + 2}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`F${row + 2}`).border = thinBorder;

  row = endActionRow + 1;
  // Section 7C and 7D
  worksheet.mergeCells(`B${row}:E${row}`);
  worksheet.getCell(`B${row}`).value = '7.C APPROVED FOR:';
  worksheet.getCell(`B${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row}`).border = thinBorder;

  worksheet.mergeCells(`B${row + 1}:E${row + 1}`);
  worksheet.getCell(`B${row + 1}`).value = '_______ days with pay';
  worksheet.getCell(`B${row + 1}`).font = { name: 'Arial', size: 7 };
  worksheet.getCell(`B${row + 1}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row + 1}`).border = thinBorder;

  worksheet.mergeCells(`B${row + 2}:E${row + 2}`);
  worksheet.getCell(`B${row + 2}`).value = '_______ days without pay';
  worksheet.getCell(`B${row + 2}`).font = { name: 'Arial', size: 7 };
  worksheet.getCell(`B${row + 2}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row + 2}`).border = thinBorder;

  worksheet.mergeCells(`B${row + 3}:E${row + 3}`);
  worksheet.getCell(`B${row + 3}`).value = '_______ others (Specify)';
  worksheet.getCell(`B${row + 3}`).font = { name: 'Arial', size: 7 };
  worksheet.getCell(`B${row + 3}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`B${row + 3}`).border = thinBorder;

  worksheet.mergeCells(`F${row}:H${row}`);
  worksheet.getCell(`F${row}`).value = '7.D DISAPPROVED DUE TO:';
  worksheet.getCell(`F${row}`).font = { name: 'Arial', size: 7, bold: true };
  worksheet.getCell(`F${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell(`F${row}`).border = thinBorder;

  for (let i = 1; i <= 3; i++) {
    worksheet.mergeCells(`F${row + i}:H${row + i}`);
    worksheet.getCell(`F${row + i}`).value = '_________________________';
    worksheet.getCell(`F${row + i}`).font = { name: 'Arial', size: 7 };
    worksheet.getCell(`F${row + i}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`F${row + i}`).border = thinBorder;
  }

  row += 6;
  // Approval signature - centered with proper borders
  worksheet.mergeCells(`B${row}:H${row}`);
  worksheet.getCell(`B${row}`).value = 'EDWARD V. SERNADILLA, RPF, DPA / OIC, CENR Officer';
  worksheet.getCell(`B${row}`).font = { name: 'Arial', size: 9, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(`B${row}`).border = thinBorder;

  // Set row heights - adjusted for better content fit
  for (let i = 1; i <= row; i++) {
    worksheet.getRow(i).height = 18;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `Leave_Application_${(data.full_name || 'Employee').replace(/\s+/g, '_')}.xlsx`;
  saveAs(blob, fileName);
};

/**
 * Generates a Travel Order Excel document matching government format
 * Uses the same data pipeline as PDF generator for consistency
 */
export const generateTravelOrderExcel = async (request, accounts = []) => {
  const data = buildPdfDataFromRequest(request, accounts);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Travel Order');

  // Page setup for A4 portrait
  worksheet.pageSetup.paperSize = 9;
  worksheet.pageSetup.orientation = 'portrait';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 0;

  // Optimized Column Widths (A-H) to prevent clipping
  worksheet.columns = [
    { width: 20 }, // A: Left Field Labels (Position/Designation, Departure Date, etc.)
    { width: 16 }, // B: Left Values (Start)
    { width: 14 }, // C: Left Values (Mid)
    { width: 10 }, // D: Left Values (End)
    { width: 16 }, // E: Right Field Labels (Salary, Office, Arrival Date, Station)
    { width: 14 }, // F: Right Values (Start)
    { width: 14 }, // G: Right Values (Mid)
    { width: 16 }, // H: Right Values / Yellow Badge
  ];

  // Hide gridlines
  worksheet.views = [{ showGridLines: false }];

  const thinBorder = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };

  const grayBottomBorder = {
    bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } }
  };

  // 1. Document Header Block
  // Logo at top-left (Row 1-2)
  await addDenrLogoToWorksheet(workbook, worksheet, 0, 0, 95, 95);

  // Agency Heading (Center Merged across B to G)
  worksheet.mergeCells('B1:G1');
  worksheet.getCell('B1').value = 'Department of Environment and Natural Resources';
  worksheet.getCell('B1').font = { name: 'Arial', size: 12, bold: true };
  worksheet.getCell('B1').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('B2:G2');
  worksheet.getCell('B2').value = 'Community Environment and Natural Resources Office, Olongapo City';
  worksheet.getCell('B2').font = { name: 'Arial', size: 12 };
  worksheet.getCell('B2').alignment = { horizontal: 'center', vertical: 'middle' };

  // Tracking Box (Top Right, Column H) - Small, Compact Yellow Badge
  const travelNo = data.travel_no || data.control_number || '';
  worksheet.mergeCells('H1:H2');
  worksheet.getCell('H1').value = travelNo || '';
  worksheet.getCell('H1').font = { name: 'Arial', size: 12, bold: true };
  worksheet.getCell('H1').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell('H1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  worksheet.getCell('H1').border = thinBorder;
  worksheet.getRow(1).height = 20;
  worksheet.getRow(2).height = 20;

  // Top Red Divider Bar (Row 5 - 2 rows lower than logo/header)
  worksheet.mergeCells('A7:H7');
  worksheet.getCell('A7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA61C1C' } };
  worksheet.getRow(7).height = 4;

  let row = 8; // Spacing after red line
  row += 1;

  // 2. Title Section
  worksheet.mergeCells(`A${row}:H${row}`);
  worksheet.getCell(`A${row}`).value = 'TRAVEL ORDER';
  worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 15, bold: true };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(row).height = 22;

  row += 2;

  // Control Number Subtitle (Centered with bottom underline)
  const numberText = travelNo || '___________';
  worksheet.mergeCells(`C${row}:F${row}`);
  worksheet.getCell(`C${row}`).value = `NO. ${numberText}`;
  worksheet.getCell(`C${row}`).font = { name: 'Arial', size: 12, bold: true };
  worksheet.getCell(`C${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(`C${row}`).border = { bottom: { style: 'thin' } };
  worksheet.getRow(row).height = 10;

  // 2 Spaces under Title Number
  row += 5;

  // 3. Key-Value Form Fields Grid
  const officeLabel = data.office || data.office_department || data.department || 'CENRO';

  // Helper function to build clean form rows with underlines
  const createFormRow = (rNum, leftLabel, leftVal, rightLabel, rightVal) => {
    // Left Field Label (Col A)
    worksheet.getCell(`A${rNum}`).value = leftLabel;
    worksheet.getCell(`A${rNum}`).font = { name: 'Arial', size: 12 };
    worksheet.getCell(`A${rNum}`).alignment = { horizontal: 'left', vertical: 'middle' };

    // Left Field Value (Col B-D)
    worksheet.mergeCells(`B${rNum}:D${rNum}`);
    worksheet.getCell(`B${rNum}`).value = leftVal;
    worksheet.getCell(`B${rNum}`).font = { name: 'Arial', size: 12 };
    worksheet.getCell(`B${rNum}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`B${rNum}`).border = grayBottomBorder;
    worksheet.getCell(`C${rNum}`).border = grayBottomBorder;
    worksheet.getCell(`D${rNum}`).border = grayBottomBorder;

    // Right Field Label (Col E)
    worksheet.getCell(`E${rNum}`).value = rightLabel;
    worksheet.getCell(`E${rNum}`).font = { name: 'Arial', size: 12 };
    worksheet.getCell(`E${rNum}`).alignment = { horizontal: 'left', vertical: 'middle' };

    // Right Field Value (Col F-H)
    worksheet.mergeCells(`F${rNum}:H${rNum}`);
    worksheet.getCell(`F${rNum}`).value = rightVal;
    worksheet.getCell(`F${rNum}`).font = { name: 'Arial', size: 12 };
    worksheet.getCell(`F${rNum}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`F${rNum}`).border = grayBottomBorder;
    worksheet.getCell(`G${rNum}`).border = grayBottomBorder;
    worksheet.getCell(`H${rNum}`).border = grayBottomBorder;

    worksheet.getRow(rNum).height = 22; // Comfortable line spacing
  };

  // Row 1: Name & Salary
  createFormRow(row, 'Name:', data.full_name || '', 'Salary:', data.salary || '');
  row++;

  // Row 2: Position/Designation & Office
  createFormRow(row, 'Position/Designation:', data.position || '', 'Office:', officeLabel);
  row++;

  // Row 3: Departure Date & Arrival Date
  createFormRow(row, 'Departure Date:', data.departure_date || data.start_date || '', 'Arrival Date:', data.arrival_date || data.end_date || '');
  row++;

  // Row 4: Destination & Official Station
  createFormRow(row, 'Destination:', data.destination || '', 'Official Station:', data.official_station || 'Olongapo City');
  row+=3;

  // Purpose Block - Plain Inline Text
  worksheet.mergeCells(`A${row}:H${row}`);
  worksheet.getCell(`A${row}`).value = `PURPOSE :   ${data.purpose || ''}`;
  worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 12 };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(row).height = 22;

  // 2 Spaces under Purpose block
  row += 3;

  // 4. Travel Terms & Conditions
  const addTermRow = (rNum, text) => {
    worksheet.mergeCells(`A${rNum}:H${rNum}`);
    worksheet.getCell(`A${rNum}`).value = text;
    worksheet.getCell(`A${rNum}`).font = { name: 'Arial', size: 12 };
    worksheet.getCell(`A${rNum}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getRow(rNum).height = 20;
  };

  addTermRow(row, `Per Diems/Expenses Allowed : ${data.per_diems !== false ? 'YES' : 'NO'}`);
  row++;
  addTermRow(row, `Assistants or Laborers Allowed : ${data.assistants_allowed ? 'YES' : 'NO'}`);
  row++;
  addTermRow(row, `Appropriations to which travel should be charged : ${data.appropriations || 'CDS'}`);
  row++;
  addTermRow(row, `Remarks or special instructions : ${data.remarks || 'Gather documentation and prepare the necessary report.'}`);

  // 1 Space under Remarks section
  row += 3;

  // 5. Certification & Undertaking Statement
  worksheet.mergeCells(`A${row}:H${row}`);
  worksheet.getCell(`A${row}`).value = 'CERTIFICATION / UNDERTAKING:';
  worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 12, bold: true };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(row).height = 20;
  row++;

  const certText = 'I certify that the above travel is necessary and is related to the official function of the said office. I further certify that the travel is true and correct to the best of my knowledge and that I bind myself to be accountable for any misrepresentation or inappropriate claims in relation to this travel order.\n\nHence, I am recommending for its approval.';
  worksheet.mergeCells(`A${row}:H${row + 3}`);
  worksheet.getCell(`A${row}`).value = certText;
  worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 12 };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  worksheet.getRow(row).height = 20;
  worksheet.getRow(row + 1).height = 20;
  worksheet.getRow(row + 2).height = 20;
  worksheet.getRow(row + 3).height = 20;
  row += 4;

  // 3 spaces below 'hence...'
  row += 3;

  // 6. Signatures Grid - Middle Approvals Section
  worksheet.getCell(`A${row}`).value = 'Approved:';
  worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 12, bold: true };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.getCell(`E${row}`).value = 'Recommended by:';
  worksheet.getCell(`E${row}`).font = { name: 'Arial', size: 12 };
  worksheet.getCell(`E${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(row).height = 20;

  // 3 Blank rows for signature space
  row += 4;

  // Approver Name
  worksheet.getCell(`A${row}`).value = 'EDWARD V. SERNADILLA, RPF, DPA';
  worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 12, bold: true };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(row).height = 20;
  row++;

  // Approver Title
  worksheet.getCell(`A${row}`).value = 'OI, CENR Officer';
  worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 12 };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(row).height = 20;

  // 1 Blank row before thick divider line
  row += 4;

  // 7. Deduct Authorization Clause & Employee Signature
  // Thick Divider Line (Row Span A to H)
  worksheet.mergeCells(`A${row}:H${row}`);
  worksheet.getCell(`A${row}`).border = { top: { style: 'medium', color: { argb: 'FF000000' } } };
  worksheet.getRow(row).height = 5;
  row+=2;

  // Authorization Text
  const authText = 'I hereby authorize the Accountant to deduct the corresponding amount of the unliquidated cash advance from any succeeding salary for my failure to liquidate this travel within the prescribed thirty-day period upon return to my permanent official station pursuant to item 5.1.3 COA Circular 97-002 dated February 10, 1997 and Sec. 16 EO No. 248 dated May 29, 1995.';
  worksheet.mergeCells(`A${row}:H${row + 2}`);
  worksheet.getCell(`A${row}`).value = authText;
  worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 12 };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  worksheet.getRow(row).height = 20;
  worksheet.getRow(row + 1).height = 20;
  worksheet.getRow(row + 2).height = 20;
  row += 3;

  // 3 spaces below 'may29,1995'
  row += 2;

  // Employee Signature (Uppercase, Bold, Right-aligned)
  worksheet.mergeCells(`F${row}:H${row}`);
  const employeeNameUpper = (data.full_name || '').toUpperCase();
  worksheet.getCell(`F${row}`).value = employeeNameUpper;
  worksheet.getCell(`F${row}`).font = { name: 'Arial', size: 12, bold: true };
  worksheet.getCell(`F${row}`).alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getRow(row).height = 20;
  row += 2;

  // 2 spaces below user's name
  row += 2;

  // 8. Document Footer
  // Motto (Bold Italic)
  worksheet.mergeCells(`A${row}:H${row}`);
  worksheet.getCell(`A${row}`).value = 'Malinis na Kapaligiran at Mayamang Kalikasan para sa Buong Sambayanan.';
  worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 11, bold: true, italic: true };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(row).height = 18;
  row++;

  // Address
  worksheet.mergeCells(`A${row}:H${row}`);
  worksheet.getCell(`A${row}`).value = 'Fiscal L.D. Baduria St. Upper Kalaklan, Olongapo City, 2200';
  worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 11 };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(row).height = 16;
  row++;

  // Contact Info
  worksheet.mergeCells(`A${row}:H${row}`);
  worksheet.getCell(`A${row}`).value = 'Landline: 047 224 2669 | Email: cenroolongapo@denr.gov.ph | www.r3.denr.gov.ph';
  worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 11 };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(row).height = 16;

  // Save File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `Travel_Order_${(data.full_name || 'Employee').replace(/\s+/g, '_')}.xlsx`;
  saveAs(blob, fileName);
};

/**
 * Unified Excel export function that auto-detects application type
 * Uses the same data pipeline as PDF generator for consistency
 */
export const generateApplicationExcel = async (request, accounts = []) => {
  try {
    const requestType = request.request_type || request.details?.request_type;
    
    if (requestType === REQUEST_TYPES.TRAVEL) {
      await generateTravelOrderExcel(request, accounts);
    } else {
      await generateLeaveApplicationExcel(request, accounts);
    }
  } catch (error) {
    console.error('Error generating Excel document:', error);
    throw error;
  }
};