// Minimal Markdown reading for product documents: headings with their line
// ranges, bullet lines, fenced blocks and pipe tables. Line numbers are 1-based.

/** Split a document into lines and mark which ones are inside fenced code. */
export function lines(text) {
  let fence = null;
  return text.replace(/\r\n/g, '\n').split('\n').map((raw, i) => {
    const m = /^\s*(```+|~~~+)(\w*)/.exec(raw);
    let inFence = fence !== null;
    let lang = fence?.lang ?? null;
    if (m) {
      if (fence === null) {
        fence = { marker: m[1][0], lang: m[2].toLowerCase() };
        inFence = true;
        lang = fence.lang;
      } else if (m[1][0] === fence.marker) {
        fence = null;
        inFence = true;
      }
    }
    return { n: i + 1, raw, text: raw.trim(), inFence, lang };
  });
}

/** Headings outside code fences: { level, title, line, end } where end is the last line of the section body. */
export function sections(ls) {
  const hs = [];
  for (const l of ls) {
    if (l.inFence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(l.raw);
    if (m) hs.push({ level: m[1].length, title: m[2].trim(), line: l.n });
  }
  for (let i = 0; i < hs.length; i++) {
    const next = hs.slice(i + 1).find((h) => h.level <= hs[i].level);
    hs[i].end = next ? next.line - 1 : ls.length;
  }
  return hs;
}

/** Lines belonging to a section (excluding the heading line itself). */
export function body(ls, section) {
  return ls.filter((l) => l.n > section.line && l.n <= section.end);
}

/** Find the first section whose title matches any of the patterns. */
export function findSection(secs, patterns) {
  return secs.find((s) => patterns.some((p) => p.test(normalizeTitle(s.title))));
}

export function normalizeTitle(t) {
  return t
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/[^\p{L}\p{N}\s/&-]/gu, '')
    .trim();
}

/** Parse every pipe table outside code fences. Returns { header: string[], rows: {cells, line}[], line }. */
export function tables(ls) {
  const out = [];
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i];
    const sep = ls[i + 1];
    if (l.inFence || !sep || !isRow(l.text) || !/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(sep.text)) continue;
    const header = cells(l.text);
    const rows = [];
    let j = i + 2;
    while (j < ls.length && isRow(ls[j].text) && !ls[j].inFence) {
      rows.push({ cells: cells(ls[j].text), line: ls[j].n });
      j++;
    }
    out.push({ header, rows, line: l.n, end: j > i + 2 ? ls[j - 1].n : sep.n });
    i = j - 1;
  }
  return out;
}

function isRow(t) {
  return t.includes('|') && /^\|?.+\|.+/.test(t);
}

export function cells(row) {
  let t = row.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  const out = [];
  let cur = '';
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '\\' && t[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (t[i] === '|') {
      out.push(cur.trim());
      cur = '';
    } else cur += t[i];
  }
  out.push(cur.trim());
  return out;
}

/** Remove inline code, links' URLs and emphasis so word rules see plain prose. */
export function prose(text) {
  return text
    .replace(/`[^`]*`/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/<!--.*?-->/g, ' ')
    .replace(/[*_~]/g, '');
}
