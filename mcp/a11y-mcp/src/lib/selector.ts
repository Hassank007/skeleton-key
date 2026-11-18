/**
 * In-page code, kept as plain strings. Strings are injected into the page as written, so no compiler
 * helper can leak into them. Everything here only reads the page: it never clicks, types or edits it.
 */

/**
 * A function declaration for `Runtime.callFunctionOn`: with `this` set to an element, it returns a
 * CSS selector. It uses `#id` when the id is unique, otherwise `tag:nth-of-type(n)` up to the nearest
 * unique id or the root. The selector identifies the element for a developer; it need not be the shortest.
 */
export const SELECTOR_FN = `function () {
  var el = this;
  if (!el || el.nodeType !== 1) return '';
  var doc = el.ownerDocument;
  var esc = function (s) { return window.CSS && CSS.escape ? CSS.escape(s) : s; };
  var parts = [];
  while (el && el.nodeType === 1) {
    if (el.id && doc.querySelectorAll('#' + esc(el.id)).length === 1) { parts.unshift('#' + esc(el.id)); break; }
    var tag = el.localName;
    var parent = el.parentElement;
    if (!parent) { parts.unshift(tag); break; }
    var same = Array.prototype.filter.call(parent.children, function (c) { return c.localName === tag; });
    parts.unshift(same.length > 1 ? tag + ':nth-of-type(' + (same.indexOf(el) + 1) + ')' : tag);
    el = parent;
  }
  return parts.join(' > ');
}`

/**
 * Defines `window.__a11y` in the page, once per walk. It keeps focused elements in an array so two
 * elements with the same selector are never confused (identity is compared with `===`).
 */
export const HELPERS_SRC = `(function () {
  var seen = [];
  var selectorOf = ${SELECTOR_FN};
  var STYLE_PROPS = ['outlineStyle', 'outlineWidth', 'outlineColor', 'outlineOffset', 'boxShadow',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'backgroundColor', 'color', 'textDecorationLine', 'textDecorationColor'];
  function snapshot(el) {
    var cs = window.getComputedStyle(el);
    var out = {};
    STYLE_PROPS.forEach(function (p) { out[p] = cs[p]; });
    return out;
  }
  function deepActive() {
    var el = document.activeElement;
    while (el) {
      if (el.shadowRoot && el.shadowRoot.activeElement) { el = el.shadowRoot.activeElement; continue; }
      if (el.tagName === 'IFRAME' || el.tagName === 'FRAME') {
        try {
          var d = el.contentDocument;
          if (d && d.activeElement && d.activeElement !== d.body) { el = d.activeElement; continue; }
        } catch (e) { /* cross-origin frame: stop at the frame element */ }
      }
      break;
    }
    return el;
  }
  function describe(el) {
    var key = seen.indexOf(el);
    if (key === -1) { seen.push(el); key = seen.length - 1; }
    var rect = el.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    return {
      key: key,
      selector: selectorOf.call(el),
      tag: el.localName,
      isBody: el === document.body || el === document.documentElement,
      inViewport: rect.right > 0 && rect.bottom > 0 && rect.left < vw && rect.top < vh,
      hasSize: rect.width > 0 && rect.height > 0,
      style: snapshot(el)
    };
  }
  window.__a11y = {
    deepActive: deepActive,
    describe: describe,
    styleOf: function (key) { return seen[key] ? snapshot(seen[key]) : null; },
    // Wait for running finite transitions and animations (for example a skip link that slides in), so styles
    // and positions are measured at rest. Capped at one second so an endless animation cannot stall the walk.
    settle: function () {
      var running = document.getAnimations ? document.getAnimations() : [];
      var finite = running.filter(function (a) {
        var t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
        return t && t.iterations !== Infinity;
      });
      var done = Promise.all(finite.map(function (a) { return a.finished.catch(function () {}); }));
      var cap = new Promise(function (resolve) { setTimeout(resolve, 1000); });
      return Promise.race([done, cap]).then(function () {});
    },
    start: function () {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      window.scrollTo(0, 0);
    }
  };
})()`
