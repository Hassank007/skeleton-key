import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { run, parseArgs, isValidDate } from '../../acr.mjs';
import { copyFixture, makeTempRepo, put, REAL_REPO_ROOT } from './helpers.mjs';

/** Run the CLI in-process against a temporary repository; always cleans up. */
function withRepo(setup, fn) {
  const { root, cleanup } = makeTempRepo();
  try {
    setup?.(root);
    const out = [];
    const err = [];
    const code = (argv, extra = {}) =>
      run(argv, { cwd: root, repoRoot: root, stdout: (s) => out.push(s), stderr: (s) => err.push(s), ...extra });
    return fn({ root, out, err, code });
  } finally {
    cleanup();
  }
}

const withApp = (root) => copyFixture('evidence-app', path.join(root, 'app'));

test('success: writes ACR.md, prints one summary line, exits 0 even with failing rows', () => {
  withRepo(withApp, ({ root, out, err, code }) => {
    assert.equal(code(['app', '--date', '2025-01-01']), 0);
    assert.ok(fs.existsSync(path.join(root, 'app', 'ACR.md')));
    assert.equal(out.length, 1);
    assert.match(out[0], /^Wrote app[\\/]ACR\.md: Supports \d+, Partially Supports \d+, Does Not Support \d+, Not Applicable \d+, Not Evaluated \d+$/);
    assert.ok(err.some((w) => w.startsWith('Warning: Unknown criterion "9.9.9"')), 'warnings are printed');
    assert.match(fs.readFileSync(path.join(root, 'app', 'ACR.md'), 'utf8'), /\*\*Report date:\*\* 2025-01-01/);
  });
});

test('no folder: usage on stderr, exit 1', () => {
  withRepo(null, ({ err, code }) => {
    assert.equal(code([]), 1);
    assert.match(err[0], /^Usage: node scripts\/acr\.mjs/);
  });
});

test('missing folder: error names the folder, exit 1, nothing written', () => {
  withRepo(null, ({ root, err, code }) => {
    assert.equal(code(['nope']), 1);
    assert.match(err[0], /nope.*not found/i);
    assert.deepEqual(fs.readdirSync(root), []);
  });
});

test('folder without package.json: exit 1 and no ACR.md', () => {
  withRepo(
    (root) => fs.mkdirSync(path.join(root, 'bare')),
    ({ root, err, code }) => {
      assert.equal(code(['bare']), 1);
      assert.match(err[0], /bare.*No package\.json/);
      assert.ok(!fs.existsSync(path.join(root, 'bare', 'ACR.md')));
    },
  );
});

test('bad date: exit 1 and the value is named', () => {
  withRepo(withApp, ({ err, code }) => {
    for (const bad of ['2025-02-30', '25-01-01', 'today', '2025-13-01']) {
      err.length = 0;
      assert.equal(code(['app', '--date', bad]), 1, bad);
      assert.ok(err[0].includes(bad), bad);
    }
    err.length = 0;
    assert.equal(code(['app', '--date']), 1);
    assert.match(err[0], /missing/);
  });
});

test('unknown flag: exit 1 and accepted flags are listed', () => {
  withRepo(withApp, ({ root, err, code }) => {
    assert.equal(code(['app', '--bogus']), 1);
    assert.match(err[0], /Unknown flag: --bogus.*Accepted flags: --date/);
    assert.ok(!fs.existsSync(path.join(root, 'app', 'ACR.md')));
  });
});

test('invalid config: exit 1, names the entry, no report written', () => {
  withRepo(withApp, ({ root, err, code }) => {
    put(path.join(root, 'app', 'acr.config.json'), JSON.stringify({ criteria: { '1.1.1': { level: 'Supports', reason: 'sure' } } }));
    assert.equal(code(['app']), 1);
    assert.match(err[0], /criteria\["1\.1\.1"\]\.level/);
    assert.ok(!fs.existsSync(path.join(root, 'app', 'ACR.md')));
  });
});

test('malformed evidence: warns, still writes the report, exit 0', () => {
  withRepo(withApp, ({ root, err, code }) => {
    put(path.join(root, 'app', 'evidence', 'vitest.json'), '{ broken');
    assert.equal(code(['app', '--date', '2025-01-01']), 0);
    assert.ok(err.some((w) => /Warning: Skipped unreadable evidence file .*vitest\.json/.test(w)));
    const text = fs.readFileSync(path.join(root, 'app', 'ACR.md'), 'utf8');
    assert.match(text, /- Unreadable: .*vitest\.json/);
    assert.match(text, /\*\*Vitest unit and property tests:\*\* not available/);
  });
});

