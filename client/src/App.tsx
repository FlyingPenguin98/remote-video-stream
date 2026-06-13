import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/auth';
import { getMe } from './api/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Movies } from './pages/Movies';
import { Shows } from './pages/Shows';
import { ShowDetail } from './pages/ShowDetail';
import { Player } from './pages/Player';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { token, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    getMe()
      .then((user) => setAuth(token, user))
      .catch(() => clearAuth());
  }, []);

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthLoader>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/shows" element={<Shows />} />
              <Route path="/shows/:id" element={<ShowDetail />} />
              <Route path="/player/:type/:id" element={<Player />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthLoader>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
