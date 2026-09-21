import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Mail, Hash, Building2, Calendar, Shield, Edit2, Save, X, Camera } from 'lucide-react';
import { formatFullDate } from '../utils/formatters';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { logProfileUpdate } from '../services/activityLogService';

export const ProfilePage = () => {
  const { userData, currentUser } = useAuth();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Auto-enable edit mode when accessing /profile/edit
  useEffect(() => {
    if (location.pathname === '/profile/edit') {
      setIsEditing(true);
    }
  }, [location.pathname]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPG, PNG, and WebP images are allowed');
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    // Validate passwords if entered
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);

    try {
      let successMsg = '';
      
      // Update profile picture if changed
      if (profileImage && currentUser) {
        const timestamp = Date.now();
        const imagePath = `profile_pictures/${currentUser.uid}/${timestamp}_${profileImage.name}`;
        const imageRef = ref(storage, imagePath);
        await uploadBytes(imageRef, profileImage);
        const imageUrl = await getDownloadURL(imageRef);

        await updateDoc(doc(db, 'users', currentUser.uid), {
          profilePicUrl: imageUrl,
        });
        
        // Log profile picture update
        if (userData) {
          logProfileUpdate(
            userData.uid,
            userData.name,
            userData.email,
            userData.role,
            userData.department,
            'profile picture'
          );
        }
        
        successMsg = 'Profile picture updated successfully!';
      }

      // Update password if changed
      if (newPassword && currentUser) {
        await updatePassword(currentUser, newPassword);
        
        // Log password update
        if (userData) {
          logProfileUpdate(
            userData.uid,
            userData.name,
            userData.email,
            userData.role,
            userData.department,
            'password'
          );
        }
        
        successMsg = successMsg 
          ? 'Profile picture and password updated successfully!' 
          : 'Password changed successfully!';
      }

      setSuccess(successMsg || 'Profile updated successfully!');
      setIsEditing(false);
      setNewPassword('');
      setConfirmPassword('');
      setProfileImage(null);
      setImagePreview(null);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Please log out and log in again before changing your password');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    setNewPassword('');
    setConfirmPassword('');
    setProfileImage(null);
    setImagePreview(null);
  };

  const currentProfilePic = imagePreview || userData?.profilePicUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="secondary">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative">
            {currentProfilePic ? (
              <img
                src={currentProfilePic}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold">
                {userData?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="h-4 w-4 text-white" />
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {userData?.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 capitalize mt-1">
              {userData?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-gray-900 dark:text-white">{userData?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Hash className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Roll Number</p>
              <p className="text-gray-900 dark:text-white">{userData?.rollNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
              <p className="text-gray-900 dark:text-white">{userData?.department}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                {userData?.status}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
              <p className="text-gray-900 dark:text-white">
                {formatFullDate(userData?.createdAt || null)}
              </p>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Change Password
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
              />
            </div>

            <div className="flex space-x-3 mt-6">
              <Button onClick={handleSave} isLoading={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="secondary" disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
