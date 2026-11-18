// Checks beyond keyboard and focus, shared by measure-baseline.mjs and measure-seance.mjs.
// Each returns { pass, detail }. Screen reader, vision and wording checks that axe cannot
// settle (axe reports 0 violations on both apps). Read-only: nothing here edits the app.

// Runs in the page. Resolves any CSS colour (rgb, oklch, color(), hex) to sRGB through a canvas,
// composites translucent backgrounds up the ancestor chain, and treats every gradient stop as a
// possible background (worst case wins).
const COLOUR_LIB = `
const cv = document.createElement('canvas'); cv.width = cv.height = 1;
const cx = cv.getContext('2d', { willReadFrequently: true });
function rgba(str) {
  cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = str; cx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}
const over = (top, under) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1); };
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const STOP = /(rgba?\\([^)]*\\)|oklch\\([^)]*\\)|oklab\\([^)]*\\)|lab\\([^)]*\\)|lch\\([^)]*\\)|hsla?\\([^)]*\\)|color\\([^)]*\\)|#[0-9a-f]{3,8}\\b)/gi;
// Every opaque background colour that could sit behind el (one per gradient stop).
function backgrounds(el) {
  const layers = [];
  for (let n = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    const img = cs.backgroundImage;
    if (img && img !== 'none' && img.includes('gradient')) { layers.push({ stops: (img.match(STOP) || []).map(rgba) }); }
    const bg = rgba(cs.backgroundColor);
    if (bg[3] > 0) layers.push({ stops: [bg] });
    const top = layers[layers.length - 1];
    if (top && top.stops.length && top.stops.every((s) => s[3] >= 1)) break;
  }
  let result = [[255, 255, 255, 1]];
  for (let i = layers.length - 1; i >= 0; i--) {
    const next = [];
    for (const s of layers[i].stops) for (const u of result) next.push(over(s, u));
    result = next.length ? next : result;
  }
  return result;
}
`;

const visibleJs = `const visible = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[aria-hidden=true]'); };`;

/** 1.4.3: every visible text in the page reaches 4.5:1 (3:1 when large) against its worst-case background. */
export async function textContrast(page) {
  const fails = await page.evaluate(`(() => { ${COLOUR_LIB} ${visibleJs}
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el) || el.closest('dialog:not([open])')) continue;
      const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (!text || /^[\\p{Extended_Pictographic}\\s✓]+$/u.test(text)) continue;
      const cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) === 0) continue;
      const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight, 10) >= 700;
      const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
      const bgs = backgrounds(el);
      const fg = rgba(cs.color);
      const worst = Math.min(...bgs.map((b) => ratio(over(fg, b), b)));
      if (worst < need) out.push(text.slice(0, 30) + ' ' + worst.toFixed(2) + ':1 (needs ' + need + ')');
    }
    return out;
  })()`);
  return { pass: fails.length === 0, detail: fails.length ? fails.slice(0, 4).join('; ') + (fails.length > 4 ? ` (+${fails.length - 4} more)` : '') : 'all text passes' };
}

/** 1.4.11: each text input's edge (border, or its own fill) reaches 3:1 against what surrounds it. */
export async function inputBoundaries(page) {
  const fails = await page.evaluate(`(() => { ${COLOUR_LIB} ${visibleJs}
    const out = [];
    for (const el of document.querySelectorAll('input:not([type=radio]):not([type=checkbox]):not([type=hidden]), select, textarea')) {
      if (!visible(el)) continue;
      const cs = getComputedStyle(el);
      const outside = backgrounds(el.parentElement);
      const fill = backgrounds(el);
      const border = rgba(cs.borderTopColor);
      const hasBorder = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
      let best = 0;
      for (const o of outside) {
        if (hasBorder) best = Math.max(best, Math.min(...fill.map(() => ratio(over(border, o), o))));
        best = Math.max(best, Math.min(...fill.map((f) => ratio(f, o))));
      }
      if (best < 3) out.push((el.id || el.name || el.type) + ' ' + best.toFixed(2) + ':1');
    }
    return out;
  })()`);
  return { pass: fails.length === 0, detail: fails.length ? fails.join('; ') : 'all inputs reach 3:1' };
}

/** 2.4.7: a text field shows a real outline when focused (box-shadow alone vanishes in forced colours). */
export async function inputFocusOutline(locator) {
  await locator.focus();
  const r = await locator.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  const pass = r.style !== 'none' && r.width >= 1;
  return { pass, detail: pass ? `${r.width}px ${r.style} outline` : 'no outline (box-shadow only or nothing)' };
}

