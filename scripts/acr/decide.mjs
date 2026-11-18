// The one place a conformance Level is decided. Pure: no I/O, no clock, no randomness.
// "Supports" is returned from exactly one branch, which needs qualifying passing evidence
// and no failing item, inconclusive item, open finding, human-only flag or Not Applicable override.

/**
 * @typedef {{ result: 'pass'|'fail'|'inconclusive', kind: 'test'|'axe' }} EvidenceLike
 * @typedef {{ severity: 'Critical'|'Serious'|'Moderate'|'Minor', open: boolean }} FindingLike
 * @typedef {{ level: 'Not Applicable'|'Not Evaluated', reason?: string }} OverrideLike
 */

/**
 * @param {{ tier: 'axe'|'test', humanOnly: boolean }} criterion
 * @param {EvidenceLike[]} items
 * @param {FindingLike[]} findings
 * @param {OverrideLike|undefined|null} override
 * @returns {{ level: string, reasonCode: string, overrideIgnored: boolean }}
 */
export function decide(criterion, items, findings, override) {
  const failing = items.filter((i) => i.result === 'fail');
  const qualifying = items.filter(
    (i) => i.result === 'pass' && (i.kind === 'test' || (i.kind === 'axe' && criterion.tier === 'axe')),
  );
  const inconclusive = items.filter((i) => i.result === 'inconclusive');
  const open = findings.filter((f) => f.open);
  const naOverride = override?.level === 'Not Applicable';

  if (failing.length > 0 || open.length > 0) {
    const overrideIgnored = naOverride;
    if (qualifying.length > 0) return { level: 'Partially Supports', reasonCode: 'mixed', overrideIgnored };
    if (failing.length > 0 || open.some((f) => f.severity === 'Critical' || f.severity === 'Serious')) {
      return { level: 'Does Not Support', reasonCode: failing.length > 0 ? 'failing' : 'open-serious-finding', overrideIgnored };
    }
    return { level: 'Partially Supports', reasonCode: 'open-minor-finding', overrideIgnored };
  }
  if (naOverride) return { level: 'Not Applicable', reasonCode: 'override-na', overrideIgnored: false };
  if (criterion.humanOnly) return { level: 'Not Evaluated', reasonCode: 'human-only', overrideIgnored: false };
  if (inconclusive.length > 0) return { level: 'Not Evaluated', reasonCode: 'inconclusive', overrideIgnored: false };
  if (qualifying.length > 0) return { level: 'Supports', reasonCode: 'qualifying-pass', overrideIgnored: false };
  return { level: 'Not Evaluated', reasonCode: 'no-evidence', overrideIgnored: false };
}
