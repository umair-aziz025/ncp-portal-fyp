export const SESSIONS = [
  'FA15', 'FA16', 'FA17', 'FA18', 'FA19', 'FA20', 'FA21', 'FA22', 'FA23', 'FA24', 'FA25',
  'IN22', 'IN23', 'IN24',
  'SE18', 'SE19', 'SE20', 'SE21', 'SE22', 'SE23', 'SE24',
  'SP16', 'SP17', 'SP18', 'SP19', 'SP20', 'SP21', 'SP22', 'SP23', 'SP24', 'SP25',
  'SU16', 'SU17', 'SU18', 'SU19', 'SU20', 'SU21', 'SU22', 'SU24', 'SU25'
];

export const PROGRAMS = [
  'BIT', 'BCS', 'BSE', 'BBA', 'MBA', 'MCS',
  'BAF', 'BAH', 'BAI', 'BAS', 'BAT', 'BBT', 'BCH', 'BCM', 'BCT', 'BCV', 'BEC', 'BED', 'BEE',
  'BFA', 'BFD', 'BFT', 'BHE', 'BHM', 'BHN', 'BHS', 'BIR', 'BIS', 'BMB', 'BMC', 'BME', 'BMT',
  'BPH', 'BPS', 'BSM', 'BST', 'BSY', 'BTH', 'BTY', 'BZO', 'CSE', 'DLA', 'DOP', 'DPH', 'DPT',
  'DVM', 'EDE', 'EDU', 'ELT', 'ENG', 'EPE', 'ETT', 'HRM', 'IET', 'IRB', 'LAW', 'LLB',
  'MAE', 'MAI', 'MBE', 'MBY', 'MCE', 'MCH', 'MCM', 'MCT', 'MCV', 'MEA', 'MEC', 'MED',
  'MEE', 'MES', 'MET', 'MLT', 'MME', 'MMS', 'MPE', 'MPH', 'MSM', 'MTE', 'MZO'
];

export const DEPARTMENTS = PROGRAMS;

export const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const USER_ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  DEPT_ADMIN: 'dept_admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const NOTIFICATION_TYPES = {
  ANNOUNCEMENT: 'announcement',
  ASSIGNMENT: 'assignment',
  ALERT: 'alert',
  SYSTEM: 'system',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const FEEDBACK_CATEGORIES = {
  ACADEMIC: 'academic',
  TECHNICAL: 'technical',
  ADMINISTRATIVE: 'administrative',
  GENERAL: 'general',
} as const;

export const FEEDBACK_STATUS = {
  SUBMITTED: 'submitted',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const ROLL_NUMBER_REGEX = /^[A-Z]{2}\d{2}-[A-Z]{3,4}-\d{3}$/;
