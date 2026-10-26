// Prints a progress summary of docs/MIGRATION_TRACKER.md: checked boxes per
// section, open approvals, and parity matrix status counts.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'MIGRATION_TRACKER.md');
const lines = readFileSync(file, 'utf8').split(/\r?\n/);

const sections = [];
let current = null;
let inMatrix = false;
const matrix = {};

for (const line of lines) {
  const heading = line.match(/^##\s+(.*)/);
  if (heading) {
    current = { title: heading[1], done: 0, total: 0, open: [] };
    sections.push(current);
    inMatrix = /parity matrix/i.test(heading[1]);
    continue;
  }
  const box = line.match(/^\s*- \[( |x|X)\]\s+(.*)/);
  if (box && current) {
    current.total++;
    if (box[1] === ' ') current.open.push(box[2].replace(/\*\*/g, '').slice(0, 70));
    else current.done++;
  }
  if (inMatrix && /^\|\s*\d+\s*\|/.test(line)) {
    const status = line.split('|').at(-2).trim() || 'todo';
    matrix[status] = (matrix[status] ?? 0) + 1;
  }
}

const bar = (done, total, width = 20) => {
  const filled = total ? Math.round((done / total) * width) : 0;
  return '#'.repeat(filled) + '-'.repeat(width - filled);
};

let allDone = 0;
let allTotal = 0;
console.log('\nNSL Bank migration progress\n');
for (const s of sections.filter((s) => s.total > 0)) {
  allDone += s.done;
  allTotal += s.total;
  console.log(`${s.done === s.total ? 'DONE' : '    '} [${bar(s.done, s.total)}] ${String(s.done).padStart(2)}/${String(s.total).padEnd(2)} ${s.title}`);
}
console.log(`\nOverall: ${allDone}/${allTotal} items (${Math.round((allDone / allTotal) * 100)}%)`);

const approvals = sections.find((s) => /approval queue/i.test(s.title));
if (approvals?.open.length) {
  console.log(`\nAwaiting approval (${approvals.open.length}):`);
  for (const item of approvals.open) console.log(`  - ${item}`);
}

const next = sections.find((s) => /^phase/i.test(s.title) && s.done < s.total);
if (next) console.log(`\nNext up in "${next.title}":\n  - ${next.open[0]}`);

console.log(`\nParity matrix: ${Object.entries(matrix).map(([k, v]) => `${v} ${k}`).join(', ')}\n`);
