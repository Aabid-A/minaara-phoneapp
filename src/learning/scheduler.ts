import { clampProbability, classifyMastery } from "./bkt";
import type {
  HighYieldness,
  MasteryStatus,
  RelatedPrerequisiteCompletion,
  ScheduleReason,
  SchedulingDecision,
  SchedulingInput,
} from "./types";

const DAY_MS = 86_400_000;
const RECENT_PREREQUISITE_WINDOW_HOURS = 24;

const HIGH_YIELD_PRIORITY_MULTIPLIERS: Record<HighYieldness, number> = {
  1: 0.85,
  2: 0.95,
  3: 1,
  4: 1.15,
  5: 1.3,
};

const HIGH_YIELD_INTERVAL_MULTIPLIERS: Record<HighYieldness, number> = {
  1: 1.25,
  2: 1.1,
  3: 1,
  4: 0.85,
  5: 0.75,
};

function coerceHighYieldness(value: number | null | undefined): HighYieldness {
  if (!Number.isFinite(value ?? Number.NaN)) {
    return 3;
  }

  const rounded = Math.round(value as number);
  if (rounded <= 1) return 1;
  if (rounded >= 5) return 5;
  return rounded as HighYieldness;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function roundDays(days: number): number {
  if (!Number.isFinite(days)) {
    return 0;
  }

  return Math.round(days * 100) / 100;
}

function baseIntervalForMastery(status: MasteryStatus, input?: number): number {
  if (input && Number.isFinite(input) && input > 0) {
    return input;
  }

  switch (status) {
    case "weak_recovery":
      return 0.5;
    case "learning":
      return 1;
    case "strengthening":
      return 3;
    case "mastered":
      return 7;
    case "new":
    default:
      return 1;
  }
}

function daysOverdue(nextReviewAt: Date | null, now: Date): number {
  if (!nextReviewAt) {
    return 0;
  }

  const diff = now.getTime() - nextReviewAt.getTime();
  return diff > 0 ? diff / DAY_MS : 0;
}

function countRecentSuccessfulPrerequisites(
  relatedPrerequisites: RelatedPrerequisiteCompletion[] | undefined,
  now: Date,
): number {
  const windowMs = RECENT_PREREQUISITE_WINDOW_HOURS * 60 * 60 * 1000;

  return (relatedPrerequisites ?? []).filter((completion) => {
    if (!completion.was_successful) {
      return false;
    }

    const completedAt = parseDate(completion.completed_at);
    if (!completedAt) {
      return false;
    }

    const ageMs = now.getTime() - completedAt.getTime();
    return ageMs >= 0 && ageMs <= windowMs;
  }).length;
}

function contextualPrimingMultiplier(input: {
  recentSuccessfulPrerequisites: number;
  isWeak: boolean;
}): number {
  if (input.isWeak || input.recentSuccessfulPrerequisites <= 0) {
    return 1;
  }

  return Math.min(1.35, 1 + input.recentSuccessfulPrerequisites * 0.1);
}

function choosePriorityReason(input: {
  masteryStatus: MasteryStatus;
  isDue: boolean;
  highYieldness: HighYieldness;
}): ScheduleReason {
  if (input.masteryStatus === "weak_recovery") {
    return "weak_recovery";
  }
  if (input.isDue) {
    return "due_review";
  }
  if (input.masteryStatus === "learning") {
    return "learning_reinforcement";
  }
  if (input.masteryStatus === "strengthening") {
    return "strengthening";
  }
  return "mastery_maintenance";
}

function buildPriorityDetail(input: {
  reason: ScheduleReason;
  daysOverdue: number;
  highYieldness: HighYieldness;
  contextualPrimingMultiplier: number;
}): string {
  const highYieldText =
    input.highYieldness >= 4 ? " This is a high-yield concept." : "";
  const primingText =
    input.contextualPrimingMultiplier > 1
      ? " Recent prerequisite success slightly widens the next interval."
      : "";

  switch (input.reason) {
    case "weak_recovery":
      return `This concept is below the recovery threshold and should be reviewed soon.${highYieldText}`;
    case "due_review":
      return input.daysOverdue >= 1
        ? `This concept is overdue by ${Math.max(1, Math.round(input.daysOverdue))} day(s).${highYieldText}`
        : `This concept has reached its next review point.${highYieldText}`;
    case "learning_reinforcement":
      return `This concept is still in the learning band and should stay in rotation.${highYieldText}${primingText}`;
    case "strengthening":
      return `This concept is improving and can be reviewed on a wider interval.${highYieldText}${primingText}`;
    case "mastery_maintenance":
      return `This concept is in the mastery band and only needs maintenance review.${highYieldText}${primingText}`;
  }
}

export function scheduleConceptReview(input: SchedulingInput): SchedulingDecision {
  const now = parseDate(input.now) ?? new Date();
  const pKnown = clampProbability(input.p_known);
  const masteryStatus = classifyMastery(pKnown);
  const isWeak = pKnown < 0.35;
  const nextReviewAt = parseDate(input.next_review_at);
  const overdueDays = daysOverdue(nextReviewAt, now);
  const isDue = isWeak || !nextReviewAt || nextReviewAt <= now;
  const highYieldness = coerceHighYieldness(input.high_yieldness);
  const recentSuccessfulPrerequisites = countRecentSuccessfulPrerequisites(
    input.related_prerequisites,
    now,
  );
  const primingMultiplier = contextualPrimingMultiplier({
    recentSuccessfulPrerequisites,
    isWeak,
  });
  const baseInterval = baseIntervalForMastery(
    masteryStatus,
    input.base_interval_days,
  );
  const highYieldIntervalMultiplier =
    HIGH_YIELD_INTERVAL_MULTIPLIERS[highYieldness];
  const intervalDays = Math.max(
    0.25,
    roundDays(baseInterval * highYieldIntervalMultiplier * primingMultiplier),
  );
  const scheduledAt = addDays(now, intervalDays);
  const highYieldPriorityMultiplier =
    HIGH_YIELD_PRIORITY_MULTIPLIERS[highYieldness];
  const weaknessScore = (1 - pKnown) * 70;
  const dueScore = isDue ? 25 + Math.min(35, overdueDays * 10) : 0;
  const recoveryScore = isWeak ? 30 : 0;
  const primingDeprioritization =
    primingMultiplier > 1 && !isDue ? (primingMultiplier - 1) * 20 : 0;
  const priorityScore =
    (weaknessScore + dueScore + recoveryScore) *
      highYieldPriorityMultiplier -
    primingDeprioritization;
  const priorityReason = choosePriorityReason({
    masteryStatus,
    isDue,
    highYieldness,
  });

  return {
    concept_id: input.concept_id,
    p_known: pKnown,
    mastery_status: masteryStatus,
    is_weak: isWeak,
    is_due: isDue,
    days_overdue: roundDays(overdueDays),
    interval_days: intervalDays,
    next_review_at: scheduledAt.toISOString(),
    priority_score: Math.round(priorityScore * 100) / 100,
    priority_reason: priorityReason,
    priority_detail: buildPriorityDetail({
      reason: priorityReason,
      daysOverdue: overdueDays,
      highYieldness,
      contextualPrimingMultiplier: primingMultiplier,
    }),
    high_yield_multiplier: highYieldPriorityMultiplier,
    contextual_priming_multiplier: primingMultiplier,
  };
}

export function orderScheduledConcepts(
  inputs: SchedulingInput[],
): SchedulingDecision[] {
  return inputs
    .map(scheduleConceptReview)
    .sort((a, b) => b.priority_score - a.priority_score);
}
