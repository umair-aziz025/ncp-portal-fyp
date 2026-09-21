import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../config/firebase';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { FileUpload } from '../common/FileUpload';
import { DEPARTMENTS } from '../../utils/constants';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateRollNumber,
  validateDepartment,
  validateIdCard,
  validatePasswordMatch,
} from '../../utils/validation';
import { RegisterFormData } from '../../types';
import { GraduationCap } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    rollNumber: '',
    idCard: null,
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, idCard: file }));
    setErrors((prev) => ({ ...prev, idCard: null }));
  };

  const checkRollNumberExists = async (rollNumber: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('rollNumber', '==', rollNumber.toUpperCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking roll number:', error);
      return false;
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Partial<RegisterFormData> = {};

    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const passwordMatchError = validatePasswordMatch(
      formData.password,
      formData.confirmPassword
    );
    if (passwordMatchError) newErrors.confirmPassword = passwordMatchError;

    const departmentError = validateDepartment(formData.department);
    if (departmentError) newErrors.department = departmentError;

    const rollNumberError = validateRollNumber(formData.rollNumber);
    if (rollNumberError) {
      newErrors.rollNumber = rollNumberError;
    } else {
      // Check for duplicate roll number
      const rollNumberExists = await checkRollNumberExists(formData.rollNumber);
      if (rollNumberExists) {
        newErrors.rollNumber = 'This roll number is already registered';
      }
    }

    const idCardError = validateIdCard(formData.idCard);
    if (idCardError) newErrors.idCard = idCardError as any;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!(await validateForm())) return;

    setLoading(true);

    try {
      // Double-check roll number uniqueness before creating auth user
      const rollNumberExists = await checkRollNumberExists(formData.rollNumber);
      if (rollNumberExists) {
        setErrors(prev => ({ ...prev, rollNumber: 'This roll number is already registered' }));
        setGeneralError('This roll number is already registered. Please use a unique roll number.');
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      const idCardFile = formData.idCard!;
      const timestamp = Date.now();
      const idCardPath = `id_cards/${user.uid}/${timestamp}_${idCardFile.name}`;
      const idCardRef = ref(storage, idCardPath);

      await uploadBytes(idCardRef, idCardFile);
      const idCardUrl = await getDownloadURL(idCardRef);

      // Final check before writing to Firestore
      const finalRollNumberCheck = await checkRollNumberExists(formData.rollNumber);
      if (finalRollNumberCheck) {
        // Roll number was taken during registration process, delete the auth user
        await user.delete();
        setErrors(prev => ({ ...prev, rollNumber: 'This roll number is already registered' }));
        setGeneralError('This roll number was just registered by another user. Please try again with a different roll number.');
        setLoading(false);
        return;
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        department: formData.department,
        rollNumber: formData.rollNumber.toUpperCase(),
        role: 'student',
        status: 'pending',
        idCardUrl,
        profilePicUrl: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: null,
      });

      navigate('/pending-approval');
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.code === 'auth/email-already-in-use') {
        setGeneralError('This email is already registered. Please login instead.');
      } else if (error.code === 'auth/invalid-email') {
        setGeneralError('Invalid email address.');
      } else if (error.code === 'auth/weak-password') {
        setGeneralError('Password is too weak. Please use a stronger password.');
      } else {
        setGeneralError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Register for the University NCP Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="John Doe"
            required
          />

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Min. 6 characters"
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Re-enter password"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                  ${
                    errors.department
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                style={{ maxHeight: '200px' }}
                required
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.department}
                </p>
              )}
            </div>

            <Input
              label="Roll Number"
              name="rollNumber"
              type="text"
              value={formData.rollNumber}
              onChange={handleChange}
              error={errors.rollNumber}
              placeholder="FA23-BIT-053"
              helperText="Format: FA23-BIT-053"
              required
            />
          </div>

          <FileUpload
            label="Student ID Card"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            error={errors.idCard as any}
            helperText="Upload a clear photo of your student ID card (Max 10MB)"
            preview
          />

          {generalError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{generalError}</p>
            </div>
          )}

          <Button type="submit" fullWidth isLoading={loading}>
            Register
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Login here
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
