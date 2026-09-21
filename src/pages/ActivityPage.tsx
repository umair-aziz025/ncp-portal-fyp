import { useState, useEffect } from 'react';
import { Activity as ActivityIcon, FileText, MessageSquare, Heart, Download, UserCheck, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatFullDate } from '../utils/formatters';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceTitle?: string;
  details?: string;
  createdAt: any;
}

export const ActivityPage = () => {
  const { userData, isAdmin } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (userData) {
      fetchActivities();
    }
  }, [userData]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, 'activity_logs');
      let q;

      if (isAdmin) {
        // Admin sees all activities in their department or all for super_admin
        if (userData?.role === 'super_admin' || userData?.department === 'Administration - All Departments Supervisor') {
          q = query(logsRef, orderBy('createdAt', 'desc'), limit(100));
        } else {
          // Dept admin and faculty - now using server-side orderBy with index
          q = query(
            logsRef,
            where('department', '==', userData?.department),
            orderBy('createdAt', 'desc'),
            limit(100)
          );
        }
      } else {
        // Regular users see only their activities - now using server-side orderBy with index
        q = query(
          logsRef,
          where('userId', '==', userData?.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ActivityLog[];

      setActivities(logs);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true;
    return activity.resourceType === filter;
  });

  const getActivityIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'resource':
        return <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'feedback':
        return <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'like':
        return <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'download':
        return <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'verification':
        return <UserCheck className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'notification':
        return <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <ActivityIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isAdmin ? 'Monitor all platform activities' : 'Track your recent activities'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'resource', 'feedback', 'like', 'download', 'notification', 'verification'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Activity List */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <ActivityIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Activities Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your activities will appear here as you interact with the platform
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.resourceType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {activity.action}
                      </p>
                      {activity.resourceTitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {activity.resourceTitle}
                        </p>
                      )}
                      {activity.details && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {activity.details}
                        </p>
                      )}
                      {isAdmin && activity.userName && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          By: {activity.userName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                      <Calendar className="h-4 w-4" />
                      {formatFullDate(activity.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
