import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">Taskio</p>
        <h1>{isSignUp ? 'Create your workspace' : 'Welcome back'}</h1>
        <p className="muted">
          Plan projects, organize lists, and keep every task moving in one calm board.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button className="button button-primary" disabled={loading} type="submit">
            {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Log in'}
          </button>
        </form>

        <button className="text-button" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </section>
    </main>
  );
}

export default AuthForm;
