#!/usr/bin/env node
// pm-skills: deterministic checks behind the product-management skills.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from '../src/lint.mjs';
import { renderRanking, score, writeBack } from '../src/score.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

const HELP = `pm-skills ${VERSION}
Deterministic checks for product documents. Works on plain Markdown.

Usage
  pm-skills lint <file or folder...> [--type prd|stories|criteria|update|generic] [--strict] [--json] [--ignore word,word]
      Find missing sections, vague words, metrics without baseline or date,
      incomplete Gherkin scenarios and stories without a "so that".
      Exit 1 on errors (and on warnings with --strict).

  pm-skills score <file> [--write] [--json] [--allow-high-confidence]
      Rank the first RICE (Reach, Impact, Confidence, Effort) or ICE
      (Impact, Confidence, Ease) table in the file. --write adds Score and Rank
      columns to that table in place.

  pm-skills template <name>
      Print a skill's output template: ${templateNames().join(', ')}`;

function templateNames() {
  const dir = join(ROOT, 'skills');
  return existsSync(dir) ? readdirSync(dir).filter((d) => existsSync(join(dir, d, 'template.md'))).sort() : [];
}

function parse(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') o.json = true;
    else if (a === '--strict') o.strict = true;
    else if (a === '--write') o.write = true;
    else if (a === '--allow-high-confidence') o.allowHighConfidence = true;
    else if (a === '--type') o.type = argv[++i];
    else if (a.startsWith('--type=')) o.type = a.slice(7);
    else if (a === '--ignore') o.ignore = argv[++i].split(',').map((s) => s.trim());
    else if (a === '-h' || a === '--help') o.help = true;
    else if (a === '-v' || a === '--version') o.version = true;
    else if (a.startsWith('-')) throw new Error(`Unknown option: ${a}`);
    else o._.push(a);
  }
  return o;
}

const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const LEVEL = { error: c('31', 'error'), warn: c('33', 'warn ') };

function read(file) {
  if (!existsSync(file)) throw new Error(`File not found: ${file}`);
  return readFileSync(file, 'utf8');
}

function main() {
  const o = parse(process.argv.slice(2));
  const [cmd, ...args] = o._;
  if (o.version) return console.log(VERSION), 0;
  if (o.help || !cmd) return console.log(HELP), 0;

  if (cmd === 'lint') {
    if (!args.length) throw new Error('Usage: pm-skills lint <file...>');
    let failed = false;
    const all = [];
    const files = args.flatMap((a) => (existsSync(a) && statSync(a).isDirectory() ? readdirSync(a).filter((f) => f.endsWith('.md')).sort().map((f) => join(a, f)) : [a]));
    for (const file of files) {
      const r = lint(read(file), { type: o.type, ignoreWords: o.ignore });
      const bad = r.findings.some((f) => f.level === 'error') || (o.strict && r.findings.length > 0);
      failed ||= bad;
      all.push({ file, ...r, ok: !bad });
      if (o.json) continue;
      if (!r.findings.length) {
        console.log(`${c('32', 'ok')}    ${file} (${r.type})`);
        continue;
      }
      console.log(`${file} (${r.type})`);
      for (const f of r.findings) {
        console.log(`  ${LEVEL[f.level]} ${f.line ? `${String(f.line).padStart(4)}  ` : '      '}${f.message}  ${c('2', `[${f.rule}]`)}`);
        if (f.hint) console.log(`             ${c('2', `→ ${f.hint}`)}`);
      }
      const e = r.findings.filter((f) => f.level === 'error').length;
      console.log(`  ${e} error${e === 1 ? '' : 's'}, ${r.findings.length - e} warning${r.findings.length - e === 1 ? '' : 's'}`);
    }
    if (o.json) console.log(JSON.stringify(all.length === 1 ? all[0] : all, null, 2));
    return failed ? 1 : 0;
  }

  if (cmd === 'score') {
    const file = args[0];
    if (!file) throw new Error('Usage: pm-skills score <file>');
    const text = read(file);
    const r = score(text, { allowHighConfidence: o.allowHighConfidence });
    if (o.json) {
      console.log(JSON.stringify({ method: r.method, items: r.items.map(({ row, ...it }) => it), problems: r.problems, closeCalls: r.closeCalls }, null, 2));
    } else {
      console.log(`${r.method} ranking (${r.method === 'RICE' ? 'reach × impact × confidence ÷ effort' : 'impact × confidence × ease'})\n`);
      console.log(renderRanking(r));
      if (r.closeCalls.length) {
        console.log('\nToo close to call (within 10%): decide these on strategy, not on the number.');
        for (const [a, b] of r.closeCalls) console.log(`  - ${a} ≈ ${b}`);
      }
      if (r.problems.length) {
        console.log('\nCheck these inputs:');
        for (const p of r.problems) console.log(`  - line ${p.line}: ${p.message}`);
      }
    }
    if (o.write) {
      writeFileSync(file, writeBack(text, r));
      if (!o.json) console.log(`\nWrote Score and Rank columns to ${file}.`);
    }
    return r.problems.some((p) => /not a number|must be|not a positive/.test(p.message)) ? 1 : 0;
  }

  if (cmd === 'template') {
    const name = args[0];
    const p = join(ROOT, 'skills', name || '', 'template.md');
    if (!name || !existsSync(p)) throw new Error(`Unknown template. Choose one of: ${templateNames().join(', ')}`);
    process.stdout.write(readFileSync(p, 'utf8'));
    return 0;
  }

  throw new Error(`Unknown command: ${cmd}. Run pm-skills --help.`);
}

try {
  process.exit(main() || 0);
} catch (err) {
  console.error(`pm-skills: ${err.message}`);
  process.exit(2);
}
