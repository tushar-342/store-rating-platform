import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth, roleHome } from './auth';
import { ProtectedRoute, RoleProtectedRoute, Shell } from './components';
import {
  AdminDashboard,
  AdminStores,
  AdminUserDetail,
  AdminUsers,
  ChangePassword,
  CreateStore,
  CreateUser,
  Login,
  OwnerDashboard,
  OwnerRatings,
  Register,
  UserStores,
} from './pages';
import './style.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});
function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? roleHome(user.role) : '/login'} replace />;
}
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Shell />}>
          <Route path="/change-password" element={<ChangePassword />} />
          <Route element={<RoleProtectedRoute roles={['SYSTEM_ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:id" element={<AdminUserDetail />} />
            <Route path="/admin/stores" element={<AdminStores />} />
            <Route path="/admin/create-user" element={<CreateUser />} />
            <Route path="/admin/create-store" element={<CreateStore />} />
            <Route path="/admin/change-password" element={<ChangePassword />} />
          </Route>
          <Route element={<RoleProtectedRoute roles={['NORMAL_USER']} />}>
            <Route path="/user/stores" element={<UserStores />} />
            <Route path="/user/change-password" element={<ChangePassword />} />
          </Route>
          <Route element={<RoleProtectedRoute roles={['STORE_OWNER']} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/ratings" element={<OwnerRatings />} />
            <Route path="/owner/change-password" element={<ChangePassword />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
