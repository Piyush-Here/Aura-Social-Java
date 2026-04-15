import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { AuthForm } from './components/AuthForm';
import { FeedPage } from './components/FeedPage';
import { MessagesPage } from './components/MessagesPage';
import { Navbar } from './components/Navbar';
import { ProfilePage } from './components/ProfilePage';
import { SearchPage } from './components/SearchPage';

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="screen-center">
        <div className="loading-mark">Aura</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user && <Navbar />}
      <div className={user ? 'page-shell with-nav' : 'page-shell'}>
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthForm />} />
          <Route path="/" element={user ? <FeedPage /> : <Navigate to="/auth" replace />} />
          <Route path="/search" element={user ? <SearchPage /> : <Navigate to="/auth" replace />} />
          <Route
            path="/messages"
            element={user ? <MessagesPage /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/messages/:username"
            element={user ? <MessagesPage /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/profile/:username"
            element={user ? <ProfilePage /> : <Navigate to="/auth" replace />}
          />
          <Route path="*" element={<Navigate to={user ? '/' : '/auth'} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
