import jsPDF from 'jspdf';

function loadImageAsDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

const DENR_LOGO_PATH = '/denr-logo.png';

async function addDenrLogo(doc, x, y, sizeMm = 22) {
  try {
    const dataUrl = await loadImageAsDataUrl(DENR_LOGO_PATH);
    doc.addImage(dataUrl, 'PNG', x, y, sizeMm, sizeMm);
    return true;
  } catch {
    return false;
  }
}

function drawControlNumberStamp(doc, W, controlNumber) {
  if (!controlNumber) return;
  doc.setFillColor(255, 238, 0);
  doc.rect(W - 45, 8, 30, 10, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.rect(W - 45, 8, 30, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(String(controlNumber), W - 30, 14.5, { align: 'center' });
}

function parseEmployeeName(data) {
  if (data.surname || data.first_name) {
    return {
      lastName: data.surname || '',
      firstName: data.first_name || '',
      middleName: data.middle_name || '',
    };
  }
  const nameParts = (data.full_name || '').trim().split(/\\s+/).filter(Boolean);
  if (nameParts.length === 0) return { lastName: '', firstName: '', middleName: '' };
  if (nameParts.length === 1) return { lastName: '', firstName: nameParts[0], middleName: '' };
  if (nameParts.length === 2) {
    return { firstName: nameParts[0], middleName: '', lastName: nameParts[1] };
  }
  return {
    firstName: nameParts[0],
    middleName: nameParts.slice(1, -1).join(' '),
    lastName: nameParts[nameParts.length - 1],
  };
}

/**
 * Renders a Travel Order PDF onto the provided jsPDF document.
 */
export async function renderTravelOrderPDF(doc, data) {
  const W = 210;
  const travelNo = data.travel_no || data.control_number || '';

  await addDenrLogo(doc, 15, 8, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Department of Environment and Natural Resources', W / 2, 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Community Environment and Natural Resources Office, Olongapo City', W / 2, 17, { align: 'center' });

  doc.setDrawColor(180, 0, 0);
  doc.setLineWidth(1.2);
  doc.line(15, 33, W - 15, 33);
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TRAVEL ORDER', W / 2, 43, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  drawControlNumberStamp(doc, W, travelNo);
  doc.text(`NO. ${travelNo || '___________'}`, W / 2, 50, { align: 'center' });
  doc.line(W / 2 - 10, 51, W / 2 + 30, 51);

  const applicationNumber = data.application_number || data.control_number || '';
  if (applicationNumber && applicationNumber !== travelNo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Application Number: ${applicationNumber}`, W / 2, 56, { align: 'center' });
  }

  const left = 15;
  const mid = W / 2 + 5;
  let y = 68;
  const lineH = 8;

  const field = (label, value, x, width, row_y) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`${label}:`, x, row_y);
    doc.text(value || '', x + doc.getTextWidth(`${label}: `) + 1, row_y);
    doc.setDrawColor(180, 180, 180);
    doc.line(x + doc.getTextWidth(`${label}: `), row_y + 0.5, x + width, row_y + 0.5);
    doc.setDrawColor(0, 0, 0);
  };

  const officeLabel = data.office || data.office_department || data.department || 'CENRO';

  field('Name', data.full_name || '', left, 85, y);
  field('Salary', data.salary || '', mid, 85, y);
  y += lineH;

  field('Position/Designation', data.position || '', left, 85, y);
  field('Office', officeLabel, mid, 85, y);
  y += lineH;

  field('Departure Date', data.departure_date || data.start_date || '', left, 85, y);
  field('Arrival Date', data.arrival_date || data.end_date || '', mid, 85, y);
  y += lineH;

  field('Destination', data.destination || '', left, 85, y);
  field('Official Station', data.official_station || 'Olongapo City', mid, 85, y);
  y += lineH + 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('PURPOSE :', left, y);
  const purposeText = data.purpose || '';
  const wrapped = doc.splitTextToSize(purposeText, W - left - 20);
  doc.text(wrapped, left + 22, y);
  y += Math.max(wrapped.length * 5, 8) + 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Per Diems/Expenses Allowed : ${data.per_diems !== false ? 'YES' : 'NO'}`, left, y);
  y += 6;
  doc.text(`Assistants or Laborers Allowed : ${data.assistants_allowed ? 'YES' : 'NO'}`, left, y);
  y += 6;
  doc.text(`Appropriations to which travel should be charged : ${data.appropriations || 'CDS'}`, left, y);
  y += 6;
  doc.text(`Remarks or special instructions : ${data.remarks || 'Gather documentation and prepare the necessary report.'}`, left, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATION / UNDERTAKING:', left, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const certText = 'I certify that the above travel is necessary and is related to the official function of the said office. I further certify that the travel is true and correct to the best of my knowledge and that I bind myself to be accountable for any misrepresentation or inappropriate claims in relation to this travel order.\n\nHence, I am recommending for its approval.';
  const certWrapped = doc.splitTextToSize(certText, W - left * 2);
  doc.text(certWrapped, left, y);
  y += certWrapped.length * 4.5 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Approved:', left, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Recommended by:', mid + 10, y);
  y += 16;

  doc.setFont('helvetica', 'bold');
  doc.text('EDWARD V. SERNADILLA, RPF, DPA', left, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('OIC, CENRO', left, y);
  y += 12;

  doc.setLineWidth(0.5);
  doc.line(left, y, W - left, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const authText = 'I hereby authorize the Accountant to deduct the corresponding amount of the unliquidated cash advance from any succeeding salary for my failure to liquidate this travel within the prescribed thirty-day period upon return to my permanent official station pursuant to item 5.1.3 COA Circular 97-002 dated February 10, 1997 and Sec. 16 EO No. 248 dated May 29, 1995.';
  const authWrapped = doc.splitTextToSize(authText, W - left * 2);
  doc.text(authWrapped, left, y);
  y += authWrapped.length * 4.2 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text((data.full_name || 'Employee Name').toUpperCase(), W - left, y, { align: 'right' });
  y += 12;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text('"Malinis na Kapaligiran at Mayamang Kalikasan para sa Buong Sambayanan."', W / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Fiscal L.D. Baduria St. Upper Kalaklan, Olongapo City, 2200', W / 2, y, { align: 'center' });
  y += 4;
  doc.text('Landline: 047 224 2669 | Email: cenroolongapo@denr.gov.ph | www.r3.denr.gov.ph', W / 2, y, { align: 'center' });
}
