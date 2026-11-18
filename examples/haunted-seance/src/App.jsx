import { useState } from 'react';

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
    else if (d.date < today()) e.date = 'The dead cannot travel to the past.';
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

  const spirit = SPIRITS.find((s) => s.id === data.spirit);
  const set = (k, v) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const next = () => {
    const e = validateStep(step, data);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < 2) { setDir('forward'); setStep(step + 1); }
    else setConfirming(true);
  };
  const back = () => { setDir('back'); setErrors({}); setStep(step - 1); };
  const reset = () => {
    setData({ spirit: '', date: '', time: '', name: '', email: '', phone: '' });
    setStep(0); setDone(false); setConfirming(false);
  };

  return (
    <>
      <div className="fog" aria-hidden="true"><span /><span /><span /></div>
      <div className="ghosts" aria-hidden="true">
        {[...Array(6)].map((_, i) => <span key={i} className={`ghost g${i}`}>👻</span>)}
      </div>
      <main className="container">
        <header>
          <h1 className="title">Séance Booking</h1>
          <p className="subtitle">Speak with those who have passed beyond the veil</p>
        </header>

        <section className="card">
          {done ? (
            <div className="success" role="status">
              <div className="orb">🔮</div>
              <h2>The Veil Is Parted</h2>
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
                    <span className="dot">{i < step ? '✓' : i + 1}</span>
                    <span className="label">{s}</span>
                  </li>
                ))}
              </ol>

              <div key={step} className={`panel ${dir}`}>
                {step === 0 && (
                  <fieldset>
                    <legend>Choose a spirit to summon</legend>
                    <div className="spirits">
                      {SPIRITS.map((s) => (
                        <label key={s.id} className={`spirit ${data.spirit === s.id ? 'selected' : ''}`}>
                          <input type="radio" name="spirit" value={s.id} checked={data.spirit === s.id} onChange={() => set('spirit', s.id)} />
                          <span className="icon">{s.icon}</span>
                          <span className="sname">{s.name}</span>
                          <span className="blurb">{s.blurb}</span>
                        </label>
                      ))}
                    </div>
                    {errors.spirit && <p className="error" role="alert">{errors.spirit}</p>}
                  </fieldset>
                )}

                {step === 1 && (
                  <div>
                    <div className="field">
                      <label htmlFor="date">Date</label>
                      <input id="date" type="date" min={today()} value={data.date} onChange={(e) => set('date', e.target.value)} aria-invalid={!!errors.date} />
                      {errors.date && <p className="error" role="alert">{errors.date}</p>}
                    </div>
                    <fieldset>
                      <legend>Hour of the night</legend>
                      <div className="times">
                        {TIMES.map((t) => (
                          <label key={t} className={`time ${data.time === t ? 'selected' : ''}`}>
                            <input type="radio" name="time" value={t} checked={data.time === t} onChange={() => set('time', t)} />
                            {t}
                          </label>
                        ))}
                      </div>
                      {errors.time && <p className="error" role="alert">{errors.time}</p>}
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
                        <input id={k} type={type} autoComplete={ac} value={data[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${k}-err` : undefined} />
                        {errors[k] && <p className="error" id={`${k}-err`} role="alert">{errors[k]}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="actions">
                {step > 0 ? <button className="btn ghost-btn" onClick={back}>Back</button> : <span />}
                <button className="btn" onClick={next}>{step === 2 ? 'Review & Book' : 'Continue'}</button>
              </div>
            </>
          )}
        </section>
      </main>

      {confirming && (
        <div className="overlay" onClick={() => setConfirming(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="mtitle" onClick={(e) => e.stopPropagation()}>
            <h2 id="mtitle">Confirm Your Séance</h2>
            <dl>
              <dt>Spirit</dt><dd>{spirit.icon} {spirit.name}</dd>
              <dt>When</dt><dd>{data.date} at {data.time}</dd>
              <dt>Name</dt><dd>{data.name}</dd>
              <dt>Email</dt><dd>{data.email}</dd>
              <dt>Phone</dt><dd>{data.phone}</dd>
            </dl>
            <div className="actions">
              <button className="btn ghost-btn" onClick={() => setConfirming(false)}>Go Back</button>
              <button className="btn" autoFocus onClick={() => { setConfirming(false); setDone(true); }}>Seal the Pact</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
