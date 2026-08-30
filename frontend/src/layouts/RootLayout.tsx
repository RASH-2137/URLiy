
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export function RootLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-brand-600">URLiy</Link>
          <nav className="flex gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard"><Button variant="primary">Dashboard</Button></Link>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost">Log in</Button></Link>
                <Link to="/signup"><Button variant="primary">Sign up</Button></Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
