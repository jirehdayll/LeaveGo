import { exportApplicationToWord } from '../utils/exporters';
import { REQUEST_TYPES } from '../constants';

/**
 * Unified Word export function that hooks into the PDF data pipeline
 * This ensures absolute data consistency between PDF and Word outputs
 * Uses HTML-to-Docx conversion for automated layout preservation
 * 
 * @param request - The raw request object from the database
 * @param accounts - Optional accounts array for employee data enrichment
 */
export const generateApplicationWord = async (request, accounts = []) => {
  try {
    // Use the HTML-based converter that consumes the same PDF data pipeline
    await exportApplicationToWord(request, accounts);
  } catch (error) {
    console.error('Error generating Word document:', error);
    throw error;
  }
};
