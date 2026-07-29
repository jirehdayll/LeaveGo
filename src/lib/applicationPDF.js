import jsPDF from 'jspdf';
import { renderLeaveApplicationPDF } from '../components/pdf/LeaveApplicationPDFTemplate';
import { renderTravelOrderPDF } from '../components/pdf/TravelOrderPDFTemplate';
import { REQUEST_TYPES } from '../constants';

export const generateApplicationPDF = async (request) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const isLeave = request.request_type === REQUEST_TYPES.LEAVE;
  const details = request.details || {};

  try {
    if (isLeave) {
      await renderLeaveApplicationPDF(pdf, details);
      pdf.save(`Leave_Application_${details.control_number || request.id}.pdf`);
    } else {
      await renderTravelOrderPDF(pdf, details);
      pdf.save(`Travel_Order_${details.travel_no || details.control_number || request.id}.pdf`);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};