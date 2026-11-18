import { useEffect, useRef, useState } from 'react';

const SPIRITS = [
  { id: 'victorian', name: 'The Weeping Bride', icon: '👰', blurb: 'A Victorian bride who still waits at the altar.' },
  { id: 'captain', name: 'Captain Blackwater', icon: '🏴‍☠️', blurb: 'A drowned sea captain with tales of lost gold.' },
  { id: 'child', name: 'Little Eliza', icon: '🧸', blurb: 'A playful child spirit who loves to knock on walls.' },
  { id: 'monk', name: 'Brother Ambrose', icon: '🕯️', blurb: 'A silent monk who guards forbidden secrets.' },
];

const TIMES = ['21:00', '22:00', '23:00', '00:00', '01:00', '03:00'];
const STEPS = ['Spirit', 'Date & Time', 'Your Details'];

const today = () => new Date().toISOString().slice(0, 10);

function validateStep(step, d) {
  const e = {};
  if (step === 0 && !d.spirit) e.spirit = 'Choose a spirit to summon.';
  if (step === 1) {
    if (!d.date) e.date = 'Pick a date.';
    else if (d.date < today()) e.date = 'The dead cannot travel to the past. Pick today or a later date.';
    if (!d.time) e.time = 'Pick an hour.';
  }
  if (step === 2) {
    if (!d.name.trim()) e.name = 'Name is required.';
    else if (d.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    if (!d.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = 'Enter a valid email address.';
    if (!d.phone.trim()) e.phone = 'Phone is required.';
    else if (!/^\+?[\d\s\-()]{7,20}$/.test(d.phone.trim()) || d.phone.replace(/\D/g, '').length < 7)
      e.phone = 'Enter a valid phone number (7+ digits).';
  }
  return e;
}

export default function App() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ spirit: '', date: '', time: '', name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [dir, setDir] = useState('forward');
  const [announcement, setAnnouncement] = useState('');
  const [errorSeq, setErrorSeq] = useState(0);
  const [paused, setPaused] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const interacted = useRef(false);
  const headingRef = useRef(null);
  const summaryRef = useRef(null);
  const reviewBtnRef = useRef(null);
  const dialogRef = useRef(null);
  const sealRef = useRef(null);

  // 2.2.2 / 2.3.3: user-controlled pause for all decorative motion.
  useEffect(() => {
    document.documentElement.dataset.motion = paused ? 'paused' : 'full';
  }, [paused]);

  // 2.4.2: unique title per step / state.
  useEffect(() => {
    document.title = done
      ? 'Séance booked - Séance Booking'
      : `Step ${step + 1} of ${STEPS.length}: ${STEPS[step]} - Séance Booking`;
  }, [step, done]);

  // 2.4.3: after a step change or success, move focus to that view's heading.
  useEffect(() => {
    if (interacted.current && !confirming) headingRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, done]);

  // 3.3.1: after a failed submit, move focus to the error summary.
  useEffect(() => {
    if (errorSeq > 0) summaryRef.current?.focus();
  }, [errorSeq]);

  // Native modal dialog: traps Tab, closes on Escape, inerts the page behind it.
  useEffect(() => {
    if (!confirming) return undefined;
    const dlg = dialogRef.current;
    if (dlg && !dlg.open) { dlg.showModal(); sealRef.current?.focus(); }
    return undefined;
  }, [confirming]);

  const closeDialog = (restoreFocus) => {
    setConfirming(false);
    if (restoreFocus) setTimeout(() => reviewBtnRef.current?.focus(), 0);
  };

  const focusField = (id) => (ev) => {
    ev.preventDefault();
    document.getElementById(id)?.focus();
  };
  const fieldId = {
    spirit: `spirit-${SPIRITS[0].id}`,
    date: 'date',
    time: `time-${TIMES[0].replace(':', '')}`,
    name: 'name',
    email: 'email',
    phone: 'phone',
  };
  const errorList = Object.entries(errors).filter(([, m]) => m);

  const spirit = SPIRITS.find((s) => s.id === data.spirit);
  const set = (k, v) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const next = () => {
    interacted.current = true;
    const e = validateStep(step, data);
    setErrors(e);
    if (Object.keys(e).length) { setErrorSeq((n) => n + 1); return; }
    if (step < 2) { setDir('forward'); setStep(step + 1); }
    else setConfirming(true);
  };
  const back = () => { interacted.current = true; setDir('back'); setErrors({}); setStep(step - 1); };
  const reset = () => {
    interacted.current = true;
    setData({ spirit: '', date: '', time: '', name: '', email: '', phone: '' });
    setStep(0); setDone(false); setConfirming(false); setAnnouncement('');
  };
  const seal = () => {
    interacted.current = true;
    setConfirming(false);
    setDone(true);
    setAnnouncement('Your séance is booked.');
  };

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
      <div className="fog" aria-hidden="true"><span /><span /><span /></div>
      <div className="ghosts" aria-hidden="true">
        {[...Array(6)].map((_, i) => <span key={i} className={`ghost g${i}`}>👻</span>)}
      </div>
      <main className="container" id="main" tabIndex={-1}>
        <header>
          <h1 className="title">Séance Booking</h1>
          <p className="subtitle">Speak with those who have passed beyond the veil</p>
          <button type="button" className="btn ghost-btn motion-toggle" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
            Pause animations
          </button>
        </header>

        <section className="card" aria-label="Séance booking">
          {done ? (
            <div className="success">
              <div className="orb" aria-hidden="true">🔮</div>
              <h2 ref={headingRef} tabIndex={-1}>The Veil Is Parted</h2>
              <p>
                Your séance with <strong>{spirit.name}</strong> is booked for{' '}
                <strong>{data.date}</strong> at <strong>{data.time}</strong>.
              </p>
              <p className="muted">A confirmation will be whispered to {data.email}.</p>
              <button className="btn" onClick={reset}>Book Another Séance</button>
            </div>
          ) : (
            <>
              <ol className="steps" aria-label="Progress">
                {STEPS.map((s, i) => (
                  <li key={s} className={i === step ? 'active' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
                    <span className="dot" aria-hidden="true">{i < step ? '✓' : i + 1}</span>
                    <span className="label">{s}{i < step && <span className="sr-only"> (completed)</span>}</span>
                  </li>
                ))}
              </ol>

              {errorList.length > 0 && (
                <div className="error-summary" ref={summaryRef} tabIndex={-1} role="group" aria-labelledby="err-summary-title">
                  <h2 id="err-summary-title">There {errorList.length === 1 ? 'is a problem' : 'are problems'} with this step</h2>
                  <ul>
                    {errorList.map(([k, m]) => (
                      <li key={k}><a href={`#${fieldId[k]}`} onClick={focusField(fieldId[k])}>{m}</a></li>
                    ))}
                  </ul>
                </div>
              )}

              <div key={step} className={`panel ${dir}`}>
                <h2 className="sr-only" ref={headingRef} tabIndex={-1}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</h2>
                {step === 0 && (
                  <fieldset aria-describedby={errors.spirit ? 'spirit-err' : undefined}>
                    <legend>Choose a spirit to summon</legend>
                    <div className="spirits">
                      {SPIRITS.map((s) => (
                        <label key={s.id} className={`spirit ${data.spirit === s.id ? 'selected' : ''}`}>
                          <input id={`spirit-${s.id}`} type="radio" name="spirit" value={s.id} checked={data.spirit === s.id} onChange={() => set('spirit', s.id)} />
                          <span className="icon" aria-hidden="true">{s.icon}</span>
                          <span className="sname">{s.name}</span>
                          <span className="blurb">{s.blurb}</span>
                        </label>
                      ))}
                    </div>
                    {errors.spirit && <p className="error" id="spirit-err">{errors.spirit}</p>}
                  </fieldset>
                )}

                {step === 1 && (
                  <div>
                    <div className="field">
                      <label htmlFor="date">Date</label>
                      <input id="date" type="date" min={today()} value={data.date} onChange={(e) => set('date', e.target.value)} aria-invalid={errors.date ? 'true' : undefined} aria-describedby={errors.date ? 'date-err' : undefined} />
                      {errors.date && <p className="error" id="date-err">{errors.date}</p>}
                    </div>
                    <fieldset aria-describedby={errors.time ? 'time-err' : undefined}>
                      <legend>Hour of the night</legend>
                      <div className="times">
                        {TIMES.map((t) => (
                          <label key={t} className={`time ${data.time === t ? 'selected' : ''}`}>
                            <input id={`time-${t.replace(':', '')}`} type="radio" name="time" value={t} checked={data.time === t} onChange={() => set('time', t)} />
                            {t}
                          </label>
                        ))}
                      </div>
                      {errors.time && <p className="error" id="time-err">{errors.time}</p>}
                    </fieldset>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    {[
                      ['name', 'Full name', 'text', 'name'],
                      ['email', 'Email', 'email', 'email'],
                      ['phone', 'Phone', 'tel', 'tel'],
                    ].map(([k, label, type, ac]) => (
                      <div className="field" key={k}>
                        <label htmlFor={k}>{label}</label>
                        <input id={k} type={type} autoComplete={ac} value={data[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={errors[k] ? 'true' : undefined} aria-describedby={errors[k] ? `${k}-err` : undefined} />
                        {errors[k] && <p className="error" id={`${k}-err`}>{errors[k]}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="actions">
                {step > 0 ? <button className="btn ghost-btn" onClick={back}>Back</button> : <span />}
                <button className="btn" ref={reviewBtnRef} onClick={next}>{step === 2 ? 'Review & Book' : 'Continue'}</button>
              </div>
            </>
          )}
        </section>
      </main>

      {confirming && (
        <dialog
          ref={dialogRef}
          className="overlay"
          aria-labelledby="mtitle"
          onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
          onClose={() => closeDialog(true)}
        >
          <div className="modal">
            <h2 id="mtitle">Confirm Your Séance</h2>
            <dl>
              <dt>Spirit</dt><dd><span aria-hidden="true">{spirit.icon}</span> {spirit.name}</dd>
              <dt>When</dt><dd>{data.date} at {data.time}</dd>
              <dt>Name</dt><dd>{data.name}</dd>
              <dt>Email</dt><dd>{data.email}</dd>
              <dt>Phone</dt><dd>{data.phone}</dd>
            </dl>
            <div className="actions">
              <button className="btn ghost-btn" onClick={() => dialogRef.current.close()}>Go Back</button>
              <button className="btn" ref={sealRef} onClick={seal}>Seal the Pact</button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
