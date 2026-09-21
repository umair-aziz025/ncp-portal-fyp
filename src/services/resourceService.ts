import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Resource } from '../types';

export const uploadResource = async (
  file: File,
  metadata: {
    title: string;
    description: string;
    subject: string;
    semester: string;
    department: string;
    uploadedBy: string;
    uploadedByName: string;
    tags: string[];
  }
) => {
  try {
    const timestamp = Date.now();
    const filePath = `resources/${metadata.department}/${metadata.semester}/${timestamp}_${file.name}`;
    const fileRef = ref(storage, filePath);

    await uploadBytes(fileRef, file);
    const fileUrl = await getDownloadURL(fileRef);

    const resourceData = {
      ...metadata,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type.split('/')[1],
      downloads: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'resources'), resourceData);
    return docRef.id;
  } catch (error) {
    console.error('Error uploading resource:', error);
    throw error;
  }
};

export const getResources = async (userDepartment: string, semester?: string, subject?: string) => {
  try {
    let q = query(
      collection(db, 'resources'),
      where('department', '==', userDepartment)
    );

    const snapshot = await getDocs(q);
    let resources = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Resource[];

    if (semester) {
      resources = resources.filter((r) => r.semester === semester);
    }

    if (subject) {
      resources = resources.filter((r) => r.subject.toLowerCase().includes(subject.toLowerCase()));
    }

    resources.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return resources;
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};

export const updateResource = async (resourceId: string, updates: Partial<Resource>) => {
  try {
    const docRef = doc(db, 'resources', resourceId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

export const deleteResource = async (resourceId: string, fileUrl: string) => {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    await deleteDoc(doc(db, 'resources', resourceId));
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

export const incrementDownload = async (resourceId: string) => {
  try {
    const docRef = doc(db, 'resources', resourceId);
    await updateDoc(docRef, {
      downloads: increment(1),
    });
  } catch (error) {
    console.error('Error incrementing download:', error);
  }
};
