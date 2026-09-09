/**
 * Contest-style test flow: per-item Run / Submit, a best-or-last scored rollup,
 * and a leaderboard.
 *
 *  - Run    : coding only, executes against the SAMPLE cases, does not score.
 *  - Submit : grades against ALL cases, appended to item_submissions (history),
 *             and the best (or last) result per item is rolled up into
 *             submission_results. submissions.score / penalty_seconds follow.
 *
 * Leaderboard rank: score DESC, then penalty_seconds ASC (sum of time from the
 * student's start to the submission that reached each item's best score), then
 * last_scored_at ASC.
 */
const db = require('../db');
const judge = require('./judge.service');
const { gradeItem } = require('./grading.service');
const { notFound, forbidden, badRequest } = require('../utils/http');

function verdictOf({ type, pointsAwarded, pointsPossible, needsManualReview, judgeStderr }) {
  if (needsManualReview) return 'pending_review';
  if (type === 'coding' && /compil/i.test(judgeStderr || '')) return 'compile_error';
  if (pointsPossible > 0 && pointsAwarded >= pointsPossible) return 'accepted';
  if (pointsAwarded > 0) return 'partial';
  return 'wrong';
}

async function loadContext(testId, studentId) {
  const test = await db.one(
    `SELECT t.*, tr.judge_language, tr.kind AS track_kind
       FROM tests t JOIN tracks tr ON tr.id = t.track_id
      WHERE t.id = :id AND t.is_published = 1`,
    { id: testId },
  );
  if (!test) throw notFound('Test not found');
  const submission = await db.one(
    `SELECT * FROM submissions WHERE test_id = :tid AND student_id = :sid`,
    { tid: testId, sid: studentId },
  );
  if (!submission) throw forbidden('Start the test first');
  return { test, submission };
}

function windowState(test) {
  const now = Date.now();
  const opens = test.opens_at ? new Date(test.opens_at).getTime() : null;
  const closes = test.closes_at ? new Date(test.closes_at).getTime() : null;
  if (opens && now < opens) return 'upcoming';
  if (closes && now > closes) return 'ended';
  return 'live';
}

/** effective deadline for one participant: min(test close, start + duration). */
function attemptEndsAt(test, submission) {
  const times = [];
  if (test.closes_at) times.push(new Date(test.closes_at).getTime());
  if (test.duration_minutes) {
    times.push(new Date(submission.started_at).getTime() + test.duration_minutes * 60000);
  }
  return times.length ? Math.min(...times) : null;
}

async function assertOpenForSubmit(test, submission) {
  if (submission.status !== 'in_progress') throw forbidden('Your attempt is already closed');
  if (windowState(test) === 'upcoming') throw forbidden('This test has not started yet');
  if (windowState(test) === 'ended') throw forbidden('This test has ended');
  const ends = attemptEndsAt(test, submission);
  if (ends && Date.now() > ends) throw forbidden('Your time for this test is up');
}

/** Run a coding answer against the sample cases only. Nothing is scored. */
async function runSamples({ testId, itemId, studentId, source }) {
  const { test, submission } = await loadContext(testId, studentId);
  await assertOpenForSubmit(test, submission);

  const item = await db.one(
    `SELECT * FROM test_items WHERE id = :id AND test_id = :tid`, { id: itemId, tid: testId },
  );
  if (!item) throw notFound('Question not found');
  if (item.type !== 'coding') throw badRequest('Run is only for coding questions');

  const cases = await db.query(
    `SELECT id, stdin, expected_stdout, is_sample, weight
       FROM test_cases WHERE item_id = :id AND is_sample = 1 ORDER BY sort_order, id`,
    { id: itemId },
  );
  if (cases.length === 0) throw badRequest('This question has no sample cases to run');

  const run = await judge.runAgainstCases({
    judgeLanguage: test.judge_language, source: source || '', cases,
  });

  await db.query(
    `INSERT INTO item_submissions
       (submission_id, item_id, student_id, kind, answer_text, language,
        cases_total, cases_passed, verdict, judge_stderr)
     VALUES (:sid, :iid, :stu, 'run', :src, :lang, :ct, :cp, :v, :err)`,
    {
      sid: submission.id, iid: itemId, stu: studentId, src: (source || '').slice(0, 200000),
      lang: test.judge_language,
      ct: run.casesTotal, cp: run.casesPassed,
      v: run.compileError ? 'compile_error' : (run.casesPassed === run.casesTotal ? 'accepted' : 'wrong'),
      err: (run.compileError || run.stderr || '').slice(0, 20000),
    },
  );

  return {
    casesTotal: run.casesTotal,
    casesPassed: run.casesPassed,
    compileError: run.compileError || null,
    cases: run.results.filter((r) => r.isSample),
  };
}

