import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useMutation } from '@tanstack/react-query';
import { useCurriculum, saveAttempt, usePracticeGate } from '@/data';
import { useSession } from '@/session';
import { usePreferences } from '@/store';
import { useReviewSession } from '@/review-session';
import { dueQuestions, nextMetric } from '@/learning/progress';
import { useTheme, fonts } from '@/theme';
import { Button, Card, Disclosure, ErrorState, IconButton, LoadingStudy, Notice, Page, T, tick } from '@/ui';
import { supabase } from '@/supabase';
import { pendingAttempts } from '@/pending-attempt-storage';
import { PendingAttemptError } from '@/pending-attempt';
import { practiceFailure, type PracticeRequest } from '@/generated/practice-submission';
import type { Metric } from '@/types';
function attemptId() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.floor(Math.random() * 16); return (c === 'x' ? r : (r & 3) | 8).toString(16); }); }
export default function ReviewSession() {
  const { mode, type, concept } = useLocalSearchParams<{ mode?: string; type?: string; concept?: string }>();
  const t = useTheme(); const { data, error, refetch, isPreview } = useCurriculum(); const userId = useSession(s => s.session?.user.id);
  const gate = usePracticeGate();
  const questions = useReviewSession(s => s.questions); const index = useReviewSession(s => s.index); const start = useReviewSession(s => s.start);
  const [revealed, setRevealed] = useState(false); const [option, setOption] = useState<string>(); const [feedback, setFeedback] = useState<string>();
  const initialized = useRef(false); const began = useRef(Date.now()); const lock = useRef(false); const nextLock = useRef(false);
  const payload = useRef<Parameters<typeof saveAttempt>[0] | null>(null);
  const [pendingReady, setPendingReady] = useState(!userId);
  const [recovery, setRecovery] = useState<PracticeRequest | null>(null);
  const [recoveryError, setRecoveryError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    if (!userId) return;
    pendingAttempts.load(userId).then(request => {
      if (!active) return;
      if (request) { payload.current = request; setRecovery(request); }
      setPendingReady(true);
    }).catch(error => { if (active) setRecoveryError(error); });
    return () => { active = false; };
  }, [userId]);
  const [correctOptionIds, setCorrectOptionIds] = useState<string[]>([]);
  const entryUserId = useRef(userId);
  useEffect(() => {
    if (entryUserId.current !== userId) {
      useReviewSession.getState().clear();
      router.dismissTo('/(tabs)/review');
    }
  }, [userId]);
  const [resolvedCorrect, setResolvedCorrect] = useState<boolean | null>(null);
  const [pendingMetric, setPendingMetric] = useState<Metric | null>(null);
  useEffect(() => {
    if (!data || initialized.current || !pendingReady || recovery || (!isPreview && (!gate.data?.enabled || gate.isFetching || gate.error))) return;
    let candidates = data.questions.filter(q => q.question_type === (type === 'mcq' ? 'mcq' : 'card') && (!concept || q.concept_id === concept));
    if (mode === 'due') candidates = dueQuestions(candidates, data.metrics, new Date().toISOString());
    initialized.current = true; start(candidates.slice(0, 6));
  }, [data, type, concept, mode, start, pendingReady, recovery, isPreview, gate.data, gate.isFetching, gate.error]);
  const question = questions[index];
  useEffect(() => { nextLock.current = false; }, [index]);
  const mutation = useMutation({ mutationFn: saveAttempt, onSuccess: (result) => {
    if (useSession.getState().session?.user.id !== result.userId) return;
    setResolvedCorrect(result.isCorrect);
    setCorrectOptionIds(result.correctOptionIds);
    setPendingMetric({ ...result.metric, mastery_status: result.metric.mastery_label, last_reviewed_at: result.observedAt });
    setFeedback('Saved to your account.'); lock.current = false;
  }, onError: () => { lock.current = false; } });
  usePreventRemove(mutation.isPending, () => {});
  function respond(correct: boolean, cardRating?: 'know' | 'dont_know') {
    if (!question || !data || lock.current || feedback || mutation.isPending || payload.current || (!isPreview && (!gate.data?.enabled || gate.isFetching || gate.error))) return;
    lock.current = true; tick();
    if (isPreview) {
      const now = new Date().toISOString();
      const metric = nextMetric(question, correct, data.metrics[question.concept_id], now);
      setResolvedCorrect(correct);
      setCorrectOptionIds(question.mcq_options.filter(o => o.is_correct).map(o => o.id));
      const store = usePreferences.getState(); store.set({ previewMetrics: { ...store.previewMetrics, [metric.concept_id]: metric } });
      setPendingMetric(metric); setFeedback('Saved on this device.'); lock.current = false;
    } else if (userId) {
      payload.current = { attemptId: attemptId(), expectedUserId: userId, questionId: question.id, conceptId: question.concept_id, cardRating, selectedOptionId: option, timeSpentMs: Math.min(2147483647, Math.max(0, Date.now() - began.current)) };
      mutation.mutate(payload.current);
    }
  }
  function next() {
    if (!feedback || nextLock.current) return;
    nextLock.current = true;
    const lastQuestion = index + 1 >= questions.length;
    useReviewSession.getState().advance(); setRevealed(false); setOption(undefined); setFeedback(undefined); setPendingMetric(null); setResolvedCorrect(null); setCorrectOptionIds([]); payload.current = null; mutation.reset(); began.current = Date.now();
    if (lastQuestion) router.replace('/session-complete');
  }
  const failureFor = (error: Error) => error instanceof PendingAttemptError ? { ...practiceFailure(error), message: error.message } : practiceFailure(error);
  function failureView(error: Error, retry: () => void) {
    const failure = failureFor(error);
    return <><Notice>{failure.message}</Notice>
      {failure.canRetry && <Button label={failure.kind === 'unavailable' ? 'Check availability and retry' : 'Retry the same answer'} secondary onPress={retry} disabled={mutation.isPending} />}
      {failure.kind === 'auth' && <Button label={payload.current ? "Sign in to recover your answer" : "Sign in again"} onPress={() => { void (async () => { await supabase?.auth.signOut({ scope: 'local' }).catch(() => {}); useSession.setState({ session: null, authPending: false }); router.push('/auth'); })(); }} />}
    </>;
  }
  if (recoveryError) return <Page>{failureView(recoveryError, () => { if (userId) pendingAttempts.load(userId).then(request => { setRecoveryError(null); setRecovery(request); payload.current = request; setPendingReady(true); }).catch(setRecoveryError); })}<Button secondary label="Return without discarding answer" onPress={() => router.dismissTo('/(tabs)/review')} /></Page>;
  if (!pendingReady) return <Page><Notice>Checking for a pending answer on this device…</Notice></Page>;
  if (recovery) return <Page>
    <T variant="title">{feedback ? 'Answer confirmed' : 'Confirm your pending answer'}</T>
    <Notice>{feedback ? `${feedback}${pendingMetric?.next_review_at ? ` Next review: ${new Date(pendingMetric.next_review_at).toLocaleDateString()}.` : ''}` : 'Your previous answer is kept on this device. Confirm it before starting another. Replaying it will not count twice.'}</Notice>
    {mutation.isPending && <Notice>Confirming your answer…</Notice>}
    {mutation.error && failureView(mutation.error, () => mutation.mutate(recovery))}
    {!feedback && !mutation.isPending && !mutation.error && <Button label="Confirm pending answer" onPress={() => mutation.mutate(recovery)} />}
    <Button secondary label={feedback ? 'Return to review' : 'Return without discarding answer'} disabled={mutation.isPending} onPress={() => { useReviewSession.getState().clear(); router.dismissTo('/(tabs)/review'); }} />
  </Page>;
  if (!isPreview && !payload.current && !feedback && (!gate.data?.enabled || gate.isFetching || gate.error)) return <Page><T variant="title">Account practice is paused</T>{gate.error ? failureView(gate.error, () => void gate.refetch()) : <><Notice>{gate.data?.message ?? 'Checking practice availability. No answer has been sent.'}</Notice><Button label="Check availability" secondary onPress={() => void gate.refetch()} /></>}<Button secondary label="Return to review" onPress={() => router.dismissTo('/(tabs)/review')} /></Page>;
  return <Page>
    <Stack.Screen options={{ headerLeft: () => <IconButton name="close" label="Close review" onPress={() => { if (!mutation.isPending) router.dismissTo('/(tabs)/review'); }} /> }} />
    {error && !payload.current ? <ErrorState message={error.message} retry={() => void refetch()} /> : !data || !initialized.current ? <LoadingStudy /> : !question ? <><T variant="display">Nothing to review here.</T><T color={t.muted}>Open a briefing, or try a practice session from Review.</T><Button label="Back to review" onPress={() => router.dismissTo('/(tabs)/review')} /></> : <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T variant="label" color={t.accent}>{question.question_type === 'card' ? 'RECALL CARD' : 'GUIDED QUESTION'}</T><T variant="small" color={t.muted} style={{ fontVariant: ['tabular-nums'] }}>{index + 1} / {questions.length}</T></View>
      {isPreview && <Notice>Development preview · content awaits review. Activity stays on this device.</Notice>}
      <T variant="title" style={{ fontSize: 26, lineHeight: 34 }} selectable>{question.prompt}</T>
      {question.question_type === 'card' ? <>
        {!revealed ? <View style={{ paddingTop: 44 }}><T color={t.muted}>Take a moment to recall it. There’s no timer.</T><View style={{ paddingTop: 24 }}><Button label="Reveal answer" onPress={() => { setRevealed(true); tick(); }} /></View></View> : <Card><T variant="label" color={t.muted}>EXPLANATION</T><T selectable>{question.explanation_excerpt}</T></Card>}
        {revealed && !feedback && !payload.current && <View style={{ gap: 12 }}><Button label="I recalled it" onPress={() => respond(true, 'know')} /><Button label="Let me revisit it" secondary onPress={() => respond(false, 'dont_know')} /></View>}
      </> : <>
        {!revealed ? <View style={{ gap: 12 }}>{question.mcq_options.map(o => <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ checked: option === o.id, disabled: !!payload.current || !!feedback }} aria-checked={option === o.id} disabled={!!payload.current || !!feedback} onPress={() => { setOption(o.id); tick(); }} style={({ pressed }) => ({ padding: 16, minHeight: 52, borderWidth: 1, borderColor: option === o.id ? t.accent : t.line, backgroundColor: option === o.id ? t.accentWash : pressed ? t.inset : t.surface, borderRadius: 12, borderCurve: 'continuous' })}><T>{o.content}</T></Pressable>)}</View> : <View style={{ gap: 8 }}><T variant="label" color={t.muted}>YOUR RESPONSE</T><T color={t.muted}>{question.mcq_options.find(o => o.id === option)?.content}</T></View>}
        {!payload.current && !feedback && <Button label="Check answer" disabled={!option} onPress={() => { setRevealed(true); respond(question.mcq_options.find(o => o.id === option)?.is_correct === true); }} />}
        {revealed && <Card><T variant="label" color={t.accent}>{resolvedCorrect === null ? 'EXPLANATION' : resolvedCorrect ? 'THAT’S RIGHT' : 'A CHANCE TO REVISIT'}</T><T selectable>{question.explanation_excerpt}</T></Card>}
      </>}
      {mutation.isPending && <Notice>Saving your answer…</Notice>}
      {mutation.error && failureView(mutation.error, () => { if (payload.current && !mutation.isPending) mutation.mutate(payload.current); })}
      {feedback && <View style={{ gap: 16 }}><T variant="small" color={t.muted}>{feedback}{pendingMetric?.next_review_at ? ` Next review: ${new Date(pendingMetric.next_review_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.` : ''}</T><Button label={index + 1 === questions.length ? 'Finish session' : 'Next idea'} onPress={next} /></View>}
      {revealed && resolvedCorrect !== null && question.question_type === 'mcq' && <Disclosure title="Show answer choices">{question.mcq_options.map(o => <View key={o.id} style={{ gap: 4 }}><T selectable>{o.content}</T>{correctOptionIds.includes(o.id) && <T variant="small" color={t.accent}>Correct choice in the stored question</T>}</View>)}</Disclosure>}
      {revealed && <Disclosure title="Briefing and source context">{(() => { const block = data.blocks.find(b => b.id === question.source_excerpt_id); return block ? <><T variant="small" style={{ fontFamily: fonts.medium }}>{block.section_title}</T><T selectable>{block.content}</T><T variant="small" color={t.muted}>{isPreview ? 'Development seed. No verified source reference supplied.' : [block.source_book, block.source_reference].filter(Boolean).join(' · ') || 'No source attribution recorded.'}</T></> : <T color={t.muted}>No linked source block is available for this question.</T>; })()}</Disclosure>}
    </>}
  </Page>;
}
