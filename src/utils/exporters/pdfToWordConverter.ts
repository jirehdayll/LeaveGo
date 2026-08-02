import HtmlToDocx from "@turbodocx/html-to-docx";
import { saveAs } from "file-saver";
import { buildPdfDataFromRequest } from "../../lib/pdfDataBuilder";
import { REQUEST_TYPES } from "../../constants";

/**
 * Centralized PDF-to-Word converter that uses HTML rendering
 * This utility consumes the exact same data payload as the PDF generator
 * and converts it to DOCX format using HTML-to-Docx transformation.
 * 
 * Architecture:
 * 1. Data Payload: Uses buildPdfDataFromRequest() for single source of truth
 * 2. HTML Rendering: Creates HTML strings matching PDF layout structure
 * 3. Conversion: Uses @turbodocx/html-to-docx for automated conversion
 * 4. Download: Triggers browser download of converted .docx file
 */

/**
 * Generate Header HTML for Leave Application
 */
function generateLeaveApplicationHeaderHTML(data: any): string {
  return `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 10px;">Civil Service Form No. 6</div>
      <div style="font-size: 10px;">Revised 2020</div>
      <h1 style="font-size: 16px; font-weight: bold; margin: 5px 0;">Republic of the Philippines</h1>
      <h2 style="font-size: 14px; font-weight: normal; margin: 3px 0;">Department of Environment and Natural Resources</h2>
      <h2 style="font-size: 14px; font-weight: normal; margin: 3px 0;">PROVINCIAL ENVIRONMENT AND NATURAL RESOURCES OFFICE</h2>
      <h2 style="font-size: 14px; font-weight: normal; margin: 3px 0;">REGION III, Iba, Zambales</h2>
    </div>
  `;
}

/**
 * Generate Footer HTML for Leave Application
 */
function generateLeaveApplicationFooterHTML(data: any): string {
  return `
    <div style="text-align: center; font-size: 10px; font-style: italic;">
      "Malinis na Kapaligiran at Mayamang Kalikasan para sa Buong Sambayanan."<br>
      Fiscal L.D. Baduria St. Upper Kalaklan, Olongapo City, 2200<br>
      Landline: 047 224 2669 | Email: cenroolongapo@denr.gov.ph | www.r3.denr.gov.ph
    </div>
  `;
}

/**
 * Generate Body HTML for Leave Application matching CSF No. 6 format
 */
