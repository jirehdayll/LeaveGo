import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, TextRun, AlignmentType, BorderStyle, PageOrientation, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import { resolveControlNumber } from './applicationNumber';

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const WORD_COLORS = {
  OB: 'F59E0B', // amber-500
  Maternity: '059669', // emerald-600
  SL: 'E11D48', // rose-600
  FL: 'E11D48', // rose-600
  SPL: 'E11D48', // rose-600
  VL: 'E11D48', // rose-600
  WL: 'E11D48', // rose-600
  Weekend: '94A3B8', // slate-400
};

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

/**
 * Shared data processing function used by both PDF and Word generators
 * This ensures absolute data consistency between both export formats
 */
function processMonthlySummaryData(monthForms, month, year, allApprovedForms = monthForms) {
  const maxDays = getDaysInMonth(month, year);
  const employeeMap = {};
  const mIdx = MONTH_NAMES.indexOf(month.toLowerCase());
  const targetYear = parseInt(year, 10);

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

  filteredData.forEach((req) => {
    const name = req.user_name || req.profiles?.full_name || req.details?.name || 'Unknown Employee';
    if (!employeeMap[name]) {
      employeeMap[name] = { name, leaves: {} };
    }

    const startDateVal = req.details?.start_date || req.details?.departure_date || req.submitted_at || req.created_at;
    const endDateVal = req.details?.end_date || req.details?.arrival_date || req.submitted_at || req.created_at;

    if (startDateVal && endDateVal) {
      const typeStr = req.details?.leave_type || (req.request_type === 'travel' ? 'Official Business' : 'Leave');
      const type = getLeaveTypeAbbreviation(typeStr);
      const controlNumber = resolveControlNumber(req, allApprovedForms);

      const start = new Date(startDateVal);
      const end = new Date(endDateVal);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() === mIdx && d.getFullYear() === targetYear) {
          employeeMap[name].leaves[d.getDate()] = {
            type,
            controlNumber,
            display: getLeaveCellValue(type, controlNumber),
          };
        }
      }
    }
  });

  return {
    employeeMap,
    maxDays,
    sortedNames: Object.keys(employeeMap).sort((a, b) => a.localeCompare(b)),
  };
}

export const generateMonthlySummaryWord = async (monthForms, month, year, allApprovedForms = monthForms) => {
  console.log('Word Generator - Input data:', monthForms);
  console.log('Word Generator - Month:', month, 'Year:', year);
  console.log('Word Generator - All approved forms:', allApprovedForms);
  
  // Use the same data processing as PDF generator for consistency
  const { employeeMap, maxDays, sortedNames } = processMonthlySummaryData(monthForms, month, year, allApprovedForms);

  console.log('Word Generator - Employee map after processing:', employeeMap);

  // Create table headers
  const headerRow = new TableRow({
    children: [
      new TableCell({ 
        width: { size: 800, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true })] })] 
      }),
      new TableCell({ 
        width: { size: 2500, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'NAME OF PERSONNEL', bold: true })] })] 
      }),
      ...Array.from({ length: 31 }, (_, i) => 
        new TableCell({ 
          width: { size: 300, type: WidthType.DXA },
          children: [new Paragraph({ 
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: (i + 1).toString(), bold: true })] 
          })] 
        })
      ),
      new TableCell({ 
        width: { size: 1000, type: WidthType.DXA },
        children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Undertime', bold: true })] 
        })] 
      }),
      new TableCell({ 
        width: { size: 1500, type: WidthType.DXA },
        children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'REMARKS', bold: true })] 
        })] 
      }),
    ],
  });

  // Create data rows
  const tableRows = [headerRow];

  sortedNames.forEach((empName, index) => {
    const rowCells = [
      new TableCell({ 
        width: { size: 800, type: WidthType.DXA },
        children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: (index + 1).toString(), bold: true })] 
        })] 
      }),
      new TableCell({ 
        width: { size: 2500, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: empName, bold: true })] })] 
      }),
    ];

    for (let day = 1; day <= 31; day++) {
      const cellData = employeeMap[empName].leaves[day];
      let cellText = '';
      let isWeekendDay = isWeekend(day, month, year);
      let shadingFill = undefined;
      let textColor = '000000';

      if (day > maxDays) {
        cellText = '';
      } else if (cellData && !isWeekendDay) {
        cellText = cellData.display;
        shadingFill = WORD_COLORS[cellData.type] || WORD_COLORS.OB;
        textColor = (cellData.type === 'OB' || cellData.type === 'Maternity') ? 'FFFFFF' : 'FFFFFF';
      } else if (isWeekendDay) {
        cellText = '';
        shadingFill = WORD_COLORS.Weekend;
      }

      const cellOptions = { 
        width: { size: 300, type: WidthType.DXA },
        children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: cellText, size: 18, color: textColor })] 
        })] 
      };

      if (shadingFill) {
        cellOptions.shading = {
          type: ShadingType.CLEAR,
          fill: shadingFill,
        };
      }

      rowCells.push(new TableCell(cellOptions));
    }

    rowCells.push(
      new TableCell({ 
        width: { size: 1000, type: WidthType.DXA },
        children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '' })] 
        })] 
      }),
      new TableCell({ 
        width: { size: 1500, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: '' })] })] 
      })
    );

    tableRows.push(new TableRow({ children: rowCells }));
  });

  // Create the table
  const table = new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });

  // Create the document
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
          },
        },
      },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'REPORT OF ATTENDANCE OF CENRO-OLONGAPO CITY',
              bold: true,
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `FOR THE MONTH OF ${month.toUpperCase()} ${year}`,
              bold: true,
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        table,
      ],
    }],
  });

  // Generate and save the document
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Monthly_Summary_${month}_${year}.docx`);
};