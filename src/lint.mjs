// Product-document lint: deterministic checks a reviewer would otherwise do by
// eye. English and Turkish are both understood, because PMs write in both.
import { body, findSection, lines, prose, sections, tables } from './markdown.mjs';

// word -> what to write instead. Matched as whole words, case-insensitive.
const VAGUE_EN = {
  fast: 'give a number: "p95 under 300 ms"',
  faster: 'say how much faster, measured how',
  quick: 'give a time or a step count',
  quickly: 'give a time or a step count',
  easy: 'say what the user no longer has to do, or a task-success target',
  easily: 'say what the user no longer has to do',
  simple: 'name the step that gets removed',
  intuitive: 'state the usability target, e.g. "80% finish without help"',
  'user-friendly': 'state the usability target',
  seamless: 'say which handoff stops failing',
  seamlessly: 'say which handoff stops failing',
  robust: 'name the failure it must survive',
  scalable: 'give the load it must handle',
  efficient: 'give the resource or time budget',
  optimize: 'say optimise what, from what, to what',
  optimise: 'say optimise what, from what, to what',
  improve: 'give the metric, baseline and target',
  improved: 'give the metric, baseline and target',
  better: 'say better on which metric, by how much',
  enhance: 'say what changes for the user',
  modern: 'name the concrete property',
  flexible: 'name the cases it must support',
  'best-in-class': 'name the benchmark',
  'world-class': 'name the benchmark',
  significant: 'give the number',
  significantly: 'give the number',
  various: 'list them',
  several: 'give the count',
  some: 'say which ones, or how many',
  many: 'give the count',
  'as needed': 'say who decides, and when',
  'as appropriate': 'state the rule',
  'and/or': 'pick one, or write both cases',
  etc: 'finish the list or say "for example"',
  'should be able': 'write the requirement as "must" plus a check',
  ideally: 'decide: is it required or not?',
  'nice to have': 'move it to non-goals or give it a priority',
};

const VAGUE_TR = {
  'hızlı': 'bir sayı ver: "p95 300 ms altında"',
  'hızlıca': 'süre ya da adım sayısı ver',
  'kolay': 'kullanıcının artık yapmak zorunda olmadığı adımı yaz',
  'kolayca': 'kullanıcının artık yapmak zorunda olmadığı adımı yaz',
  'basit': 'kalkan adımı yaz',
  'sezgisel': 'kullanılabilirlik hedefi yaz: "kullanıcıların %80\'i yardımsız tamamlar"',
  'kullanıcı dostu': 'kullanılabilirlik hedefi yaz',
  'sorunsuz': 'hangi geçişin artık hata vermeyeceğini yaz',
  'sağlam': 'dayanması gereken hatayı yaz',
  'ölçeklenebilir': 'kaldırması gereken yükü yaz',
  'verimli': 'süre ya da kaynak bütçesi ver',
  'iyileştirmek': 'metrik, mevcut değer ve hedef yaz',
  'iyileştirilecek': 'metrik, mevcut değer ve hedef yaz',
  'iyileştirme': 'metrik, mevcut değer ve hedef yaz',
  'geliştirilecek': 'kullanıcı için neyin değiştiğini yaz',
  'daha iyi': 'hangi metrikte, ne kadar',
  'modern': 'somut özelliği yaz',
  'esnek': 'desteklemesi gereken durumları say',
  'çeşitli': 'tek tek yaz',
  'birçok': 'sayı ver',
  'bazı': 'hangileri ya da kaç tane',
  'gerektiğinde': 'kimin, ne zaman karar verdiğini yaz',
  'uygun şekilde': 'kuralı yaz',
  've/veya': 'birini seç ya da iki durumu ayrı yaz',
  'vb': 'listeyi bitir ya da "örneğin" de',
  'vs': 'listeyi bitir ya da "örneğin" de',
  'ideal olarak': 'karar ver: gerekli mi değil mi?',
  'olsa iyi olur': 'kapsam dışına al ya da öncelik ver',
};

const PLACEHOLDER = /\b(TODO|TBD|TBC|FIXME|XXX)\b|\?\?\?|lorem ipsum|\[(fill|placeholder|doldur)[^\]]*\]|<(metric|target|baseline|owner|date|name)>/i;

