import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User } from '../../types';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatFullDate } from '../../utils/formatters';
import { Mail, Hash, Building2, Calendar, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UserCardProps {
  user: User;
  onApprove?: (userId: string) => Promise<void>;
  onReject?: (userId: string) => Promise<void>;
}

export const UserCard = ({ user, onApprove, onReject }: UserCardProps) => {
  const { isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | null;
  }>({ isOpen: false, type: null });

  const handleApprove = async () => {
    if (!onApprove) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        status: 'approved',
        role: selectedRole,
        updatedAt: Timestamp.now(),
      });
      await onApprove(user.uid);
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
    setLoading(false);
    setConfirmDialog({ isOpen: false, type: null });
  };

  const handleReject = async () => {
    if (!onReject) return;
    setLoading(true);
    await onReject(user.uid);
    setLoading(false);
    setConfirmDialog({ isOpen: false, type: null });
  };

  const getStatusBadge = () => {
    switch (user.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 mt-2">
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 mt-2">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 mt-2">
            Rejected
          </span>
        );
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.name}
              </h3>
              {getStatusBadge()}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{user.rollNumber}</span>
            </div>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{user.department}</span>
            </div>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Registered: {formatFullDate(user.createdAt)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              View ID Card
            </button>
          </div>

          {(onApprove || onReject) && (
            <div className="flex space-x-3">
              {onApprove && user.status !== 'approved' && (
                <Button
                  onClick={() => setConfirmDialog({ isOpen: true, type: 'approve' })}
                  variant="success"
                  size="sm"
                  fullWidth
                  isLoading={loading}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-1 inline" />
                  {user.status === 'rejected' ? 'Re-approve' : 'Approve'}
                </Button>
              )}

              {onReject && user.status !== 'rejected' && (
                <Button
                  onClick={() => setConfirmDialog({ isOpen: true, type: 'reject' })}
                  variant="danger"
                  size="sm"
                  fullWidth
                  isLoading={loading}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-1 inline" />
                  {user.status === 'approved' ? 'Revoke' : 'Reject'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Student ID Card - {user.name}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-4">
              <img
                src={user.idCardUrl}
                alt="Student ID Card"
                className="w-full h-auto rounded"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="dept_admin">Department Admin</option>
                {isSuperAdmin && <option value="super_admin">Super Admin</option>}
              </select>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Select the role for this user before approving
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button onClick={() => setShowModal(false)} variant="secondary" size="sm">
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowModal(false);
                  setConfirmDialog({ isOpen: true, type: 'approve' });
                }} 
                variant="success" 
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-1 inline" />
                Approve
              </Button>
              <Button 
                onClick={() => {
                  setShowModal(false);
                  setConfirmDialog({ isOpen: true, type: 'reject' });
                }} 
                variant="danger" 
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-1 inline" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'approve'}
        title={user.status === 'rejected' ? 'Re-approve User' : 'Approve User'}
        message={`Are you sure you want to ${user.status === 'rejected' ? 're-approve' : 'approve'} ${user.name} as ${selectedRole}? They will gain access to the portal.`}
        confirmText={user.status === 'rejected' ? 'Re-approve' : 'Approve'}
        cancelText="Cancel"
        variant="info"
        onConfirm={handleApprove}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'reject'}
        title={user.status === 'approved' ? 'Revoke Access' : 'Reject User'}
        message={`Are you sure you want to ${user.status === 'approved' ? 'revoke access for' : 'reject'} ${user.name}? ${user.status === 'approved' ? 'They will lose all access to the portal.' : 'They will not be able to access the portal.'}`}
        confirmText={user.status === 'approved' ? 'Revoke' : 'Reject'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleReject}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
      />
    </>
  );
};
