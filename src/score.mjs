// RICE and ICE scoring from a Markdown table. The model writes the inputs and
// the reasons; this code does the arithmetic, so a ranking never depends on an
// LLM multiplying correctly.
import { lines, tables } from './markdown.mjs';

const COLS = {
  name: /^(item|initiative|feature|idea|name|title|project|epic|opportunity|madde|fikir|özellik|girişim|başlık|ad)$/i,
  reach: /^(reach|erişim|ulaşım)/i,
  impact: /^(impact|etki)/i,
  confidence: /^(confidence|güven)/i,
  effort: /^(effort|efor|emek|maliyet)/i,
  ease: /^(ease|kolaylık)/i,
  score: /^(score|skor|puan)$/i,
  rank: /^(rank|sıra)$/i,
};

const RICE_IMPACT = [0.25, 0.5, 1, 2, 3];

/** "12,000" / "12k" / "1.2M" / "12.000" -> number. Returns NaN when unreadable. */
export function parseNumber(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().toLowerCase().replace(/\s+/g, '').replace(/[~≈]/g, '');
  if (!s) return NaN;
  let mult = 1;
  if (/[k]$/.test(s)) [mult, s] = [1e3, s.slice(0, -1)];
  else if (/m$/.test(s)) [mult, s] = [1e6, s.slice(0, -1)];
  else if (/(bin)$/.test(s)) [mult, s] = [1e3, s.slice(0, -3)];
  const pct = s.endsWith('%') || s.startsWith('%'); // "80%" or Turkish "%80"
  if (pct) s = s.replace('%', '');
  // thousands separators: "12,000" or "12.000"; decimal comma "0,8"
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, '');
  else s = s.replace(',', '.');
  const v = Number(s) * mult;
  return pct ? v / 100 : v;
}