function generateLeaveApplicationBodyHTML(data: any): string {
  const leaveTypes = [
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
  ];

  const selectedType = data.leave_type || '';
  
  const leaveTypeCheckboxes = leaveTypes.map(lt => {
    const isSelected = selectedType.toLowerCase().includes(lt.toLowerCase().split(' ')[0].toLowerCase());
    return `<div style="margin: 2px 0; font-size: 11px;">
      <span style="font-weight: bold;">${isSelected ? '☑' : '☐'}</span>
      <span style="margin-left: 5px;">${lt}</span>
    </div>`;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4;">
      <div style="text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0;">APPLICATION FOR LEAVE</div>
      <div style="text-align: center; font-size: 14px; margin: 5px 0;">NO. ${data.control_number || '____________'}</div>

      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <tr>
          <td style="width: 30%; padding: 8px; border: 1px solid #000; vertical-align: top;">
            <div style="font-weight: bold; font-size: 11px;">1. OFFICE/DEPARTMENT</div>
            <div style="margin-top: 5px;">${data.department || data.office_department || ''}</div>
          </td>
          <td style="width: 70%; padding: 8px; border: 1px solid #000; vertical-align: top;">
            <div style="font-weight: bold; font-size: 11px;">2. NAME :</div>
            <div style="display: flex; gap: 10px; margin-top: 5px; font-size: 11px;">
              <div>(Last): <strong>${data.surname || ''}</strong></div>
              <div>(First): <strong>${data.first_name || ''}</strong></div>
              <div>(Middle): <strong>${data.middle_name || ''}</strong></div>
            </div>
          </td>
        </tr>
        <tr>
          <td style="width: 25%; padding: 8px; border: 1px solid #000; vertical-align: top;">
            <div style="font-weight: bold; font-size: 11px;">3. DATE OF FILING</div>
            <div style="margin-top: 5px;">${data.date_of_filing || new Date().toLocaleDateString()}</div>
          </td>
          <td style="width: 35%; padding: 8px; border: 1px solid #000; vertical-align: top;">
            <div style="font-weight: bold; font-size: 11px;">4. POSITION</div>
            <div style="margin-top: 5px;">${data.position || ''}</div>
          </td>
          <td style="width: 40%; padding: 8px; border: 1px solid #000; vertical-align: top;">
            <div style="font-weight: bold; font-size: 11px;">5. SALARY</div>
            <div style="margin-top: 5px;">${data.salary ? (String(data.salary).startsWith('₱') ? data.salary : `₱ ${data.salary}`) : ''}</div>
          </td>
        </tr>
      </table>

      <div style="background-color: #ddd; padding: 5px; font-weight: bold; font-size: 12px; margin: 15px 0 10px 0;">6. DETAILS OF APPLICATION</div>

      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">6A TYPE OF LEAVE TO BE AVAILED OF</div>
          ${leaveTypeCheckboxes}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">6B DETAILS OF LEAVE</div>
          <div style="font-size: 10px; margin: 5px 0;">In case of Vacation/Special Privilege Leave:</div>
          <div style="font-size: 10px; margin: 3px 0;">☐ Within the Philippines ________________</div>
          <div style="font-size: 10px; margin: 3px 0;">☐ Abroad (Specify) __________________</div>
          <div style="font-size: 10px; margin: 8px 0;">In case of Sick Leave:</div>
          <div style="font-size: 10px; margin: 3px 0;">☐ In Hospital (Specify Illness) _________</div>
          <div style="font-size: 10px; margin: 3px 0;">☐ Out Patient (Specify Illness) _________</div>
        </div>
      </div>

      <div style="margin: 15px 0;">
        <div style="font-weight: bold; font-size: 11px;">6C NUMBER OF WORKING DAYS APPLIED FOR</div>
        <div style="border-bottom: 1px solid #000; padding: 2px 5px; min-height: 20px;">${data.num_days || ''}</div>
      </div>

      <div style="margin: 10px 0;">
        <div style="font-weight: bold; font-size: 11px;">INCLUSIVE DATES</div>
        <div style="border-bottom: 1px solid #000; padding: 2px 5px; min-height: 20px;">${data.start_date || ''} to ${data.end_date || ''}</div>
      </div>

      <div style="margin: 15px 0;">
        <div style="font-weight: bold; font-size: 11px;">6D COMPUTATION</div>
        <div style="font-size: 10px; margin: 5px 0;">☐ Not Requested</div>
        <div style="font-size: 10px; margin: 5px 0;">☑ Requested</div>
        <div style="font-size: 10px; margin: 5px 0; padding-left: 20px;">
          If Vacation/Special Privilege Leave:
          <div style="margin: 3px 0;">☐ Within Philippines</div>
          <div style="margin: 3px 0;">☐ Abroad</div>
        </div>
      </div>

      <div style="background-color: #ddd; padding: 5px; font-weight: bold; font-size: 12px; margin: 15px 0 10px 0;">7. RECOMMENDATION</div>
      <div style="font-size: 11px; margin: 10px 0;">
        <div style="margin: 5px 0;">☐ Approval Recommended</div>
        <div style="margin: 5px 0;">☐ Disapproval Recommended</div>
        <div style="margin: 5px 0;">Reason: ${data.disapproval_reason || '________________________________________'}</div>
      </div>

      <div style="background-color: #ddd; padding: 5px; font-weight: bold; font-size: 12px; margin: 15px 0 10px 0;">8. ACTION BY AUTHORITY</div>
      <div style="font-size: 11px; margin: 10px 0;">
        <div style="margin: 5px 0;">☐ Approved</div>
        <div style="margin: 5px 0;">☐ Disapproved</div>
        <div style="margin: 5px 0;">Reason: ${data.disapproval_reason || '________________________________________'}</div>
      </div>

      <div style="margin-top: 30px;">
        <div style="display: flex; gap: 50px;">
          <div>
            <div style="font-weight: bold; font-size: 11px;">Approved by:</div>
            <div style="margin-top: 20px; font-weight: bold; font-size: 12px;">EDWARD V. SERNADILLA, RPF, DPA</div>
            <div style="font-size: 11px;">OIC, CENRO</div>
          </div>
          <div>
            <div style="font-weight: bold; font-size: 11px;">Recommended by:</div>
            <div style="margin-top: 20px; border-bottom: 1px solid #000; width: 200px;"></div>
            <div style="font-size: 11px;">Signature/Date</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate Header HTML for Travel Order
 */
function generateTravelOrderHeaderHTML(data: any): string {
  return `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="font-size: 14px; font-weight: bold; margin: 5px 0;">Department of Environment and Natural Resources</h1>
      <h2 style="font-size: 12px; font-weight: normal; margin: 3px 0;">Community Environment and Natural Resources Office, Olongapo City</h2>
    </div>
    <div style="border-top: 2px solid #b00; margin: 15px 0;"></div>
  `;
}

/**
 * Generate Footer HTML for Travel Order
 */
function generateTravelOrderFooterHTML(data: any): string {
  return `
    <div style="text-align: center; font-size: 10px; font-style: italic;">
      "Malinis na Kapaligiran at Mayamang Kalikasan para sa Buong Sambayanan."<br>
      Fiscal L.D. Baduria St. Upper Kalaklan, Olongapo City, 2200<br>
      Landline: 047 224 2669 | Email: cenroolongapo@denr.gov.ph | www.r3.denr.gov.ph
    </div>
  `;
}

/**
 * Generate Body HTML for Travel Order matching government format
 */
function generateTravelOrderBodyHTML(data: any): string {
  return `
    <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4;">
      <div style="text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0;">TRAVEL ORDER</div>
      <div style="text-align: center; margin: 10px 0;">
        <span style="border-bottom: 1px solid #000; display: inline-block; padding: 0 20px; font-size: 14px;">NO. ${data.travel_no || data.control_number || '___________'}</span>
      </div>

      <div style="display: flex; margin: 8px 0;">
        <div style="flex: 1; margin: 0 10px;">
          <div style="font-weight: bold; font-size: 11px;">Name:</div>
          <div style="border-bottom: 1px solid #ccc; padding: 2px 5px; min-height: 20px;">${data.full_name || ''}</div>
        </div>
        <div style="flex: 1; margin: 0 10px;">
          <div style="font-weight: bold; font-size: 11px;">Salary:</div>
          <div style="border-bottom: 1px solid #ccc; padding: 2px 5px; min-height: 20px;">${data.salary || ''}</div>
        </div>
      </div>

      <div style="display: flex; margin: 8px 0;">
        <div style="flex: 1; margin: 0 10px;">
          <div style="font-weight: bold; font-size: 11px;">Position/Designation:</div>
          <div style="border-bottom: 1px solid #ccc; padding: 2px 5px; min-height: 20px;">${data.position || ''}</div>
        </div>
        <div style="flex: 1; margin: 0 10px;">
          <div style="font-weight: bold; font-size: 11px;">Office:</div>
          <div style="border-bottom: 1px solid #ccc; padding: 2px 5px; min-height: 20px;">${data.office || data.office_department || data.department || 'CENRO'}</div>
        </div>
      </div>

      <div style="display: flex; margin: 8px 0;">
        <div style="flex: 1; margin: 0 10px;">
          <div style="font-weight: bold; font-size: 11px;">Departure Date:</div>
          <div style="border-bottom: 1px solid #ccc; padding: 2px 5px; min-height: 20px;">${data.departure_date || data.start_date || ''}</div>
        </div>
        <div style="flex: 1; margin: 0 10px;">
          <div style="font-weight: bold; font-size: 11px;">Arrival Date:</div>
          <div style="border-bottom: 1px solid #ccc; padding: 2px 5px; min-height: 20px;">${data.arrival_date || data.end_date || ''}</div>
        </div>
      </div>

      <div style="display: flex; margin: 8px 0;">
        <div style="flex: 1; margin: 0 10px;">
          <div style="font-weight: bold; font-size: 11px;">Destination:</div>
          <div style="border-bottom: 1px solid #ccc; padding: 2px 5px; min-height: 20px;">${data.destination || ''}</div>
        </div>
        <div style="flex: 1; margin: 0 10px;">
          <div style="font-weight: bold; font-size: 11px;">Official Station:</div>
          <div style="border-bottom: 1px solid #ccc; padding: 2px 5px; min-height: 20px;">${data.official_station || 'Olongapo City'}</div>
        </div>
      </div>

      <div style="margin: 15px 0;">
        <div style="font-weight: bold; font-size: 11px;">PURPOSE:</div>
        <div style="margin-top: 5px; padding: 5px; border: 1px solid #ccc; min-height: 40px;">
          ${data.purpose || ''}
        </div>
      </div>

      <div style="margin: 10px 0; font-size: 11px;">
        <div>Per Diems/Expenses Allowed: ${data.per_diems !== false ? 'YES' : 'NO'}</div>
        <div>Assistants or Laborers Allowed: ${data.assistants_allowed ? 'YES' : 'NO'}</div>
        <div>Appropriations to which travel should be charged: ${data.appropriations || 'CDS'}</div>
        <div>Remarks or special instructions: ${data.remarks || 'Gather documentation and prepare the necessary report.'}</div>
      </div>

      <div style="font-weight: bold; font-size: 12px; margin: 15px 0 10px 0;">CERTIFICATION / UNDERTAKING:</div>
      <div style="font-size: 10px; margin: 10px 0; line-height: 1.5;">
        I certify that the above travel is necessary and is related to the official function of the said office. I further certify that the travel is true and correct to the best of my knowledge and that I bind myself to be accountable for any misrepresentation or inappropriate claims in relation to this travel order.
        <br><br>
        Hence, I am recommending for its approval.
      </div>

      <div style="margin-top: 30px;">
        <div style="display: flex; gap: 50px;">
          <div>
            <div style="font-weight: bold; font-size: 11px;">Approved:</div>
            <div style="margin-top: 20px; font-weight: bold; font-size: 12px;">EDWARD V. SERNADILLA, RPF, DPA</div>
            <div style="font-size: 11px;">OIC, CENRO</div>
          </div>
          <div>
            <div style="font-weight: bold; font-size: 11px;">Recommended by:</div>
            <div style="margin-top: 20px; border-bottom: 1px solid #000; width: 200px;"></div>
            <div style="font-size: 11px;">Signature/Date</div>
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid #000; margin: 20px 0;"></div>

      <div style="font-size: 9px; margin: 10px 0; line-height: 1.4;">
        I hereby authorize the Accountant to deduct the corresponding amount of the unliquidated cash advance from any succeeding salary for my failure to liquidate this travel within the prescribed thirty-day period upon return to my permanent official station pursuant to item 5.1.3 COA Circular 97-002 dated February 10, 1997 and Sec. 16 EO No. 248 dated May 29, 1995.
      </div>

      <div style="text-align: right; font-weight: bold; font-size: 12px; margin: 20px 0;">
        ${(data.full_name || 'Employee Name').toUpperCase()}
      </div>
    </div>
  `;
}

/**
 * Main conversion function that takes PDF data and converts to Word
 * @param pdfData - The exact data object used by PDF templates
 * @param requestType - Type of document (leave or travel)
 */
export async function convertPdfDataToWord(pdfData: any, requestType: string): Promise<void> {
  try {
    // Generate HTML components based on request type
    let bodyHtml: string;
    let headerHtml: string;
    let footerHtml: string;
    let filename: string;

    if (requestType === REQUEST_TYPES.LEAVE) {
      bodyHtml = generateLeaveApplicationBodyHTML(pdfData);
      headerHtml = generateLeaveApplicationHeaderHTML(pdfData);
      footerHtml = generateLeaveApplicationFooterHTML(pdfData);
      filename = `Leave_Application_${pdfData.control_number || 'draft'}.docx`;
    } else if (requestType === REQUEST_TYPES.TRAVEL) {
      bodyHtml = generateTravelOrderBodyHTML(pdfData);
      headerHtml = generateTravelOrderHeaderHTML(pdfData);
      footerHtml = generateTravelOrderFooterHTML(pdfData);
      filename = `Travel_Order_${pdfData.travel_no || pdfData.control_number || 'draft'}.docx`;
    } else {
      throw new Error(`Unsupported request type: ${requestType}`);
    }

    // Document options for Word OpenXML conversion
    const documentOptions = {
      title: filename,
      orientation: 'portrait',
      margins: {
        top: 0.75,
        bottom: 0.75,
        left: 0.75,
        right: 0.75
      }
    };

    // Convert HTML to DOCX using @turbodocx/html-to-docx with proper signature
    const docxResult = await HtmlToDocx(
      bodyHtml,        // Argument 1: Main Document Body
      headerHtml,      // Argument 2: Header HTML
      documentOptions, // Argument 3: Page margins, orientation
      footerHtml       // Argument 4: Footer HTML
    );

    // Convert result to Blob if needed for saveAs
    let docxBlob: Blob;
    if (docxResult instanceof Blob) {
      docxBlob = docxResult;
    } else {
      // Handle different result types from HtmlToDocx by converting to Uint8Array
      let uint8Array: Uint8Array;
      if (docxResult instanceof Uint8Array) {
        uint8Array = docxResult;
      } else if (docxResult instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(docxResult);
      } else {
        // For Buffer or other types, safely convert by copying to a new Uint8Array
        const tempArray = new Uint8Array(docxResult as unknown as ArrayBuffer);
        uint8Array = new Uint8Array(tempArray.length);
        uint8Array.set(tempArray);
      }
      docxBlob = new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }

    // Trigger browser download
    saveAs(docxBlob, filename);
  } catch (error) {
    console.error('Error converting PDF data to Word:', error);
    throw error;
  }
}

/**
 * Export function for individual applications (Leave/Travel)
 * This uses the exact same data pipeline as PDF generation
 * @param request - Raw request object from database
 * @param accounts - Optional accounts array for employee data enrichment
 */
export async function exportApplicationToWord(request: any, accounts: any[] = []): Promise<void> {
  try {
    // Use the exact same data preparation as PDF generation
    const pdfData = buildPdfDataFromRequest(request, accounts);
    
    // Convert to Word using the shared pipeline
    await convertPdfDataToWord(pdfData, request.request_type);
  } catch (error) {
    console.error('Error exporting application to Word:', error);
    throw error;
  }
}