test('missing evidence: writes an all Not Evaluated report with a notice and a warning, exit 0', () => {
  withRepo(
    (root) => put(path.join(root, 'app', 'package.json'), '{"name":"app","version":"0.1.0"}'),
    ({ root, err, code }) => {
      assert.equal(code(['app', '--date', '2025-01-01']), 0);
      assert.ok(err.some((w) => /No evidence source could be read/.test(w)));
      const text = fs.readFileSync(path.join(root, 'app', 'ACR.md'), 'utf8');
      assert.match(text, /Notice: no evidence was read/);
      assert.ok(!/\| Supports \|/.test(text.split('## Table 1')[1]));
      assert.match(text, /\| Not Evaluated \| 55 \|/);
    },
  );
});

test('a Not Applicable override works with no evidence', () => {
  withRepo(
    (root) => {
      put(path.join(root, 'app', 'package.json'), '{"name":"app"}');
      put(path.join(root, 'app', 'acr.config.json'), JSON.stringify({ criteria: { '1.2.1': { level: 'Not Applicable', reason: 'No media.' } } }));
    },
    ({ root, code }) => {
      assert.equal(code(['app']), 0);
      const text = fs.readFileSync(path.join(root, 'app', 'ACR.md'), 'utf8');
      assert.match(text, /\| 1\.2\.1 .* \| Not Applicable \| No media \(owner-stated, not tested\)\. \|/);
    },
  );
});

test('a folder outside the repository root: exit 1, nothing written', () => {
  const outside = makeTempRepo();
  try {
    put(path.join(outside.root, 'package.json'), '{"name":"outside"}');
    withRepo(null, ({ err, code }) => {
      assert.equal(code([outside.root]), 1);
      assert.match(err[0], /outside the repository root/);
      assert.ok(!fs.existsSync(path.join(outside.root, 'ACR.md')));
    });
  } finally {
    outside.cleanup();
  }
});

test('several folders: all are processed, any failure gives exit 1', () => {
  withRepo(withApp, ({ root, out, err, code }) => {
    assert.equal(code(['missing-one', 'app', 'missing-two']), 1);
    assert.equal(out.length, 1, 'the good folder was still written');
    assert.equal(err.filter((e) => e.startsWith('Error:')).length, 2);
    assert.ok(fs.existsSync(path.join(root, 'app', 'ACR.md')));
  });
});

test('parseArgs and isValidDate', () => {
  assert.deepEqual(parseArgs(['a', 'b', '--date=2025-02-28']), { folders: ['a', 'b'], date: '2025-02-28' });
  assert.equal(isValidDate('2024-02-29'), true);
  assert.equal(isValidDate('2025-02-29'), false);
});

test('real script: exit codes from a separate process (no folder, folder outside the repository)', () => {
  const script = path.join(REAL_REPO_ROOT, 'scripts', 'acr.mjs');
  const none = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(none.status, 1);
  assert.match(none.stderr, /Usage:/);

  const outside = makeTempRepo();
  try {
    put(path.join(outside.root, 'package.json'), '{"name":"outside"}');
    const r = spawnSync(process.execPath, [script, outside.root], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /outside the repository root/);
    assert.ok(!fs.existsSync(path.join(outside.root, 'ACR.md')));
  } finally {
    outside.cleanup();
  }
});

test('the generator source uses no eval, Function constructor, dynamic import or child process', () => {
  const files = ['scripts/acr.mjs', ...fs.readdirSync(path.join(REAL_REPO_ROOT, 'scripts', 'acr')).filter((f) => f.endsWith('.mjs')).map((f) => `scripts/acr/${f}`)];
  for (const f of files) {
    const src = fs.readFileSync(path.join(REAL_REPO_ROOT, f), 'utf8');
    assert.ok(!/\beval\s*\(/.test(src), `${f}: eval`);
    assert.ok(!/new Function\b/.test(src), `${f}: new Function`);
    assert.ok(!/\bimport\s*\(/.test(src), `${f}: dynamic import`);
    assert.ok(!/child_process/.test(src), `${f}: child_process`);
  }
});
