/**
 * AI question author — the admin describes a question in plain words and gets a
 * polished statement + sample/hidden test cases back to review.
 *
 * No API key: this talks to a LOCAL model server (Ollama by default) over HTTP.
 * Point it at an OpenAI-compatible endpoint with AI_API_STYLE=openai if wanted.
 *
 * Trust model: the model DRAFTS. For coding questions the generated reference
 * solution is then run through the Piston judge and every test case's expected
 * output is REPLACED with what the reference solution actually prints — so the
 * cases the admin saves are correct by construction, not by the model's word.
 */
const config = require('../config');
const judge = require('./judge.service');
const { badRequest, ApiError } = require('../utils/http');

const JUDGE_LANGS = new Set(['c', 'c++', 'java', 'python']);

function notConfigured(detail) {
  return new ApiError(501, detail || 'The AI question author is not set up on this server');
}

/* --------------------------------------------------------------- model call */

async function withTimeout(fn) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), config.ai.timeoutMs);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(t);
  }
}

async function chatJson(systemPrompt, userPrompt) {
  const { style, baseUrl, model, apiKey } = config.ai;

  if (style === 'openai') {
    const res = await withTimeout((signal) => fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    }));
    if (res.status === 404) throw notConfigured(`Model "${model}" not found at ${baseUrl}`);
    if (!res.ok) throw notConfigured(`AI endpoint responded ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // Ollama native
  const res = await withTimeout((signal) => fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      format: 'json',
      options: { temperature: 0.4, num_ctx: 8192 },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })).catch((e) => {
    if (e.name === 'AbortError') throw notConfigured('The model took too long to respond');
    throw notConfigured(`Could not reach a local model at ${baseUrl} — is Ollama running?`);
  });
  if (res.status === 404) {
    throw notConfigured(`Model "${model}" is not pulled — run:  ollama pull ${model}`);
  }
  if (!res.ok) throw notConfigured(`Local model responded ${res.status}`);
  const data = await res.json();
  return data.message?.content || '';
}

function extractJson(text) {
  const s = String(text).trim();
  const direct = tryParse(s);
  if (direct) return direct;
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const p = tryParse(fenced[1]);
    if (p) return p;
  }
  const brace = s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1);
  const p = tryParse(brace);
  if (p) return p;
  throw badRequest('The model did not return usable JSON — try again or rephrase the idea');
}
function tryParse(x) { try { return JSON.parse(x); } catch { return null; } }

/* -------------------------------------------------------------------- status */

async function status() {
  const { style, baseUrl, model } = config.ai;
  try {
    if (style === 'openai') {
      const res = await withTimeout((signal) => fetch(`${baseUrl}/v1/models`, {
        signal,
        headers: config.ai.apiKey ? { Authorization: `Bearer ${config.ai.apiKey}` } : {},
      }));
      return { enabled: res.ok, style, model, baseUrl, detail: res.ok ? 'ready' : `HTTP ${res.status}` };
    }
    const res = await withTimeout((signal) => fetch(`${baseUrl}/api/tags`, { signal }));
    if (!res.ok) return { enabled: false, style, model, baseUrl, detail: `HTTP ${res.status}` };
    const data = await res.json();
    const names = (data.models || []).map((m) => m.name);
    const hasModel = names.some((n) => n === model || n.split(':')[0] === model.split(':')[0]);
    return {
      enabled: true,
      style,
      model,
      baseUrl,
      modelPulled: hasModel,
      detail: hasModel ? 'ready' : `run: ollama pull ${model}`,
      available: names,
    };
  } catch {
    return { enabled: false, style, model, baseUrl, detail: `no model server at ${baseUrl}` };
  }
}

/* ------------------------------------------------------------------ generate */

const CODING_SYS = 'You are an experienced programming-contest problem setter. '
  + 'Reply with ONLY a single valid JSON object, no prose, no markdown fences.';

function codingPrompt({ idea, language, difficulty, sampleCount, hiddenCount }) {
  return `Design ONE ${difficulty} problem for a ${language} coding test based on this idea:
"""${idea}"""

Rules:
- The program reads ALL input from standard input and writes ONLY the answer to standard output.
- The statement must be unambiguous: input format, output format, and constraints.
- Give a CORRECT reference solution in ${language} (reads stdin, writes stdout, compiles as-is).
- Give ${sampleCount} sample case(s) and ${hiddenCount} hidden case(s) covering edge cases.
- stdin/stdout are exact strings (use \\n for newlines in the JSON).

Return exactly:
{"title":"...",
 "promptMd":"full statement in Markdown with ## Input, ## Output, ## Constraints, ## Example sections",
 "points": <integer 50-150 by difficulty>,
 "referenceSolution":"<${language} source>",
 "sampleCases":[{"stdin":"...","expectedStdout":"..."}],
 "hiddenCases":[{"stdin":"...","expectedStdout":"..."}]}`;
}

const MCQ_SYS = 'You are a computer-science instructor writing exam questions. '
  + 'Reply with ONLY a single valid JSON object, no prose, no markdown fences.';

function mcqPrompt({ idea, difficulty, type }) {
  if (type === 'short_answer') {
    return `Write ONE ${difficulty} short-answer question about: """${idea}""".
Return: {"promptMd":"the question in Markdown","points":<5-20>,"expectedAnswer":"the exact expected answer (short)"}`;
  }
  return `Write ONE ${difficulty} multiple-choice question about: """${idea}""".
Exactly 4 options, exactly one correct.
Return: {"promptMd":"the question in Markdown","points":<5-20>,"options":[{"label":"...","isCorrect":true|false}],"explanationMd":"why the answer is correct"}`;
}

/** Run the reference solution and rebuild every case's expected output. */
async function verifyCases(judgeLanguage, referenceSolution, cases) {
  const out = { language: judgeLanguage, compiled: null, kept: 0, dropped: 0, warnings: [] };
  if (!referenceSolution || !JUDGE_LANGS.has(judgeLanguage)) {
    out.warnings.push('cases not machine-verified (no judge language) — check them by hand');
    return { cases, verification: out };
  }
  const verified = [];
  let compileFailed = false;
  for (const c of cases) {
    // eslint-disable-next-line no-await-in-loop
    const r = await judge.runOnce({ judgeLanguage, source: referenceSolution, stdin: c.stdin ?? '' });
    if (r.compileError) { compileFailed = true; break; }
    if (r.exitCode !== 0) { out.dropped += 1; continue; }
    verified.push({ ...c, expectedStdout: String(r.stdout).replace(/\s+$/, '') });
    out.kept += 1;
  }
  out.compiled = !compileFailed;
  if (compileFailed) {
    out.warnings.push('the AI reference solution did not compile — cases kept as-is, verify manually');
    return { cases, verification: out };
  }
  if (out.dropped) out.warnings.push(`${out.dropped} case(s) dropped (reference solution errored on them)`);
  return { cases: verified, verification: out };
}

async function generate({ idea, type = 'coding', judgeLanguage, difficulty = 'medium', sampleCount = 2, hiddenCount = 5 }) {
  const clean = String(idea || '').trim();
  if (clean.length < 8) throw badRequest('Describe the question idea in a bit more detail');
  if (clean.length > 4000) throw badRequest('That idea is too long');
  const diff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';

  if (type === 'coding') {
    const language = JUDGE_LANGS.has(judgeLanguage) ? judgeLanguage : 'python';
    const raw = await chatJson(CODING_SYS, codingPrompt({
      idea: clean, language, difficulty: diff,
      sampleCount: clamp(sampleCount, 1, 4), hiddenCount: clamp(hiddenCount, 1, 12),
    }));
    const j = extractJson(raw);
    const sample = asCases(j.sampleCases).map((c) => ({ ...c, isSample: true }));
    const hidden = asCases(j.hiddenCases).map((c) => ({ ...c, isSample: false }));
    if (sample.length + hidden.length === 0) throw badRequest('The model produced no test cases — try again');

    const { cases, verification } = await verifyCases(language, j.referenceSolution, [...sample, ...hidden]);

    return {
      draft: {
        type: 'coding',
        promptMd: buildPrompt(j),
        points: intIn(j.points, 50, 150, 100),
        cases: cases.map((c) => ({
          stdin: String(c.stdin ?? ''),
          expectedStdout: String(c.expectedStdout ?? ''),
          isSample: !!c.isSample,
        })),
      },
      meta: {
        title: j.title || null,
        referenceSolution: j.referenceSolution || null,
        language,
        verification,
      },
      note: verification.compiled
        ? `Reference solution compiled — ${verification.kept} case(s) verified against it.`
        : 'Review the statement and cases carefully before saving.',
    };
  }

  // mcq / short_answer / query
  const raw = await chatJson(MCQ_SYS, mcqPrompt({ idea: clean, difficulty: diff, type }));
  const j = extractJson(raw);
  const draft = { type, promptMd: String(j.promptMd || j.question || '').trim(), points: intIn(j.points, 1, 20, 5) };
  if (!draft.promptMd) throw badRequest('The model produced no question text — try again');

  if (type === 'mcq') {
    const options = (Array.isArray(j.options) ? j.options : [])
      .map((o) => ({ label: String(o.label ?? o.text ?? '').trim(), isCorrect: !!(o.isCorrect ?? o.correct) }))
      .filter((o) => o.label);
    if (options.length < 2 || !options.some((o) => o.isCorrect)) {
      throw badRequest('The model produced an invalid option set — try again');
    }
    draft.options = options;
  } else if (j.expectedAnswer != null && String(j.expectedAnswer).trim()) {
    draft.expectedAnswer = String(j.expectedAnswer).trim();
    draft.gradingMode = 'auto_exact';
  } else {
    draft.gradingMode = 'manual';
  }

  return {
    draft,
    meta: { explanationMd: j.explanationMd || null },
    note: 'AI draft — review before saving.',
  };
}

/* --------------------------------------------------------------- tiny helpers */

function clamp(n, lo, hi) { n = Number(n); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : lo; }
function intIn(n, lo, hi, dflt) { n = Number(n); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : dflt; }
function asCases(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((c) => ({ stdin: String(c.stdin ?? c.input ?? ''), expectedStdout: String(c.expectedStdout ?? c.output ?? c.expected ?? '') }))
    .filter((c) => c.stdin !== '' || c.expectedStdout !== '');
}
function buildPrompt(j) {
  const body = String(j.promptMd || j.statement || j.description || '').trim();
  const head = j.title && !new RegExp(`^#+\\s*${escapeRe(j.title)}`, 'i').test(body) ? `## ${j.title}\n\n` : '';
  return (head + body).slice(0, 100000);
}
function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

module.exports = { status, generate };
