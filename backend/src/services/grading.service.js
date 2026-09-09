/**
 * Grades a submitted test attempt.
 *
 *  - mcq            -> compare selected option to the correct option
 *  - short_answer   -> auto_exact match, else flagged for manual review
 *  - query          -> auto_exact | auto_judge | manual
 *  - coding         -> run source against test_cases via the Piston judge
 */
const db = require('../db');
const judge = require('./judge.service');

function norm(s) {
  return String(s ?? '').trim().replace(/\r\n/g, '\n').replace(/\s+$/gm, '');
}

async function gradeItem({ item, result, track }) {
  const possible = item.points;

  if (item.type === 'mcq') {
    const correct = await db.one(
      `SELECT id FROM test_item_options WHERE item_id = :id AND is_correct = 1 LIMIT 1`,
      { id: item.id },
    );
    const awarded =
      correct && String(correct.id) === String(result.selected_option_id) ? possible : 0;
    return { pointsAwarded: awarded, pointsPossible: possible, needsManualReview: 0 };
  }

  if (item.type === 'short_answer') {
    if (item.grading_mode === 'auto_exact' && item.expected_answer != null) {
      const ok = norm(result.answer_text) === norm(item.expected_answer);
      return { pointsAwarded: ok ? possible : 0, pointsPossible: possible, needsManualReview: 0 };
    }
    return { pointsAwarded: 0, pointsPossible: possible, needsManualReview: 1 };
  }

  if (item.type === 'query') {
    if (item.grading_mode === 'auto_exact' && item.expected_answer != null) {
      const ok = norm(result.answer_text) === norm(item.expected_answer);
      return { pointsAwarded: ok ? possible : 0, pointsPossible: possible, needsManualReview: 0 };
    }
    // auto_judge / manual for query is left as a manual-review path in this scaffold
    return { pointsAwarded: 0, pointsPossible: possible, needsManualReview: 1 };
  }

  if (item.type === 'coding') {
    const cases = await db.query(
      `SELECT id, stdin, expected_stdout, is_sample, weight
         FROM test_cases WHERE item_id = :id ORDER BY sort_order, id`,
      { id: item.id },
    );
    if (cases.length === 0) {
      return { pointsAwarded: 0, pointsPossible: possible, needsManualReview: 1 };
    }
    const run = await judge.runAgainstCases({
      judgeLanguage: track.judge_language,
      source: result.answer_text || '',
      cases,
    });
    const fraction = run.weightTotal > 0 ? run.weightPassed / run.weightTotal : 0;
    return {
      pointsAwarded: Math.round(possible * fraction),
      pointsPossible: possible,
      needsManualReview: 0,
      casesTotal: run.casesTotal,
      casesPassed: run.casesPassed,
      judgeStdout: JSON.stringify(run.results).slice(0, 60000),
      judgeStderr: (run.compileError || run.stderr || '').slice(0, 20000),
    };
  }

  return { pointsAwarded: 0, pointsPossible: possible, needsManualReview: 1 };
}

/** Grade every result row of a submission and write scores back. */
async function gradeSubmission(submissionId) {
  const submission = await db.one(`SELECT * FROM submissions WHERE id = :id`, { id: submissionId });
  if (!submission) throw new Error('submission not found');
  const track = await db.one(
    `SELECT t.* FROM tracks t JOIN tests te ON te.track_id = t.id WHERE te.id = :id`,
    { id: submission.test_id },
  );

  const rows = await db.query(
    `SELECT sr.*, ti.type, ti.points, ti.grading_mode, ti.expected_answer, ti.id AS item_id
       FROM submission_results sr
       JOIN test_items ti ON ti.id = sr.item_id
      WHERE sr.submission_id = :id`,
    { id: submissionId },
  );

  let score = 0;
  let maxScore = 0;
  let anyManual = false;

  for (const r of rows) {
    const item = {
      id: r.item_id, type: r.type, points: r.points,
      grading_mode: r.grading_mode, expected_answer: r.expected_answer,
    };
    // eslint-disable-next-line no-await-in-loop
    const g = await gradeItem({ item, result: r, track });
    score += g.pointsAwarded;
    maxScore += g.pointsPossible;
    if (g.needsManualReview) anyManual = true;

    // eslint-disable-next-line no-await-in-loop
    await db.query(
      `UPDATE submission_results SET
         points_awarded = :pa, points_possible = :pp,
         needs_manual_review = :mr, cases_total = :ct, cases_passed = :cp,
         judge_stdout = :out, judge_stderr = :err, graded_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      {
        id: r.id,
        pa: g.pointsAwarded, pp: g.pointsPossible,
        mr: g.needsManualReview ? 1 : 0,
        ct: g.casesTotal ?? null, cp: g.casesPassed ?? null,
        out: g.judgeStdout ?? null, err: g.judgeStderr ?? null,
      },
    );
  }

  await db.query(
    `UPDATE submissions SET status = 'graded', graded_at = CURRENT_TIMESTAMP,
       score = :score, max_score = :max WHERE id = :id`,
    { id: submissionId, score, max: maxScore },
  );

  return { score, maxScore, needsManualReview: anyManual };
}

module.exports = { gradeSubmission, gradeItem, norm };
