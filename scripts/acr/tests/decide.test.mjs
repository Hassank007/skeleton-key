import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide } from '../decide.mjs';

const crit = (over = {}) => ({ tier: 'test', humanOnly: false, ...over });
const pass = (kind = 'test') => ({ result: 'pass', kind });
const fail = (kind = 'test') => ({ result: 'fail', kind });
const inc = (kind = 'test') => ({ result: 'inconclusive', kind });
const finding = (severity, open = true) => ({ severity, open });
const NA = { level: 'Not Applicable', reason: 'No media.' };
const NE = { level: 'Not Evaluated', reason: 'Later.' };

test('5.1a failing evidence plus qualifying pass is Partially Supports', () => {
  assert.equal(decide(crit(), [pass(), fail()], [], null).level, 'Partially Supports');
});

test('5.1a an open finding plus qualifying pass is Partially Supports', () => {
  assert.equal(decide(crit(), [pass()], [finding('Serious')], null).level, 'Partially Supports');
});

test('5.1b failing evidence with no pass is Does Not Support', () => {
  assert.equal(decide(crit(), [fail()], [], null).level, 'Does Not Support');
});

test('5.1b an open Critical or Serious finding with no pass is Does Not Support', () => {
  assert.equal(decide(crit(), [], [finding('Critical')], null).level, 'Does Not Support');
  assert.equal(decide(crit(), [], [finding('Serious')], null).level, 'Does Not Support');
});

test('5.1c an open Moderate or Minor finding alone is Partially Supports', () => {
  assert.equal(decide(crit(), [], [finding('Moderate')], null).level, 'Partially Supports');
  assert.equal(decide(crit(), [], [finding('Minor')], null).level, 'Partially Supports');
});

test('an axe pass does not count as qualifying for a test-tier criterion', () => {
  assert.equal(decide(crit(), [pass('axe'), fail()], [], null).level, 'Does Not Support');
});

test('5.2 a Not Applicable override gives Not Applicable', () => {
  assert.equal(decide(crit(), [], [], NA).level, 'Not Applicable');
  assert.equal(decide(crit({ humanOnly: true }), [], [], NA).level, 'Not Applicable');
});

test('7.4 a Not Applicable override is ignored when evidence fails or a finding is open', () => {
  const r = decide(crit(), [fail()], [], NA);
  assert.equal(r.level, 'Does Not Support');
  assert.equal(r.overrideIgnored, true);
  assert.equal(decide(crit(), [], [finding('Minor')], NA).overrideIgnored, true);
});

test('a fixed finding does not change the Level', () => {
  assert.equal(decide(crit(), [pass()], [finding('Serious', false)], null).level, 'Supports');
  assert.equal(decide(crit(), [], [finding('Serious', false)], null).level, 'Not Evaluated');
});

test('5.3 human-only is Not Evaluated even with passing evidence', () => {
  const r = decide(crit({ humanOnly: true }), [pass()], [], null);
  assert.equal(r.level, 'Not Evaluated');
  assert.equal(r.reasonCode, 'human-only');
});

test('5.4 an inconclusive item gives Not Evaluated, even with a pass', () => {
  const r = decide(crit(), [pass(), inc()], [], null);
  assert.equal(r.level, 'Not Evaluated');
  assert.equal(r.reasonCode, 'inconclusive');
});

test('5.5 a passing tagged test gives Supports', () => {
  assert.equal(decide(crit(), [pass()], [], null).level, 'Supports');
});

test('5.5 a passing axe rule gives Supports only for the axe tier', () => {
  assert.equal(decide(crit({ tier: 'axe' }), [pass('axe')], [], null).level, 'Supports');
  assert.equal(decide(crit({ tier: 'test' }), [pass('axe')], [], null).level, 'Not Evaluated');
});

test('5.6 no evidence gives Not Evaluated', () => {
  const r = decide(crit(), [], [], null);
  assert.equal(r.level, 'Not Evaluated');
  assert.equal(r.reasonCode, 'no-evidence');
});

test('a Not Evaluated override never raises or lowers a Level', () => {
  assert.equal(decide(crit(), [], [], NE).level, 'Not Evaluated');
  assert.equal(decide(crit(), [pass()], [], NE).level, 'Supports');
  assert.equal(decide(crit(), [fail()], [], NE).level, 'Does Not Support');
});

test('5.10 the function is deterministic and does not mutate its input', () => {
  const items = Object.freeze([Object.freeze(pass())]);
  const findings = Object.freeze([]);
  const a = decide(crit(), items, findings, null);
  const b = decide(crit(), items, findings, null);
  assert.deepEqual(a, b);
});

test('exhaustive: all 432 combinations keep REQ-5.7 and REQ-5.8', () => {
  const passes = [[], [pass('test')], [pass('axe')]];
  const fails = [[], [fail()]];
  const incs = [[], [inc()]];
  const findingSets = [[], [finding('Moderate')], [finding('Serious')]];
  const humans = [true, false];
  const tiers = ['axe', 'test'];
  const overrides = [null, NA, NE];

  let combos = 0;
  for (const p of passes)
    for (const f of fails)
      for (const i of incs)
        for (const o of findingSets)
          for (const h of humans)
            for (const t of tiers)
              for (const ov of overrides) {
                combos++;
                const c = crit({ tier: t, humanOnly: h });
                const items = [...p, ...f, ...i];
                const r = decide(c, items, o, ov);
                const label = JSON.stringify({ p, f, i, o, h, t, ov });
                const qualifying = p.some((x) => x.kind === 'test' || (x.kind === 'axe' && t === 'axe'));
                const blocked = f.length > 0 || i.length > 0 || o.length > 0 || h || ov?.level === 'Not Applicable';

                if (r.level === 'Supports') {
                  assert.ok(qualifying, `Supports without qualifying evidence: ${label}`);
                  assert.ok(!blocked, `Supports while blocked: ${label}`);
                }
                if (qualifying && !blocked) assert.equal(r.level, 'Supports', label);
                if (r.level === 'Not Applicable') {
                  assert.equal(ov?.level, 'Not Applicable', `NA without override: ${label}`);
                  assert.ok(ov.reason, label);
                  assert.ok(f.length === 0 && o.length === 0, `NA over a blocker: ${label}`);
                }
                if (ov?.level === 'Not Applicable' && f.length === 0 && o.length === 0) {
                  assert.equal(r.level, 'Not Applicable', label);
                }
                if (f.length > 0 || o.length > 0) {
                  assert.ok(['Partially Supports', 'Does Not Support'].includes(r.level), label);
                  assert.equal(r.overrideIgnored, ov?.level === 'Not Applicable', label);
                  if (qualifying) assert.equal(r.level, 'Partially Supports', label);
                  else if (f.length > 0 || o.some((x) => x.severity === 'Serious')) assert.equal(r.level, 'Does Not Support', label);
                  else assert.equal(r.level, 'Partially Supports', label);
                } else {
                  assert.equal(r.overrideIgnored, false, label);
                }
                if (h && f.length === 0 && o.length === 0 && ov?.level !== 'Not Applicable') {
                  assert.equal(r.level, 'Not Evaluated', label);
                }
              }
  assert.equal(combos, 432);
});
