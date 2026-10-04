import { useQuery } from '@tanstack/react-query';
import { usePreferences } from './store';
import { supabase } from './supabase';
import { useSession } from './session';
import seed from './generated/preview.json';
import type { Curriculum, Metric, Question } from './types';

import { queryClient } from './query-client';
export { queryClient } from './query-client';
export const previewCurriculum: Curriculum = {
  blocks: seed.textbook_blocks.map(b => ({ ...b, layer: 'high_yield' })),
  concepts: seed.curriculum_concepts, domains: seed.curriculum_domains,
  questions: seed.question_bank.map(q => ({ ...q, question_type: q.question_type as 'card' | 'mcq', mcq_options: seed.mcq_options.filter(o => o.question_id === q.id).map((o, i) => ({ ...o, id: `${q.id}-option-${i}` })) })),
  metrics: {},
};
export const curriculumKey = (userId?: string) => ['curriculum', 'surah-1', userId ?? 'preview'];
export function useCurriculum() {
  const userId = useSession(s => s.session?.user.id);
  const previewMetrics = usePreferences(s => s.previewMetrics);
  const query = useQuery({ queryKey: curriculumKey(userId), enabled: !!userId,
    queryFn: async (): Promise<Curriculum> => {
      if (!supabase || !userId) throw new Error('Sign in to load your study space.');
      const responses = await Promise.all([
        supabase.from('textbook_blocks').select('id,section_title,content,layer,ayah_range,source_book,source_reference').eq('surah_id', 'surah-1'),
        supabase.from('curriculum_concepts').select('id,domain_id,primary_statement,high_yieldness,ayah_range').eq('surah_id', 'surah-1'),
        supabase.from('curriculum_domains').select('id,name'),
        supabase.from('question_bank').select('id,question_type,concept_id,source_excerpt_id,prompt,explanation_excerpt,high_yieldness,mcq_options(id,content,is_correct)').eq('surah_id', 'surah-1'),
        supabase.from('user_concept_metrics').select('*').eq('user_id', userId),
      ]);
      const error = responses.find(r => r.error)?.error;
      if (error) throw new Error('Your study space could not be loaded. Check your connection and try again.');
      const [blocks, concepts, domains, questions, metrics] = responses.map(r => r.data ?? []);
      return { blocks: blocks as Curriculum['blocks'], concepts: concepts as Curriculum['concepts'], domains: domains as Curriculum['domains'], questions: questions as unknown as Question[],
        metrics: Object.fromEntries(metrics.map(m => [m.concept_id, { ...m, p_known: Number(m.p_known), p_learn: Number(m.p_learn), p_guess: Number(m.p_guess), p_slip: Number(m.p_slip), mastery_status: m.mastery_label, last_reviewed_at: m.last_attempted_at }])) };
    },
  });
  return { ...query, data: userId ? query.data : { ...previewCurriculum, metrics: previewMetrics }, isPreview: !userId };
}
// Retryable writes use a stable attempt UUID. Never insert duplicates when a
// metric write fails. Absolute metrics below also make a same-payload retry safe.
export async function saveAttempt(input: { attemptId: string; userId: string; question: Question; metric: Metric; correct: boolean; cardRating?: 'know' | 'dont_know'; optionId?: string; elapsed: number; now: string }) {
  if (!supabase) throw new Error('The account connection is not configured.');
  const attempt = await supabase.from('user_question_attempts').insert({ id: input.attemptId, user_id: input.userId, question_id: input.question.id, is_correct: input.correct, card_rating: input.cardRating, selected_option_id: input.optionId, time_spent_ms: input.elapsed, created_at: input.now });
  if (attempt.error && attempt.error.code !== '23505') throw new Error('Your answer was not saved. Check your connection and retry.');
  const m = input.metric;
  const metric = await supabase.from('user_concept_metrics').upsert({
    user_id: input.userId, concept_id: m.concept_id, p_known: m.p_known, p_learn: m.p_learn, p_guess: m.p_guess, p_slip: m.p_slip,
    attempt_count: m.attempt_count, correct_count: m.correct_count, incorrect_count: m.incorrect_count,
    mastery_label: m.mastery_status, last_bkt_update_at: input.now, last_attempted_at: input.now,
    next_review_at: m.next_review_at, interval_days: m.interval_days, streak: m.streak, ease_factor: m.ease_factor,
    status_tag: !input.correct ? 'incorrect' : m.mastery_status === 'mastered' ? 'mastered' : m.mastery_status === 'strengthening' ? 'seen' : 'learning',
  }, { onConflict: 'user_id,concept_id' });
  if (metric.error) throw new Error('Your answer was recorded, but review timing could not be updated. Retry to finish saving.');
  await queryClient.invalidateQueries({ queryKey: curriculumKey(input.userId) });
}
