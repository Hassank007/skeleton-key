import { describe, expect, it } from 'vitest';
import lightCss from '../../src/tokens/tokens.css?raw';
import darkCss from '../../src/tokens/dark.css?raw';
import { contrastRatio } from './support/contrast';

// Guards 1.4.3: white text on primary buttons must keep 4.5:1 in every state and theme.
const tokens = (css: string, name: string): string[] =>
  [...css.matchAll(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`, 'g'))].map((m) => m[1]);

describe('primary button text contrast', () => {
  for (const [label, file] of [
    ['light', lightCss],
    ['dark', darkCss],
  ]) {
    for (const name of ['color-accent', 'color-accent-hover']) {
      it(`${label} ${name} gives white text at least 4.5:1 [SC 1.4.3]`, () => {
        const values = tokens(file, name);
        expect(values.length).toBeGreaterThan(0);
        for (const v of values) expect(contrastRatio('#ffffff', v)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