/** Grade one item submission, update history + rollup + participation totals. */
async function submitItem({ testId, itemId, studentId, answerText, selectedOptionId }) {
  const { test, submission } = await loadContext(testId, studentId);
  await assertOpenForSubmit(test, submission);

  const item = await db.one(
    `SELECT * FROM test_items WHERE id = :id AND test_id = :tid`, { id: itemId, tid: testId },
  );
  if (!item) throw notFound('Question not found');

  const track = { judge_language: test.judge_language };
  const g = await gradeItem({
    item: {
      id: item.id, type: item.type, points: item.points,
      grading_mode: item.grading_mode, expected_answer: item.expected_answer,
    },
    result: { answer_text: answerText ?? null, selected_option_id: selectedOptionId ?? null },
    track,
  });
  const verdict = verdictOf({
    type: item.type, pointsAwarded: g.pointsAwarded, pointsPossible: g.pointsPossible,
    needsManualReview: g.needsManualReview, judgeStderr: g.judgeStderr,
  });

  await db.transaction(async (conn) => {
    await conn.execute(
      `INSERT INTO item_submissions
         (submission_id, item_id, student_id, kind, answer_text, selected_option_id, language,
          cases_total, cases_passed, points_awarded, points_possible, verdict,
          judge_stdout, judge_stderr)
       VALUES (:sid, :iid, :stu, 'submit', :ans, :opt, :lang, :ct, :cp, :pa, :pp, :v, :out, :err)`,
      {
        sid: submission.id, iid: itemId, stu: studentId,
        ans: (answerText ?? '').slice(0, 200000), opt: selectedOptionId ?? null,
        lang: item.type === 'coding' ? test.judge_language : null,
        ct: g.casesTotal ?? null, cp: g.casesPassed ?? null,
        pa: g.pointsAwarded, pp: g.pointsPossible, v: verdict,
        out: g.judgeStdout ?? null, err: g.judgeStderr ?? null,
      },
    );

    // roll up: best (default) or last
    const [existingRows] = await conn.execute(
      `SELECT points_awarded FROM submission_results WHERE submission_id = :sid AND item_id = :iid`,
      { sid: submission.id, iid: itemId },
    );
    const prev = existingRows[0] ? Number(existingRows[0].points_awarded) : -1;
    const takeThis = test.scoring === 'last' || g.pointsAwarded > prev || prev < 0;
    const improved = g.pointsAwarded > prev;

    await conn.execute(
      `INSERT INTO submission_results
         (submission_id, item_id, answer_text, selected_option_id, cases_total, cases_passed,
          judge_stdout, judge_stderr, points_awarded, points_possible, needs_manual_review,
          graded_at, best_at, attempts, language)
       VALUES (:sid, :iid, :ans, :opt, :ct, :cp, :out, :err, :pa, :pp, :mr,
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, :lang)
       ON DUPLICATE KEY UPDATE
         attempts = attempts + 1,
         graded_at = CURRENT_TIMESTAMP,
         answer_text = IF(:take, VALUES(answer_text), answer_text),
         selected_option_id = IF(:take, VALUES(selected_option_id), selected_option_id),
         cases_total = IF(:take, VALUES(cases_total), cases_total),
         cases_passed = IF(:take, VALUES(cases_passed), cases_passed),
         judge_stdout = IF(:take, VALUES(judge_stdout), judge_stdout),
         judge_stderr = IF(:take, VALUES(judge_stderr), judge_stderr),
         points_awarded = IF(:take, VALUES(points_awarded), points_awarded),
         needs_manual_review = IF(:take, VALUES(needs_manual_review), needs_manual_review),
         language = IF(:take, VALUES(language), language),
         best_at = IF(:improved, CURRENT_TIMESTAMP, best_at)`,
      {
        sid: submission.id, iid: itemId,
        ans: answerText ?? null, opt: selectedOptionId ?? null,
        ct: g.casesTotal ?? null, cp: g.casesPassed ?? null,
        out: g.judgeStdout ?? null, err: g.judgeStderr ?? null,
        pa: g.pointsAwarded, pp: g.pointsPossible, mr: g.needsManualReview ? 1 : 0,
        lang: item.type === 'coding' ? test.judge_language : null,
        take: takeThis ? 1 : 0, improved: improved ? 1 : 0,
      },
    );

    await recomputeTotals(conn, submission.id, test);
  });

  const totals = await db.one(
    `SELECT score, max_score, submit_count, penalty_seconds FROM submissions WHERE id = :id`,
    { id: submission.id },
  );
  return {
    verdict,
    pointsAwarded: g.pointsAwarded,
    pointsPossible: g.pointsPossible,
    casesTotal: g.casesTotal ?? null,
    casesPassed: g.casesPassed ?? null,
    compileError: /compil/i.test(g.judgeStderr || '') ? (g.judgeStderr || '').slice(0, 4000) : null,
    needsManualReview: !!g.needsManualReview,
    score: totals.score,
    maxScore: totals.max_score,
  };
}

