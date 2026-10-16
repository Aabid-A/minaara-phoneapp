import type { PracticeRequest, PracticeResult } from './generated/practice-submission';
export type PendingStorage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> };
export class PendingAttemptError extends Error {
  constructor(message: string, public code = 'LOCAL_STORAGE') { super(message); }
}
/** One credential-free, account-scoped durable request. Never store preview data. */
export function createPendingAttempts(storage: PendingStorage) {
  const key = (userId: string) => `minaara.practice.pending.v1.${userId}`;
  function decode(raw: string, userId: string): PracticeRequest {
    try {
      const parsed = JSON.parse(raw), r = parsed.request as PracticeRequest;
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (parsed.version !== 1 || r.expectedUserId !== userId || ![r.attemptId,r.expectedUserId,r.questionId,r.conceptId].every(id => typeof id === 'string' && uuid.test(id))
        || (r.timeSpentMs !== undefined && (!Number.isInteger(r.timeSpentMs) || r.timeSpentMs < 0 || r.timeSpentMs > 2147483647))
        || !(r.cardRating ? ['know','dont_know'].includes(r.cardRating) && !r.selectedOptionId : typeof r.selectedOptionId === 'string' && uuid.test(r.selectedOptionId))) throw new Error();
      // Reconstruct a whitelist; no tokens, question content or metric snapshots.
      return { attemptId:r.attemptId, expectedUserId:r.expectedUserId, questionId:r.questionId, conceptId:r.conceptId,
        ...(r.cardRating ? {cardRating:r.cardRating} : {selectedOptionId:r.selectedOptionId}), ...(r.timeSpentMs !== undefined ? {timeSpentMs:r.timeSpentMs} : {}) };
    } catch { throw new PendingAttemptError('Pending answer recovery data could not be read. It has been kept. Contact support before starting another answer.', 'PENDING_CORRUPT'); }
  }
  async function load(userId: string) {
    try { const raw = await storage.getItem(key(userId)); return raw === null ? null : decode(raw,userId); }
    catch (error) { if (error instanceof PendingAttemptError) throw error; throw new PendingAttemptError('Pending answer storage is unavailable. No new answer will be sent. Try again when storage is available.'); }
  }
  // Serializes check/write/send/clear within this runtime, including double taps.
  let tail: Promise<unknown> = Promise.resolve();
  async function submit(request: PracticeRequest, send: (request: PracticeRequest) => Promise<PracticeResult>) {
    const operation = tail.then(async () => {
      const safe = decode(JSON.stringify({version:1,request}),request.expectedUserId);
      const previous = await load(safe.expectedUserId);
      if (previous && JSON.stringify(previous) !== JSON.stringify(safe)) throw new PendingAttemptError('Another answer is pending. Confirm that answer before starting another.', 'PENDING_CONFLICT');
      if (!previous) {
        try {
          await storage.setItem(key(safe.expectedUserId),JSON.stringify({version:1,request:safe}));
          const persisted = await load(safe.expectedUserId);
          if (JSON.stringify(persisted) !== JSON.stringify(safe)) throw new Error();
        } catch { throw new PendingAttemptError('Your answer has not been sent. Recovery data could not be saved on this device. Try again when storage is available.'); }
      }
      const result = await send(safe);
      if (result.version !== 1 || result.attemptId !== safe.attemptId || result.userId !== safe.expectedUserId
        || result.questionId !== safe.questionId || result.conceptId !== safe.conceptId || typeof result.isCorrect !== 'boolean'
        || !Number.isFinite(Date.parse(result.nextReviewAt))) throw new PendingAttemptError('Your answer was not confirmed. Recovery data has been kept.');
      try {
        const current = await load(safe.expectedUserId);
        if (JSON.stringify(current) !== JSON.stringify(safe)) throw new Error('Recovery data changed');
        await storage.removeItem(key(safe.expectedUserId));
      }
      catch { throw new PendingAttemptError('Your answer was confirmed, but recovery data could not be cleared. Retry the same answer safely to finish.'); }
      return result;
    });
    tail = operation.catch(() => {});
    return operation;
  }
  return { load, submit };
}
