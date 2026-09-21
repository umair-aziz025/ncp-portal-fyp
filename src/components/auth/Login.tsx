import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { validateEmail, validatePassword } from '../../utils/validation';
import { LoginFormData, User } from '../../types';
import { GraduationCap } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        setGeneralError('User data not found. Please contact support.');
        await auth.signOut();
        setLoading(false);
        return;
      }

      const userData = userDoc.data() as User;

      if (userData.status === 'pending') {
        await auth.signOut();
        navigate('/pending-approval');
        return;
      }

      if (userData.status === 'rejected') {
        await auth.signOut();
        setGeneralError(
          'Your account has been rejected. Please contact administration for more information.'
        );
        setLoading(false);
        return;
      }

      await updateDoc(userDocRef, {
        lastLogin: Timestamp.now(),
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setGeneralError('Invalid email or password.');
      } else if (error.code === 'auth/invalid-credential') {
        setGeneralError('Invalid email or password.');
      } else if (error.code === 'auth/too-many-requests') {
        setGeneralError('Too many failed attempts. Please try again later.');
      } else {
        setGeneralError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Login to University NCP Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="john.doe@university.edu"
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Enter your password"
            required
          />

          {generalError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{generalError}</p>
            </div>
          )}

          <Button type="submit" fullWidth isLoading={loading}>
            Login
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Register here
              </button>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you faculty or admin?{' '}
              <button
                type="button"
                onClick={() => navigate('/admin-register')}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              >
                Admin Registration
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
