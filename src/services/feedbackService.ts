import { collection, addDoc, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Feedback, FeedbackResponse } from '../types';

export const submitFeedback = async (feedbackData: Omit<Feedback, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'feedback'), feedbackData);
    return docRef.id;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

export const getFeedback = async (userId: string, userRole: string, userDepartment: string) => {
  try {
    let q;

    if (userRole === 'super_admin') {
      q = query(collection(db, 'feedback'));
    } else if (userRole === 'dept_admin' || userRole === 'faculty') {
      q = query(
        collection(db, 'feedback'),
        where('department', '==', userDepartment)
      );
    } else {
      q = query(
        collection(db, 'feedback'),
        where('userId', '==', userId)
      );
    }

    const snapshot = await getDocs(q);
    const feedback = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Feedback[];

    feedback.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return feedback;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }
};

export const respondToFeedback = async (
  feedbackId: string,
  response: Omit<FeedbackResponse, 'createdAt'>,
  newStatus: string
) => {
  try {
    const docRef = doc(db, 'feedback', feedbackId);
    const responseWithTimestamp = {
      ...response,
      createdAt: Timestamp.now(),
    };

    await updateDoc(docRef, {
      responses: [...(await getDoc(docRef)).data()?.responses || [], responseWithTimestamp],
      status: newStatus,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error responding to feedback:', error);
    throw error;
  }
};

const getDoc = async (docRef: any) => {
  const snapshot = await docRef.get();
  return snapshot;
};
