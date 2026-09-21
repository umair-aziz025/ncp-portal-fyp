import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification } from '../types';

export const createNotification = async (notificationData: Omit<Notification, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getNotifications = async (userDepartment: string, userRole: string) => {
  try {
    let q;
    
    // Super Admin with special department sees all notifications
    if (userDepartment === 'Administration - All Departments Supervisor') {
      q = query(collection(db, 'notifications'));
    } else {
      q = query(
        collection(db, 'notifications'),
        where('department', 'in', [userDepartment, 'all'])
      );
    }

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];

    const filtered = notifications.filter((notif) =>
      notif.targetRoles.includes('all') || notif.targetRoles.includes(userRole)
    );

    filtered.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return filtered;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markAsRead = async (notificationId: string, userId: string) => {
  try {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, {
      [`isRead.${userId}`]: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: string) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};
