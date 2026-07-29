import { Document, Packer, Paragraph, TextRun, AlignmentType, UnderlineType } from 'docx';
import { saveAs } from 'file-saver';
import { REQUEST_TYPES } from '../../constants';

/**
 * Shared Word document converter that consumes the exact same data payload used by PDF generators.
 * This ensures absolute data consistency between PDF and Word outputs.
 */

// Word document styling helpers
const createFieldLine = (label: string, value: string) => {
  return new Paragraph({
    children: [
      new TextRun({
        text: label,
        bold: true,
        size: 24,
      }),
      new TextRun({
        text: ': ',
        bold: true,
        size: 24,
      }),
      new TextRun({
        text: value || '________________________',
        underline: {},
        size: 24,
      }),
    ],
    spacing: { after: 120 },
  });
};

const createCenteredText = (text: string, bold = false, size = 28) => {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold,
        size,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  });
};

const createSectionHeader = (text: string) => {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        underline: {},
      }),
    ],
    spacing: { before: 240, after: 120 },
  });
};

/**
 * Converts Leave Application PDF data to Word document format matching CSF No. 6
 * @param pdfData - The exact data object used by renderLeaveApplicationPDF
 */
export const convertLeaveApplicationToDocx = async (pdfData: any) => {
  const children = [
    // Form header info
    new Paragraph({
      children: [
        new TextRun({
          text: 'Civil Service Form No. 6',
          size: 14,
        }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Revised 2020',
          size: 14,
        }),
      ],
      spacing: { after: 120 },
    }),

    // Republic header
    createCenteredText('Republic of the Philippines', true, 20),
    createCenteredText('Department of Environment and Natural Resources', false, 20),
    createCenteredText('PROVINCIAL ENVIRONMENT AND NATURAL RESOURCES OFFICE', false, 20),
    createCenteredText('REGION III, Iba, Zambales', false, 20),

    // Main title
    createCenteredText('APPLICATION FOR LEAVE', true, 32),
    createCenteredText(`NO. ${pdfData.control_number || '____________'}`, false, 24),

    // Section 1: Office/Department
    createFieldLine('1. OFFICE/DEPARTMENT', pdfData.department || pdfData.office_department || ''),

    // Section 2: Name (Last, First, Middle)
    new Paragraph({
      children: [
        new TextRun({
          text: '2. NAME :',
          bold: true,
          size: 24,
        }),
        new TextRun({
          text: ' (Last): ',
          size: 22,
        }),
        new TextRun({
          text: pdfData.surname || '',
          underline: {},
          size: 22,
        }),
        new TextRun({
          text: ' (First): ',
          size: 22,
        }),
        new TextRun({
          text: pdfData.first_name || '',
          underline: {},
          size: 22,
        }),
        new TextRun({
          text: ' (Middle): ',
          size: 22,
        }),
        new TextRun({
          text: pdfData.middle_name || '',
          underline: {},
          size: 22,
        }),
      ],
      spacing: { after: 120 },
    }),

    // Section 3: Date of Filing
    createFieldLine('3. DATE OF FILING', pdfData.date_of_filing || new Date().toLocaleDateString()),

    // Section 4: Position
    createFieldLine('4. POSITION', pdfData.position || ''),

    // Section 5: Salary
    createFieldLine('5. SALARY', pdfData.salary || ''),

    // Section 6: Details of Application
    createSectionHeader('6. DETAILS OF APPLICATION'),

    // 6A: Type of Leave
    new Paragraph({
      children: [
        new TextRun({
          text: '6A TYPE OF LEAVE TO BE AVAILED OF',
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 120 },
    }),

    // Leave type checkboxes
    ...[
      'Vacation Leave (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)',
      'Mandatory/Forced Leave (Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292)',
      'Sick Leave (Sec. 43, Rule XVI, Omnibus Rules Implementing E.O No. 292)',
      'Maternity Leave (R.A. No. 11210 / IRR issues by CSC, DOLE and SSS)',
      'Paternity Leave (R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended)',
      'Special Privilege Leave (Sec. 21, Rule XVI, Omnibus Rule Implementing E.O. No. 292)',
      'Solo Parent Leave (RA No. 8972 / CSC MC No. 8, s. 2004)',
      'Study Leave (Sec. 68, Rule XVI, Omnibus Rule Implementing E.O. No. 292)',
      '10-Day VAWC Leave (RA No. 9262 / CSC MC No. 15, s. 2005)',
      'Rehabilitation Privilege (Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292)',
      'Special Leave Benefits for Women (RA No. 9710 / CSC MC No. 25, s. 2010)',
      'Special Emergency (Calamity) Leave (CSC MC No. 2, s. 2012, as amended)',
      'Adoption Leave (R.A. No. 8552)',
      'Wellness Leave',
    ].map(leaveType => {
      const selectedType = pdfData.leave_type || '';
      const isSelected = selectedType.toLowerCase().includes(leaveType.toLowerCase().split(' ')[0].toLowerCase());
      return new Paragraph({
        children: [
          new TextRun({
            text: isSelected ? '☑' : '☐',
            size: 20,
          }),
          new TextRun({
            text: ` ${leaveType}`,
            size: 18,
          }),
        ],
        spacing: { after: 60 },
      });
    }),

    // 6B: Details of Leave
    createSectionHeader('6B DETAILS OF LEAVE'),
    
    new Paragraph({
      children: [
        new TextRun({
          text: 'In case of Vacation/Special Privilege Leave:',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '☐ Within the Philippines ________________',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '☐ Abroad (Specify) __________________',
          size: 18,
        }),
      ],
      spacing: { after: 120 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'In case of Sick Leave:',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '☐ In Hospital (Specify Illness) _________',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '☐ Out Patient (Specify Illness) _________',
          size: 18,
        }),
      ],
      spacing: { after: 120 },
    }),

    // 6C: Number of working days and inclusive dates
    createFieldLine('6C NUMBER OF WORKING DAYS APPLIED FOR', String(pdfData.num_days || '')),
    createFieldLine('INCLUSIVE DATES', `${pdfData.start_date || ''} to ${pdfData.end_date || ''}`),

    // 6D: Computation
    new Paragraph({
      children: [
        new TextRun({
          text: '6D COMPUTATION',
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '☐ Not Requested',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '☑ Requested',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '(Signature of Applicant)',
          size: 16,
        }),
      ],
      spacing: { after: 240 },
    }),

    // Section 7: Details of Action on Application
    createSectionHeader('7. DETAILS OF ACTION ON APPLICATION'),

    // 7A: Certification of Leave Credits
    new Paragraph({
      children: [
        new TextRun({
          text: '7A CERTIFICATION OF LEAVE CREDITS',
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'As of _______________',
          size: 18,
        }),
      ],
      spacing: { after: 240 },
    }),

    // Leave credits table
    new Paragraph({
      children: [
        new TextRun({
          text: 'Vacation Leave: Total Earned _____ Less this application _____ Balance _____',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Sick Leave: Total Earned _____ Less this application _____ Balance _____',
          size: 18,
        }),
      ],
      spacing: { after: 240 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'DAISY A. FABILEÑA',
          bold: true,
          size: 18,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '"AO IV/HRMO"',
          size: 16,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),

    // 7B: Recommendation
    new Paragraph({
      children: [
        new TextRun({
          text: '7B RECOMMENDATION',
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '☐ For approval',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '☑ For disapproval due to _______________________',
          size: 18,
        }),
      ],
      spacing: { after: 240 },
    }),

    // 7C: Approved For
    new Paragraph({
      children: [
        new TextRun({
          text: '7.C APPROVED FOR:',
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '_______ days with pay',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '_______ days without pay',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '_______ others (Specify)',
          size: 18,
        }),
      ],
      spacing: { after: 240 },
    }),

    // 7D: Disapproved Due To
    new Paragraph({
      children: [
        new TextRun({
          text: '7.D DISAPPROVED DUE TO:',
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '___________________',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '___________________',
          size: 18,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '___________________',
          size: 18,
        }),
      ],
      spacing: { after: 240 },
    }),

    // Approval signature
    new Paragraph({
      children: [
        new TextRun({
          text: 'EDWARD V. SERNADILLA, RPF, DPA /',
          bold: true,
          size: 20,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'OIC, CENR Officer',
          size: 18,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Leave_Application_${pdfData.control_number || 'draft'}.docx`);
};

/**
 * Converts Travel Order PDF data to Word document format
 * @param pdfData - The exact data object used by renderTravelOrderPDF
 */
export const convertTravelOrderToDocx = async (pdfData: any) => {
  const children = [
    // Header
    createCenteredText('Department of Environment and Natural Resources', true, 28),
    createCenteredText('Community Environment and Natural Resources Office, Olongapo City', false, 24),
    
    // Divider line
    new Paragraph({
      children: [
        new TextRun({
          text: '________________________________________________________________________________________________________________________',
          size: 20,
          color: 'B30000',
        }),
      ],
      spacing: { before: 120, after: 240 },
    }),

    // Title
    createCenteredText('TRAVEL ORDER', true, 36),
    createCenteredText(`NO. ${pdfData.travel_no || pdfData.control_number || '____________'}`, false, 24),

    // Travel Order Fields - matching PDF template structure
    createFieldLine('Name', pdfData.full_name || ''),
    createFieldLine('Salary', pdfData.salary || ''),
    createFieldLine('Position/Designation', pdfData.position || ''),
    createFieldLine('Office', pdfData.office_department || pdfData.office || 'CENRO'),
    createFieldLine('Departure Date', pdfData.departure_date || pdfData.start_date || ''),
    createFieldLine('Arrival Date', pdfData.arrival_date || pdfData.end_date || ''),
    createFieldLine('Destination', pdfData.destination || ''),
    createFieldLine('Official Station', pdfData.official_station || 'Olongapo City'),

    // Purpose section
    createFieldLine('Purpose', pdfData.purpose || ''),
    new Paragraph({
      children: [
        new TextRun({
          text: `Per Diems/Expenses Allowed : ${pdfData.per_diems !== false ? 'YES' : 'NO'}`,
          size: 22,
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Assistants or Laborers Allowed : ${pdfData.assistants_allowed ? 'YES' : 'NO'}`,
          size: 22,
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Appropriations to which travel should be charged : ${pdfData.appropriations || 'CDS'}`,
          size: 22,
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Remarks or special instructions : ${pdfData.remarks || 'Gather documentation and prepare the necessary report.'}`,
          size: 22,
        }),
      ],
      spacing: { after: 240 },
    }),

    // Certification section - matching PDF template
    createSectionHeader('CERTIFICATION / UNDERTAKING'),
    new Paragraph({
      children: [
        new TextRun({
          text: 'I certify that the above travel is necessary and is related to the official function of the said office. I further certify that the travel is true and correct to the best of my knowledge and that I bind myself to be accountable for any misrepresentation or inappropriate claims in relation to this travel order.',
          size: 22,
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Hence, I am recommending for its approval.',
          size: 22,
        }),
      ],
      spacing: { after: 240 },
    }),

    // Approval section
    new Paragraph({
      children: [
        new TextRun({
          text: 'Approved:',
          bold: true,
          size: 24,
        }),
        new TextRun({
          text: '                                                                 Recommended by:',
          bold: true,
          size: 24,
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'EDWARD V. SERNADILLA, RPF, DPA',
          bold: true,
          size: 24,
        }),
        new TextRun({
          text: '                                                                 ____________________________',
          size: 24,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'OIC, CENRO',
          size: 24,
        }),
        new TextRun({
          text: '                                                                 ____________________________',
          size: 24,
        }),
      ],
      spacing: { after: 120 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: '____________________________________________________________________________________',
          size: 20,
        }),
      ],
      spacing: { after: 160 },
    }),

    // Authorization paragraph - matching PDF template
    new Paragraph({
      children: [
        new TextRun({
          text: 'I hereby authorize the Accountant to deduct the corresponding amount of the unliquidated cash advance from any succeeding salary for my failure to liquidate this travel within the prescribed thirty-day period upon return to my permanent official station pursuant to item 5.1.3 COA Circular 97-002 dated February 10, 1997 and Sec. 16 EO No. 248 dated May 29, 1995.',
          size: 20,
          italics: true,
        }),
      ],
      spacing: { after: 160 },
    }),

    // Signature line - matching PDF template
    new Paragraph({
      children: [
        new TextRun({
          text: (pdfData.full_name || 'Employee Name').toUpperCase(),
          bold: true,
          size: 24,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 120 },
    }),

    // Footer - matching PDF template
    new Paragraph({
      children: [
        new TextRun({
          text: '"Malinis na Kapaligiran at Mayamang Kalikasan para sa Buong Sambayanan."',
          italics: true,
          size: 18,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Fiscal L.D. Baduria St. Upper Kalaklan, Olongapo City, 2200',
          size: 18,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Landline: 047 224 2669 | Email: cenroolongapo@denr.gov.ph | www.r3.denr.gov.ph',
          size: 18,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Travel_Order_${pdfData.travel_no || pdfData.control_number || 'draft'}.docx`);
};

/**
 * Unified Word export function that routes to the appropriate converter
 * based on request type, using the same PDF data payload
 * @param pdfData - The exact data object used by PDF templates
 * @param requestType - The type of request (leave or travel)
 */
export const exportToWord = async (pdfData: any, requestType: string) => {
  if (requestType === REQUEST_TYPES.LEAVE) {
    await convertLeaveApplicationToDocx(pdfData);
  } else if (requestType === REQUEST_TYPES.TRAVEL) {
    await convertTravelOrderToDocx(pdfData);
  } else {
    throw new Error(`Unsupported request type for Word export: ${requestType}`);
  }
};
