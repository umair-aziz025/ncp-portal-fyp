import { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'faculty' | 'dept_admin' | 'super_admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  uid: string;
  name: string;
  email: string;
  department: string;
  rollNumber: string;
  role: UserRole;
  status: UserStatus;
  idCardUrl: string;
  profilePicUrl: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin: Timestamp | null;
}

export type NotificationType = 'announcement' | 'assignment' | 'alert' | 'system';
export type Priority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdBy: string;
  createdByName: string;
  department: string;
  targetRoles: string[];
  priority: Priority;
  isRead: Record<string, boolean>;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
  }> | null;
  createdAt: Timestamp;
  expiresAt: Timestamp | null;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  courseName?: string;
  courseCode?: string;
  teacherName?: string;
  semester?: string;
  subject?: string;
  department: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  downloads: number;
  likes?: number;
  likedBy?: string[];
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type FeedbackCategory = 'academic' | 'technical' | 'administrative' | 'general';
export type FeedbackStatus = 'submitted' | 'in_progress' | 'resolved' | 'closed';

export interface FeedbackResponse {
  respondedBy: string;
  respondedByName: string;
  message: string;
  createdAt: Timestamp;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  status: FeedbackStatus;
  priority: Priority;
  assignedTo: string | null;
  responses: FeedbackResponse[];
  attachments: Array<{
    name: string;
    url: string;
  }> | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt: Timestamp | null;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetType: 'user' | 'notification' | 'resource' | 'feedback';
  targetId: string;
  details: string;
  metadata: Record<string, unknown>;
  timestamp: Timestamp;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
  isAcademic: boolean;
}

export interface ChatConversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt: Timestamp;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  rollNumber: string;
  idCard: File | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}
