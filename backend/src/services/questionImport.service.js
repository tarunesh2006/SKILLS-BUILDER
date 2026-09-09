/**
 * Import test questions without typing them field by field.
 *
 *  - fromUrl(url)      -> fetches a public web page and best-effort extracts a
 *                         problem statement + visible sample cases into a DRAFT
 *                         question (the admin reviews and saves it normally).
 *  - parseBulk(text)   -> turns a JSON / CSV / Markdown blob holding many
 *                         questions into an array of question objects ready for
 *                         the same insert path as the "Add question" form.
 *
 * No scraping libraries: the HTML is reduced with small regex passes, the same
 * dependency-free style as googleAuth.service.js.
 *
 * SECURITY: the URL is fetched server-side, so every hop is checked against a
 * private-address blocklist (SSRF guard) before the request is made.
 */
const dns = require('dns').promises;
const net = require('net');
const { badRequest } = require('../utils/http');

const FETCH_TIMEOUT_MS = 12000;
const MAX_BYTES = 3_000_000;
const MAX_REDIRECTS = 4;

/* ----------------------------------------------------------------- SSRF guard */

function isBlockedIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;             // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;   // carrier-grade NAT
    return false;
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase().replace(/^\[|\]$/g, '');
    if (x === '::1' || x === '::') return true;
    if (x.startsWith('::ffff:')) return isBlockedIp(x.slice(7));
    if (/^f[cd]/.test(x)) return true;                   // unique local
    if (x.startsWith('fe80')) return true;               // link-local
    return false;
  }
  return true;
}

async function assertPublicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw badRequest('That is not a valid URL'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw badRequest('Only http(s) links can be imported');
  }
  let resolved;
  try {
    resolved = await dns.lookup(u.hostname, { all: true });
  } catch {
    throw badRequest('Could not resolve that host');
  }
  if (resolved.some((r) => isBlockedIp(r.address))) {
    throw badRequest('That host is not allowed');
  }
  return u;
}

/* --------------------------------------------------------------------- fetch */

async function fetchPage(startUrl) {
  let url = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    // eslint-disable-next-line no-await-in-loop
    const u = await assertPublicUrl(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let res;
    try {
      // eslint-disable-next-line no-await-in-loop
      res = await fetch(u, {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SkillBuilder-Import/1.0; +education)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    } catch (e) {
      throw badRequest(e.name === 'AbortError' ? 'The page took too long to load' : 'Could not reach that page');
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), u).toString();
      continue;
    }
    if (!res.ok) throw badRequest(`The page responded ${res.status}`);

    const ct = res.headers.get('content-type') || '';
    if (ct && !/html|xml|text/i.test(ct)) throw badRequest('That link is not an HTML page');

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) throw badRequest('That page is too large to import');
    return { html: buf.toString('utf8'), finalUrl: res.url || u.toString() };
  }
  throw badRequest('Too many redirects');
}

/* ------------------------------------------------------------- HTML reducers */

const ENTITIES = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&#39;': "'", '&apos;': "'", '&mdash;': '—', '&ndash;': '–', '&hellip;': '…',
  '&le;': '<=', '&ge;': '>=', '&times;': '×', '&minus;': '-', '&rarr;': '→',
};
function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}
function safeCodePoint(n) {
  try { return String.fromCodePoint(n); } catch { return ''; }
}

/** Inner text of the first element matching a tag+attr predicate. */
function firstBlock(html, tagRe) {
  const m = html.match(tagRe);
  return m ? m[1] : null;
}

function htmlToText(html) {
  return decodeEntities(
    String(html)
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|noscript|svg|template|nav|footer|form|button)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|article|h[1-6]|tr|pre|blockquote)>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '\n- ')
      .replace(/<\/(li|ul|ol)>/gi, '\n')
      .replace(/<(h[12])[^>]*>/gi, '\n## ')
      .replace(/<h[3-6][^>]*>/gi, '\n### ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Pull the most statement-like region before falling back to <body>. */
function mainRegion(html) {
  const candidates = [
    /<div[^>]*class="[^"]*problem-statement[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*(?:id|class)="[^"]*(?:question|problem|challenge|content|statement)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/(?:div|section|main)>/i,
    /<body[^>]*>([\s\S]*?)<\/body>/i,
  ];
  for (const re of candidates) {
    const block = firstBlock(html, re);
    if (block && htmlToText(block).length > 120) return block;
  }
  return html;
}

