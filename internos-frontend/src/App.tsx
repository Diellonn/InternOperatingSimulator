import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import MentorDashboard from './pages/MentorDashboard';
import InternTasks from './pages/InternTasks';
import TaskManagement from './pages/TaskManagement';
import TaskDetail from './pages/TaskDetail';
import Users from './pages/Users';
import ActivityLog from './pages/ActivityLog';
import ProfileSettings from './pages/ProfileSettings';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="Admin">
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Mentor Dashboard Route */}
        <Route path="/mentor/dashboard" element={
          <ProtectedRoute requiredRole="Mentor">
            <DashboardLayout>
              <MentorDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Intern Dashboard Route */}
        <Route path="/intern/dashboard" element={
          <ProtectedRoute requiredRole="Intern">
            <DashboardLayout>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-8 rounded-xl border border-indigo-100">
                  <h2 className="text-2xl font-bold text-gray-800">Welcome to Your Dashboard</h2>
                  <p className="text-gray-600 mt-2">View your assigned tasks and track your progress</p>
                </div>
                <InternTasks />
              </div>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Task Management (Admin/Mentor) */}
        <Route path="/tasks/manage" element={
          <ProtectedRoute>
            <DashboardLayout>
              <TaskManagement />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Intern Tasks List */}
        <Route path="/intern/tasks" element={
          <ProtectedRoute>
            <DashboardLayout>
              <InternTasks />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Task Detail */}
        <Route path="/tasks/:id" element={
          <ProtectedRoute>
            <DashboardLayout>
              <TaskDetail />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Users Management (Admin Only) */}
        <Route path="/admin/users" element={
          <ProtectedRoute requiredRole="Admin">
            <DashboardLayout>
              <Users />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Activity Log */}
        <Route path="/activities" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ActivityLog />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Profile Settings */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProfileSettings />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
