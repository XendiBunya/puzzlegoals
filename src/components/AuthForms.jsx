import { useState } from 'react';
import { authClient } from '../lib/auth.js';

export default function AuthForms({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset-sent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: err } = await authClient.signIn.email({ email, password });
      if (err) throw new Error(err.message || 'Sign in failed');
      onAuth({ id: data.user.id, email: data.user.email });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: err } = await authClient.signUp.email({
        email,
        password,
        name: name || email.split('@')[0],
      });
      if (err) throw new Error(err.message || 'Sign up failed');
      onAuth({ id: data.user.id, email: data.user.email });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await authClient.forgetPassword({ email });
      if (err) throw new Error(err.message || 'Failed to send reset email');
      setMode('reset-sent');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'reset-sent') {
    return (
      <div className="setup">
        <h2>Check your email.</h2>
        <p className="setup-lede">
          We sent a password reset link to <strong>{email}</strong>. It expires in 15 minutes.
        </p>
        <button className="btn-quiet" type="button" onClick={() => setMode('login')}>
          Back to sign in
        </button>
      </div>
    );
  }

  if (mode === 'forgot') {
    return (
      <div className="setup">
        <h2>Reset your password.</h2>
        <p className="setup-lede">Enter your email and we'll send you a link to reset your password.</p>
        <form onSubmit={handleForgotPassword}>
          <fieldset>
            <div className="f-head"><span className="eyebrow">Email</span></div>
            <input
              className="field" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email"
            />
          </fieldset>
          {error && <p className="f-hint" style={{ color: 'var(--brass)', marginBottom: '1rem' }}>{error}</p>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <p className="f-hint" style={{ marginTop: '1.5rem' }}>
          Remember your password?{' '}
          <button className="btn-quiet" type="button" style={{ display: 'inline', padding: '.2rem .5rem' }}
            onClick={() => { setMode('login'); setError(null); }}>Sign in</button>
        </p>
      </div>
    );
  }

  return (
    <div className="setup">
      <h2>{mode === 'login' ? 'Welcome back.' : 'Create an account.'}</h2>
      <p className="setup-lede">
        {mode === 'login'
          ? 'Sign in to pick up where you left off.'
          : 'Your puzzles are saved to your account across devices.'}
      </p>

      <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
        {mode === 'register' && (
          <fieldset>
            <div className="f-head"><span className="eyebrow">Name</span></div>
            <input
              className="field" type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)" autoComplete="name"
            />
          </fieldset>
        )}

        <fieldset>
          <div className="f-head"><span className="eyebrow">Email</span></div>
          <input
            className="field" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" required autoComplete="email"
          />
        </fieldset>

        <fieldset>
          <div className="f-head"><span className="eyebrow">Password</span></div>
          <input
            className="field" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? '6 characters minimum' : ''}
            required minLength={mode === 'register' ? 6 : undefined}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </fieldset>

        {error && <p className="f-hint" style={{ color: 'var(--brass)', marginBottom: '1rem' }}>{error}</p>}

        <button className="btn" type="submit" disabled={loading}>
          {loading
            ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
            : (mode === 'login' ? 'Sign in' : 'Create account')}
        </button>
      </form>

      <p className="f-hint" style={{ marginTop: '1.5rem' }}>
        {mode === 'login' ? (
          <>
            <button className="btn-quiet" type="button" style={{ display: 'inline', padding: '.2rem .5rem' }}
              onClick={() => { setMode('forgot'); setError(null); }}>Forgot password?</button>
            {' '}&middot;{' '}
            <button className="btn-quiet" type="button" style={{ display: 'inline', padding: '.2rem .5rem' }}
              onClick={() => { setMode('register'); setError(null); }}>Sign up</button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button className="btn-quiet" type="button" style={{ display: 'inline', padding: '.2rem .5rem' }}
              onClick={() => { setMode('login'); setError(null); }}>Sign in</button>
          </>
        )}
      </p>
    </div>
  );
}

/** Shown when user clicks a reset link — set route to #/reset-password?token=xxx */
export function ResetPasswordForm({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = new URLSearchParams(location.hash.split('?')[1] || '').get('token');

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await authClient.resetPassword({ newPassword: password, token });
      if (err) throw new Error(err.message || 'Reset failed');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="setup">
        <h2>Password reset.</h2>
        <p className="setup-lede">Your password has been changed. You can now sign in.</p>
        <button className="btn" type="button" onClick={onDone}>Sign in</button>
      </div>
    );
  }

  return (
    <div className="setup">
      <h2>Set a new password.</h2>
      <form onSubmit={submit}>
        <fieldset>
          <div className="f-head"><span className="eyebrow">New password</span></div>
          <input className="field" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6 characters minimum" required minLength={6}
            autoComplete="new-password" />
        </fieldset>
        <fieldset>
          <div className="f-head"><span className="eyebrow">Confirm password</span></div>
          <input className="field" type="password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password" required minLength={6}
            autoComplete="new-password" />
        </fieldset>
        {error && <p className="f-hint" style={{ color: 'var(--brass)', marginBottom: '1rem' }}>{error}</p>}
        <button className="btn" type="submit" disabled={loading || !token}>
          {loading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
