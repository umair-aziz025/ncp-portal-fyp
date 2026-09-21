import { GraduationCap } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { ProfileDropdown } from './ProfileDropdown';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { userData } = useAuth();

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                University NCP
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Notification & Communication Portal
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {userData && <ProfileDropdown />}
          </div>
        </div>
      </div>
    </nav>
  );
};
