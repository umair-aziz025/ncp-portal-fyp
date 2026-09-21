import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User } from '../../types';
import { UserCard } from './UserCard';
import { useAuth } from '../../context/AuthContext';
import { Users, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { logUserApproval, logUserRejection } from '../../services/activityLogService';

type TabType = 'pending' | 'approved' | 'rejected';
type RoleFilter = 'all' | 'student' | 'faculty' | 'dept_admin';

export const VerificationDashboard = () => {
  const { userData, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [userData, activeTab, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let q;

      if (isSuperAdmin) {
        // Super admin sees all users except themselves
        q = query(
          collection(db, 'users'),
          where('status', '==', activeTab)
        );
      } else if (userData?.role === 'dept_admin') {
        // Dept admin sees only their department users (excluding super_admins)
        q = query(
          collection(db, 'users'),
          where('status', '==', activeTab),
          where('department', '==', userData.department)
        );
      } else {
        setUsers([]);
        setLoading(false);
        return;
      }

      const snapshot = await getDocs(q);
      let usersData = snapshot.docs.map((doc) => doc.data() as User);
      
      // Filter out super_admins from dept_admin view and current user from super_admin view
      usersData = usersData.filter(user => {
        if (user.uid === userData?.uid) return false; // Hide self
        if (!isSuperAdmin && user.role === 'super_admin') return false; // Hide super_admins from dept_admin
        
        // Apply role filter for super_admin
        if (isSuperAdmin && roleFilter !== 'all') {
          return user.role === roleFilter;
        }
        
        return true;
      });
      
      usersData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      let pendingQuery, approvedQuery, rejectedQuery;

      if (isSuperAdmin) {
        pendingQuery = query(collection(db, 'users'), where('status', '==', 'pending'));
        approvedQuery = query(collection(db, 'users'), where('status', '==', 'approved'));
        rejectedQuery = query(collection(db, 'users'), where('status', '==', 'rejected'));
      } else if (userData?.role === 'dept_admin') {
        const dept = userData.department;
        pendingQuery = query(
          collection(db, 'users'),
          where('status', '==', 'pending'),
          where('department', '==', dept)
        );
        approvedQuery = query(
          collection(db, 'users'),
          where('status', '==', 'approved'),
          where('department', '==', dept)
        );
        rejectedQuery = query(
          collection(db, 'users'),
          where('status', '==', 'rejected'),
          where('department', '==', dept)
        );
      } else {
        return;
      }

      const [pendingSnap, approvedSnap, rejectedSnap] = await Promise.all([
        getDocs(pendingQuery),
        getDocs(approvedQuery),
        getDocs(rejectedQuery),
      ]);

      // Filter out super_admins from dept_admin stats
      const filterSuperAdmins = (snapshot: any) => {
        if (isSuperAdmin) return snapshot.size;
        return snapshot.docs.filter((doc: any) => doc.data().role !== 'super_admin').length;
      };

      setStats({
        pending: filterSuperAdmins(pendingSnap),
        approved: filterSuperAdmins(approvedSnap),
        rejected: filterSuperAdmins(rejectedSnap),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const user = users.find(u => u.uid === userId);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'approved',
        updatedAt: Timestamp.now(),
      });

      // Log approval activity
      if (userData && user) {
        logUserApproval(
          userData.uid,
          userData.name,
          userData.email,
          userData.role,
          userData.department,
          user.uid,
          user.name,
          user.email
        );
      }

      // Remove from current list and update stats
      setUsers((prev) => prev.filter((user) => user.uid !== userId));
      fetchStats();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user. Please try again.');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const user = users.find(u => u.uid === userId);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'rejected',
        updatedAt: Timestamp.now(),
      });

      // Log rejection activity
      if (userData && user) {
        logUserRejection(
          userData.uid,
          userData.name,
          userData.email,
          userData.role,
          userData.department,
          user.uid,
          user.name,
          user.email
        );
      }

      // Remove from current list and update stats
      setUsers((prev) => prev.filter((user) => user.uid !== userId));
      fetchStats();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user. Please try again.');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isSuperAdmin
              ? 'Review and manage all user registrations'
              : `Review and manage ${userData?.department} department registrations`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`bg-yellow-50 dark:bg-yellow-900/20 border-2 rounded-lg p-6 text-left transition-all ${
            activeTab === 'pending'
              ? 'border-yellow-500 dark:border-yellow-400'
              : 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Pending
              </p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-2">
                {stats.pending}
              </p>
            </div>
            <Clock className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`bg-green-50 dark:bg-green-900/20 border-2 rounded-lg p-6 text-left transition-all ${
            activeTab === 'approved'
              ? 'border-green-500 dark:border-green-400'
              : 'border-green-200 dark:border-green-800 hover:border-green-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Approved
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                {stats.approved}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`bg-red-50 dark:bg-red-900/20 border-2 rounded-lg p-6 text-left transition-all ${
            activeTab === 'rejected'
              ? 'border-red-500 dark:border-red-400'
              : 'border-red-200 dark:border-red-800 hover:border-red-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Rejected</p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">
                {stats.rejected}
              </p>
            </div>
            <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </button>
      </div>

      {/* Role Filter for Super Admin */}
      {isSuperAdmin && (
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Role:
          </span>
          <div className="flex gap-2">
            {(['all', 'student', 'faculty', 'dept_admin'] as RoleFilter[]).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  roleFilter === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {role === 'all' ? 'All Users' : role.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Users
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {activeTab === 'pending'
              ? 'All user registrations have been reviewed.'
              : `No ${activeTab} users found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {users.map((user) => (
            <UserCard
              key={user.uid}
              user={user}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};
