import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import TaskDetail from './pages/TaskDetail';
import AdminPanel from './pages/AdminPanel';
import TeamsPage from './pages/TeamsPage';
import TasksPage from './pages/TasksPage';
import { type ReactNode } from 'react';
import Layout from './components/Layout';

const queryClient = new QueryClient();

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/teams" element={<PrivateRoute><Layout><TeamsPage /></Layout></PrivateRoute>} />
      <Route path="/tasks" element={<PrivateRoute><Layout><TasksPage /></Layout></PrivateRoute>} />
      <Route path="/task/:taskId" element={<PrivateRoute><Layout><TaskDetail /></Layout></PrivateRoute>} />
      
      <Route 
        path="/admin" 
        element={
          <PrivateRoute>
            <Layout>
            {user?.role === 'ADMIN' ? <AdminPanel /> : <Navigate to="/" />}
            </Layout>
          </PrivateRoute>
        } 
      />

      <Route path="*" element={<Layout><Navigate to="/" /></Layout>} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="bottom-right" />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}