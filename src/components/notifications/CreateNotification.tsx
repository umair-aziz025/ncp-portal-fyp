import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { createNotification } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { X } from 'lucide-react';
import { DEPARTMENTS } from '../../utils/constants';
import { logNotificationCreate } from '../../services/activityLogService';

interface CreateNotificationProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateNotification = ({ onClose, onSuccess }: CreateNotificationProps) => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement' as const,
    department: userData?.role === 'super_admin' ? 'all' : userData?.department || '',
    targetRoles: ['all'],
    priority: 'medium' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const notificationData = {
        ...formData,
        createdBy: userData!.uid,
        createdByName: userData!.name,
        isRead: {},
        attachments: null,
        createdAt: Timestamp.now(),
        expiresAt: null,
      };
      
      const notificationId = await createNotification(notificationData);

      // Log notification creation
      if (userData && notificationId) {
        logNotificationCreate(
          userData.uid,
          userData.name,
          userData.email,
          userData.role,
          userData.department,
          notificationId,
          formData.title
        );
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating notification:', error);
      alert('Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Notification
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="announcement">Announcement</option>
                <option value="assignment">Assignment</option>
                <option value="alert">Alert</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Department
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              disabled={userData?.role !== 'super_admin'}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Create Notification
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
