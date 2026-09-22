import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import AuthForm from './features/auth/AuthForm';
import BoardsList from './features/boards/BoardsList';
import BoardPage from './features/boards/BoardPage';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="eyebrow">Taskio setup</p>
          <h1>Connect Supabase</h1>
          <p className="muted">
            Create a .env file in the Taskio folder and add your Supabase URL and anon key.
          </p>
          <pre className="setup-code">
{`VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_key_here`}
          </pre>
        </section>
      </main>
    );
  }

  if (loading) return <p className="status-message">Loading...</p>;

  if (!session) return <AuthForm />;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app-shell">
            <div className="topbar">
              <div>
                <p className="eyebrow">Workspace</p>
                <p className="user-email">Logged in as {session.user.email}</p>
              </div>
              <button className="button button-ghost" onClick={() => supabase.auth.signOut()}>
                Log out
              </button>
            </div>
            <BoardsList session={session} />
          </div>
        }
      />
      <Route path="/board/:boardId" element={<BoardPage />} />
    </Routes>
  );
}

export default App;
