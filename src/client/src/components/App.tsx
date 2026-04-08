import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthForm } from './components/AuthForm';
import { FeedPage } from './pages/FeedPage';
import { ProfilePage } from './pages/ProfilePage';
import { MessagesPage } from './pages/MessagesPage';
import { SearchPage } from './pages/SearchPage';

// Wraps any route that requires the user to be logged in
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const Loader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', fontSize: 13, color: '#888', letterSpacing: '0.1em'
  }}>
    AURA
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <BrowserRouter>
      {user && <Navbar />}
      <div style={{ paddingTop: user ? '64px' : '0' }}>
        <Routes>
          <Route path="/auth" element={
            user ? <Navigate to="/" replace /> : <AuthForm />
          } />
          <Route path="/" element={
            <ProtectedRoute><FeedPage /></ProtectedRoute>
          } />
          <Route path="/profile/:uid" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute><MessagesPage /></ProtectedRoute>
          } />
          <Route path="/messages/:recipientId" element={
            <ProtectedRoute><MessagesPage /></ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute><SearchPage /></ProtectedRoute>
          } />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