function pageTitle(html) {
  const h1 = firstBlock(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return htmlToText(h1).slice(0, 160);
  const t = firstBlock(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  return t ? decodeEntities(t).trim().slice(0, 160) : null;
}

/* --------------------------------------------------------- sample extraction */

function preText(pre) {
  // keep the newlines a <pre> carries; drop any inner spans/line divs
  return decodeEntities(
    String(pre)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(div|li|p)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  ).replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/^\n+|\n+$/g, '');
}

function casesFromCodeforces(html) {
  const cases = [];
  const inputs = [...html.matchAll(/<div[^>]*class="[^"]*\binput\b[^"]*"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi)];
  const outputs = [...html.matchAll(/<div[^>]*class="[^"]*\boutput\b[^"]*"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi)];
  for (let i = 0; i < Math.min(inputs.length, outputs.length); i += 1) {
    cases.push({ stdin: preText(inputs[i][1]), expectedStdout: preText(outputs[i][1]), isSample: true });
  }
  return cases;
}

function casesFromLabels(text) {
  // "Sample Input 0 ... Sample Output 0 ..." style, working on reduced text
  const cases = [];
  const re = /sample\s*input\s*#?\s*\d*\s*\n([\s\S]*?)\n\s*sample\s*output\s*#?\s*\d*\s*\n([\s\S]*?)(?=\n\s*(?:sample\s*input|explanation|constraints|note|$))/gi;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(text))) {
    const stdin = m[1].trim();
    const expectedStdout = m[2].trim();
    if (expectedStdout) cases.push({ stdin, expectedStdout, isSample: true });
  }
  return cases;
}

function casesFromPrePairs(html) {
  const pres = [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi)].map((x) => preText(x[1])).filter(Boolean);
  const cases = [];
  for (let i = 0; i + 1 < pres.length; i += 2) {
    cases.push({ stdin: pres[i], expectedStdout: pres[i + 1], isSample: true });
  }
  return cases;
}

