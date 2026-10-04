import type {
  AttemptRecord,
  BktState,
  BktUpdateResult,
  ConceptMetric,
  ConceptMetricUpdateResult,
  MasteryStatus,
} from "./types";

export const MIN_PROBABILITY = 0.001;
export const MAX_PROBABILITY = 0.999;

export const DEFAULT_BKT_STATE: BktState = {
  p_known: 0.2,
  p_learn: 0.1,
  p_guess: 0.2,
  p_slip: 0.1,
};

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && !Number.isNaN(value);
}

export function clampProbability(value: number): number {
  if (!isFiniteNumber(value)) {
    return MIN_PROBABILITY;
  }
  return Math.min(MAX_PROBABILITY, Math.max(MIN_PROBABILITY, value));
}

export function sanitizeBktState(state: Partial<BktState> | null | undefined): BktState {
  return {
    p_known: clampProbability(state?.p_known ?? DEFAULT_BKT_STATE.p_known),
    p_learn: clampProbability(state?.p_learn ?? DEFAULT_BKT_STATE.p_learn),
    p_guess: clampProbability(state?.p_guess ?? DEFAULT_BKT_STATE.p_guess),
    p_slip: clampProbability(state?.p_slip ?? DEFAULT_BKT_STATE.p_slip),
  };
}

export function classifyMastery(pKnown: number): MasteryStatus {
  const p_known = clampProbability(pKnown);

  if (p_known < 0.35) {
    return "weak_recovery";
  }
  if (p_known < 0.7) {
    return "learning";
  }
  if (p_known < 0.9) {
    return "strengthening";
  }
  return "mastered";
}

export function posteriorKnownGivenCorrect(state: BktState): number {
  const sanitized = sanitizeBktState(state);
  const knownLikelihood = sanitized.p_known * (1 - sanitized.p_slip);
  const unknownLikelihood = (1 - sanitized.p_known) * sanitized.p_guess;
  const denominator = knownLikelihood + unknownLikelihood;

  if (denominator <= 0) {
    return sanitized.p_known;
  }

  return clampProbability(knownLikelihood / denominator);
}

export function posteriorKnownGivenIncorrect(state: BktState): number {
  const sanitized = sanitizeBktState(state);
  const knownLikelihood = sanitized.p_known * sanitized.p_slip;
  const unknownLikelihood = (1 - sanitized.p_known) * (1 - sanitized.p_guess);
  const denominator = knownLikelihood + unknownLikelihood;

  if (denominator <= 0) {
    return sanitized.p_known;
  }

  return clampProbability(knownLikelihood / denominator);
}

export function applyLearningTransition(
  posteriorKnown: number,
  pLearn: number,
): number {
  const posterior = clampProbability(posteriorKnown);
  const learn = clampProbability(pLearn);
  return clampProbability(posterior + (1 - posterior) * learn);
}

export function updateBktState(
  state: Partial<BktState> | null | undefined,
  isCorrect: boolean,
): BktUpdateResult {
  const previous = sanitizeBktState(state);
  const posterior_p_known = isCorrect
    ? posteriorKnownGivenCorrect(previous)
    : posteriorKnownGivenIncorrect(previous);
  const next_p_known = applyLearningTransition(
    posterior_p_known,
    previous.p_learn,
  );
  const next: BktState = {
    ...previous,
    p_known: next_p_known,
  };

  return {
    previous,
    posterior_p_known,
    next,
    delta_p_known: next.p_known - previous.p_known,
    observation: isCorrect ? "correct" : "incorrect",
  };
}

export function updateConceptMetric(
  metric: ConceptMetric,
  attempt: AttemptRecord,
): ConceptMetricUpdateResult {
  if (metric.concept_id !== attempt.concept_id) {
    throw new Error("Attempt concept_id must match metric concept_id.");
  }

  const update = updateBktState(metric, attempt.is_correct);
  const attemptedAt = attempt.attempted_at ?? new Date().toISOString();
  const attemptCount = Math.max(0, metric.attempt_count ?? 0) + 1;
  const correctCount =
    Math.max(0, metric.correct_count ?? 0) + (attempt.is_correct ? 1 : 0);
  const incorrectCount =
    Math.max(0, metric.incorrect_count ?? 0) + (attempt.is_correct ? 0 : 1);

  const nextMetric: ConceptMetric = {
    ...metric,
    ...update.next,
    prior_p_known: update.previous.p_known,
    last_observed_at: attemptedAt,
    attempt_count: attemptCount,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    mastery_status: classifyMastery(update.next.p_known),
  };

  return {
    ...update,
    metric: nextMetric,
  };
}
