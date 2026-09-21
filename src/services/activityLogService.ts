import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ActivityLogData {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  department: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceTitle?: string;
  details?: string;
  targetUserId?: string;
  targetUserName?: string;
  createdAt: Timestamp;
}

/**
 * Log a user activity to Firestore
 */
export const logActivity = async (data: Omit<ActivityLogData, 'createdAt'>): Promise<void> => {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      ...data,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
};

/**
 * Helper functions for common activities
 */

export const logLogin = (userId: string, userName: string, userEmail: string, role: string, department: string) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    role,
    department,
    action: 'User logged in',
    resourceType: 'auth',
    details: 'Successful login',
  });
};

export const logResourceUpload = (
  userId: string,
  userName: string,
  userEmail: string,
  role: string,
  department: string,
  resourceId: string,
  resourceTitle: string
) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    role,
    department,
    action: 'Uploaded resource',
    resourceType: 'resource',
    resourceId,
    resourceTitle,
    details: `Uploaded: ${resourceTitle}`,
  });
};

export const logResourceDownload = (
  userId: string,
  userName: string,
  userEmail: string,
  role: string,
  department: string,
  resourceId: string,
  resourceTitle: string
) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    role,
    department,
    action: 'Downloaded resource',
    resourceType: 'download',
    resourceId,
    resourceTitle,
    details: `Downloaded: ${resourceTitle}`,
  });
};

export const logResourceLike = (
  userId: string,
  userName: string,
  userEmail: string,
  role: string,
  department: string,
  resourceId: string,
  resourceTitle: string,
  liked: boolean
) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    role,
    department,
    action: liked ? 'Liked resource' : 'Unliked resource',
    resourceType: 'like',
    resourceId,
    resourceTitle,
    details: `${liked ? 'Liked' : 'Unliked'}: ${resourceTitle}`,
  });
};

export const logResourceDelete = (
  userId: string,
  userName: string,
  userEmail: string,
  role: string,
  department: string,
  resourceId: string,
  resourceTitle: string
) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    role,
    department,
    action: 'Deleted resource',
    resourceType: 'resource',
    resourceId,
    resourceTitle,
    details: `Deleted: ${resourceTitle}`,
  });
};

export const logFeedbackSubmit = (
  userId: string,
  userName: string,
  userEmail: string,
  role: string,
  department: string,
  feedbackId: string,
  subject: string
) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    role,
    department,
    action: 'Submitted feedback',
    resourceType: 'feedback',
    resourceId: feedbackId,
    resourceTitle: subject,
    details: `Submitted: ${subject}`,
  });
};

export const logFeedbackReply = (
  userId: string,
  userName: string,
  userEmail: string,
  role: string,
  department: string,
  feedbackId: string,
  subject: string
) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    role,
    department,
    action: 'Replied to feedback',
    resourceType: 'feedback',
    resourceId: feedbackId,
    resourceTitle: subject,
    details: `Replied to: ${subject}`,
  });
};

export const logFeedbackResolve = (
  userId: string,
  userName: string,
  userEmail: string,
  role: string,
  department: string,
  feedbackId: string,
  subject: string
) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    role,
    department,
    action: 'Resolved feedback',
    resourceType: 'feedback',
    resourceId: feedbackId,
    resourceTitle: subject,
    details: `Resolved: ${subject}`,
  });
};

export const logUserApproval = (
  adminId: string,
  adminName: string,
  adminEmail: string,
  adminRole: string,
  adminDepartment: string,
  targetUserId: string,
  targetUserName: string,
  targetUserEmail: string
) => {
  return logActivity({
    userId: adminId,
    userName: adminName,
    userEmail: adminEmail,
    role: adminRole,
    department: adminDepartment,
    action: 'Approved user',
    resourceType: 'verification',
    targetUserId,
    targetUserName,
    details: `Approved: ${targetUserName} (${targetUserEmail})`,
  });
};

export const logUserRejection = (
  adminId: string,
  adminName: string,
  adminEmail: string,
  adminRole: string,
  adminDepartment: string,
  targetUserId: string,
  targetUserName: string,
  targetUserEmail: string
) => {
  return logActivity({
    userId: adminId,
    userName: adminName,
    userEmail: adminEmail,
    role: adminRole,
    department: adminDepartment,
    action: 'Rejected user',
    resourceType: 'verification',
    targetUserId,
    targetUserName,
    details: `Rejected: ${targetUserName} (${targetUserEmail})`,
  });
};

export const logProfileUpdate = (
  userId: string,
  userName: string,
  userEmail: string,
  role: string,
  department: string,
  updateType: string
) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    role,
    department,
    action: `Updated ${updateType}`,
    resourceType: 'profile',
    details: `Profile update: ${updateType}`,
  });
};

export const logNotificationCreate = (
  userId: string,
  userName: string,
  userEmail: string,
  role: string,
  department: string,
  notificationId: string,
  title: string
) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    role,
    department,
    action: 'Created notification',
    resourceType: 'notification',
    resourceId: notificationId,
    resourceTitle: title,
    details: `Created notification: ${title}`,
  });
};

export const logNotificationDelete = (
  userId: string,
  userName: string,
  userEmail: string,
  role: string,
  department: string,
  notificationId: string,
  title: string
) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    role,
    department,
    action: 'Deleted notification',
    resourceType: 'notification',
    resourceId: notificationId,
    resourceTitle: title,
    details: `Deleted notification: ${title}`,
  });
};
