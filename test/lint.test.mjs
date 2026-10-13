import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { detectType, lint } from '../src/lint.mjs';

const rules = (r) => r.findings.map((f) => f.rule);
const has = (r, rule, line) => r.findings.some((f) => f.rule === rule && (line === undefined || f.line === line));
const ex = (p) => readFileSync(new URL(`../examples/${p}`, import.meta.url), 'utf8');

test('good examples pass without findings', () => {
  for (const f of ['good/prd-delivery-estimate.md', 'good/stories-delivery-estimate.md', 'good/criteria-delivery-window.md', 'good/update-week-42.md', 'good/backlog-rice.md']) {
    assert.deepEqual(lint(ex(f)).findings, [], f);
  }
});

test('the weak PRD trips every rule it should', () => {
  const r = lint(ex('before/weak-prd.md'));
  assert.equal(r.type, 'prd');
  const missing = r.findings.filter((f) => f.rule === 'missing-section').map((f) => f.message);
  assert.deepEqual(missing, ['Missing section: Problem.', 'Missing section: Users / audience.', 'Missing section: Non-goals / out of scope.']);
  for (const rule of ['vague-word', 'metric-without-number', 'story-without-value', 'gherkin-incomplete', 'placeholder']) assert.ok(rules(r).includes(rule), rule);
});

test('type detection: front matter wins, then the title', () => {
  assert.equal(detectType('---\ntype: update\n---\n# PRD: x'), 'update');
  assert.equal(detectType('# PRD: Checkout'), 'prd');
  assert.equal(detectType('# Product requirements for search'), 'prd');
  assert.equal(detectType('# Weekly update'), 'update');
  assert.equal(detectType('# Ürün gereksinim dokümanı'), 'prd');
  assert.equal(detectType('# Haftalık durum'), 'update');
  assert.equal(detectType('# Notes'), 'generic');
});

test('vague words: whole words only, English and Turkish, code and headings ignored', () => {
  const r = lint([
    '# Notes',
    '## Fast lane',
    'The page must be fast.',
    'Breakfast is not a vague word, nor is `fast` in code.',
    'Ödeme sayfası hızlı ve kullanıcı dostu olmalı.',
    'How many users? Kaç kullanıcı?',
    '```',
    'seamless inside a code block',
    '```',
  ].join('\n'));
  const hits = r.findings.filter((f) => f.rule === 'vague-word').map((f) => [f.line, f.message.split('"')[1]]);
  assert.deepEqual(hits, [[3, 'fast'], [5, 'hızlı'], [5, 'kullanıcı dostu']]);
});

test('vague words can be ignored per run or per line', () => {
  assert.equal(lint('Some users.', { ignoreWords: ['some'] }).findings.length, 0);
  assert.equal(lint('Some users. <!-- pm-lint:ignore -->').findings.length, 0);
});

test('metrics: number, baseline and date, in bullets or tables', () => {
  const doc = [
    '# PRD: x',
    '## Success metrics',
    '- Conversion goes up',
    '- Conversion to 2.5%',
    '- Conversion from 2.1% to 2.5% by 30 Nov',
    "- Dönüşüm %2,1'den %2,5'e, 30 Kasım'a kadar",
    '| Metric | Baseline | Target | By |',
    '| --- | --- | --- | --- |',
    '| Tickets per 1,000 orders | 64 | 45 | Q4 |',
    '| Late deliveries | | under 5% | |',
  ].join('\n');
  const r = lint(doc, { type: 'generic' });
  assert.ok(has(r, 'metric-without-number', 3));
  assert.ok(has(r, 'metric-without-baseline', 4));
  assert.ok(has(r, 'metric-without-date', 4));
  for (const l of [5, 6, 9]) assert.ok(!r.findings.some((f) => f.line === l && f.rule.startsWith('metric')), `line ${l}`);
  assert.ok(has(r, 'metric-without-baseline', 10));
  assert.ok(has(r, 'metric-without-date', 10));
  // in a PRD a metric without a number is an error, elsewhere a warning
  assert.equal(r.findings.find((f) => f.line === 3).level, 'warn');
  assert.equal(lint(doc, { type: 'prd' }).findings.find((f) => f.line === 3).level, 'error');
});

