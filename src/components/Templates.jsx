import { useEffect, useState } from 'react';
import * as api from '../lib/api.js';

export default function Templates({ onBack, onUse }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    const data = await api.listTemplates();
    setTemplates(data.templates || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this template?')) return;
    await api.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUse = (e, id) => {
    e.stopPropagation();
    onUse(id);
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
            const steps = tpl.steps || [];
            const subtaskCount = steps.reduce((n, s) => n + (s.subtasks?.length || 0), 0);
            const isExpanded = expanded[tpl.id];
            const displaySteps = isExpanded ? steps : steps.slice(0, 5);
            return (
              <div key={tpl.id} className="template-card" onClick={() => toggleExpand(tpl.id)}
                style={{ cursor: 'pointer' }}>
                <div className="template-card-info">
                  <strong>{tpl.name}</strong>
                  <span className="f-hint">
                    {steps.length} steps{subtaskCount ? ` · ${subtaskCount} subtasks` : ''}
                  </span>
                  <ul className="template-steps-preview">
                    {displaySteps.map((s, i) => (
                      <li key={i}>
                        <span className="f-hint">{s.text || s}</span>
                        {isExpanded && s.subtasks?.length > 0 && (
                          <ul className="template-substeps-preview">
                            {s.subtasks.map((sub, j) => (
                              <li key={j} className="f-hint">{sub.text || sub}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                    {!isExpanded && steps.length > 5 && (
                      <li className="f-hint template-more">+{steps.length - 5} more — click to expand</li>
                    )}
                  </ul>
                </div>
                <div className="template-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-quiet" type="button" onClick={(e) => handleUse(e, tpl.id)}>Use</button>
                  <button className="btn-quiet" type="button" style={{ color: 'var(--brass)' }}
                    onClick={(e) => handleDelete(e, tpl.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