async function recomputeTotals(conn, submissionId, test) {
  const [aggRows] = await conn.execute(
    `SELECT COALESCE(SUM(sr.points_awarded), 0) AS score,
            COALESCE(SUM(TIMESTAMPDIFF(SECOND, s.started_at, sr.best_at)), 0) AS penalty
       FROM submission_results sr
       JOIN submissions s ON s.id = sr.submission_id
      WHERE sr.submission_id = :sid AND sr.points_awarded > 0`,
    { sid: submissionId },
  );
  const [maxRows] = await conn.execute(
    `SELECT COALESCE(SUM(points), 0) AS max FROM test_items WHERE test_id = :tid`,
    { tid: test.id },
  );
  const [curRows] = await conn.execute(
    `SELECT score FROM submissions WHERE id = :id`, { id: submissionId },
  );
  const agg = aggRows[0];
  const maxRow = maxRows[0];
  const cur = curRows[0];
  const newScore = Number(agg.score);
  const rose = newScore > Number(cur.score || 0);

  await conn.execute(
    `UPDATE submissions SET
       score = :score, max_score = :max, penalty_seconds = :pen,
       submit_count = submit_count + 1,
       last_scored_at = IF(:rose, CURRENT_TIMESTAMP, last_scored_at)
     WHERE id = :id`,
    { id: submissionId, score: newScore, max: Number(maxRow.max), pen: Number(agg.penalty), rose: rose ? 1 : 0 },
  );
}

async function finish({ testId, studentId }) {
  const { submission } = await loadContext(testId, studentId);
  if (submission.status !== 'in_progress') return submission;
  await db.query(
    `UPDATE submissions SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = :id`,
    { id: submission.id },
  );
  return { ...submission, status: 'submitted' };
}

async function leaderboard(testId, { limit = 200 } = {}) {
  const rows = await db.query(
    `SELECT u.id AS student_id, u.full_name, u.roll_number, u.username,
            s.score, s.max_score, s.penalty_seconds, s.submit_count,
            s.last_scored_at, s.status
       FROM submissions s
       JOIN users u ON u.id = s.student_id
      WHERE s.test_id = :tid
      ORDER BY s.score DESC, s.penalty_seconds ASC, s.last_scored_at ASC, s.id ASC
      LIMIT :lim`,
    { tid: testId, lim: limit },
  );
  let rank = 0;
  let prevKey = null;
  return rows.map((r, i) => {
    const key = `${r.score}|${r.penalty_seconds}`;
    if (key !== prevKey) { rank = i + 1; prevKey = key; }
    return {
      rank,
      studentId: r.student_id,
      name: r.full_name,
      rollNumber: r.roll_number,
      score: r.score ?? 0,
      maxScore: r.max_score ?? 0,
      penaltySeconds: r.penalty_seconds,
      submissions: r.submit_count,
      lastScoredAt: r.last_scored_at,
      status: r.status,
    };
  });
}

module.exports = {
  runSamples, submitItem, finish, leaderboard,
  windowState, attemptEndsAt, loadContext,
};
