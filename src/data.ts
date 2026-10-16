import { useQuery } from '@tanstack/react-query';
import { usePreferences } from './store';
import { supabase } from './supabase';
import { useSession } from './session';
import seed from './generated/preview.json';
import type { Curriculum, Question } from './types';

import { pendingAttempts } from './pending-attempt-storage';
import { submitPracticeAttempt, getPracticeGate, PracticeSubmissionError, type PracticeRequest, requirePracticeIdentity } from './generated/practice-submission';
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
export function usePracticeGate() {
  const userId = useSession(s => s.session?.user.id);
  return useQuery({ queryKey: ['practice-gate', userId], enabled: !!userId, staleTime: 0, retry: false,
    queryFn: async () => {
      if (!supabase) throw new PracticeSubmissionError('UNAVAILABLE');
      const { data: { user }, error } = await supabase.auth.getUser();
      requirePracticeIdentity(user,error,userId);
      return getPracticeGate(supabase);
    },
  });
}
// Durable before send; a failed/ambiguous RPC never removes the pending request.
export async function saveAttempt(input: PracticeRequest) {
  if (!supabase) throw new PracticeSubmissionError('UNAVAILABLE');
  const client = supabase;
  const result = await pendingAttempts.submit(input, async request => {
    if (useSession.getState().session?.user.id !== request.expectedUserId) throw new PracticeSubmissionError('AUTH');
    const { data: { user }, error } = await client.auth.getUser();
    requirePracticeIdentity(user,error,request.expectedUserId);
    return submitPracticeAttempt(client, request);
  });
  if (useSession.getState().session?.user.id !== input.expectedUserId) throw new PracticeSubmissionError('AUTH');
  void queryClient.invalidateQueries({ queryKey: curriculumKey(input.expectedUserId) });
  return result;
}
