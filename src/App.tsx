import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { AdminRegister } from './components/auth/AdminRegister';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { NotificationsPage } from './pages/NotificationsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ProfilePage } from './pages/ProfilePage';
import { ActivityPage } from './pages/ActivityPage';
import { AdminLogsPage } from './pages/AdminLogsPage';
import { PendingApproval } from './pages/PendingApproval';
import { VerificationDashboard } from './components/admin/VerificationDashboard';
import { ChatbotWidget } from './components/chatbot/ChatbotWidget';

function ChatbotWrapper() {
  const location = useLocation();
  const authPages = ['/login', '/register', '/admin-register', '/pending-approval'];
  const shouldShowChatbot = !authPages.includes(location.pathname);

  return shouldShowChatbot ? <ChatbotWidget /> : null;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-register" element={<AdminRegister />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NotificationsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/resources"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ResourcesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FeedbackPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/activity"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ActivityPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/verification"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <VerificationDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminLogsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          <ChatbotWrapper />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
