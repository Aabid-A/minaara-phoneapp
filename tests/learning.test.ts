import test from 'node:test';
import assert from 'node:assert/strict';
import { nextMetric, dueQuestions } from '../src/learning/progress';
import { updateBktState } from '../src/learning/bkt';
import { buildMap } from '../src/map-model';
import seed from '../src/generated/preview.json';
import type { Curriculum, Question } from '../src/types';
const question: Question = { ...seed.question_bank[0], question_type: 'card', mcq_options: [] };
const now = '2026-10-04T12:00:00.000Z';
test('first card answer uses the web learning engine and schedules review', () => {
  const correct = nextMetric(question, true, undefined, now);
  const incorrect = nextMetric(question, false, undefined, now);
  assert.equal(correct.p_known, updateBktState(undefined, true).next.p_known);
  assert.ok(correct.p_known > incorrect.p_known);
  assert.equal(correct.attempt_count, 1);
  assert.equal(correct.correct_count, 1);
  assert.equal(incorrect.incorrect_count, 1);
  assert.ok(new Date(correct.next_review_at!).getTime() > new Date(now).getTime());
});
test('new concepts are practice, not falsely labelled due reviews', () => {
  assert.equal(dueQuestions([question], {}, now).length, 0);
  const metric = nextMetric(question, true, undefined, now);
  assert.equal(dueQuestions([question], { [question.concept_id]: metric }, now).length, 0);
  assert.equal(dueQuestions([question], { [question.concept_id]: metric }, '2026-10-07T12:00:00Z').length, 1);
});
const curriculum: Curriculum = { blocks: seed.textbook_blocks.map(b => ({ ...b, layer: 'high_yield' })), concepts: seed.curriculum_concepts, domains: seed.curriculum_domains, questions: seed.question_bank.map(q => ({ ...q, question_type: q.question_type as 'card' | 'mcq', mcq_options: [] })), metrics: {} };
test('focused map has no more than five nodes and only recorded membership edges', () => {
  const model = buildMap(curriculum);
  assert.equal(model.items.length, 5);
  assert.equal(model.edges.length, 6);
  assert.equal(model.items.filter(n => n.kind === 'concept').length, 3);
  assert.ok(model.edges.every(e => e.path.includes('C')));
  assert.ok(model.edges.every(e => e.from === 'surah-1' || e.to === curriculum.domains[0].id));
  assert.ok(model.edges.every(e => e.relation === 'belongs to surah' || e.relation === 'belongs to domain'));
});
test('map does not fabricate cross-domain connections', () => {
  const changed = { ...curriculum, concepts: curriculum.concepts.map((c, i) => i === 1 ? { ...c, domain_id: 'another-domain' } : c) };
  const model = buildMap(changed);
  assert.equal(model.edges.length, 5);
  assert.ok(!model.edges.some(e => e.from === changed.concepts[1].id && e.relation === 'belongs to domain'));
});
test('empty curriculum has an honest one-node map', () => {
  const model = buildMap({ blocks: [], concepts: [], domains: [], questions: [], metrics: {} });
  assert.equal(model.items.length, 1); assert.equal(model.edges.length, 0);
});
test('preview contains the exact development seed counts, not an invented full curriculum', () => {
  assert.equal(seed.textbook_blocks.length, 3); assert.equal(seed.question_bank.length, 6);
  assert.ok(seed.textbook_blocks.every(b => b.surah_id === 'surah-1'));
  for (const q of seed.question_bank.filter(q => q.question_type === 'mcq')) {
    const options = seed.mcq_options.filter(o => o.question_id === q.id);
    assert.equal(options.length, 4); assert.equal(options.filter(o => o.is_correct).length, 1);
  }
});
