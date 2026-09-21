import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAsRead, deleteNotification } from '../services/notificationService';
import { Notification } from '../types';
import { CreateNotification } from '../components/notifications/CreateNotification';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatDate } from '../utils/formatters';
import { logNotificationDelete } from '../services/activityLogService';

const ITEMS_PER_PAGE = 8;

export const NotificationsPage = () => {
  const { userData, isAdmin, isFaculty } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; notificationId: string | null }>({ 
    show: false, 
    notificationId: null 
  });

  useEffect(() => {
    if (userData) {
      fetchNotifications();
    }
  }, [userData]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications(userData!.department, userData!.role);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId, userData!.uid);
      // Update local state immediately
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, isRead: { ...notif.isRead, [userData!.uid]: true } }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setDeleteDialog({ show: true, notificationId });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.notificationId) return;
    try {
      const notification = notifications.find(n => n.id === deleteDialog.notificationId);
      
      await deleteNotification(deleteDialog.notificationId);
      
      // Log notification deletion
      if (userData && notification) {
        logNotificationDelete(
          userData.uid,
          userData.name,
          userData.email,
          userData.role,
          userData.department,
          deleteDialog.notificationId,
          notification.title
        );
      }
      
      setDeleteDialog({ show: false, notificationId: null });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNotifications = notifications.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stay updated with latest announcements ({notifications.length} total)
          </p>
        </div>
        {(isAdmin || isFaculty) && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Notification
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Notifications Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Notifications will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-all ${
                  !notif.isRead?.[userData!.uid] ? 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPriorityColor(notif.priority)}`}>
                        {notif.priority}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 capitalize">
                        {notif.type}
                      </span>
                      {!notif.isRead?.[userData!.uid] && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                          New
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {notif.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap">
                      {notif.message}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span>By {notif.createdByName}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(notif.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!notif.isRead?.[userData!.uid] && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                    {(isAdmin || notif.createdBy === userData!.uid) && (
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border transition-colors ${
                    currentPage === 1
                      ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border transition-colors ${
                    currentPage === totalPages
                      ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, notifications.length)} of {notifications.length} notifications
              </p>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateNotification
          onClose={() => setShowCreate(false)}
          onSuccess={fetchNotifications}
        />
      )}

      <ConfirmDialog
        isOpen={deleteDialog.show}
        onCancel={() => setDeleteDialog({ show: false, notificationId: null })}
        onConfirm={confirmDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
};
