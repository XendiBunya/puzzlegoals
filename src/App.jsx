import { useCallback, useEffect, useState } from 'react';
import AuthForms, { ResetPasswordForm } from './components/AuthForms.jsx';
import Dashboard from './components/Dashboard.jsx';
import Setup from './components/Setup.jsx';
import Board from './components/Board.jsx';
import Account from './components/Account.jsx';
import { useGoalSync } from './hooks/useGoalSync.js';
import { authClient } from './lib/auth.js';
import * as api from './lib/api.js';

// Simple hash-based routing
function useRoute() {
  const [hash, setHash] = useState(location.hash || '#/');
  useEffect(() => {
    const onChange = () => setHash(location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

function navigate(path) {
  location.hash = path;
}

export default function App() {
  const route = useRoute();
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in
  const [goalData, setGoalData] = useState(null);
  const [loadingGoal, setLoadingGoal] = useState(false);

  // Check Neon Auth session on mount
  useEffect(() => {
    authClient.getSession().then(({ data, error }) => {
      if (data?.user) {
        setUser({ id: data.user.id, email: data.user.email, name: data.user.name });
      } else {
        setUser(null);
        if (!location.hash.startsWith('#/reset-password')) navigate('#/auth');
      }
    }).catch(() => {
      setUser(null);
      if (!location.hash.startsWith('#/reset-password')) navigate('#/auth');
    });
  }, []);

  // Load goal when route changes to #/goal/:id
  useEffect(() => {
    const match = route.match(/^#\/goal\/(.+)$/);
    if (!match || !user) { setGoalData(null); return; }
    setLoadingGoal(true);
    api.getGoal(match[1])
      .then(({ goal }) => setGoalData(goal))
      .catch(() => { setGoalData(null); navigate('#/'); })
      .finally(() => setLoadingGoal(false));
  }, [route, user]);

  const handleAuth = (u) => {
    setUser(u);
    navigate('#/');
  };

  const handleLogout = async () => {
    await authClient.signOut();
    setUser(null);
    navigate('#/auth');
  };

  const handleCreate = useCallback(async (payload) => {
    const { goal } = await api.createGoal(payload);
    navigate(`#/goal/${goal.id}`);
  }, []);

  // Determine screen
  let screen;
  if (user === undefined) {
    screen = <p className="f-hint" style={{ marginTop: '3rem', textAlign: 'center' }}>Loading...</p>;
  } else if (route.startsWith('#/reset-password')) {
    screen = <ResetPasswordForm onDone={() => navigate('#/auth')} />;
  } else if (!user || route === '#/auth') {
    screen = <AuthForms onAuth={handleAuth} />;
  } else if (route === '#/account') {
    screen = <Account user={user} onUserChange={setUser} onLogout={handleLogout} />;
  } else if (route === '#/new') {
    screen = <Setup onCreate={handleCreate} />;
  } else if (route.startsWith('#/goal/') && goalData) {
    screen = <GoalBoard goal={goalData} />;
  } else if (route.startsWith('#/goal/') && loadingGoal) {
    screen = <p className="f-hint" style={{ marginTop: '3rem', textAlign: 'center' }}>Loading puzzle...</p>;
  } else {
    screen = <Dashboard onSelect={(id) => navigate(`#/goal/${id}`)} onNew={() => navigate('#/new')} />;
  }

  return (
    <div className="wrap">
      <header className="masthead">
        <svg className="mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 3h7c0 1.6 1 1.6 1 2.6S10 7 10 8.6h4C14 7 13 7 13 5.6S14 4.6 14 3h7v7c-1.6 0-1.6 1-2.6 1s-1.6-1-1.6.4v4c1.6 0 1.6-1 2.6-1s1.6 1 1.6 2.6v3H3z"
            stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <h1 style={{ cursor: user ? 'pointer' : undefined }} onClick={() => user && navigate('#/')}>PuzzleGoals</h1>
        <span className="tag">a goal is a puzzle, cut into steps</span>
        <span className="spacer" />
        {user && (
          <>
            <button className="btn-quiet" type="button" onClick={() => navigate('#/account')}>
              {user.name || user.email}
            </button>
            <button className="btn-quiet" type="button" onClick={handleLogout}>Log out</button>
          </>
        )}
      </header>
      <main>{screen}</main>
      <footer className="build-info">
        <a href="/faq" target="_blank" rel="noopener">FAQ</a>
        <span className="spacer" />
        {__BUILD_INFO__.commit} &middot; {new Date(__BUILD_INFO__.built).toLocaleString()}
      </footer>
    </div>
  );
}

/** Wrapper that sets up the sync hook for a loaded goal */
function GoalBoard({ goal: initial }) {
  const { goal, dispatch, error } = useGoalSync(initial);

  const isArchived = !!goal?.archived_at;

  const handleToggleArchive = async () => {
    if (isArchived) await api.unarchiveGoal(goal.id);
    else await api.archiveGoal(goal.id);
    navigate('#/');
  };

  if (!goal) return null;

  return (
    <>
      <Board goal={goal} dispatch={dispatch} />
      {error && <p className="f-hint" style={{ color: 'var(--brass)', marginTop: '.5rem' }}>{error}</p>}
      <div className="footnote">
        <button className="btn-quiet" type="button" onClick={() => navigate('#/')}>Back to puzzles</button>
        <span className="spacer" />
        <button className="btn-quiet" type="button" onClick={handleToggleArchive}>
          {isArchived ? 'Restore this goal' : 'Archive this goal'}
        </button>
      </div>
    </>
  );
}