const PRD_SECTIONS = [
  { key: 'problem', label: 'Problem', re: [/^problem/, /^(the )?problem statement/, /^sorun/, /^problem tanımı/, /^background/, /^arka plan/] },
  { key: 'users', label: 'Users / audience', re: [/^(target )?users?/, /^audience/, /^personas?/, /^who/, /^kullanıcılar?/, /^hedef kitle/, /^kimin için/] },
  { key: 'goals', label: 'Goals and success metrics', re: [/^goals?/, /^success( metrics| criteria)?/, /^metrics/, /^objectives?/, /^hedefler?/, /^başarı/, /^metrikler/] },
  { key: 'nongoals', label: 'Non-goals / out of scope', re: [/^non[- ]?goals?/, /^out of scope/, /^not in scope/, /^kapsam dışı/, /^hedef olmayan/] },
  { key: 'requirements', label: 'Requirements / scope', re: [/^(functional )?requirements?/, /^scope/, /^solution/, /^proposal/, /^user stories/, /^gereksinimler?/, /^kapsam$/, /^çözüm/, /^öneri/] },
  { key: 'questions', label: 'Open questions / risks', re: [/^open questions?/, /^questions?/, /^risks?/, /^açık sorular/, /^sorular/, /^riskler?/] },
];

const UPDATE_SECTIONS = [
  { key: 'summary', label: 'Summary (TL;DR)', re: [/^tl ?dr/, /^summary/, /^özet/, /^kısaca/] },
  { key: 'progress', label: 'Progress / done', re: [/^progress/, /^done/, /^shipped/, /^completed/, /^ilerleme/, /^tamamlanan/, /^yapılanlar/] },
  { key: 'next', label: 'Next', re: [/^next/, /^coming up/, /^plan/, /^sıradaki/, /^sonraki/, /^plan/] },
  { key: 'risks', label: 'Risks / blockers', re: [/^risks?/, /^blockers?/, /^issues/, /^riskler?/, /^engeller?/, /^sorunlar/] },
  { key: 'asks', label: 'Asks / decisions needed', re: [/^asks?/, /^decisions?( needed)?/, /^help needed/, /^talepler?/, /^kararlar?/, /^beklenen karar/, /^ihtiyaçlar/] },
];

const METRIC_SECTION = [/^goals?/, /^success/, /^metrics/, /^objectives?/, /^kpis?/, /^hedefler?/, /^başarı/, /^metrikler/];
const AC_SECTION = [/^acceptance/, /^kabul kriter/, /^definition of done/, /^criteria/];
const BASELINE = /\b(from|baseline|today|currently|current|now|vs\.?|compared)\b|→|->|mevcut|şu an|bugün|\d%?'?(d|t)(e|a)n\b/i;
const TIMEFRAME = /\b(by|within|in \d|per|days?|weeks?|months?|quarters?|years?|q[1-4]|h[12]|20\d\d|sprint|jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|june?|july?|aug(ust)?|sep(t|tember)?|oct(ober)?|nov(ember)?|dec(ember)?)\b|(^|[^\p{L}])(gün|günde|günü|hafta|haftada|haftası|ay|ayda|ayı|çeyrek|çeyrekte|yıl|yılda|ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)(?![\p{L}])|kadar|içinde|itibaren/iu;

const GHERKIN = {
  scenario: /^\s*(Scenario( Outline)?|Example|Senaryo( Taslağı)?|Örnek)\s*:/i,
  given: /^\s*(Given|Diyelim ki)\b/i,
  when: /^\s*(When|Eğer ki|Eğerki)\b/i,
  then: /^\s*(Then|O zaman|O halde)\b/i,
  background: /^\s*(Background|Geçmiş|Ön koşul)\s*:/i,
  feature: /^\s*(Feature|Özellik)\s*:/i,
};

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

function wordRe(word) {
  // \b does not understand Turkish letters, so bound words by "not a letter".
  return new RegExp(`(^|[^\\p{L}\\p{N}_-])(${escapeRe(word)})(?=$|[^\\p{L}\\p{N}_-])`, 'giu');
}

const VAGUE = [...Object.entries(VAGUE_EN), ...Object.entries(VAGUE_TR)].map(([w, hint]) => ({ w, hint, re: wordRe(w) }));

/** Guess the document type from front matter or the title. */
export function detectType(text) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(text.replace(/\r\n/g, '\n'));
  const t = fm && /^type:\s*([\w-]+)/m.exec(fm[1]);
  if (t) return t[1].toLowerCase();
  const title = (/^#\s+(.+)$/m.exec(text)?.[1] || '').toLowerCase();
  const w = (re) => new RegExp(`(^|[^\\p{L}])(${re})(?=$|[^\\p{L}])`, 'u').test(title);
  if (w('prd|product requirements?|requirements doc|ürün gereksinim\\p{L}*')) return 'prd';
  if (w('update|status|weekly|haftalık|durum|güncelleme')) return 'update';
  if (w('stories|slices|backlog|story|hikayeler|hikâyeler')) return 'stories';
  if (w('acceptance|kabul')) return 'criteria';
  return 'generic';
}

