import { DEFAULT_BKT_STATE, updateConceptMetric } from './bkt';
import { scheduleConceptReview } from './scheduler';
import type { HighYieldness } from './types';
import type { Metric, Question } from '../types';

export function nextMetric(question: Question, correct: boolean, previous: Metric | undefined, now: string): Metric {
  const updated = updateConceptMetric(previous ?? { concept_id: question.concept_id, ...DEFAULT_BKT_STATE }, {
    concept_id: question.concept_id, question_id: question.id, is_correct: correct, attempted_at: now, source: question.question_type,
  });
  const schedule = scheduleConceptReview({ concept_id: question.concept_id, p_known: updated.metric.p_known,
    now, next_review_at: previous?.next_review_at, base_interval_days: previous?.interval_days,
    high_yieldness: Math.min(5, Math.max(1, Math.round(question.high_yieldness))) as HighYieldness });
  return { ...updated.metric, next_review_at: schedule.next_review_at,
    interval_days: schedule.interval_days < 1 ? 0 : Math.round(schedule.interval_days),
    streak: correct ? (previous?.streak ?? 0) + 1 : 0,
    ease_factor: Math.round(Math.max(1.3, Math.min(3, (previous?.ease_factor ?? 2.5) + (correct ? .05 : -.2))) * 100) / 100,
    mastery_status: schedule.mastery_status, last_reviewed_at: now };
}
export function dueQuestions(questions: Question[], metrics: Record<string, Metric>, now: string) {
  const time = new Date(now).getTime();
  return questions.filter(q => {
    const metric = metrics[q.concept_id];
    return metric && (!metric.next_review_at || new Date(metric.next_review_at).getTime() <= time);
  });
}
