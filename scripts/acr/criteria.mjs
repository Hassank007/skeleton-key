// The 55 WCAG 2.2 Level A and AA success criteria, in numeric order.
// 4.1.1 Parsing (removed in WCAG 2.2) and all Level AAA criteria are left out on purpose.

/**
 * @typedef {object} Criterion
 * @property {string} id
 * @property {string} name
 * @property {'A'|'AA'} level
 * @property {'Perceivable'|'Operable'|'Understandable'|'Robust'} principle
 * @property {'axe'|'test'} tier   `axe`: a passing axe rule alone may support "Supports". `test`: only a tagged test may.
 * @property {boolean} humanOnly   A person must judge it; never "Supports".
 * @property {string} [note]       What a person must check (human-only entries).
 */

const PRINCIPLES = { 1: 'Perceivable', 2: 'Operable', 3: 'Understandable', 4: 'Robust' };

// Criteria where axe rules test the property itself (token, measured ratio, title, measured size, lang value).
const AXE_TIER = new Set(['1.3.5', '1.4.3', '2.4.2', '2.5.8', '3.1.1']);

const HUMAN_ONLY_NOTES = {
  '1.2.1': 'A person must check that audio-only and video-only content has a text or audio alternative.',
  '1.2.2': 'A person must check that prerecorded video has accurate captions.',
  '1.2.3': 'A person must check that prerecorded video has an audio description or a text alternative.',
  '1.2.4': 'A person must check that live audio has real-time captions.',
  '1.2.5': 'A person must check that prerecorded video has an audio description.',
  '1.3.3': 'A person must check that instructions do not rely only on shape, colour, size, position or sound.',
  '1.4.5': 'A person must check that text is real text and not an image of text.',
  '2.5.4': 'A person must check that no function depends only on device motion, or that motion can be turned off.',
  '3.1.2': 'A person must check that passages in another language are marked with a lang attribute.',
  '3.2.3': 'A person must compare navigation across pages to check it keeps the same relative order.',
  '3.2.4': 'A person must compare components across pages to check they are identified the same way.',
  '3.2.6': 'A person must check that help options appear in the same place on each page.',
  '3.3.4': 'A person must decide whether the pages handle legal or financial data and, if so, check reversal, checking or confirmation.',
};

// [id, name, level]
const ROWS = [
  ['1.1.1', 'Non-text Content', 'A'],
  ['1.2.1', 'Audio-only and Video-only (Prerecorded)', 'A'],
  ['1.2.2', 'Captions (Prerecorded)', 'A'],
  ['1.2.3', 'Audio Description or Media Alternative (Prerecorded)', 'A'],
  ['1.2.4', 'Captions (Live)', 'AA'],
  ['1.2.5', 'Audio Description (Prerecorded)', 'AA'],
  ['1.3.1', 'Info and Relationships', 'A'],
  ['1.3.2', 'Meaningful Sequence', 'A'],
  ['1.3.3', 'Sensory Characteristics', 'A'],
  ['1.3.4', 'Orientation', 'AA'],
  ['1.3.5', 'Identify Input Purpose', 'AA'],
  ['1.4.1', 'Use of Color', 'A'],
  ['1.4.2', 'Audio Control', 'A'],
  ['1.4.3', 'Contrast (Minimum)', 'AA'],
  ['1.4.4', 'Resize Text', 'AA'],
  ['1.4.5', 'Images of Text', 'AA'],
  ['1.4.10', 'Reflow', 'AA'],
  ['1.4.11', 'Non-text Contrast', 'AA'],
  ['1.4.12', 'Text Spacing', 'AA'],
  ['1.4.13', 'Content on Hover or Focus', 'AA'],
  ['2.1.1', 'Keyboard', 'A'],
  ['2.1.2', 'No Keyboard Trap', 'A'],
  ['2.1.4', 'Character Key Shortcuts', 'A'],
  ['2.2.1', 'Timing Adjustable', 'A'],
  ['2.2.2', 'Pause, Stop, Hide', 'A'],
  ['2.3.1', 'Three Flashes or Below Threshold', 'A'],
  ['2.4.1', 'Bypass Blocks', 'A'],
  ['2.4.2', 'Page Titled', 'A'],
  ['2.4.3', 'Focus Order', 'A'],
  ['2.4.4', 'Link Purpose (In Context)', 'A'],
  ['2.4.5', 'Multiple Ways', 'AA'],
  ['2.4.6', 'Headings and Labels', 'AA'],
  ['2.4.7', 'Focus Visible', 'AA'],
  ['2.4.11', 'Focus Not Obscured (Minimum)', 'AA'],
  ['2.5.1', 'Pointer Gestures', 'A'],
  ['2.5.2', 'Pointer Cancellation', 'A'],
  ['2.5.3', 'Label in Name', 'A'],
  ['2.5.4', 'Motion Actuation', 'A'],
  ['2.5.7', 'Dragging Movements', 'AA'],
  ['2.5.8', 'Target Size (Minimum)', 'AA'],
  ['3.1.1', 'Language of Page', 'A'],
  ['3.1.2', 'Language of Parts', 'AA'],
  ['3.2.1', 'On Focus', 'A'],
  ['3.2.2', 'On Input', 'A'],
  ['3.2.3', 'Consistent Navigation', 'AA'],
  ['3.2.4', 'Consistent Identification', 'AA'],
  ['3.2.6', 'Consistent Help', 'A'],
  ['3.3.1', 'Error Identification', 'A'],
  ['3.3.2', 'Labels or Instructions', 'A'],
  ['3.3.3', 'Error Suggestion', 'AA'],
  ['3.3.4', 'Error Prevention (Legal, Financial, Data)', 'AA'],
  ['3.3.7', 'Redundant Entry', 'A'],
  ['3.3.8', 'Accessible Authentication (Minimum)', 'AA'],
  ['4.1.2', 'Name, Role, Value', 'A'],
  ['4.1.3', 'Status Messages', 'AA'],
];

/** @type {readonly Criterion[]} */
export const CRITERIA = Object.freeze(
  ROWS.map(([id, name, level]) => {
    const note = HUMAN_ONLY_NOTES[id];
    return Object.freeze({
      id,
      name,
      level,
      principle: PRINCIPLES[id[0]],
      tier: AXE_TIER.has(id) ? 'axe' : 'test',
      humanOnly: note !== undefined,
      ...(note !== undefined ? { note } : {}),
    });
  }),
);

/** Compare criterion ids numerically (1.4.10 after 1.4.5). */
export function compareIds(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

const BY_ID = new Map(CRITERIA.map((c) => [c.id, c]));

/** @returns {Criterion|undefined} */
export function getCriterion(id) {
  return BY_ID.get(id);
}

export function isCriterionId(id) {
  return BY_ID.has(id);
}

export const LEVELS = Object.freeze([
  'Supports',
  'Partially Supports',
  'Does Not Support',
  'Not Applicable',
  'Not Evaluated',
]);
