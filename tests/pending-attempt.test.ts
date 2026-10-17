import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPendingAttempts, type PendingStorage } from '../src/pending-attempt';
import type { PracticeRequest, PracticeResult } from '../src/generated/practice-submission';
const user = '10000000-0000-4000-8000-000000000001';
const request: PracticeRequest = { attemptId:'10000000-0000-4000-8000-000000000002', expectedUserId:user, questionId:'10000000-0000-4000-8000-000000000003', conceptId:'10000000-0000-4000-8000-000000000004', cardRating:'know', timeSpentMs:500 };
const result = {version:1,attemptId:request.attemptId,userId:user,questionId:request.questionId,conceptId:request.conceptId,isCorrect:true,nextReviewAt:'2026-10-17T00:00:00Z'} as PracticeResult;
function memory() {
  const values = new Map<string,string>();
  const storage: PendingStorage = { async getItem(k) {return values.get(k) ?? null;}, async setItem(k,v) {values.set(k,v);},async removeItem(k) {values.delete(k);} };
  return {values,storage};
}
test('persistence failure and failed read-back prevent any network submission or false success', async () => {
  for (const failure of ['write','readback']) {
    const {storage} = memory(); let sends = 0;
    if (failure === 'write') storage.setItem = async () => {throw new Error('disk full');};
    else storage.setItem = async () => {};
    await assert.rejects(createPendingAttempts(storage).submit(request,async () => {sends++;return result;}), /has not been sent/);
    assert.equal(sends,0);
  }
});
test('restart before commit restores exactly the same request, not a new attempt', async () => {
  const {storage} = memory();
  await assert.rejects(createPendingAttempts(storage).submit(request,async () => {throw new Error('offline');}));
  const restarted = createPendingAttempts(storage), pending = await restarted.load(user);
  assert.deepEqual(pending,request);
  const confirmed = await restarted.submit(pending!,async payload => { assert.deepEqual(payload,request);return result; });
  assert.equal(confirmed.attemptId,request.attemptId);
  assert.equal(await restarted.load(user),null);
});
test('restart after commit/lost response replays one ID and counts progress once', async () => {
  const {storage} = memory(); let count = 0;
  const receipts = new Map<string,PracticeResult>();
  async function server(r:PracticeRequest) { const old = receipts.get(r.attemptId); if (old) return {...old,replayed:true}; count++;receipts.set(r.attemptId,result);return result; }
  await assert.rejects(createPendingAttempts(storage).submit(request,async r => {await server(r);throw new Error('process killed after commit');}));
  const restarted = createPendingAttempts(storage), pending = await restarted.load(user);
  assert.deepEqual(pending,request);
  assert.equal((await restarted.submit(pending!,server)).replayed,true);
  assert.equal(count,1);
  assert.equal(await restarted.load(user),null);
});
test('auth/conflict/invalid results retain pending data; another account cannot see or overwrite it', async () => {
  const {storage,values} = memory(), outbox=createPendingAttempts(storage);
  for (const code of ['PT401','PT409']) {
    await assert.rejects(outbox.submit(request,async () => {throw Object.assign(new Error(code),{code});}));
    assert.deepEqual(await outbox.load(user),request);
  }
  await assert.rejects(outbox.submit(request,async () => ({...result,userId:'other'})), /not confirmed/);
  await assert.rejects(outbox.submit({...request,attemptId:'20000000-0000-4000-8000-000000000002'},async () => result),/Another answer/);
  assert.equal(await outbox.load('other'),null);
  assert.equal(values.size,1);
});
test('corrupt recovery and unavailable reads fail closed without overwriting storage', async () => {
  const {storage,values}=memory(); values.set(`minaara.practice.pending.v1.${user}`,'broken');
  await assert.rejects(createPendingAttempts(storage).load(user),/Contact support/);
  assert.equal([...values.values()][0],'broken');
  storage.getItem=async () => {throw new Error('keychain unavailable');};
  await assert.rejects(createPendingAttempts(storage).submit(request,async () => result),/No new answer will be sent/);
});
test('clear failure keeps a confirmed request recoverable; whitelist stores no credentials or metrics', async () => {
  const {storage,values}=memory(); const remove=storage.removeItem;
  storage.removeItem=async () => {throw new Error('unavailable');};
  const input={...request,accessToken:'SECRET',metric:{attempt_count:999}};
  await assert.rejects(createPendingAttempts(storage).submit(input,async () => result),/was confirmed/);
  assert(![...values.values()][0].includes('SECRET'));
  assert(![...values.values()][0].includes('metric'));
  storage.removeItem=remove;
  await createPendingAttempts(storage).submit(request,async () => ({...result,replayed:true}));
  assert.equal(values.size,0);
});
