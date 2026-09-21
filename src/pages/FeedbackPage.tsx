import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Send, X, Filter, CheckCircle } from 'lucide-react';
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
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Feedback, FeedbackResponse } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { formatFullDate } from '../utils/formatters';
import { 
  logFeedbackSubmit, 
  logFeedbackReply, 
  logFeedbackResolve 
} from '../services/activityLogService';

export const FeedbackPage = () => {
  const { userData, isAdmin, isFaculty } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [replyText, setReplyText] = useState('');

  const [submitForm, setSubmitForm] = useState({
    category: '',
    subject: '',
    message: '',
    concernType: '',
  });

  useEffect(() => {
    fetchFeedbacks();
  }, [userData?.department, userData?.role]);

  const fetchFeedbacks = async () => {
    if (!userData) return;
    
    try {
      setLoading(true);
      const feedbackRef = collection(db, 'feedback');
      let q;

      if (userData?.role === 'student') {
        // Students see only their own feedback
        q = query(
          feedbackRef,
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc')
        );
      } else if (userData?.department === 'Administration - All Departments Supervisor') {
        // Super Admin with special department sees all feedback
        q = query(feedbackRef, orderBy('createdAt', 'desc'));
      } else if (userData?.role === 'dept_admin') {
        // Dept admin sees all feedback from their department
        q = query(
          feedbackRef,
          where('department', '==', userData.department),
          orderBy('createdAt', 'desc')
        );
      } else if (userData?.role === 'faculty') {
        // Faculty sees feedback from their department
        q = query(
          feedbackRef,
          where('department', '==', userData.department),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Fallback: super_admin role sees all feedback
        q = query(feedbackRef, orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      const feedbacksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Feedback[];

      setFeedbacks(feedbacksData);
      console.log(`Fetched ${feedbacksData.length} feedbacks for role: ${userData?.role}, dept: ${userData?.department}`);
    } catch (err: any) {
      console.error('Error fetching feedbacks:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      if (err.code === 'failed-precondition' || err.message?.includes('index')) {
        setError('Database index required. Please create the feedback index in Firebase Console.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);

    try {
      const docRef = await addDoc(collection(db, 'feedback'), {
        userId: userData?.uid,
        userName: userData?.name,
        userEmail: userData?.email,
        department: userData?.department,
        rollNumber: userData?.rollNumber,
        category: submitForm.category,
        concernType: submitForm.concernType,
        subject: submitForm.subject,
        message: submitForm.message,
        status: 'submitted',
        priority: 'medium',
        assignedTo: null,
        responses: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        resolvedAt: null,
      });

      // Log feedback submission
      if (userData) {
        logFeedbackSubmit(
          userData.uid,
          userData.name,
          userData.email,
          userData.role,
          userData.department,
          docRef.id,
          submitForm.subject
        );
      }

      setSubmitForm({
        category: '',
        subject: '',
        message: '',
        concernType: '',
      });
      setShowSubmitModal(false);
      setSuccess('Feedback submitted successfully! Faculty will respond soon.');
      fetchFeedbacks();
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedFeedback) return;

    setReplyLoading(true);
    try {
      const response: FeedbackResponse = {
        respondedBy: userData?.uid || '',
        respondedByName: userData?.name || '',
        message: replyText,
        createdAt: Timestamp.now(),
      };

      await updateDoc(doc(db, 'feedback', selectedFeedback.id), {
        responses: arrayUnion(response),
        status: 'in_progress',
        updatedAt: Timestamp.now(),
      });

      // Log feedback reply
      if (userData) {
        logFeedbackReply(
          userData.uid,
          userData.name,
          userData.email,
          userData.role,
          userData.department,
          selectedFeedback.id,
          selectedFeedback.subject
        );
      }

      setReplyText('');
      fetchFeedbacks();
      // Update selected feedback
      const updatedFeedback = {
        ...selectedFeedback,
        responses: [...(selectedFeedback.responses || []), response],
      };
      setSelectedFeedback(updatedFeedback);
    } catch (err) {
      console.error('Error replying to feedback:', err);
      setError('Failed to send reply. Please try again.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleUpdateStatus = async (feedbackId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'feedback', feedbackId), {
        status,
        updatedAt: Timestamp.now(),
        resolvedAt: status === 'resolved' ? Timestamp.now() : null,
      });
      
      // Log feedback resolution
      if (status === 'resolved' && userData && selectedFeedback) {
        logFeedbackResolve(
          userData.uid,
          userData.name,
          userData.email,
          userData.role,
          userData.department,
          feedbackId,
          selectedFeedback.subject
        );
      }
      
      fetchFeedbacks();
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, status: status as any });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || feedback.department === filterDepartment;
    return matchesStatus && matchesDepartment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'resolved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'closed':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feedback & Support</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Submit queries and get support from faculty
          </p>
        </div>
        {userData?.role === 'student' && (
          <Button onClick={() => setShowSubmitModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Submit Feedback
          </Button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4">
        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'submitted', 'in_progress', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Department Filter for Admin/Faculty */}
        {(isAdmin || isFaculty) && (
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Departments</option>
            {Array.from(new Set(feedbacks.map(f => f.department))).sort().map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Feedbacks List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Feedback Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {userData?.role === 'student'
              ? 'Submit your first feedback or query using the button above.'
              : 'No feedback submissions to review at this time.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedFeedback(feedback)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {feedback.subject}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        feedback.status
                      )}`}
                    >
                      {feedback.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {feedback.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{feedback.userName}</span>
                <span>•</span>
                <span>{feedback.department}</span>
                <span>•</span>
                <span>{feedback.concernType || feedback.category}</span>
                <span>•</span>
                <span>{formatFullDate(feedback.createdAt)}</span>
                <span>•</span>
                <span>{feedback.responses?.length || 0} replies</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Submit Feedback
              </h2>
              <button
                onClick={() => setShowSubmitModal(false)}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Feedback Category
                </label>
                <select
                  value={submitForm.category}
                  onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select Category</option>
                  <option value="academic">Academic</option>
                  <option value="technical">Technical</option>
                  <option value="administrative">Administrative</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Concern Type
                </label>
                <select
                  value={submitForm.concernType}
                  onChange={(e) =>
                    setSubmitForm({ ...submitForm, concernType: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">What is this about?</option>
                  <option value="course_material">Course Material</option>
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam/Quiz</option>
                  <option value="attendance">Attendance</option>
                  <option value="grading">Grading</option>
                  <option value="schedule">Schedule</option>
                  <option value="facility">Facility Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Input
                label="Subject"
                value={submitForm.subject}
                onChange={(e) => setSubmitForm({ ...submitForm, subject: e.target.value })}
                required
                placeholder="Brief subject of your feedback"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  value={submitForm.message}
                  onChange={(e) => setSubmitForm({ ...submitForm, message: e.target.value })}
                  rows={5}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Describe your feedback or issue in detail..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" isLoading={submitLoading} fullWidth>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  variant="secondary"
                  disabled={submitLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedFeedback.subject}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    selectedFeedback.status
                  )}`}
                >
                  {selectedFeedback.status.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  <strong>From:</strong> {selectedFeedback.userName}
                </span>
                <span>
                  <strong>Roll No:</strong> {(selectedFeedback as any).rollNumber}
                </span>
                <span>
                  <strong>Department:</strong> {selectedFeedback.department}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  <strong>Category:</strong> {selectedFeedback.category}
                </span>
                <span>
                  <strong>Concern:</strong> {(selectedFeedback as any).concernType}
                </span>
                <span>
                  <strong>Submitted:</strong> {formatFullDate(selectedFeedback.createdAt)}
                </span>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-gray-900 dark:text-white">{selectedFeedback.message}</p>
              </div>
            </div>

            {/* Responses */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Responses</h3>
              {selectedFeedback.responses && selectedFeedback.responses.length > 0 ? (
                selectedFeedback.responses.map((response, index) => (
                  <div
                    key={index}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {response.respondedByName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFullDate(response.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{response.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No responses yet.</p>
              )}
            </div>

            {/* Reply Form (for faculty/admin) */}
            {(isFaculty || isAdmin) && selectedFeedback.status !== 'closed' && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Send Reply
                </h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Type your response..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-3"
                />
                <div className="flex gap-3">
                  <Button onClick={handleReply} isLoading={replyLoading}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                  {selectedFeedback.status !== 'resolved' && isAdmin && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedFeedback.id, 'resolved')}
                      variant="secondary"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
