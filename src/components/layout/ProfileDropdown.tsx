import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Settings,
  Bell,
  Activity,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export const ProfileDropdown = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      icon: User,
      label: 'View Profile',
      onClick: () => {
        navigate('/profile');
        setIsOpen(false);
      },
    },
    {
      icon: Settings,
      label: 'Edit Profile',
      onClick: () => {
        navigate('/profile/edit');
        setIsOpen(false);
      },
    },
    {
      icon: Bell,
      label: 'Notifications',
      onClick: () => {
        navigate('/notifications');
        setIsOpen(false);
      },
    },
    {
      icon: Activity,
      label: 'My Activity',
      onClick: () => {
        navigate('/profile/activity');
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {userData?.profilePicUrl ? (
          <img
            src={userData.profilePicUrl}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
            {userData?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {userData?.name || 'User'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {userData?.role?.replace('_', ' ') || 'Student'}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {userData?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {userData?.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {userData?.rollNumber} • {userData?.department}
            </p>
          </div>

          <div className="py-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
