// Centralized Constants for LeaveGo Application

export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  SUPER_ADMIN: 'super_admin',
  PENRO: 'penro',
  CENRO: 'cenro'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.EMPLOYEE]: 'Employee',
  [USER_ROLES.SUPER_ADMIN]: 'Super Administrator',
  [USER_ROLES.PENRO]: 'PENRO',
  [USER_ROLES.CENRO]: 'CENRO'
};

export const APP_ROUTES = {
  LOGIN: '/login',
  RESET_PASSWORD: '/reset-password',
  ROOT: '/',
  SELECTION: '/selection',
  DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  PENRO_DASHBOARD: '/penro/dashboard',
  FORMS_LEAVE: '/forms/leave',
  FORMS_TRAVEL: '/forms/travel',
  SUCCESS: '/success',
  ADMIN_APPROVED: '/admin/approved',
  ADMIN_ARCHIVE: '/admin/archive',
  ADMIN_MONTHLY_SUMMARY: '/admin/monthly-summary',
  ADMIN_ACCOUNT_MANAGEMENT: '/admin/account-management',
  ADMIN_RECORDS: '/admin/records',
  PROFILE_VIEW: '/profile/view/:id'
} as const;


export const REQUEST_STATUS = {
  PENDING: 'Pending',
  PENDING_PENRO: 'Pending Approval PENRO',
  APPROVED: 'Approved',
  DECLINED: 'Declined',
  ARCHIVED: 'Archived'
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

export const REQUEST_TYPES = {
  LEAVE: 'Leave',
  TRAVEL: 'Travel'
} as const;

export type RequestType = typeof REQUEST_TYPES[keyof typeof REQUEST_TYPES];

export const STATUS_COLORS: Record<RequestStatus, { bg: string; text: string; border: string }> = {
  [REQUEST_STATUS.PENDING]: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  [REQUEST_STATUS.PENDING_PENRO]: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200'
  },
  [REQUEST_STATUS.APPROVED]: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  [REQUEST_STATUS.DECLINED]: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  [REQUEST_STATUS.ARCHIVED]: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  }
};

export const LEAVE_TYPES = [
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
] as const;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const APPROPRIATIONS = {
  CDS: 'CDS',
  MOOE: 'MOOE',
  PS: 'PS'
} as const;

export const OFFICES = {
  CENRO_OLONGAPO: 'CENRO Olongapo',
  PENRO_ZAMBALES: 'PENRO Zambales',
  CENRO_SUBIC: 'CENRO Subic',
  CENRO_CASTILLEJOS: 'CENRO Castillejos'
} as const;

export const DEPARTMENTS = [
  'Forest Management',
  'Land Management', 
  'Biodiversity & Wildlife Conservation',
  'Coastal & Marine Resources Management',
  'Administrative Section',
  'Human Resource Management Unit',
  'Finance/Accounting',
  'Records Management',
  'Public Assistance and Complaint Desk',
  'IT Management'
] as const;

export const POSITIONS = [
  'Administrative Officer',
  'HR Management Officer',
  'Records Officer / Custodian',
  'Environmental Management Specialist',
  'Forest Rangers / Forest Technicians',
  'Land Management Officer',
  'IT Specialist'
] as const;

export const EMPLOYEE_TYPES = [
  'Regular',
  'Contract of Service'
] as const;

export const SALARY_RANGES = [
  '₱ 1,000 - 5,000',
  '₱ 5,001 - 10,000',
  '₱ 10,001 - 15,000',
  '₱ 15,001 - 20,000',
  '₱ 20,001 - 25,000',
  '₱ 25,001 - 30,000',
  '₱ 30,001 - 35,000',
  '₱ 35,001 - 40,000',
  '₱ 40,001 - 45,000',
  '₱ 45,001 - 50,000',
  '₱ 50,001 and above'
] as const;

export const BOOTSTRAP_ADMIN_EMAILS = new Set(['admin@denr.gov.ph']);

export const LEAVE_REQUEST_ORDER_COLUMNS = Object.freeze([
  'submitted_at',
  'updated_at',
  'admin_seen_at',
  'id',
  'status',
  'request_type',
] as const);

export const DEFAULT_LEAVE_REQUEST_ORDER_BY = 'submitted_at';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [USER_ROLES.ADMIN]: [
    'view_dashboard',
    'approve_requests',
    'decline_requests',
    'archive_requests',
    'manage_accounts',
    'view_reports'
  ],
  [USER_ROLES.EMPLOYEE]: [
    'submit_requests',
    'view_own_requests',
    'edit_own_requests'
  ],
  [USER_ROLES.PENRO]: [
    'view_dashboard',
    'approve_requests',
    'decline_requests'
  ],
  [USER_ROLES.CENRO]: [
    'view_dashboard',
    'approve_requests',
    'decline_requests'
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    'view_dashboard',
    'approve_requests',
    'decline_requests',
    'archive_requests',
    'manage_accounts',
    'manage_admins',
    'view_reports',
    'system_settings'
  ]
};
