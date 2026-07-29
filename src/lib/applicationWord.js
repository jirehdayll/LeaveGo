import { buildPdfDataFromRequest } from './pdfDataBuilder';
import { exportToWord } from '../utils/exports';
import { REQUEST_TYPES } from '../constants';

/**
 * Unified Word export function that hooks into the PDF data pipeline
 * This ensures absolute data consistency between PDF and Word outputs
 * 
 * @param request - The raw request object from the database
 * @param accounts - Optional accounts array for employee data enrichment
 */
export const generateApplicationWord = async (request, accounts = []) => {
  try {
    // Use the exact same data preparation as PDF generation
    const pdfData = buildPdfDataFromRequest(request, accounts);
    
    // Export using the shared converter that consumes PDF data
    await exportToWord(pdfData, request.request_type);
  } catch (error) {
    console.error('Error generating Word document:', error);
    throw error;
  }
};
