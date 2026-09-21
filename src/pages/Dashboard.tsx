import { useAuth } from '../context/AuthContext';
import { Bell, BookOpen, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: Bell,
      title: 'View Notifications',
      description: 'Check latest announcements and alerts',
      color: 'blue',
      path: '/notifications',
    },
    {
      icon: BookOpen,
      title: 'Browse Resources',
      description: 'Access educational materials',
      color: 'green',
      path: '/resources',
    },
    {
      icon: MessageSquare,
      title: 'Submit Feedback',
      description: 'Share your queries and concerns',
      color: 'purple',
      path: '/feedback',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {getGreeting()}, {userData?.name?.split(' ')[0]}!
        </h1>
        <p className="text-blue-100">
          Welcome to the University Notification & Communication Portal
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="bg-white/20 px-4 py-2 rounded-lg">
            <span className="font-semibold">Department:</span> {userData?.department}
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-lg">
            <span className="font-semibold">Roll Number:</span> {userData?.rollNumber}
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-lg capitalize">
            <span className="font-semibold">Role:</span> {userData?.role?.replace('_', ' ')}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-left hover:shadow-lg transition-all hover:-translate-y-1`}
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 bg-${action.color}-100 dark:bg-${action.color}-900/30`}
              >
                <action.icon className={`h-6 w-6 text-${action.color}-600 dark:text-${action.color}-400`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {action.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Getting Started
        </h2>
        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
          <li className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-center font-semibold mr-3 flex-shrink-0">
              1
            </span>
            <span>
              Check the <strong>Notifications</strong> section regularly for important
              announcements and updates from faculty and administration.
            </span>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-center font-semibold mr-3 flex-shrink-0">
              2
            </span>
            <span>
              Browse the <strong>Resources</strong> library to access lecture notes, assignments,
              and study materials uploaded by your instructors.
            </span>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-center font-semibold mr-3 flex-shrink-0">
              3
            </span>
            <span>
              Use the <strong>Feedback</strong> feature to submit queries, report issues, or
              provide suggestions to improve your learning experience.
            </span>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-center font-semibold mr-3 flex-shrink-0">
              4
            </span>
            <span>
              Access the <strong>AI Chatbot</strong> (bottom-right corner) for quick answers to
              academic questions and portal guidance.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
