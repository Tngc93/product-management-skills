import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseNumber, renderRanking, score, writeBack } from '../src/score.mjs';

const CLI = fileURLToPath(new URL('../cli/pm-skills.mjs', import.meta.url));
const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
const tmp = (name, text) => {
  const p = join(mkdtempSync(join(tmpdir(), 'pm-skills-')), name);
  writeFileSync(p, text);
  return p;
};

const RICE = `# Backlog

| Item | Reach | Impact | Confidence | Effort |
| --- | --- | --- | --- | --- |
| A | 1,000 | 2 | 80% | 2 |
| B | 2k | 1 | 0.5 | 4 |
| C | 500 | 3 | 100 | 1 |
| D | 960 | 2 | 80% | 2 |
`;

test('parseNumber understands separators, suffixes and percentages', () => {
  assert.equal(parseNumber('1,000'), 1000);
  assert.equal(parseNumber('12.000'), 12000);
  assert.equal(parseNumber('2k'), 2000);
  assert.equal(parseNumber('1.5M'), 1500000);
  assert.equal(parseNumber('80%'), 0.8);
  assert.equal(parseNumber('%80'), 0.8);
  assert.equal(parseNumber('0,8'), 0.8);
  assert.equal(parseNumber('~300'), 300);
  assert.ok(Number.isNaN(parseNumber('lots')));
  assert.ok(Number.isNaN(parseNumber('')));
});

test('RICE: scores, ranks and close calls are computed, not guessed', () => {
  const r = score(RICE, { allowHighConfidence: true });
  assert.equal(r.method, 'RICE');
  const by = Object.fromEntries(r.items.map((i) => [i.name, i]));
  assert.equal(by.A.score, 800);
  assert.equal(by.B.score, 250);
  assert.equal(by.C.score, 1500); // "100" confidence read as 100%
  assert.equal(by.D.score, 768);
  assert.deepEqual(['C', 'A', 'D', 'B'].map((n) => by[n].rank), [1, 2, 3, 4]);
  assert.deepEqual(r.closeCalls, [['A', 'D']]);
});

test('RICE: confidence above 80% and off-scale impact are questioned', () => {
  const r = score(RICE.replace('| C | 500 | 3 |', '| C | 500 | 4 |'));
  const msgs = r.problems.map((p) => p.message);
  assert.ok(msgs.some((m) => /C: impact 4 is off the RICE scale/.test(m)));
  assert.ok(msgs.some((m) => /C: confidence 100% is above 80%/.test(m)));
});

test('RICE: unusable rows are reported and left unranked', () => {
  const r = score('| Item | Reach | Impact | Confidence | Effort |\n| --- | --- | --- | --- | --- |\n| X | lots | 1 | 50% | 2 |\n| Y | 10 | 1 | 50% | 0 |\n| Z | 10 | 1 | 50% | 1 |\n');
  assert.deepEqual(r.items.map((i) => i.rank), [undefined, undefined, 1]);
  assert.ok(r.problems.some((p) => p.message === 'X: reach is not a number.'));
  assert.ok(r.problems.some((p) => p.message === 'Y: effort must be more than zero.'));
});

test('ICE with Turkish headers', () => {
  const r = score('| Fikir | Etki | Güven | Kolaylık |\n| --- | --- | --- | --- |\n| Kupon | 6 | 5 | 8 |\n| Sadakat | 8 | 4 | 3 |\n| Hatalı | 11 | 5 | 5 |\n');
  assert.equal(r.method, 'ICE');
  assert.deepEqual(r.items.map((i) => [i.name, i.score, i.rank]), [['Kupon', 240, 1], ['Sadakat', 96, 2], ['Hatalı', NaN, undefined]]);
  assert.ok(r.problems.some((p) => /impact must be between 1 and 10/.test(p.message)));
});

test('ties share a rank', () => {
  const r = score('| Item | Impact | Confidence | Ease |\n| --- | --- | --- | --- |\n| a | 2 | 5 | 5 |\n| b | 5 | 5 | 2 |\n| c | 1 | 1 | 1 |\n');
  assert.deepEqual(r.items.map((i) => i.rank), [1, 1, 3]);
});

test('writeBack adds Score and Rank columns in place and keeps row order', () => {
  const out = writeBack(RICE, score(RICE, { allowHighConfidence: true }));
  assert.match(out, /\| Item \| Reach \| Impact \| Confidence \| Effort \| Score \| Rank \|/);
  assert.match(out, /\| A \| 1,000 \| 2 \| 80% \| 2 \| 800 \| 2 \|/);
  assert.match(out, /\| C \| 500 \| 3 \| 100 \| 1 \| 1,500 \| 1 \|/);
  assert.ok(out.startsWith('# Backlog'));
  // rescoring the written table is stable
  assert.equal(writeBack(out, score(out, { allowHighConfidence: true })), out);
});

test('renderRanking orders by rank', () => {
  const md = renderRanking(score(RICE, { allowHighConfidence: true }));
  const names = md.split('\n').slice(2).map((l) => l.split('|')[2].trim());
  assert.deepEqual(names, ['C', 'A', 'D', 'B']);
});

test('no table is a clear error', () => {
  assert.throws(() => score('# nothing here'), /No scoring table found/);
});

test('cli: lint exit codes, score --write, templates', () => {
  const good = fileURLToPath(new URL('../examples/good/prd-delivery-estimate.md', import.meta.url));
  const weak = fileURLToPath(new URL('../examples/before/weak-prd.md', import.meta.url));
  assert.equal(run('lint', good).status, 0);
  const bad = run('lint', weak);
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /6 errors/);
  const j = JSON.parse(run('lint', weak, '--json').stdout);
  assert.equal(j.type, 'prd');
  assert.equal(run('lint', tmp('w.md', '# x\nSome users.\n'), '--strict').status, 1);

  const f = tmp('b.md', RICE);
  const s = run('score', f, '--write', '--allow-high-confidence');
  assert.equal(s.status, 0);
  assert.match(s.stdout, /Too close to call[\s\S]*A ≈ D/);
  assert.match(readFileSync(f, 'utf8'), /\| Score \| Rank \|/);

  for (const t of ['write-prd', 'slice-stories', 'prioritize', 'acceptance-criteria', 'stakeholder-update', 'review-spec']) {
    const out = run('template', t);
    assert.equal(out.status, 0, t);
    assert.match(out.stdout, /^---\r?\ntype: /, t);
  }
  assert.equal(run('template', 'nope').status, 2);
  assert.equal(run('nope').status, 2);
  assert.match(run('--version').stdout, /^\d+\.\d+\.\d+/);
});
