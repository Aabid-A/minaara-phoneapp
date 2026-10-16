/** Canonical wire contract. Phone keeps an exact generated copy; see contract:sync. */
export const PRACTICE_RPC = 'submit_practice_attempt_v1';
export type PracticeRequest = {
  attemptId: string;
  expectedUserId: string;
  questionId: string;
  conceptId: string;
  selectedOptionId?: string;
  cardRating?: 'know' | 'dont_know';
  timeSpentMs?: number;
};
export type PracticeMetric = {
  user_id: string; concept_id: string;
  p_known: number; p_learn: number; p_guess: number; p_slip: number;
  attempt_count: number; correct_count: number; incorrect_count: number;
  mastery_label: 'weak_recovery' | 'learning' | 'strengthening' | 'mastered';
  streak: number; ease_factor: number; interval_days: number;
  next_review_at: string; last_attempted_at: string; last_bkt_update_at: string;
};
export type PracticeResult = {
  version: 1; attemptId: string; userId: string; questionId: string; conceptId: string;
  isCorrect: boolean; nextReviewAt: string; observedAt: string; replayed: boolean;
  correctOptionIds: string[]; metric: PracticeMetric;
};
type RpcClient = { rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }> };
export type PracticeFailure = { kind: 'auth' | 'conflict' | 'invalid' | 'unavailable' | 'retryable'; message: string; canRetry: boolean };
export function practiceFailure(error: unknown): PracticeFailure {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'NETWORK';
  if (['PT401', 'PGRST301', 'PGRST303', 'AUTH'].includes(code)) return { kind: 'auth', message: 'Your session is no longer valid for account practice. Sign in again before continuing.', canRetry: false };
  if (['PT409','PENDING_CONFLICT'].includes(code)) return { kind: 'conflict', message: 'This answer ID conflicts with another submission. Your pending answer has been kept. Contact support before starting another answer.', canRetry: false };
  if (['PT422', '22P02', '22003','PENDING_CORRUPT'].includes(code)) return { kind: 'invalid', message: 'This question or answer is no longer valid. Your answer was not confirmed. Reload the web session or contact support to recover a pending phone answer.', canRetry: false };
  if (['PT503', 'PGRST202', 'PGRST000', 'PGRST001', 'PGRST002', '42501', 'UNAVAILABLE'].includes(code)) return { kind: 'unavailable', message: 'Account practice is temporarily unavailable. Your answer is not confirmed. Try again later.', canRetry: true };
  return { kind: 'retryable', message: 'Your answer could not be confirmed. Retry the same answer safely without counting it twice.', canRetry: true };
}
export class PracticeSubmissionError extends Error {
  constructor(public code: string, message = practiceFailure({ code }).message) { super(message); this.name = 'PracticeSubmissionError'; }
}
/** Auth service outages are not evidence that a learner needs a new password. */
export function requirePracticeIdentity(user: { id: string } | null, error: { status?: number; name?: string } | null, expectedUserId?: string) {
  if (error) throw new PracticeSubmissionError(error.status === 400 || error.status === 401 || error.status === 403 || error.name === 'AuthSessionMissingError' ? 'AUTH' : 'UNAVAILABLE');
  if (!user || (expectedUserId && user.id !== expectedUserId)) throw new PracticeSubmissionError('AUTH');
}
export type PracticeOutcome = { ok: true; result: PracticeResult } | { ok: false; failure: PracticeFailure };
/** Serializable errors survive Next production Server Action error redaction. */
export async function practiceOutcome(run: () => Promise<PracticeResult>): Promise<PracticeOutcome> {
  try { return { ok: true, result: await run() }; } catch (error) { return { ok: false, failure: practiceFailure(error) }; }
}
export type PracticeGate = { enabled: boolean; message: string };
export async function getPracticeGate(client: RpcClient): Promise<PracticeGate> {
  try {
    const { data, error } = await client.rpc('get_practice_gate_v1', {});
    if (error) throw new PracticeSubmissionError(['PT401','PGRST301','PGRST303','PGRST202'].includes(error.code ?? '') ? error.code! : 'UNAVAILABLE');
    const gate = data as { enabled?: unknown; message?: unknown } | null;
    if (!gate || typeof gate.enabled !== 'boolean' || typeof gate.message !== 'string') throw new PracticeSubmissionError('UNAVAILABLE');
    return { enabled: gate.enabled, message: gate.message };
  } catch (error) {
    if (error instanceof PracticeSubmissionError) throw error;
    throw new PracticeSubmissionError('UNAVAILABLE');
  }
}
/** Used before the web action's serializable outcome: legacy callers must reject. */
export function requirePracticeClient(request: (Pick<PracticeRequest, 'attemptId' | 'expectedUserId'> & { clientContract?: unknown }) | null | undefined) {
  if (!request?.attemptId || !request.expectedUserId || request.clientContract !== 2) throw new Error('This practice page is out of date. Reload before continuing.');
}
export async function submitPracticeAttempt(client: RpcClient, request: PracticeRequest): Promise<PracticeResult> {
  // Explicit whitelist: never forward correctness, metrics, client clocks or credentials.
  const { data, error } = await client.rpc(PRACTICE_RPC, {
    p_attempt_id: request.attemptId, p_expected_user_id: request.expectedUserId,
    p_question_id: request.questionId, p_concept_id: request.conceptId,
    p_selected_option_id: request.selectedOptionId ?? null,
    p_card_rating: request.cardRating ?? null, p_time_spent_ms: request.timeSpentMs ?? null,
  });
  if (error) {
    throw new PracticeSubmissionError(error.code ?? 'NETWORK');
  }
  const result = data as PracticeResult | null;
  if (!result || result.version !== 1 || result.attemptId !== request.attemptId || result.userId !== request.expectedUserId
      || result.questionId !== request.questionId || result.conceptId !== request.conceptId
      || !Array.isArray(result.correctOptionIds) || !result.correctOptionIds.every(id => typeof id === 'string')
      || typeof result.isCorrect !== 'boolean' || typeof result.replayed !== 'boolean'
      || !Number.isFinite(Date.parse(result.nextReviewAt)) || !Number.isFinite(Date.parse(result.observedAt))
      || !result.metric || result.metric.user_id !== result.userId || result.metric.concept_id !== result.conceptId
      || result.metric.next_review_at !== result.nextReviewAt || !Number.isFinite(result.metric.p_known)
      || !Number.isInteger(result.metric.attempt_count)) {
    throw new PracticeSubmissionError('INVALID_RESULT', 'Your answer could not be confirmed. Retry to finish saving safely.');
  }
  return result;
}
