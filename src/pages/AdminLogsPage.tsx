import { useState, useEffect } from 'react';
import { 
  Activity as ActivityIcon, 
  FileText, 
  MessageSquare, 
  Heart, 
  Download, 
  UserCheck, 
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatFullDate } from '../utils/formatters';
import { DEPARTMENTS } from '../utils/constants';

interface ActivityLog {
  id: string;
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
  createdAt: any;
}

const ITEMS_PER_PAGE = 20;

export const AdminLogsPage = () => {
  const { userData, isSuperAdmin } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (userData) {
      fetchActivities();
    }
  }, [userData]);

  useEffect(() => {
    applyFilters();
  }, [activities, searchTerm, filterType, filterRole, filterDepartment, dateRange]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, 'activity_logs');
      let q;

      if (isSuperAdmin || userData?.department === 'Administration - All Departments Supervisor') {
        // Super admin sees all activities
        q = query(logsRef, orderBy('createdAt', 'desc'), limit(500));
      } else if (userData?.role === 'dept_admin') {
        // Dept admin sees only their department - now using server-side orderBy with index
        q = query(
          logsRef,
          where('department', '==', userData?.department),
          orderBy('createdAt', 'desc'),
          limit(300)
        );
      } else {
        // Faculty sees their department - now using server-side orderBy with index
        q = query(
          logsRef,
          where('department', '==', userData?.department),
          orderBy('createdAt', 'desc'),
          limit(300)
        );
      }

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ActivityLog[];

      console.log(`AdminLogsPage: Fetched ${logs.length} logs for role: ${userData?.role}, dept: ${userData?.department}`);
      console.log('First 3 logs:', logs.slice(0, 3));
      setActivities(logs);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...activities];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.userName.toLowerCase().includes(search) ||
          log.userEmail.toLowerCase().includes(search) ||
          log.action.toLowerCase().includes(search) ||
          log.resourceTitle?.toLowerCase().includes(search) ||
          log.details?.toLowerCase().includes(search)
      );
    }

    // Resource type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((log) => log.resourceType === filterType);
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter((log) => log.role === filterRole);
    }

    // Department filter (super admin only)
    if (isSuperAdmin && filterDepartment !== 'all') {
      filtered = filtered.filter((log) => log.department === filterDepartment);
    }

    // Date range filter
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((log) => {
        const logDate = log.createdAt.toDate();
        return logDate >= fromDate;
      });
    }
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((log) => {
        const logDate = log.createdAt.toDate();
        return logDate <= toDate;
      });
    }

    setFilteredActivities(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

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
      case 'auth':
        return <ActivityIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <ActivityIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterRole('all');
    setFilterDepartment('all');
    setDateRange({ from: '', to: '' });
  };

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isSuperAdmin
              ? 'Monitor all platform activities across departments'
              : `Monitor ${userData?.department} department activities`}
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Logs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{activities.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Filtered Results</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredActivities.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Unique Users</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {new Set(activities.map(a => a.userId)).size}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Today's Activities</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {activities.filter(a => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return a.createdAt.toDate() >= today;
            }).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, action..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Activity Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="auth">Login</option>
              <option value="resource">Resources</option>
              <option value="download">Downloads</option>
              <option value="like">Likes</option>
              <option value="feedback">Feedback</option>
              <option value="notification">Notifications</option>
              <option value="verification">Verification</option>
              <option value="profile">Profile</option>
            </select>
          </div>

          {/* User Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="dept_admin">Dept Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {/* Department (Super Admin only) */}
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Activity List */}
      {paginatedActivities.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <ActivityIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Activities Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters to see more results
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedActivities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.resourceType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {activity.action}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm text-blue-600 dark:text-blue-400">
                            {activity.userName}
                          </span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {activity.userEmail}
                          </span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 capitalize">
                            {activity.role.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.department}
                          </span>
                        </div>
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
                        {activity.targetUserName && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                            Target: {activity.targetUserName}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border transition-colors ${
                    currentPage === 1
                      ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredActivities.length)} of {filteredActivities.length} logs
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
