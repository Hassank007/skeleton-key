// Usage: node scripts/compare/measure-seance.mjs [url]   (default: the deployed Seance)
// Runs the same axe scans and keyboard/focus checks as measure-baseline.mjs against Seance.
// The skip-link check is done on a fresh page load (after a route change, focus is on the new h1 by design).
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../apps/seance/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const BASE = process.argv[2] ?? 'https://hassank007.github.io/skeleton-key/seance/';
const report = { url: BASE, scans: [], checks: [] };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

async function scan(label) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  report.scans.push({
    label,
    violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, tags: v.tags.filter((t) => t.startsWith('wcag')) })),
  });
}
const focused = () => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'BODY (focus lost)';
  const name = el.getAttribute('aria-label') || el.labels?.[0]?.textContent?.trim() || el.textContent?.trim().slice(0, 40) || '';
  return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${name}"`;
});
const check = (name, pass, detail) => report.checks.push({ name, pass, detail });

await page.goto(BASE);
await page.waitForTimeout(800);
// Skip link / first Tab stop
await page.keyboard.press('Tab');
const first = await focused();
check('First Tab stop is a skip link', /skip/i.test(first), first);
await page.getByRole('link', { name: /start booking/i }).click();
await page.waitForTimeout(800);
await scan('Step 1: choose a spirit');


// Submit step 1 empty: where does focus go, how are errors announced?
await page.getByRole('button', { name: /^next$/i }).click();
await page.waitForTimeout(300);
const alerts = await page.locator('[role=alert]').count();
check('Empty submit: focus moves to the error or error summary', !/button/.test(await focused()), await focused());
check('Errors announced once (not several competing alerts)', alerts <= 1, `${alerts} role=alert element(s)`);
await scan('Step 1: after empty submit (errors shown)');

// Choose a spirit with the keyboard and continue
await page.locator('input[name=spirit]').first().focus();
await page.keyboard.press('Space');
await page.getByRole('button', { name: /^next$/i }).click();
await page.waitForTimeout(700);
const afterStep = await focused();
check('Step change moves focus to the new step heading', /^h[1-6]|legend|fieldset/.test(afterStep), afterStep);
const title2 = await page.title();
check('Page title says which step you are on', /step|2|date|time/i.test(title2), title2);
await scan('Step 2: date and time');

// Step 2
const d = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
await page.getByLabel(/^date/i).fill(d);
await page.getByLabel(/^time/i).fill('21:00');
await page.getByRole('button', { name: /^next$/i }).click();
await page.waitForTimeout(700);
await scan('Step 3: your details');

// Step 3
await page.getByLabel(/full name/i).fill('Ada Lovelace');
await page.getByLabel(/email address/i).fill('ada@example.com');
await page.getByLabel(/phone number/i).fill('+44 20 7946 0000');
const reviewBtn = page.getByRole('button', { name: /review/i });
await reviewBtn.click();
await page.waitForTimeout(500);
await scan('Confirm dialog open');

// Native <dialog> has an implicit dialog role, so match both. Focus on <body> means the browser's own UI
// (address bar) after the last element, which is not the page behind the dialog.
const inDialog = () => page.evaluate(() => !!document.activeElement?.closest('dialog, [role=dialog]'));
const behindDialog = () => page.evaluate(() => { const e = document.activeElement; return !!e && e !== document.body && !e.closest('dialog, [role=dialog]'); });
check('Dialog: focus starts inside the dialog', await inDialog(), await focused());
let escaped = false;
for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); if (await behindDialog()) { escaped = true; break; } }
check('Dialog: Tab never reaches the page behind it', !escaped, escaped ? `focus reached the page behind: ${await focused()}` : 'stayed in the dialog (or browser UI)');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
const open = await page.locator('dialog[open], [role=dialog]').count();
check('Dialog: Escape closes it', open === 0, open ? 'still open after Escape' : 'closed');
if (open === 0) {
  const back = await focused();
  check('Dialog: focus returns to the button that opened it', /review/i.test(back), back);
}

// Motion
const motionCtx = await browser.newContext({ reducedMotion: 'reduce' });
const mp = await motionCtx.newPage();
await mp.goto(BASE);

await mp.waitForTimeout(500);
const running = await mp.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
check('Reduced motion respected (no running animations)', running === 0, `${running} animation(s) running with prefers-reduced-motion: reduce`);
const toggle = await mp.getByRole('button', { name: /motion|animation/i }).count();
check('On-page control to stop motion (WCAG 2.2.2)', toggle > 0, toggle ? 'present' : 'none');

await browser.close();
console.log(JSON.stringify(report, null, 2));
