import { ROLL_NUMBER_REGEX, ALLOWED_IMAGE_TYPES, FILE_SIZE_LIMIT } from './constants';

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email format';
  
  // Extract domain from email
  const domain = email.toLowerCase().split('@')[1];
  
  // List of allowed providers
  const allowedProviders = ['gmail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.in'];
  
  // List of common disposable email domains to block
  const disposableProviders = [
    'tempmail.com', 'temp-mail.org', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'throwaway.email', 'fakeinbox.com', 'maildrop.cc',
    'yopmail.com', 'temp-mail.io', 'getnada.com', 'trashmail.com'
  ];
  
  // Check if domain is in disposable list
  if (disposableProviders.includes(domain)) {
    return 'Disposable email addresses are not allowed';
  }
  
  // Check if domain is in allowed providers
  if (!allowedProviders.includes(domain)) {
    return 'Only Gmail and Yahoo email addresses are allowed';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name) return 'Name is required';
  if (name.length < 3) return 'Name must be at least 3 characters';
  
  // Only allow letters (including Unicode letters), spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }
  
  // Check for excessive spaces or special characters
  if (/\s{2,}/.test(name)) {
    return 'Name cannot contain multiple consecutive spaces';
  }
  
  // Check for invalid patterns (e.g., starting/ending with hyphen or apostrophe)
  if (/^[-'\s]|[-'\s]$/.test(name)) {
    return 'Name cannot start or end with special characters';
  }
  
  return null;
};

export const validateRollNumber = (rollNumber: string): string | null => {
  if (!rollNumber) return 'Roll number is required';
  if (!ROLL_NUMBER_REGEX.test(rollNumber)) {
    return 'Invalid roll number format (e.g., FA23-BIT-053)';
  }
  return null;
};

export const validateDepartment = (department: string): string | null => {
  if (!department) return 'Department is required';
  return null;
};

export const validateIdCard = (file: File | null): string | null => {
  if (!file) return 'ID card image is required';

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, and WebP images are allowed';
  }

  if (file.size > FILE_SIZE_LIMIT) {
    return 'File size must be less than 10MB';
  }

  return null;
};

export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};
