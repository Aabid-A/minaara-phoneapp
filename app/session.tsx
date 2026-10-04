import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useMutation } from '@tanstack/react-query';
import { useCurriculum, saveAttempt, queryClient, curriculumKey } from '@/data';
import { useSession } from '@/session';
import { usePreferences } from '@/store';
import { useReviewSession } from '@/review-session';
import { dueQuestions, nextMetric } from '@/learning/progress';
import { useTheme, fonts } from '@/theme';
import { Button, Card, Disclosure, ErrorState, IconButton, LoadingStudy, Notice, Page, T, tick } from '@/ui';
import type { Metric } from '@/types';
function attemptId() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.floor(Math.random() * 16); return (c === 'x' ? r : (r & 3) | 8).toString(16); }); }
export default function ReviewSession() {
  const { mode, type, concept } = useLocalSearchParams<{ mode?: string; type?: string; concept?: string }>();
  const t = useTheme(); const { data, error, refetch, isPreview } = useCurriculum(); const userId = useSession(s => s.session?.user.id);
  const questions = useReviewSession(s => s.questions); const index = useReviewSession(s => s.index); const finished = useReviewSession(s => s.finished); const start = useReviewSession(s => s.start);
  const [revealed, setRevealed] = useState(false); const [option, setOption] = useState<string>(); const [feedback, setFeedback] = useState<string>();
  const initialized = useRef(false); const began = useRef(Date.now()); const lock = useRef(false); const nextLock = useRef(false);
  const payload = useRef<Parameters<typeof saveAttempt>[0] | null>(null);
  const [pendingMetric, setPendingMetric] = useState<Metric | null>(null);
  useEffect(() => {
    if (!data || initialized.current) return;
    let candidates = data.questions.filter(q => q.question_type === (type === 'mcq' ? 'mcq' : 'card') && (!concept || q.concept_id === concept));
    if (mode === 'due') candidates = dueQuestions(candidates, data.metrics, new Date().toISOString());
    initialized.current = true; start(candidates.slice(0, 6));
  }, [data, type, concept, mode, start]);
  const question = questions[index];
  useEffect(() => { nextLock.current = false; }, [index]);
  const mutation = useMutation({ mutationFn: saveAttempt, onSuccess: () => {
    if (payload.current) setPendingMetric(payload.current.metric);
    setFeedback('Saved to your account.'); lock.current = false;
  }, onError: () => { lock.current = false; } });
  usePreventRemove(mutation.isPending, () => {});
  useEffect(() => { if (finished) router.replace('/session-complete'); }, [finished]);
  function respond(correct: boolean, cardRating?: 'know' | 'dont_know') {
    if (!question || !data || lock.current || feedback || mutation.isPending || payload.current) return;
    lock.current = true; tick();
    const now = new Date().toISOString(); const metric = nextMetric(question, correct, data.metrics[question.concept_id], now);
    if (isPreview) {
      const store = usePreferences.getState(); store.set({ previewMetrics: { ...store.previewMetrics, [metric.concept_id]: metric } });
      setPendingMetric(metric); setFeedback('Saved on this device.'); lock.current = false;
    } else if (userId) {
      payload.current = { attemptId: attemptId(), userId, question, metric, correct, cardRating, optionId: option, elapsed: Math.max(0, Date.now() - began.current), now };
      mutation.mutate(payload.current);
    }
  }
  function next() {
    if (!feedback || nextLock.current) return;
    nextLock.current = true;
    useReviewSession.getState().advance(); setRevealed(false); setOption(undefined); setFeedback(undefined); setPendingMetric(null); payload.current = null; mutation.reset(); began.current = Date.now();
  }
  return <Page>
    <Stack.Screen options={{ headerLeft: () => <IconButton name="close" label="Close review" onPress={() => { if (!mutation.isPending) router.dismissTo('/(tabs)/review'); }} /> }} />
    {error ? <ErrorState message={error.message} retry={() => void refetch()} /> : !data || !initialized.current ? <LoadingStudy /> : !question ? <><T variant="display">Nothing to review here.</T><T color={t.muted}>Open a briefing, or try a practice session from Review.</T><Button label="Back to review" onPress={() => router.dismissTo('/(tabs)/review')} /></> : <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T variant="label" color={t.accent}>{question.question_type === 'card' ? 'RECALL CARD' : 'GUIDED QUESTION'}</T><T variant="small" color={t.muted} style={{ fontVariant: ['tabular-nums'] }}>{index + 1} / {questions.length}</T></View>
      {isPreview && <Notice>Development preview · content awaits review. Activity stays on this device.</Notice>}
      <T variant="title" style={{ fontSize: 26, lineHeight: 34 }} selectable>{question.prompt}</T>
      {question.question_type === 'card' ? <>
        {!revealed ? <View style={{ paddingTop: 44 }}><T color={t.muted}>Take a moment to recall it. There’s no timer.</T><View style={{ paddingTop: 24 }}><Button label="Reveal answer" onPress={() => { setRevealed(true); tick(); }} /></View></View> : <Card><T variant="label" color={t.muted}>EXPLANATION</T><T selectable>{question.explanation_excerpt}</T></Card>}
        {revealed && !feedback && !payload.current && <View style={{ gap: 12 }}><Button label="I recalled it" onPress={() => respond(true, 'know')} /><Button label="Let me revisit it" secondary onPress={() => respond(false, 'dont_know')} /></View>}
      </> : <>
        {!revealed ? <View style={{ gap: 12 }}>{question.mcq_options.map(o => <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ checked: option === o.id, disabled: !!payload.current || !!feedback }} aria-checked={option === o.id} disabled={!!payload.current || !!feedback} onPress={() => { setOption(o.id); tick(); }} style={({ pressed }) => ({ padding: 16, minHeight: 52, borderWidth: 1, borderColor: option === o.id ? t.accent : t.line, backgroundColor: option === o.id ? t.accentWash : pressed ? t.inset : t.surface, borderRadius: 12, borderCurve: 'continuous' })}><T>{o.content}</T></Pressable>)}</View> : <View style={{ gap: 8 }}><T variant="label" color={t.muted}>YOUR RESPONSE</T><T color={t.muted}>{question.mcq_options.find(o => o.id === option)?.content}</T></View>}
        {!payload.current && !feedback && <Button label="Check answer" disabled={!option} onPress={() => { setRevealed(true); respond(question.mcq_options.find(o => o.id === option)?.is_correct === true); }} />}
        {revealed && <Card><T variant="label" color={t.accent}>{question.mcq_options.find(o => o.id === option)?.is_correct ? 'THAT’S RIGHT' : 'A CHANCE TO REVISIT'}</T><T selectable>{question.explanation_excerpt}</T></Card>}
      </>}
      {mutation.isPending && <Notice>Saving your answer…</Notice>}
      {mutation.error && <ErrorState message={mutation.error.message} retry={() => { if (payload.current && !mutation.isPending) mutation.mutate(payload.current); }} />}
      {feedback && <View style={{ gap: 16 }}><T variant="small" color={t.muted}>{feedback}{pendingMetric?.next_review_at ? ` Next review: ${new Date(pendingMetric.next_review_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.` : ''}</T><Button label={index + 1 === questions.length ? 'Finish session' : 'Next idea'} onPress={next} /></View>}
      {revealed && question.question_type === 'mcq' && <Disclosure title="Show answer choices">{question.mcq_options.map(o => <View key={o.id} style={{ gap: 4 }}><T selectable>{o.content}</T>{o.is_correct && <T variant="small" color={t.accent}>Correct choice in the stored question</T>}</View>)}</Disclosure>}
      {revealed && <Disclosure title="Briefing and source context">{(() => { const block = data.blocks.find(b => b.id === question.source_excerpt_id); return block ? <><T variant="small" style={{ fontFamily: fonts.medium }}>{block.section_title}</T><T selectable>{block.content}</T><T variant="small" color={t.muted}>{isPreview ? 'Development seed. No verified source reference supplied.' : [block.source_book, block.source_reference].filter(Boolean).join(' · ') || 'No source attribution recorded.'}</T></> : <T color={t.muted}>No linked source block is available for this question.</T>; })()}</Disclosure>}
    </>}
  </Page>;
}
