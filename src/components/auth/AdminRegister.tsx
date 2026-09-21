import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../config/firebase';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { FileUpload } from '../common/FileUpload';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateIdCard,
  validatePasswordMatch,
} from '../../utils/validation';
import { DEPARTMENTS } from '../../utils/constants';
import { ShieldCheck } from 'lucide-react';

interface AdminRegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'faculty' | 'dept_admin' | 'super_admin';
  department: string;
  idCard: File | null;
}

export const AdminRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AdminRegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'faculty',
    department: '',
    idCard: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AdminRegisterFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, idCard: file }));
    setErrors((prev) => ({ ...prev, idCard: '' }));
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const validate = async (): Promise<boolean> => {
    const newErrors: Partial<Record<keyof AdminRegisterFormData, string>> = {};

    // Name validation
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    } else {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        newErrors.email = 'Email already registered';
      }
    }

    // Password validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    // Confirm password validation
    const confirmPasswordError = validatePasswordMatch(
      formData.password,
      formData.confirmPassword
    );
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    // Department validation
    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }

    // ID Card validation
    const idCardError = validateIdCard(formData.idCard);
    if (idCardError) newErrors.idCard = idCardError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    const isValid = await validate();
    if (!isValid) return;

    setLoading(true);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Upload ID card
      const idCardRef = ref(storage, `id_cards/${user.uid}/${formData.idCard!.name}`);
      await uploadBytes(idCardRef, formData.idCard!);
      const idCardUrl = await getDownloadURL(idCardRef);

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        rollNumber: '', // No roll number for admin/faculty
        idCardUrl,
        profilePicUrl: '',
        status: 'pending', // Requires super admin approval
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Sign out immediately after registration
      await auth.signOut();

      // Redirect to pending approval page
      navigate('/pending-approval');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setGeneralError('Email is already registered');
      } else if (error.code === 'auth/weak-password') {
        setGeneralError('Password is too weak');
      } else {
        setGeneralError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin/Faculty Registration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your admin or faculty account
          </p>
        </div>

        {generalError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{generalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter your full name"
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="faculty">Faculty</option>
              <option value="dept_admin">Department Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select your role type
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${errors.department ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white max-h-40 overflow-y-auto`}
              required
            >
              <option value="">Select Department</option>
              <option value="Administration - All Departments Supervisor">Administration - All Departments Supervisor</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="mt-1 text-sm text-red-500">{errors.department}</p>
            )}
            {!errors.department && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select your department
              </p>
            )}
          </div>

          <FileUpload
            label="ID Card"
            onChange={handleFileChange}
            error={errors.idCard}
            accept="image/*,.pdf"
            helperText="Upload your official ID card (Max 5MB)"
          />

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Your registration will be reviewed by the super administrator. 
              You will receive notification once your account is approved.
            </p>
          </div>

          <Button type="submit" isLoading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Sign in
            </Link>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you a student?{' '}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Student Registration
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
