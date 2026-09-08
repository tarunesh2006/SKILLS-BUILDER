/**
 * Judge engine client.
 *
 * Submitted student code is executed ONLY inside the Piston container, never in
 * this Node process. This module just does HTTP to that container.
 *
 * Piston API: https://github.com/engineer-man/piston#api-v2
 */
const config = require('../config');

// Map our track.judge_language values to Piston runtime names.
const LANG = {
  c: { language: 'c', version: '*' },
  'c++': { language: 'c++', version: '*' },
  java: { language: 'java', version: '*' },
  python: { language: 'python', version: '*' },
};

const FILENAME = {
  c: 'main.c',
  'c++': 'main.cpp',
  java: 'Main.java',
  python: 'main.py',
};

async function pistonExecute({ judgeLanguage, source, stdin }) {
  const lang = LANG[judgeLanguage];
  if (!lang) throw new Error(`Unsupported judge language: ${judgeLanguage}`);

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    config.judge.compileTimeoutMs + config.judge.runTimeoutMs + 5000,
  );

  try {
    const res = await fetch(`${config.judge.url}/api/v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        language: lang.language,
        version: lang.version,
        files: [{ name: FILENAME[judgeLanguage], content: source }],
        stdin: stdin ?? '',
        compile_timeout: config.judge.compileTimeoutMs,
        run_timeout: config.judge.runTimeoutMs,
        run_memory_limit: 128 * 1024 * 1024,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Judge HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalize(s) {
  return String(s ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

/**
 * Run `source` against a list of { id, stdin, expected_stdout, weight } cases.
 * Returns { casesTotal, casesPassed, weightTotal, weightPassed, results[], compileError, stderr }.
 */
async function runAgainstCases({ judgeLanguage, source, cases }) {
  const results = [];
  let casesPassed = 0;
  let weightPassed = 0;
  let weightTotal = 0;
  let compileError = null;
  let lastStderr = '';

  for (const c of cases) {
    weightTotal += c.weight || 1;
    // eslint-disable-next-line no-await-in-loop
    const out = await pistonExecute({ judgeLanguage, source, stdin: c.stdin });

    if (out.compile && out.compile.code !== 0) {
      compileError = out.compile.stderr || out.compile.output || 'Compilation failed';
      results.push({ caseId: c.id, passed: false, reason: 'compile_error' });
      break; // no point running further cases
    }

    const run = out.run || {};
    lastStderr = run.stderr || lastStderr;
    const actual = normalize(run.stdout);
    const expected = normalize(c.expected_stdout);
    const timedOut = run.signal === 'SIGKILL' || /timed out/i.test(run.stderr || '');
    const passed = !timedOut && run.code === 0 && actual === expected;

    if (passed) {
      casesPassed += 1;
      weightPassed += c.weight || 1;
    }
    results.push({
      caseId: c.id,
      passed,
      isSample: !!c.is_sample,
      // only echo I/O for sample cases; hidden cases stay hidden
      ...(c.is_sample
        ? { stdin: c.stdin, expected, actual, stderr: run.stderr || '' }
        : {}),
      exitCode: run.code,
      timedOut,
    });
  }

  return {
    casesTotal: cases.length,
    casesPassed,
    weightTotal,
    weightPassed,
    results,
    compileError,
    stderr: lastStderr,
  };
}

/** Run once and just return stdout/stderr (used for query grading_mode=auto_judge). */
async function runOnce({ judgeLanguage, source, stdin }) {
  const out = await pistonExecute({ judgeLanguage, source, stdin });
  const run = out.run || {};
  return {
    compileError:
      out.compile && out.compile.code !== 0
        ? out.compile.stderr || out.compile.output
        : null,
    stdout: run.stdout || '',
    stderr: run.stderr || '',
    exitCode: run.code,
  };
}

module.exports = { runAgainstCases, runOnce, normalize };
