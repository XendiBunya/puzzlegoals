import { useState } from 'react';
import { authClient } from '../lib/auth.js';

export default function Account({ user, onUserChange, onLogout, onDeleted }) {
  return (
    <div className="setup">
      <h2>Account</h2>
      <p className="setup-lede">Manage your profile and password.</p>

      <UpdateName user={user} onUserChange={onUserChange} />
      <ChangePassword />
      <SignOutAll onLogout={onLogout} />
    </div>
  );
}

function UpdateName({ user, onUserChange }) {
  const [name, setName] = useState(user.name || '');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const { error } = await authClient.updateUser({ name });
      if (error) throw new Error(error.message);
      onUserChange({ ...user, name });
      setMsg({ ok: true, text: 'Name updated.' });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <fieldset>
      <div className="f-head"><span className="eyebrow">Profile</span></div>
      <form onSubmit={submit} className="account-form">
        <p className="f-hint">Email: {user.email}</p>
        <input className="field" type="text" value={name}
          onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <Msg msg={msg} />
        <button className="btn" type="submit" disabled={loading || name === (user.name || '')}>
          {loading ? 'Updating...' : 'Update name'}
        </button>
      </form>
    </fieldset>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next !== confirm) { setMsg({ ok: false, text: 'New passwords do not match.' }); return; }
    setMsg(null);
    setLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
      });
      if (error) throw new Error(error.message);
      setCurrent(''); setNext(''); setConfirm('');
      setMsg({ ok: true, text: 'Password changed.' });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <fieldset>
      <div className="f-head"><span className="eyebrow">Change password</span></div>
      <form onSubmit={submit} className="account-form">
        <input className="field" type="password" value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Current password" required autoComplete="current-password" />
        <input className="field" type="password" value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New password (6+ characters)" required minLength={6}
          autoComplete="new-password" />
        <input className="field" type="password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password" required minLength={6}
          autoComplete="new-password" />
        <Msg msg={msg} />
        <button className="btn" type="submit" disabled={loading || !current || !next || !confirm}>
          {loading ? 'Changing...' : 'Change password'}
        </button>
      </form>
    </fieldset>
  );
}

function SignOutAll({ onLogout }) {
  const [loading, setLoading] = useState(false);

  const handleSignOutAll = async () => {
    setLoading(true);
    try {
      await authClient.signOut();
      onLogout();
    } catch {
      setLoading(false);
    }
  };

  return (
    <fieldset>
      <div className="f-head"><span className="eyebrow">Sessions</span></div>
      <button className="btn-quiet" type="button" disabled={loading} onClick={handleSignOutAll}>
        {loading ? 'Signing out...' : 'Sign out everywhere'}
      </button>
    </fieldset>
  );
}

function Msg({ msg }) {
  if (!msg) return null;
  return (
    <p className="f-hint" style={{ color: msg.ok ? 'var(--accent)' : 'var(--brass)', margin: '.4rem 0' }}>
      {msg.text}
    </p>
  );
}