function frontMatterEnd(ls) {
  if (ls[0]?.text !== '---') return 0;
  const end = ls.findIndex((l, i) => i > 0 && l.text === '---');
  return end === -1 ? 0 : end + 1;
}

/**
 * @param {string} text
 * @param {{type?: string, ignoreWords?: string[]}} opts
 * @returns {{type: string, findings: {level: 'error'|'warn', rule: string, line: number|null, message: string, hint?: string}[]}}
 */
export function lint(text, opts = {}) {
  const type = opts.type || detectType(text);
  const ls = lines(text);
  const fmEnd = frontMatterEnd(ls);
  const secs = sections(ls);
  const findings = [];
  const add = (level, rule, line, message, hint) => findings.push({ level, rule, line, message, ...(hint ? { hint } : {}) });
  const ignore = new Set((opts.ignoreWords || []).map((w) => w.toLowerCase()));

  // ---------------------------------------------------------------- every document
  for (const l of ls) {
    if (l.inFence || l.n <= fmEnd || l.text.includes('pm-lint:ignore')) continue;
    if (PLACEHOLDER.test(l.raw)) add('warn', 'placeholder', l.n, `Placeholder left in: "${l.text.slice(0, 80)}"`, 'Fill it in or move it to Open questions with an owner.');
    if (/^#{1,6}\s/.test(l.raw)) continue;
    const p = prose(l.raw);
    const seen = new Set();
    for (const v of VAGUE) {
      if (ignore.has(v.w) || seen.has(v.w)) continue;
      v.re.lastIndex = 0;
      const m = v.re.exec(p);
      if (m && /\b(how|kaç)\s*$/i.test(p.slice(0, m.index + m[1].length))) continue; // "how many" is a question, not a claim
      if (m) {
        seen.add(v.w);
        add('warn', 'vague-word', l.n, `"${m[2]}" can't be checked by anyone.`, v.hint);
      }
    }
  }

  // ---------------------------------------------------------------- required sections
  const required = type === 'prd' ? PRD_SECTIONS : type === 'update' ? UPDATE_SECTIONS : [];
  for (const s of required) {
    if (!findSection(secs, s.re)) add('error', 'missing-section', null, `Missing section: ${s.label}.`);
  }

  // ---------------------------------------------------------------- success metrics
  const metrics = findSection(secs, METRIC_SECTION);
  if (metrics) {
    const items = body(ls, metrics).filter((l) => !l.inFence && /^\s*([-*+]|\d+[.)])\s+\S/.test(l.raw));
    for (const t of tables(body(ls, metrics))) {
      const h = t.header.map((x) => x.toLowerCase());
      const bCol = h.findIndex((x) => /baseline|current|today|mevcut|şu an|bugün/.test(x));
      const dCol = h.findIndex((x) => /^(by|date|deadline|when|due|tarih|ne zaman|son tarih|zaman)/.test(x));
      for (const r of t.rows) {
        items.push({
          n: r.line,
          raw: r.cells.join(' | '),
          hasBaseline: bCol !== -1 && /\d|unknown|bilinmiyor/i.test(r.cells[bCol] || ''),
          hasDate: dCol !== -1 && (r.cells[dCol] || '').trim() !== '',
        });
      }
    }
    if (!items.length && type === 'prd') add('error', 'metric-without-number', metrics.line, 'The success metrics section has no metrics.');
    for (const it of items) {
      const p = prose(it.raw);
      if (!/\d/.test(p)) {
        add(type === 'prd' ? 'error' : 'warn', 'metric-without-number', it.n, 'Success metric without a number.', 'Write metric, baseline, target and date: "checkout conversion 2.1% → 2.5% by 30 Nov".');
        continue;
      }
      if (!it.hasBaseline && !BASELINE.test(p)) add('warn', 'metric-without-baseline', it.n, 'Target without a baseline, so nobody can tell whether it is ambitious.', 'Add the current value: "from 2.1% to 2.5%".');
      if (!it.hasDate && !TIMEFRAME.test(p)) add('warn', 'metric-without-date', it.n, 'Target without a date or time window.', 'Add when it is measured: "by 30 Nov", "within 4 weeks of launch".');
    }
  }

  // ---------------------------------------------------------------- Gherkin
  const scenarios = [];
  let cur = null;
  let background = { given: false };
  for (const l of ls) {
    const inGherkin = l.inFence ? ['gherkin', 'feature', 'cucumber'].includes(l.lang) : true;
    if (!inGherkin) continue;
    if (GHERKIN.feature.test(l.raw)) {
      background = { given: false };
      cur = null;
      continue;
    }
    if (GHERKIN.background.test(l.raw)) {
      cur = background;
      continue;
    }
    if (GHERKIN.scenario.test(l.raw)) {
      cur = { line: l.n, title: l.text, given: background.given, when: false, then: false };
      scenarios.push(cur);
      continue;
    }
    if (!cur) continue;
    const text = l.raw.replace(/^\s*[-*]\s+/, '').replace(/\*\*/g, '');
    if (GHERKIN.given.test(text)) cur.given = true;
    if (GHERKIN.when.test(text)) cur.when = true;
    if (GHERKIN.then.test(text)) cur.then = true;
    if (/^#{1,6}\s/.test(l.raw) && !l.inFence) cur = null;
  }
  for (const s of scenarios) {
    const missing = ['given', 'when', 'then'].filter((k) => !s[k]);
    if (missing.length) add('error', 'gherkin-incomplete', s.line, `Scenario missing ${missing.map((m) => m[0].toUpperCase() + m.slice(1)).join(', ')}: ${s.title.slice(0, 70)}`, 'Every scenario needs a starting state (Given), one action (When) and an observable result (Then).');
  }

  // acceptance criteria written as plain bullets must still be checkable
  const ac = findSection(secs, AC_SECTION);
  if (ac) {
    for (const l of body(ls, ac)) {
      if (l.inFence || !/^\s*([-*+]|\d+[.)])\s+(\[[ xX]\]\s*)?\S/.test(l.raw)) continue;
      const t = prose(l.raw);
      if (/\b(given|when|then)\b|diyelim ki|eğer ki|o zaman/i.test(t)) continue;
      if (/\b(should|could|might|may|ideally)\b|meli|malı|bilir/i.test(t) && !/\d/.test(t)) {
        add('warn', 'criterion-not-testable', l.n, 'Criterion uses "should/could" without anything to measure.', 'Rewrite as an observable result: "Then the order total shows the discount" or add a number.');
      }
    }
  }

  // ---------------------------------------------------------------- user stories
  for (const l of ls) {
    if (l.inFence) continue;
    const t = prose(l.raw);
    if (/(^|[\s|>*-])as an?\s+[^,]{2,60},?\s+i\s+(want|need|can)\b/i.test(t) && !/\bso that\b|\bin order to\b/i.test(t)) {
      add('warn', 'story-without-value', l.n, 'User story without "so that": the reason is what lets you cut scope later.', 'Add "so that <outcome the user gets>".');
    }
    if (/\bolarak\b.{2,80}\b(istiyorum|isterim)\b/i.test(t) && !/\b(böylece|ki|amacıyla|için)\b/i.test(t)) {
      add('warn', 'story-without-value', l.n, 'Kullanıcı hikâyesinde "böylece" kısmı yok: neden yapıldığı, kapsamı daraltırken işe yarar.', '"…, böylece <kullanıcının kazancı>." ekle.');
    }
  }

  // ---------------------------------------------------------------- story slices
  if (type === 'stories') {
    for (const t of tables(ls)) {
      const h = t.header.map((x) => x.toLowerCase());
      const est = h.findIndex((x) => /^(points?|estimate|size|sp|puan|tahmin|efor)$/.test(x));
      const title = h.findIndex((x) => /^(story|slice|title|hikaye|hikâye|başlık)$/.test(x));
      for (const r of t.rows) {
        const v = est === -1 ? NaN : parseFloat((r.cells[est] || '').replace(',', '.'));
        if (v > 8) add('warn', 'story-too-big', r.line, `Slice estimated at ${v}: big slices hide risk.`, 'Split it again until each slice fits in a few days.');
        const name = title === -1 ? '' : r.cells[title] || '';
        if (/\s(and|ve)\s/i.test(name)) add('warn', 'story-does-two-things', r.line, `"${name.slice(0, 60)}" reads like two behaviours.`, 'Split on the "and" so each slice ships on its own.');
      }
    }
  }

  findings.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
  return { type, findings };
}
