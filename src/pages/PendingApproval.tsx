import { Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';

export const PendingApproval = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-6">
          <Clock className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Account Pending Approval
        </h1>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Your registration has been submitted successfully. An administrator will review
                your Student ID card and verify your account.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 mb-8">
          <p>This process typically takes 24-48 hours.</p>
          <p>
            You will receive an email notification once your account has been approved or if
            additional information is required.
          </p>
        </div>

        <Button onClick={handleLogout} fullWidth variant="secondary">
          Back to Login
        </Button>
      </div>
    </div>
  );
};
