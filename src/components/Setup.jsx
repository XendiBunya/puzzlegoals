import { useEffect, useMemo, useState } from 'react';
import { START_TEMPLATES, fitCut, tileCount, suggestTemplate } from '../lib/cuts.js';
import { builtInCovers } from '../lib/covers.js';
import { createGoal } from '../lib/goal.js';
import { uploadImage } from '../lib/api.js';

const DRAFT_KEY = 'puzzlegoals.setup-draft';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(data) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch {}
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

export default function Setup({ onCreate }) {
  const covers = useMemo(() => builtInCovers(), []);
  const saved = useMemo(() => loadDraft(), []);
  const [name, setName] = useState(saved?.name || '');
  const [steps, setSteps] = useState(saved?.steps || []);
  const [draft, setDraft] = useState('');
  const [coverIndex, setCoverIndex] = useState(saved?.coverIndex ?? 0);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [template, setTemplate] = useState(saved?.template ?? 0);
  const [pinnedTemplate, setPinned] = useState(saved?.pinnedTemplate ?? false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Auto-save draft to localStorage on changes
  useEffect(() => {
    saveDraft({ name, steps, coverIndex, template, pinnedTemplate });
  }, [name, steps, coverIndex, template, pinnedTemplate]);

  const pick = START_TEMPLATES[template];
  const fit = fitCut(pick.cols, pick.rows, steps.length);
  const p = tileCount(pick), f = tileCount(fit);
  const ready = name.trim() && steps.length >= 2 && !creating;

  const addSteps = (text) => {
    const parts = text.split('\n')
      .map((s) => s.replace(/^\s*(?:[-*\u2022]|\d+[.)])\s*/, '').trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...steps, ...parts];
    setSteps(next);
    if (!pinnedTemplate) setTemplate(suggestTemplate(next.length));
  };

  const note = !steps.length ? "Add some steps and we'll suggest a cut."
    : steps.length > f ? `${steps.length} steps is past the finest cut (${f} pieces), so some steps will share a tile.`
    : f > p ? `${steps.length} steps won't fit a ${p}-piece cut, so it starts at ${f} (${fit.cols} \u00d7 ${fit.rows}).`
    : steps.length === p ? 'One step, one piece. Clean.'
    : `Each step lays down about ${(p / steps.length).toFixed(1)} pieces. Add more steps and the cut gets finer.`;

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setCoverIndex(-1);
    // Preview
    const fr = new FileReader();
    fr.onload = () => setPhotoPreview(fr.result);
    fr.readAsDataURL(file);
  };

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      let imgUrl;
      if (photoFile) {
        // Upload user photo
        imgUrl = await uploadImage(photoFile);
      } else {
        // Upload the built-in cover so it's stored server-side
        const dataUri = covers[coverIndex < 0 ? 0 : coverIndex].url;
        const blob = await (await fetch(dataUri)).blob();
        imgUrl = await uploadImage(new File([blob], 'cover.jpg', { type: 'image/jpeg' }));
      }

      // Build the goal document using the existing pure function
      const goal = createGoal({
        name: name.trim(),
        steps,
        img: imgUrl,
        template: pick,
      });

      // Send to server. The goal from createGoal has the shape the server expects
      // but uses `img` — the server column is `img_url`
      clearDraft();
      await onCreate({
        name: goal.name,
        img_url: goal.img,
        cols: goal.cols,
        rows: goal.rows,
        seed: goal.seed,
        start_hint: goal.startHint,
        tasks: goal.tasks,
        schema_ver: goal.schema,
      });
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  return (
    <div className="setup">
      <h2>Pick something worth looking at when it&rsquo;s finished.</h2>
      <p className="setup-lede">
        Name the goal, break it into steps, and choose the picture on the box.
        Each step you finish sets another piece down.
      </p>

      <fieldset>
        <Head title="The goal" hint="one sentence, present tense" />
        <input
          className="field field-lg" aria-label="Goal" value={name}
          placeholder="Run a half marathon in May"
          onChange={(e) => setName(e.target.value)}
        />
      </fieldset>

      <fieldset>
        <Head title="The steps" hint={steps.length ? `${steps.length} step${steps.length === 1 ? '' : 's'}` : '8\u201320 works best'} />
        <ul className="steplist">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <input
                className="t" value={s} aria-label={`Step ${i + 1}`}
                onChange={(e) => setSteps(steps.map((v, j) => (j === i ? e.target.value : v)))}
              />
              <button className="x" type="button" title="Remove step"
                onClick={() => setSteps(steps.filter((_, j) => j !== i))}>&times;</button>
            </li>
          ))}
        </ul>
        <input
          className="field" aria-label="Add a step" value={draft}
          placeholder="Type a step, press Enter  \u00b7  or paste a whole list"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSteps(draft); setDraft(''); } }}
          onPaste={(e) => {
            const t = e.clipboardData.getData('text');
            if (t.includes('\n')) { e.preventDefault(); addSteps(t); setDraft(''); }
          }}
        />
      </fieldset>

      <fieldset>
        <Head title="The box top" hint="the picture you're uncovering" />
        <div className="covers">
          {covers.map((c, i) => (
            <button key={c.name} className="cover" type="button"
              aria-pressed={coverIndex === i && !photoFile}
              onClick={() => { setCoverIndex(i); setPhotoFile(null); setPhotoPreview(null); }}>
              <img src={c.url} alt={c.name} />
              <span className="cap">{c.name}</span>
            </button>
          ))}
          <label className={`cover upload${photoPreview ? ' chosen' : ''}`}>
            {photoPreview && <img src={photoPreview} alt="Your photo" className="fill" />}
            <span>Use my own photo<br /><small>the thing you actually want</small></span>
            <input type="file" accept="image/*" hidden onChange={onPhoto} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <Head title="The starting cut" hint="it gets finer on its own if you add steps" />
        <div className="cuts">
          {START_TEMPLATES.map((c, i) => (
            <button key={c.label} className="cut" type="button" aria-pressed={template === i}
              onClick={() => { setTemplate(i); setPinned(true); }}>
              <b>{tileCount(c)} pieces</b>
              <span>{c.cols} &times; {c.rows} &nbsp;&middot;&nbsp; {c.label}</span>
            </button>
          ))}
        </div>
        <p className="f-hint cut-note">{note}</p>
      </fieldset>

      {error && <p className="f-hint" style={{ color: 'var(--brass)', marginBottom: '1rem' }}>{error}</p>}

      <button className="btn" type="button" disabled={!ready} onClick={create}>
        {creating ? 'Creating...' : 'Cut the puzzle'}
      </button>
    </div>
  );
}

const Head = ({ title, hint }) => (
  <div className="f-head">
    <span className="eyebrow">{title}</span>
    <span className="f-hint">{hint}</span>
  </div>
);