test('Gherkin: Given, When and Then are all required; Background counts as Given', () => {
  const r = lint([
    '```gherkin',
    'Feature: Cart',
    '  Background:',
    '    Given a signed-in shopper',
    '  Scenario: Add item',
    '    When they add a lamp',
    '    Then the cart shows 1 item',
    '  Scenario: Remove item',
    '    Given a cart with a lamp',
    '    When they remove it',
    '```',
  ].join('\n'));
  const g = r.findings.filter((f) => f.rule === 'gherkin-incomplete');
  assert.equal(g.length, 1);
  assert.equal(g[0].line, 8);
  assert.match(g[0].message, /missing Then/);
});

test('Gherkin in Turkish', () => {
  const ok = lint('```gherkin\nSenaryo: Sepete ekleme\n  Diyelim ki giriş yapmış bir müşteri\n  Eğer ki bir lamba eklerse\n  O zaman sepette 1 ürün görünür\n```');
  assert.equal(ok.findings.length, 0);
  const bad = lint('```gherkin\nSenaryo: Eksik\n  Diyelim ki bir müşteri\n```');
  assert.match(bad.findings[0].message, /missing When, Then/);
});

test('plain acceptance criteria with "should" and nothing measurable are flagged', () => {
  const r = lint('# x\n## Acceptance criteria\n- The page should load\n- The page loads in under 2 s\n- Then the badge is shown\n- Sayfa açılmalı\n');
  const lines = r.findings.filter((f) => f.rule === 'criterion-not-testable').map((f) => f.line);
  assert.deepEqual(lines, [3, 6]);
});

test('user stories need a reason, in English and Turkish', () => {
  const r = lint([
    'As a shopper, I want to save my cart.',
    'As a shopper, I want to save my cart, so that I can finish on my phone.',
    'Bir müşteri olarak sepetimi kaydetmek istiyorum.',
    'Bir müşteri olarak sepetimi kaydetmek istiyorum, böylece telefonda bitirebilirim.',
  ].join('\n'));
  assert.deepEqual(r.findings.filter((f) => f.rule === 'story-without-value').map((f) => f.line), [1, 3]);
});

test('story slices: too big, or two behaviours in one', () => {
  const r = lint('---\ntype: stories\n---\n| # | Slice | Points |\n| --- | --- | --- |\n| 1 | Pay and track delivery | 13 |\n| 2 | Pay by card | 3 |\n');
  assert.ok(has(r, 'story-too-big', 6));
  assert.ok(has(r, 'story-does-two-things', 6));
  assert.equal(r.findings.filter((f) => f.line === 7).length, 0);
});

test('update needs summary, progress, next, risks and asks; Turkish headings count', () => {
  const r = lint('---\ntype: update\n---\n# Update\n## TL;DR\nx\n## Progress\nx\n');
  assert.deepEqual(r.findings.filter((f) => f.rule === 'missing-section').map((f) => f.message), [
    'Missing section: Next.', 'Missing section: Risks / blockers.', 'Missing section: Asks / decisions needed.',
  ]);
  const tr = lint('---\ntype: update\n---\n# Haftalık güncelleme\n## Özet\nx\n## Tamamlananlar\nx\n## Sıradaki\nx\n## Riskler\nx\n## Kararlar\nx\n');
  assert.equal(tr.findings.filter((f) => f.rule === 'missing-section').length, 0);
});

test('placeholders are reported, front matter is not', () => {
  const r = lint('---\nowner: TBD\n---\n# x\nOwner: TBD\nTarget: <target>\n');
  assert.deepEqual(r.findings.filter((f) => f.rule === 'placeholder').map((f) => f.line), [5, 6]);
});
