import { useEffect, useState } from 'react';
import * as api from '../lib/api.js';

export default function Dashboard({ onSelect, onNew }) {
  const [goals, setGoals] = useState([]);
  const [archived, setArchived] = useState([]);
  const [tab, setTab] = useState('active'); // 'active' | 'archived'
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [active, arch] = await Promise.all([
      api.listGoals(false),
      api.listGoals(true),
    ]);
    setGoals(active.goals);
    setArchived(arch.goals);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleArchive = async (id) => {
    await api.archiveGoal(id);
    load();
  };

  const handleUnarchive = async (id) => {
    await api.unarchiveGoal(id);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this goal and its puzzle?')) return;
    await api.deleteGoal(id);
    load();
  };

  const list = tab === 'active' ? goals : archived;

  return (
    <div>
      <div className="goalbar">
        <h2>Your puzzles</h2>
        <span className="spacer" />
        <button className="btn" type="button" onClick={onNew}>New goal</button>
      </div>

      <div className="dash-tabs">
        <button
          className={`btn-quiet${tab === 'active' ? ' active-tab' : ''}`}
          type="button" onClick={() => setTab('active')}
        >
          Active ({goals.length})
        </button>
        <button
          className={`btn-quiet${tab === 'archived' ? ' active-tab' : ''}`}
          type="button" onClick={() => setTab('archived')}
        >
          Archived ({archived.length})
        </button>
      </div>

      {loading ? (
        <p className="f-hint" style={{ marginTop: '2rem' }}>Loading...</p>
      ) : list.length === 0 ? (
        <div className="dash-empty">
          <p className="f-hint">
            {tab === 'active'
              ? "No active puzzles yet. Start one!"
              : "No archived puzzles."}
          </p>
        </div>
      ) : (
        <div className="dash-grid">
          {list.map((g) => (
            <div key={g.id} className="dash-card" onClick={() => onSelect(g.id)}>
              <div className="dash-thumb">
                <img src={g.img_url} alt={g.name} />
                <div className="dash-progress">
                  <span className="mono">{Math.round((g.doneSteps / g.totalSteps) * 100)}%</span>
                </div>
              </div>
              <div className="dash-info">
                <strong>{g.name}</strong>
                <span className="f-hint">{g.doneSteps}/{g.totalSteps} steps &middot; {g.pieces} pieces</span>
              </div>
              <div className="dash-actions" onClick={(e) => e.stopPropagation()}>
                {tab === 'active' ? (
                  <button className="btn-quiet" type="button" onClick={() => handleArchive(g.id)}>Archive</button>
                ) : (
                  <button className="btn-quiet" type="button" onClick={() => handleUnarchive(g.id)}>Restore</button>
                )}
                <button className="btn-quiet" type="button" style={{ color: 'var(--brass)' }}
                  onClick={() => handleDelete(g.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
