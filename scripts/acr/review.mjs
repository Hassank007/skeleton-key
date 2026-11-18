// Parse Trusted Tester review lines: "[Severity] <criterion segment>  ... -> STATUS".
import { isCriterionId, compareIds } from './criteria.mjs';

const HEADER = /^\s*\[(Critical|Serious|Moderate|Minor)\]\s+(.*)$/;
const ID = /\b[1-4]\.\d{1,2}\.\d{1,2}\b/g;

/**
 * @typedef {object} Finding
 * @property {'Critical'|'Serious'|'Moderate'|'Minor'} severity
 * @property {string[]} criteria   catalogue ids found in the criterion segment, in numeric order
 * @property {string} status       text after "->", or "" when absent
 * @property {boolean} open
 * @property {number} line         1-based
 * @property {string} text         what the finding says (Issue line when present, else the header text)
 */

/** @param {string} status */
export function isOpen(status) {
  return !(/FIXED/i.test(status) && !/PARTLY/i.test(status));
}

/**
 * Extract every finding line, wherever it appears (code fences included).
 * @param {string} content
 * @returns {Finding[]}
 */
export function parseReview(content) {
  const lines = content.split(/\r?\n/);
  const findings = [];
  for (let i = 0; i < lines.length; i++) {
    const m = HEADER.exec(lines[i]);
    if (!m) continue;
    const rest = m[2];
    const arrow = rest.indexOf('->');
    const status = arrow >= 0 ? rest.slice(arrow + 2).trim() : '';
    const beforeArrow = arrow >= 0 ? rest.slice(0, arrow) : rest;
    const spaceRun = /\s{2,}/.exec(rest);
    let end = rest.length;
    if (arrow >= 0) end = Math.min(end, arrow);
    if (spaceRun) end = Math.min(end, spaceRun.index);
    const segment = rest.slice(0, end);
    const ids = [...new Set((segment.match(ID) ?? []).filter(isCriterionId))].sort(compareIds);

    let text = beforeArrow.replace(/\s+/g, ' ').trim();
    for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
      if (HEADER.test(lines[j])) break;
      const issue = /^\s*Issue:\s*(.+)$/.exec(lines[j]);
      if (issue) {
        text = issue[1].replace(/\s+/g, ' ').trim();
        break;
      }
    }
    findings.push({
      severity: /** @type {Finding['severity']} */ (m[1]),
      criteria: ids,
      status,
      open: isOpen(status),
      line: i + 1,
      text,
    });
  }
  return findings;
}
