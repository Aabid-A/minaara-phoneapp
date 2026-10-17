export type ISODateString = string;

export type Probability = number;

export type HighYieldness = 1 | 2 | 3 | 4 | 5;

export type MasteryStatus =
  | "new"
  | "weak_recovery"
  | "learning"
  | "strengthening"
  | "mastered";

export type AttemptSource = "card" | "mcq" | "review" | "manual";

export interface BktState {
  p_known: Probability;
  p_learn: Probability;
  p_guess: Probability;
  p_slip: Probability;
}

export interface ConceptMetric extends BktState {
  concept_id: string;
  user_id?: string;
  prior_p_known?: Probability | null;
  last_observed_at?: ISODateString | null;
  last_reviewed_at?: ISODateString | null;
  next_review_at?: ISODateString | null;
  attempt_count?: number;
  correct_count?: number;
  incorrect_count?: number;
  mastery_status?: MasteryStatus;
}

export interface AttemptRecord {
  concept_id: string;
  question_id?: string;
  is_correct: boolean;
  attempted_at?: ISODateString;
  source?: AttemptSource;
  response_time_ms?: number;
}

export interface BktUpdateResult {
  previous: BktState;
  posterior_p_known: Probability;
  next: BktState;
  delta_p_known: number;
  observation: "correct" | "incorrect";
}

export interface ConceptMetricUpdateResult extends BktUpdateResult {
  metric: ConceptMetric;
}

export interface RelatedPrerequisiteCompletion {
  concept_id: string;
  completed_at: ISODateString;
  was_successful: boolean;
}

export interface SchedulingInput {
  concept_id: string;
  p_known: Probability;
  now?: ISODateString;
  next_review_at?: ISODateString | null;
  last_reviewed_at?: ISODateString | null;
  base_interval_days?: number;
  high_yieldness?: HighYieldness;
  related_prerequisites?: RelatedPrerequisiteCompletion[];
}

export type ScheduleReason =
  | "weak_recovery"
  | "due_review"
  | "learning_reinforcement"
  | "strengthening"
  | "mastery_maintenance";

export interface SchedulingDecision {
  concept_id: string;
  p_known: Probability;
  mastery_status: MasteryStatus;
  is_weak: boolean;
  is_due: boolean;
  days_overdue: number;
  interval_days: number;
  next_review_at: ISODateString;
  priority_score: number;
  priority_reason: ScheduleReason;
  priority_detail: string;
  high_yield_multiplier: number;
  contextual_priming_multiplier: number;
}
