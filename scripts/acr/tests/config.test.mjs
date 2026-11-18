import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readConfig } from '../config.mjs';
import { makeTempRepo, put } from './helpers.mjs';

function withConfig(content, fn) {
  const { root, cleanup } = makeTempRepo();
  try {
    const app = path.join(root, 'app');
    put(path.join(app, 'package.json'), '{"name":"app"}');
    if (content !== null) put(path.join(app, 'acr.config.json'), typeof content === 'string' ? content : JSON.stringify(content));
    return fn(app, root);
  } finally {
    cleanup();
  }
}

test('no config file gives empty defaults', () => {
  withConfig(null, (app, root) => {
    const c = readConfig(app, root);
    assert.equal(c.present, false);
    assert.equal(c.overrides.size, 0);
  });
});

test('a valid config is read', () => {
  const cfg = {
    product: { name: 'My App', description: 'Does things.' },
    criteria: {
      '1.2.1': { level: 'Not Applicable', reason: 'No media.' },
      '2.4.5': { level: 'Not Evaluated', reason: 'Single page.' },
    },
  };
  withConfig(cfg, (app, root) => {
    const c = readConfig(app, root);
    assert.deepEqual(c.product, { name: 'My App', description: 'Does things.' });
    assert.deepEqual(c.overrides.get('1.2.1'), { level: 'Not Applicable', reason: 'No media.' });
    assert.equal(c.overrides.get('2.4.5').level, 'Not Evaluated');
  });
});

test('levels other than Not Applicable and Not Evaluated are rejected', () => {
  for (const level of ['Supports', 'Partially Supports', 'Does Not Support', 'bogus']) {
    withConfig({ criteria: { '1.1.1': { level, reason: 'x' } } }, (app, root) => {
      assert.throws(() => readConfig(app, root), /criteria\["1\.1\.1"\]\.level/, level);
    });
  }
});

test('a missing or blank reason is rejected', () => {
  withConfig({ criteria: { '1.2.1': { level: 'Not Applicable' } } }, (app, root) => {
    assert.throws(() => readConfig(app, root), /criteria\["1\.2\.1"\] needs a non-empty "reason"/);
  });
  withConfig({ criteria: { '1.2.1': { level: 'Not Applicable', reason: '   ' } } }, (app, root) => {
    assert.throws(() => readConfig(app, root), /reason/);
  });
});

test('an unknown criterion (including 4.1.1 and AAA) is rejected', () => {
  for (const id of ['4.1.1', '1.4.6', '9.9.9', 'abc']) {
    withConfig({ criteria: { [id]: { level: 'Not Applicable', reason: 'x' } } }, (app, root) => {
      assert.throws(() => readConfig(app, root), new RegExp(`criteria\\["${id.replace(/\./g, '\\.')}"\\]`), id);
    });
  }
});

test('unknown fields, wrong types and malformed JSON are rejected', () => {
  withConfig({ criteria: { '1.2.1': { level: 'Not Applicable', reason: 'x', extra: 1 } } }, (app, root) => {
    assert.throws(() => readConfig(app, root), /unknown field "extra"/);
  });
  withConfig({ criteria: [] }, (app, root) => assert.throws(() => readConfig(app, root), /"criteria" must be an object/));
  withConfig({ product: { name: 3 } }, (app, root) => assert.throws(() => readConfig(app, root), /product\.name/));
  withConfig('[]', (app, root) => assert.throws(() => readConfig(app, root), /top level/));
  withConfig('{ nope', (app, root) => assert.throws(() => readConfig(app, root), /not valid JSON/));
});