function findCol(header, re) {
  return header.findIndex((h) => re.test(h.replace(/[*_`]/g, '').trim()));
}

/** Pick the first table that has enough columns for RICE or ICE. */
export function readTable(text) {
  const ls = lines(text);
  for (const t of tables(ls)) {
    const idx = Object.fromEntries(Object.entries(COLS).map(([k, re]) => [k, findCol(t.header, re)]));
    const rice = idx.reach !== -1 && idx.impact !== -1 && idx.confidence !== -1 && idx.effort !== -1;
    const ice = !rice && idx.impact !== -1 && idx.confidence !== -1 && idx.ease !== -1;
    if (rice || ice) return { table: t, idx, method: rice ? 'RICE' : 'ICE', ls };
  }
  return null;
}

/**
 * @returns {{method: 'RICE'|'ICE', items: {name, inputs, score, rank, line}[], problems: {line, message}[], closeCalls: string[][]}}
 */
export function score(text, opts = {}) {
  const found = readTable(text);
  if (!found) throw new Error('No scoring table found. Add a table with Reach, Impact, Confidence and Effort columns (RICE) or Impact, Confidence and Ease (ICE).');
  const { table, idx, method } = found;
  const problems = [];
  const items = [];
  table.rows.forEach((r, i) => {
    const get = (k) => (idx[k] === -1 ? undefined : r.cells[idx[k]]);
    const name = (idx.name === -1 ? r.cells[0] : get('name')) || `row ${i + 1}`;
    const bad = (msg) => problems.push({ line: r.line, message: `${name}: ${msg}` });
    let s = NaN;
    const inputs = {};
    if (method === 'RICE') {
      const reach = parseNumber(get('reach'));
      const impact = parseNumber(get('impact'));
      let conf = parseNumber(get('confidence'));
      const effort = parseNumber(get('effort'));
      if (conf > 1) conf /= 100; // "80" means 80%
      Object.assign(inputs, { reach, impact, confidence: conf, effort });
      if (!(reach >= 0)) bad('reach is not a number.');
      if (!(impact > 0)) bad('impact is not a positive number.');
      else if (!RICE_IMPACT.includes(impact)) bad(`impact ${impact} is off the RICE scale (0.25, 0.5, 1, 2, 3).`);
      if (!(conf > 0 && conf <= 1)) bad('confidence must be between 0% and 100%.');
      else if (conf > 0.8 && !opts.allowHighConfidence) bad(`confidence ${Math.round(conf * 100)}% is above 80%: only use that with data behind it.`);
      if (!(effort > 0)) bad('effort must be more than zero.');
      if (reach >= 0 && impact > 0 && conf > 0 && effort > 0) s = (reach * impact * conf) / effort;
    } else {
      const impact = parseNumber(get('impact'));
      const conf = parseNumber(get('confidence'));
      const ease = parseNumber(get('ease'));
      Object.assign(inputs, { impact, confidence: conf, ease });
      for (const [k, v] of Object.entries({ impact, confidence: conf, ease })) {
        if (!(v >= 1 && v <= 10)) bad(`${k} must be between 1 and 10.`);
      }
      if ([impact, conf, ease].every((v) => v >= 1 && v <= 10)) s = impact * conf * ease;
    }
    items.push({ name, inputs, score: s, line: r.line, row: i });
  });

  const valid = items.filter((it) => Number.isFinite(it.score)).sort((a, b) => b.score - a.score || a.row - b.row);
  valid.forEach((it, i) => {
    it.rank = i > 0 && Math.abs(it.score - valid[i - 1].score) < 1e-9 ? valid[i - 1].rank : i + 1;
  });

  // Adjacent items within 10% of each other: the estimates can't separate them.
  const closeCalls = [];
  for (let i = 1; i < valid.length; i++) {
    const a = valid[i - 1];
    const b = valid[i];
    if (a.score > 0 && (a.score - b.score) / a.score < 0.1) closeCalls.push([a.name, b.name]);
  }
  return { method, items, problems, closeCalls, table };
}

export function round(v) {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString('en-US');
  if (Math.abs(v) >= 100) return String(Math.round(v));
  return String(Math.round(v * 10) / 10);
}

/** The ranked table as Markdown. */
export function renderRanking(result) {
  const { method, items } = result;
  const cols = method === 'RICE' ? ['Reach', 'Impact', 'Confidence', 'Effort'] : ['Impact', 'Confidence', 'Ease'];
  const keyOf = { Reach: 'reach', Impact: 'impact', Confidence: 'confidence', Effort: 'effort', Ease: 'ease' };
  const out = [`| Rank | Item | ${cols.join(' | ')} | ${method} score |`, `| --- | --- | ${cols.map(() => '---').join(' | ')} | --- |`];
  const sorted = [...items].sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9) || a.row - b.row);
  for (const it of sorted) {
    const vals = cols.map((c) => {
      const v = it.inputs[keyOf[c]];
      if (c === 'Confidence' && method === 'RICE' && Number.isFinite(v)) return `${Math.round(v * 100)}%`;
      return Number.isFinite(v) ? round(v) : '—';
    });
    out.push(`| ${it.rank ?? '—'} | ${it.name} | ${vals.join(' | ')} | ${round(it.score)} |`);
  }
  return out.join('\n');
}

/** Write Score and Rank columns into the original table, keeping row order and other columns. */
export function writeBack(text, result) {
  const { table, items } = result;
  const src = text.replace(/\r\n/g, '\n').split('\n');
  const header = [...table.header];
  let sIdx = findCol(header, COLS.score);
  let rIdx = findCol(header, COLS.rank);
  if (sIdx === -1) {
    header.push('Score');
    sIdx = header.length - 1;
  }
  if (rIdx === -1) {
    header.push('Rank');
    rIdx = header.length - 1;
  }
  const row = (cells) => `| ${cells.join(' | ')} |`;
  src[table.line - 1] = row(header);
  src[table.line] = row(header.map(() => '---'));
  for (const it of items) {
    const cells = [...table.rows[it.row].cells];
    while (cells.length < header.length) cells.push('');
    cells[sIdx] = round(it.score);
    cells[rIdx] = it.rank ? String(it.rank) : '—';
    src[it.line - 1] = row(cells);
  }
  return src.join('\n');
}
