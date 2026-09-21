import { useState, useEffect } from 'react';
import { BookOpen, Plus, Download, Heart, Search, Filter, Upload, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Resource } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatFullDate } from '../utils/formatters';
import { DEPARTMENTS } from '../utils/constants';
import { 
  logResourceUpload, 
  logResourceDownload, 
  logResourceLike, 
  logResourceDelete 
} from '../services/activityLogService';

export const ResourcesPage = () => {
  const { userData, isFaculty, isAdmin } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [likedResources, setLikedResources] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; resourceId: string | null }>({
    isOpen: false,
    resourceId: null,
  });

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    courseName: '',
    courseCode: '',
    teacherName: '',
    semester: '',
    department: '',
    uploadType: 'course' as 'course' | 'document',
    file: null as File | null,
  });

  useEffect(() => {
    fetchResources();
    fetchLikedResources();
  }, [userData?.department]);

  const fetchResources = async () => {
    try {
      const resourcesRef = collection(db, 'resources');
      let q;

      if (userData?.role === 'student') {
        // Students see resources from their department AND resources marked as "all"
        q = query(resourcesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const resourcesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Resource[];
        
        // Filter to show only department-specific or "all" resources
        const filtered = resourcesData.filter(
          (r) => r.department === userData.department || r.department === 'all'
        );
        setResources(filtered);
        console.log(`Fetched ${filtered.length} resources for student in dept: ${userData?.department}`);
        return;
      } else if (userData?.department === 'Administration - All Departments Supervisor') {
        // Super Admin with special department sees all resources
        q = query(resourcesRef, orderBy('createdAt', 'desc'));
      } else {
        // Faculty and dept_admin see resources from their department AND resources marked as "all"
        q = query(resourcesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const resourcesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Resource[];
        
        // Filter to show only department-specific or "all" resources
        const filtered = resourcesData.filter(
          (r) => r.department === userData.department || r.department === 'all'
        );
        setResources(filtered);
        console.log(`Fetched ${filtered.length} resources for role: ${userData?.role}, dept: ${userData?.department}`);
        return;
      }

      const snapshot = await getDocs(q);
      const resourcesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Resource[];

      setResources(resourcesData);
      console.log(`Fetched ${resourcesData.length} resources for role: ${userData?.role}, dept: ${userData?.department}`);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      if (err.code === 'failed-precondition' || err.message?.includes('index')) {
        setError('Database index required. Please create the resources index in Firebase Console.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedResources = async () => {
    try {
      if (userData?.uid && userData?.role === 'student') {
        const userDoc = await getDocs(
          query(collection(db, 'user_likes'), where('userId', '==', userData.uid))
        );
        const likes = userDoc.docs.map((doc) => doc.data().resourceId);
        setLikedResources(likes);
      }
    } catch (err: any) {
      // Only log error if it's not a permission issue for non-students
      if (userData?.role === 'student') {
        console.error('Error fetching liked resources:', err);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!uploadForm.file) {
      setError('Please select a file to upload');
      return;
    }

    if (uploadForm.file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setUploadLoading(true);

    try {
      // Upload file to storage
      const timestamp = Date.now();
      const filePath = `resources/${uploadForm.department}/${timestamp}_${uploadForm.file.name}`;
      const fileRef = ref(storage, filePath);
      await uploadBytes(fileRef, uploadForm.file);
      const fileUrl = await getDownloadURL(fileRef);

      // Create resource document
      const docRef = await addDoc(collection(db, 'resources'), {
        title: uploadForm.title,
        description: uploadForm.description,
        courseName: uploadForm.courseName,
        courseCode: uploadForm.courseCode,
        teacherName: uploadForm.teacherName,
        semester: uploadForm.semester,
        department: uploadForm.department,
        fileUrl,
        fileName: uploadForm.file.name,
        fileSize: uploadForm.file.size,
        fileType: uploadForm.file.type,
        uploadedBy: userData?.uid,
        uploadedByName: userData?.name,
        downloads: 0,
        likes: 0,
        likedBy: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Log upload activity
      if (userData) {
        logResourceUpload(
          userData.uid,
          userData.name,
          userData.email,
          userData.role,
          userData.department,
          docRef.id,
          uploadForm.title
        );
      }

      // Reset form and close modal
      setUploadForm({
        title: '',
        description: '',
        courseName: '',
        courseCode: '',
        teacherName: '',
        semester: '',
        department: '',
        uploadType: 'course',
        file: null,
      });
      setShowUploadModal(false);
      fetchResources();
    } catch (err) {
      console.error('Error uploading resource:', err);
      setError('Failed to upload resource. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLike = async (resourceId: string) => {
    if (!userData?.uid) return;

    try {
      const resourceRef = doc(db, 'resources', resourceId);
      const isLiked = likedResources.includes(resourceId);
      const resource = resources.find(r => r.id === resourceId);

      if (isLiked) {
        // Unlike
        await updateDoc(resourceRef, {
          likes: increment(-1),
          likedBy: arrayRemove(userData.uid),
        });
        setLikedResources(likedResources.filter((id) => id !== resourceId));
      } else {
        // Like
        await updateDoc(resourceRef, {
          likes: increment(1),
          likedBy: arrayUnion(userData.uid),
        });
        setLikedResources([...likedResources, resourceId]);
        
        // Log like activity
        if (resource) {
          logResourceLike(
            userData.uid,
            userData.name,
            userData.email,
            userData.role,
            userData.department,
            resourceId,
            resource.title,
            true
          );
        }
      }

      // Refresh resources
      fetchResources();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      // Increment download count
      await updateDoc(doc(db, 'resources', resource.id), {
        downloads: increment(1),
      });

      // Log download activity
      if (userData) {
        logResourceDownload(
          userData.uid,
          userData.name,
          userData.email,
          userData.role,
          userData.department,
          resource.id,
          resource.title
        );
      }

      // Open file in new tab
      window.open(resource.fileUrl, '_blank');
      fetchResources();
    } catch (err) {
      console.error('Error downloading resource:', err);
    }
  };

  const handleDelete = async (resourceId: string) => {
    try {
      const resource = resources.find(r => r.id === resourceId);
      
      await deleteDoc(doc(db, 'resources', resourceId));
      
      // Log delete activity
      if (userData && resource) {
        logResourceDelete(
          userData.uid,
          userData.name,
          userData.email,
          userData.role,
          userData.department,
          resourceId,
          resource.title
        );
      }
      
      setDeleteConfirm({ isOpen: false, resourceId: null });
      fetchResources();
    } catch (err) {
      console.error('Error deleting resource:', err);
      setError('Failed to delete resource. Please try again.');
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.courseCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment =
      filterDepartment === 'all' || resource.department === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Educational Resources
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Access course materials, notes, and assignments
          </p>
        </div>
        {(isFaculty || isAdmin) && (
          <Button onClick={() => setShowUploadModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Resource
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, course name, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        {(isFaculty || isAdmin) && (
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Departments</option>
            {Array.from(new Set(resources.map(r => r.department))).sort().map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Resources List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Resources Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm
              ? 'No resources match your search.'
              : 'Educational materials uploaded by faculty will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {resource.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {resource.courseName && (
                      <span>
                        <strong>Course:</strong> {resource.courseName}
                      </span>
                    )}
                    {resource.courseCode && (
                      <span>
                        <strong>Code:</strong> {resource.courseCode}
                      </span>
                    )}
                    {resource.teacherName && (
                      <span>
                        <strong>Teacher:</strong> {resource.teacherName}
                      </span>
                    )}
                    {resource.semester && (
                      <span>
                        <strong>Semester:</strong> {resource.semester}
                      </span>
                    )}
                    <span>
                      <strong>Department:</strong> {resource.department}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Uploaded by {resource.uploadedByName}</span>
                    <span>•</span>
                    <span>{formatFullDate(resource.createdAt)}</span>
                    <span>•</span>
                    <span>{resource.downloads || 0} downloads</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    onClick={() => handleDownload(resource)}
                    variant="secondary"
                    className="whitespace-nowrap"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  {/* Like button for students */}
                  {userData?.role === 'student' ? (
                    <button
                      onClick={() => handleLike(resource.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        likedResources.includes(resource.id)
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          likedResources.includes(resource.id) ? 'fill-current' : ''
                        }`}
                      />
                      {resource.likes || 0}
                    </button>
                  ) : (
                    /* Show likes count to faculty/admin */
                    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      <Heart className="h-4 w-4" />
                      {resource.likes || 0}
                    </div>
                  )}

                  {/* Delete button for admin or uploader */}
                  {(isAdmin || resource.uploadedBy === userData?.uid) && (
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, resourceId: resource.id })}
                      className="flex items-center justify-center p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      title="Delete resource"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Upload Resource
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Upload Type Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setUploadForm({ ...uploadForm, uploadType: 'course' })}
                className={`px-4 py-2 font-medium transition-colors ${
                  uploadForm.uploadType === 'course'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Course Material
              </button>
              <button
                type="button"
                onClick={() => setUploadForm({ ...uploadForm, uploadType: 'document' })}
                className={`px-4 py-2 font-medium transition-colors ${
                  uploadForm.uploadType === 'document'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                General Document
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <Input
                label="Resource Title"
                value={uploadForm.title}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, title: e.target.value })
                }
                required
                placeholder="e.g., Week 5 Lecture Notes"
              />

              {/* Department Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadForm.department}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, department: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select Department</option>
                  {userData?.department === 'Administration - All Departments Supervisor' ? (
                    <>
                      <option value="all">All Departments</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value={userData?.department}>{userData?.department}</option>
                  )}
                </select>
              </div>

              {/* Course-specific fields */}
              {uploadForm.uploadType === 'course' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Course Name"
                      value={uploadForm.courseName}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, courseName: e.target.value })
                      }
                      required
                      placeholder="e.g., Data Structures"
                    />
                    <Input
                      label="Course Code"
                      value={uploadForm.courseCode}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, courseCode: e.target.value })
                      }
                      required
                      placeholder="e.g., CS201"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Teacher Name"
                      value={uploadForm.teacherName}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, teacherName: e.target.value })
                      }
                      required
                      placeholder="e.g., Dr. John Smith"
                    />
                    <Input
                      label="Semester"
                      value={uploadForm.semester}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, semester: e.target.value })
                      }
                      required
                      placeholder="e.g., Spring 2025"
                    />
                  </div>
                </>
              )}

              {/* Semester field for documents */}
              {uploadForm.uploadType === 'document' && (
                <Input
                  label="Semester (Optional)"
                  value={uploadForm.semester}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, semester: e.target.value })
                  }
                  placeholder="e.g., Spring 2025"
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, description: e.target.value })
                  }
                  rows={3}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Brief description of the resource..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File Upload
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Supported formats: PDF, Word, PowerPoint, Excel, ZIP (Max 50MB)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" isLoading={uploadLoading} fullWidth>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resource
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  variant="secondary"
                  disabled={uploadLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This action cannot be undone and all students will lose access to this file."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deleteConfirm.resourceId && handleDelete(deleteConfirm.resourceId)}
        onCancel={() => setDeleteConfirm({ isOpen: false, resourceId: null })}
      />
    </div>
  );
};
