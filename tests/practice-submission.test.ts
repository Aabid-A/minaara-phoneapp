import { test } from 'node:test';
import assert from 'node:assert/strict';
import { submitPracticeAttempt, PRACTICE_RPC, getPracticeGate, practiceOutcome, practiceFailure, PracticeSubmissionError, requirePracticeClient, requirePracticeIdentity, type PracticeRequest, type PracticeResult } from '../src/generated/practice-submission';

const request: PracticeRequest = { attemptId: 'attempt', expectedUserId: 'learner', questionId: 'question', conceptId: 'concept', selectedOptionId: 'option', timeSpentMs: 123 };
const response: PracticeResult = {
  version: 1, attemptId: 'attempt', userId: 'learner', questionId: 'question', conceptId: 'concept',
  isCorrect: false, correctOptionIds: ['right'], nextReviewAt: '2026-10-16T00:00:00Z', observedAt: '2026-10-15T00:00:00Z', replayed: false,
  metric: { user_id: 'learner', concept_id: 'concept', p_known: 0.13, p_learn: 0.1, p_guess: 0.2, p_slip: 0.1,
    attempt_count: 1, correct_count: 0, incorrect_count: 1, mastery_label: 'weak_recovery', streak: 0, ease_factor: 2.3, interval_days: 0,
    next_review_at: '2026-10-16T00:00:00Z', last_attempted_at: '2026-10-15T00:00:00Z', last_bkt_update_at: '2026-10-15T00:00:00Z' },
};
test('both clients whitelist the same contract and render server correctness, never a client claim', async () => {
  const malicious = { ...request, isCorrect: true, metric: { attempt_count: 999 }, user_id: 'stranger', now: '1900-01-01' };
  const result = await submitPracticeAttempt({ async rpc(name, args) {
    assert.equal(name, PRACTICE_RPC);
    assert.deepEqual(args, { p_attempt_id: 'attempt', p_expected_user_id: 'learner', p_question_id: 'question', p_concept_id: 'concept', p_selected_option_id: 'option', p_card_rating: null, p_time_spent_ms: 123 });
    return { data: response, error: null };
  } }, malicious);
  assert.equal(result.isCorrect, false);
});
test('ambiguous network failure retries the exact request and accepts the immutable replay result', async () => {
  const calls: unknown[] = [];
  const client = { async rpc(_name: string, args: Record<string, unknown>) {
    calls.push(args);
    return calls.length === 1 ? { data: null, error: { message: 'lost response' } } : { data: { ...response, replayed: true }, error: null };
  } };
  await assert.rejects(submitPracticeAttempt(client, request), /Retry/);
  const result = await submitPracticeAttempt(client, request);
  assert.equal(result.replayed, true);
  assert.deepEqual(calls[0], calls[1]);
});
test('session, conflict and invalid-input errors are deliberate and do not report success', async () => {
  for (const [code, message] of [['PT401', /Sign in/], ['PGRST301', /Sign in/], ['PT409', /conflicts/], ['PT422', /no longer valid/], ['22P02', /no longer valid/]]) {
    await assert.rejects(submitPracticeAttempt({ async rpc() { return { data: null, error: { code: String(code), message: 'private details' } }; } }, request), message as RegExp);
  }
});
test('wrong learner, mismatched identifiers and malformed results cannot show a saved answer', async () => {
  for (const result of [null, { ...response, userId: 'stranger' }, { ...response, attemptId: 'other' }, { ...response, version: 2 }, { ...response, isCorrect: null }, { ...response, metric: null }, { ...response, nextReviewAt: 'invalid' }]) {
    await assert.rejects(submitPracticeAttempt({ async rpc() { return { data: result, error: null }; } }, request), /could not be confirmed/);
  }
});


test('gate fails closed on unavailable or malformed services and exposes only an explicit enabled state', async () => {
  assert.deepEqual(await getPracticeGate({ async rpc() { return {data:{enabled:false,message:'Paused'},error:null}; } }), {enabled:false,message:'Paused'});
  await assert.rejects(getPracticeGate({ async rpc() { return {data:null,error:{code:'PGRST202',message:'missing'}}; } }), {code:'PGRST202'});
  await assert.rejects(getPracticeGate({ async rpc() { return {data:{enabled:'yes'},error:null}; } }));
});

test('serializable web errors distinguish auth, conflict, unavailable and ambiguous saves without success', async () => {
  for (const [code,kind,retry] of [['PT401','auth',false],['PT409','conflict',false],['PT503','unavailable',true],['PGRST202','unavailable',true],['42501','unavailable',true],['NETWORK','retryable',true],['PT422','invalid',false]] as const) {
    const outcome = await practiceOutcome(async () => { throw new PracticeSubmissionError(code); });
    assert.equal(outcome.ok,false);
    if (!outcome.ok) assert.deepEqual([outcome.failure.kind,outcome.failure.canRetry],[kind,retry]);
    assert.equal(practiceFailure({code}).kind,kind);
    assert.equal(JSON.parse(JSON.stringify(outcome)).ok,false);
  }
  assert.deepEqual(await practiceOutcome(async () => response),{ok:true,result:response});
});


test('legacy web payloads reject before any success-shaped outcome can be returned', () => {
  assert.throws(() => requirePracticeClient(undefined),/out of date/);
  assert.throws(() => requirePracticeClient({attemptId:'',expectedUserId:''}),/Reload/);
  assert.throws(() => requirePracticeClient(request), /out of date/); // older flat-result RPC client
  assert.doesNotThrow(() => requirePracticeClient({...request,clientContract:2}));
});


test('expired or missing authentication differs from auth-service outages and account switches', () => {
  for (const error of [{status:401},{status:403},{name:'AuthSessionMissingError'}]) assert.throws(() => requirePracticeIdentity(null,error), {code:'AUTH'});
  for (const error of [{status:503},{name:'AuthRetryableFetchError'}]) assert.throws(() => requirePracticeIdentity(null,error), {code:'UNAVAILABLE'});
  assert.throws(() => requirePracticeIdentity({id:'other'},null,'learner'),{code:'AUTH'});
  assert.doesNotThrow(() => requirePracticeIdentity({id:'learner'},null,'learner'));
});