/** 1.4.1: the chosen option is shown by more than colour (a visible native control, a mark, or a shape change). */
export async function selectionNotColourOnly(page, radioName) {
  const r = await page.evaluate((name) => {
    const radios = [...document.querySelectorAll(`input[type=radio][name=${name}]`)];
    const on = radios.find((x) => x.checked); const off = radios.find((x) => !x.checked);
    if (!on || !off) return { pass: false, detail: 'could not find a chosen and an unchosen option' };
    const box = on.getBoundingClientRect(); const ics = getComputedStyle(on); const ocs = getComputedStyle(off);
    const shown = box.width >= 8 && box.height >= 8 && parseFloat(ics.opacity) > 0 && ics.clipPath === 'none' && ics.clip === 'auto';
    if (shown && ics.appearance !== 'none') return { pass: true, detail: 'native radio is visible' };
    if (shown && ics.backgroundImage !== ocs.backgroundImage) return { pass: true, detail: 'visible custom radio draws a dot when chosen' };
    const holder = (x) => x.closest('label') || x.parentElement;
    const a = holder(on); const b = holder(off);
    const props = ['borderTopWidth', 'outlineWidth', 'fontWeight', 'textDecorationLine'];
    const s1 = getComputedStyle(a); const s2 = getComputedStyle(b);
    const diff = props.filter((p) => s1[p] !== s2[p]);
    const ea = [a, ...a.querySelectorAll('*')]; const eb = [b, ...b.querySelectorAll('*')];
    ea.forEach((el, i) => {
      if (!eb[i]) return;
      for (const pseudo of ['::before', '::after']) {
        const c1 = getComputedStyle(el, pseudo).content; const c2 = getComputedStyle(eb[i], pseudo).content;
        if (c1 !== c2 && c1 !== 'none' && c1 !== 'normal') diff.push(pseudo + ' ' + c1);
      }
    });
    if (a.innerText.includes('✓') && !b.innerText.includes('✓')) diff.push('✓ text');
    return { pass: diff.length > 0, detail: diff.length ? 'differs by ' + diff.join(', ') : 'native radio hidden; only colour or glow changes' };
  }, radioName);
  return r;
}

/** 1.3.1 / 4.1.2: a choice group in error is linked to its message, so a screen reader reads it on entering the group. */
export async function groupErrorLinked(page, radioName, errorPattern = /choose|select|pick/i) {
  return page.evaluate(({ name, src }) => {
    const re = new RegExp(src, 'i');
    const radio = document.querySelector(`input[type=radio][name=${name}]`);
    const holders = [radio, radio.closest('fieldset'), radio.closest('[role=radiogroup]')].filter(Boolean);
    for (const h of holders) {
      for (const attr of ['aria-describedby', 'aria-errormessage']) {
        const ids = (h.getAttribute(attr) || '').split(/\s+/).filter(Boolean);
        const text = ids.map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join(' ').trim();
        if (text && re.test(text)) return { pass: true, detail: `${h.tagName.toLowerCase()} ${attr} → "${text.slice(0, 50)}"` };
      }
    }
    return { pass: false, detail: 'error text is on screen but not linked to the group' };
  }, { name: radioName, src: errorPattern.source });
}

/** 1.1.1: emoji used as decoration are hidden from screen readers. */
export async function emojiHidden(page) {
  const found = await page.evaluate(() => {
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const p = n.parentElement;
      if (!p || p.closest('[aria-hidden=true], script, style, dialog:not([open])')) continue;
      const m = n.textContent.match(/\p{Extended_Pictographic}/gu);
      if (m) out.push(...m);
    }
    return out;
  });
  return { pass: found.length === 0, detail: found.length ? `${found.length} read aloud: ${found.join(' ')}` : 'none read aloud' };
}

/** 1.3.1 / 2.4.6: the current step has a heading a screen reader user can jump to. */
export async function stepHeading(page, pattern) {
  const heads = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].map((h) => h.textContent.trim()));
  const hit = heads.find((t) => pattern.test(t));
  return { pass: !!hit, detail: hit ? `"${hit}"` : `headings: ${heads.map((h) => `"${h}"`).join(', ') || 'none'}` };
}

/** 3.3.3: an error message says how to fix the problem, not only that it is wrong. */
export async function errorSuggestsFix(page, pattern) {
  const texts = await page.evaluate(() => [...document.querySelectorAll('body *')]
    .filter((e) => e.children.length === 0 && e.offsetParent !== null).map((e) => e.textContent.trim()).filter(Boolean));
  const hit = texts.find((t) => pattern.test(t));
  const err = texts.find((t) => /past|before|earlier|invalid|future|today/i.test(t));
  return { pass: !!hit, detail: hit ? `"${hit}"` : err ? `"${err}"` : 'no error shown' };
}

/** Records the live regions present before an action, so a success message can be checked against them. */
export function liveRegionIds(page) {
  return page.evaluate(() => [...document.querySelectorAll('[aria-live], [role=status], [role=alert], output')]
    .map((e, i) => { e.dataset.measureLive = String(i); return String(i); }));
}

/** 4.1.3: success is announced, by text arriving in a region that already existed, or by focus moving onto it. */
export async function successAnnounced(page, before, pattern) {
  const r = await page.evaluate(({ ids, src, flags }) => {
    const re = new RegExp(src, flags);
    for (const id of ids) {
      const e = document.querySelector(`[data-measure-live="${id}"]`);
      if (e && re.test(e.textContent)) return { pass: true, detail: `persistent live region: "${e.textContent.trim().slice(0, 50)}"` };
    }
    const f = document.activeElement;
    if (f && f !== document.body && re.test(f.textContent)) return { pass: true, detail: `focus moved to "${f.textContent.trim().slice(0, 50)}"` };
    const fresh = [...document.querySelectorAll('[aria-live], [role=status], [role=alert]')].find((e) => re.test(e.textContent));
    return { pass: false, detail: fresh ? 'live region was inserted together with its text (often not read); focus not moved' : 'no announcement and focus not moved' };
  }, { ids: before, src: pattern.source, flags: pattern.flags });
  return r;
}
