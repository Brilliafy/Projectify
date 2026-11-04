import { lazy, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const TaskDetail = lazy(() => import('./pages/TaskDetail'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
    },
  },
});

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const RouteLoading = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <span className="loading loading-spinner loading-lg text-primary"></span>
  </div>
);

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <PrivateRoute>
              <Layout>
                <TeamsPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <Layout>
                <TasksPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/task/:taskId"
          element={
            <PrivateRoute>
              <Layout>
                <TaskDetail />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Layout>
                {user?.role === 'ADMIN' ? <AdminPanel /> : <Navigate to="/dashboard" replace />}
              </Layout>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
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