// tables that pair sample input / output in adjacent cells (Kattis, many others)
function casesFromSampleTable(html) {
  const cases = [];
  const tables = html.matchAll(/<table[^>]*class="[^"]*sample[^"]*"[^>]*>([\s\S]*?)<\/table>/gi);
  for (const t of tables) {
    const cells = [...t[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => preText(c[1])).filter(Boolean);
    for (let i = 0; i + 1 < cells.length; i += 2) {
      cases.push({ stdin: cells[i], expectedStdout: cells[i + 1], isSample: true });
    }
  }
  return cases;
}

function dedupeCases(cases) {
  const seen = new Set();
  const out = [];
  for (const c of cases) {
    const key = `${c.stdin} ${c.expectedStdout}`;
    if (seen.has(key) || (!c.stdin && !c.expectedStdout)) continue;
    seen.add(key);
    out.push({
      stdin: c.stdin.slice(0, 20000),
      expectedStdout: c.expectedStdout.slice(0, 20000),
      isSample: true,
    });
  }
  return out.slice(0, 12);
}

const JUNK_LINE = /^(?:\d+\s+languages?|edit links|jump to (?:navigation|content|search).*|from wikipedia,.*|read\s+edit\s+view history|move to sidebar|toggle .* subsection.*|retrieved from ".*"|\[\d+\]|hide|show)$/i;

/** Drop leading menu / breadcrumb noise and obvious wiki chrome anywhere. */
function trimLeadingNoise(text) {
  const lines = text.split('\n').filter((l) => !JUNK_LINE.test(l.trim()));
  let i = 0;
  const lead = /^(?:-\s.{0,24}|##?\s*(?:navigation|contents).*)$/i;
  while (i < lines.length && (lines[i].trim() === '' || lead.test(lines[i].trim()))) i += 1;
  while (i < lines.length && /^-\s/.test(lines[i].trim()) && lines[i].trim().length < 40) i += 1;
  return lines.slice(i).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Fetch a URL and return a draft question for the admin to review. */
async function fromUrl(rawUrl, { type = 'coding' } = {}) {
  const { html, finalUrl } = await fetchPage(rawUrl);
  const region = mainRegion(html);
  const title = pageTitle(html);
  let statement = trimLeadingNoise(htmlToText(region));
  // collapse an immediately repeated leading heading
  statement = statement.replace(/^(#{2,3}\s*(.+))\n+\1\n+/i, '$1\n\n');

  let cases = dedupeCases([
    ...casesFromCodeforces(html),
    ...casesFromSampleTable(html),
    ...casesFromLabels(statement),
    ...(casesFromCodeforces(html).length ? [] : casesFromPrePairs(region)),
  ]);
  // if the region gave nothing, widen to the whole page for pre-pairs
  if (cases.length === 0) cases = dedupeCases(casesFromPrePairs(html));

  const hasTitle = title
    && new RegExp(`^#{0,3}\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(statement.trim());
  const promptMd = [
    title && !hasTitle ? `## ${title}` : null,
    statement,
    `\n---\n_Imported from ${finalUrl} — review before saving._`,
  ].filter(Boolean).join('\n\n').slice(0, 100000);

  return {
    draft: {
      type,
      promptMd,
      points: 100,
      cases: type === 'coding' ? cases : [],
    },
    sourceUrl: finalUrl,
    detected: { title, caseCount: cases.length, statementChars: statement.length },
    note: 'Automatic extraction is approximate — check the statement and sample cases, and add the hidden cases the judge should grade against.',
  };
}

/* ------------------------------------------------------------- bulk importer */

const TYPES = new Set(['coding', 'mcq', 'short_answer', 'query']);

function normalizeQuestion(q, i) {
  const where = `question ${i + 1}`;
  const type = String(q.type || q.kind || '').trim().toLowerCase();
  if (!TYPES.has(type)) throw badRequest(`${where}: type must be one of coding, mcq, short_answer, query`);
  const promptMd = String(q.promptMd ?? q.prompt ?? q.question ?? q.statement ?? '').trim();
  if (!promptMd) throw badRequest(`${where}: missing prompt text`);

  const out = { type, promptMd, points: Number(q.points) > 0 ? Math.floor(Number(q.points)) : 10 };

  if (type === 'mcq') {
    const raw = q.options || q.choices || [];
    const options = raw.map((o) => (typeof o === 'string'
      ? { label: o, isCorrect: false }
      : { label: String(o.label ?? o.text ?? '').trim(), isCorrect: !!(o.isCorrect ?? o.correct) }))
      .filter((o) => o.label);
    if (options.length < 2) throw badRequest(`${where}: an MCQ needs at least two options`);
    if (!options.some((o) => o.isCorrect)) {
      if (q.answer != null && options[Number(q.answer)]) options[Number(q.answer)].isCorrect = true;
      else throw badRequest(`${where}: mark the correct option`);
    }
    out.options = options;
  } else if (type === 'coding') {
    const raw = q.cases || q.tests || q.testCases || [];
    out.cases = raw.map((c) => ({
      stdin: String(c.stdin ?? c.input ?? ''),
      expectedStdout: String(c.expectedStdout ?? c.expected ?? c.output ?? ''),
      isSample: !!(c.isSample ?? c.sample),
      weight: Number(c.weight) > 0 ? Math.floor(Number(c.weight)) : 1,
    })).filter((c) => c.stdin !== '' || c.expectedStdout !== '');
  } else {
    const expected = q.expectedAnswer ?? q.answer ?? q.expected;
    if (expected != null && String(expected).trim()) {
      out.expectedAnswer = String(expected);
      out.gradingMode = 'auto_exact';
    } else {
      out.gradingMode = 'manual';
    }
  }
  return out;
}

function parseJson(content) {
  let data;
  try { data = JSON.parse(content); } catch { throw badRequest('That is not valid JSON'); }
  const arr = Array.isArray(data) ? data : (data.questions || data.items);
  if (!Array.isArray(arr) || arr.length === 0) throw badRequest('Expected a JSON array of questions');
  return arr.map(normalizeQuestion);
}

// CSV columns: type,prompt,points,optionA,optionB,optionC,optionD,correct(A-D) | expected
function parseCsv(content) {
  const rows = csvRows(content);
  if (rows.length < 2) throw badRequest('The CSV needs a header row and at least one question');
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name) => head.indexOf(name);
  const out = [];
  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r];
    if (row.every((c) => c.trim() === '')) continue;
    const get = (name) => (idx(name) >= 0 ? (row[idx(name)] ?? '').trim() : '');
    const q = { type: get('type') || 'mcq', prompt: get('prompt') || get('question'), points: get('points') };
    if (q.type === 'mcq') {
      q.options = ['a', 'b', 'c', 'd', 'e']
        .map((k) => get(`option${k}`))
        .filter(Boolean)
        .map((label) => ({ label, isCorrect: false }));
      const correct = get('correct').toLowerCase();
      const ci = 'abcde'.indexOf(correct);
      if (ci >= 0 && q.options[ci]) q.options[ci].isCorrect = true;
      else if (q.options.find((o) => o.label.toLowerCase() === correct)) {
        q.options.find((o) => o.label.toLowerCase() === correct).isCorrect = true;
      }
    } else {
      q.expected = get('expected') || get('answer');
    }
    out.push(normalizeQuestion(q, r - 1));
  }
  if (out.length === 0) throw badRequest('No question rows found in the CSV');
  return out;
}

function csvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const s = text.replace(/\r\n?/g, '\n');
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/*
 * Markdown convention (forgiving): questions separated by a line of `---`.
 * Optional first line `@type=mcq points=5`. Coding sample cases as paired
 * fenced ```in / ```out blocks. MCQ options as `- [x]` / `- [ ]` lines.
 */
function parseMarkdown(content, fallbackType) {
  const chunks = content.split(/\n-{3,}\n/).map((c) => c.trim()).filter(Boolean);
  const out = [];
  chunks.forEach((chunk, i) => {
    const lines = chunk.split('\n');
    const meta = {};
    if (/^@/.test(lines[0])) {
      lines.shift().replace(/^@/, '').split(/\s+/).forEach((kv) => {
        const [k, v] = kv.split('=');
        if (k && v) meta[k] = v;
      });
    }
    const type = (meta.type || fallbackType || 'coding').toLowerCase();
    const q = { type, points: meta.points };

    const ins = [...chunk.matchAll(/```in\s*\n([\s\S]*?)```/g)].map((m) => m[1].replace(/\n$/, ''));
    const outs = [...chunk.matchAll(/```out\s*\n([\s\S]*?)```/g)].map((m) => m[1].replace(/\n$/, ''));
    const optLines = lines.filter((l) => /^\s*[-*]\s*\[[ xX]\]/.test(l));

    let promptMd = chunk;
    if (ins.length || outs.length) promptMd = chunk.replace(/```in[\s\S]*?```/g, '').replace(/```out[\s\S]*?```/g, '');
    if (optLines.length) promptMd = promptMd.split('\n').filter((l) => !/^\s*[-*]\s*\[[ xX]\]/.test(l)).join('\n');
    q.prompt = promptMd.replace(/^@.*\n/, '').trim();

    if (type === 'coding') {
      q.cases = ins.map((stdin, k) => ({ stdin, expectedStdout: outs[k] ?? '', isSample: true }));
    } else if (type === 'mcq') {
      q.options = optLines.map((l) => ({
        label: l.replace(/^\s*[-*]\s*\[[ xX]\]\s*/, '').trim(),
        isCorrect: /\[[xX]\]/.test(l),
      }));
    }
    out.push(normalizeQuestion(q, i));
  });
  if (out.length === 0) throw badRequest('No questions found — separate each with a line of ---');
  return out;
}

function parseBulk({ format, content, fallbackType }) {
  const f = String(format || '').toLowerCase();
  if (!content || !content.trim()) throw badRequest('Nothing to import');
  if (content.length > 2_000_000) throw badRequest('That import is too large');
  if (f === 'json') return parseJson(content);
  if (f === 'csv') return parseCsv(content);
  if (f === 'markdown' || f === 'md') return parseMarkdown(content, fallbackType);
  throw badRequest('Unknown import format');
}

module.exports = { fromUrl, parseBulk };
