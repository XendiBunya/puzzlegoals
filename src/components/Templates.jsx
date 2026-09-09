import { useEffect, useState } from 'react';
import * as api from '../lib/api.js';

export default function Templates({ onBack, onUse }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await api.listTemplates();
    setTemplates(data.templates || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    await api.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div>
      <div className="goalbar">
        <h2>Your templates</h2>
        <span className="spacer" />
        <button className="btn-quiet" type="button" onClick={onBack}>&larr; Back to puzzles</button>
      </div>

      {loading ? (
        <p className="f-hint" style={{ marginTop: '2rem' }}>Loading...</p>
      ) : templates.length === 0 ? (
        <div className="dash-empty">
          <p className="f-hint">No templates yet. Save one from any puzzle page.</p>
        </div>
      ) : (
        <div className="template-grid">
          {templates.map((tpl) => {
            const subtaskCount = (tpl.steps || []).reduce((n, s) => n + (s.subtasks?.length || 0), 0);
            return (
              <div key={tpl.id} className="template-card">
                <div className="template-card-info">
                  <strong>{tpl.name}</strong>
                  <span className="f-hint">
                    {(tpl.steps || []).length} steps{subtaskCount ? ` · ${subtaskCount} subtasks` : ''}
                  </span>
                  <ul className="template-steps-preview">
                    {(tpl.steps || []).slice(0, 5).map((s, i) => (
                      <li key={i} className="f-hint">{s.text || s}</li>
                    ))}
                    {(tpl.steps || []).length > 5 && (
                      <li className="f-hint">+{(tpl.steps || []).length - 5} more</li>
                    )}
                  </ul>
                </div>
                <div className="template-card-actions">
                  <button className="btn-quiet" type="button" onClick={() => onUse(tpl.id)}>Use</button>
                  <button className="btn-quiet" type="button" style={{ color: 'var(--brass)' }}
                    onClick={() => handleDelete(tpl.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
