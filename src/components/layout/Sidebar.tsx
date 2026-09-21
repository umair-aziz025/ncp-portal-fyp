import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  BookOpen,
  MessageSquare,
  UserCheck,
  Home,
  Activity,
} from 'lucide-react';

export const Sidebar = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      show: true,
    },
    {
      icon: Bell,
      label: 'Notifications',
      path: '/notifications',
      show: true,
    },
    {
      icon: BookOpen,
      label: 'Resources',
      path: '/resources',
      show: true,
    },
    {
      icon: MessageSquare,
      label: 'Feedback',
      path: '/feedback',
      show: true,
    },
    {
      icon: UserCheck,
      label: 'Verification',
      path: '/admin/verification',
      show: isAdmin,
    },
    {
      icon: Activity,
      label: 'Activity Logs',
      path: '/admin/logs',
      show: isAdmin,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`h-5 w-5 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
};
