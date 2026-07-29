/**
 * Type definitions for the unified export system
 * These types represent the exact data structures used by PDF templates
 * and consumed by Word converters to ensure data consistency
 */

export interface BasePDFData {
  full_name: string;
  first_name?: string;
  middle_name?: string;
  surname?: string;
  department: string;
  office_department: string;
  office: string;
  position: string;
  salary?: string;
  control_number?: string;
  travel_no?: string;
  application_number?: string;
}

export interface LeaveApplicationPDFData extends BasePDFData {
  leave_type: string;
  start_date: string;
  end_date: string;
  details_of_leave?: string;
  purpose?: string;
}

export interface TravelOrderPDFData extends BasePDFData {
  departure_date: string;
  arrival_date: string;
  destination: string;
  official_station: string;
  purpose: string;
  per_diems?: boolean;
  assistants_allowed?: boolean;
  appropriations?: string;
  remarks?: string;
}

export type DocumentPDFData = LeaveApplicationPDFData | TravelOrderPDFData;

export interface ExportOptions {
  filename?: string;
  includeTimestamp?: boolean;
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
}
