import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import { logLogin } from '../services/activityLogService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoggedActivity, setHasLoggedActivity] = useState(false);

  const refreshUserData = async () => {
    if (currentUser) {
      // Force refresh - the onSnapshot listener will update automatically
      return Promise.resolve();
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Use onSnapshot for real-time updates
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data() as User;
              setUserData(data);
              
              // Log login activity only once per session
              if (!hasLoggedActivity && data.status === 'approved') {
                logLogin(data.uid, data.name, data.email, data.role, data.department);
                setHasLoggedActivity(true);
              }
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching user data:', error);
            setLoading(false);
          }
        );

        // Return cleanup function
        return unsubscribeSnapshot;
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const isApproved = userData?.status === 'approved';
  const isAdmin = isApproved && (userData?.role === 'super_admin' || userData?.role === 'dept_admin');
  const isSuperAdmin = isApproved && userData?.role === 'super_admin';
  const isFaculty = isApproved && userData?.role === 'faculty';
  const isStudent = isApproved && userData?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        loading,
        isApproved,
        isAdmin,
        isSuperAdmin,
        isFaculty,
        isStudent,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
