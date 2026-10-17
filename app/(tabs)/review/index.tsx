import { View } from 'react-native';
import { router } from 'expo-router';
import { useCurriculum } from '@/data';
import { dueQuestions } from '@/learning/progress';
import { useTheme } from '@/theme';
import { Button, Card, ErrorState, Icon, LoadingStudy, Notice, Page, T } from '@/ui';
export default function Review() {
  const t = useTheme(); const { data, isPreview, error, refetch } = useCurriculum();
  const cards = data?.questions.filter(q => q.question_type === 'card') ?? [];
  const due = data ? dueQuestions(cards, data.metrics, new Date().toISOString()) : [];
  const seen = data ? Object.values(data.metrics).filter(m => (m.attempt_count ?? 0) > 0).length : 0;
  return <Page>
    <View style={{ gap: 12 }}><T variant="display">Return.{ '\n' }Not rush.</T><T color={t.muted}>A little practice. Space to remember.</T></View>
    {error ? <ErrorState message={error.message} retry={() => void refetch()} /> : !data ? <LoadingStudy /> : <>
      <Card><Icon name="review" color={t.accent} size={28} /><T variant="title">{due.length ? `${due.length} ${due.length === 1 ? 'idea' : 'ideas'} to revisit` : seen ? 'A quiet moment.' : 'Start with one idea.'}</T>
        <T color={t.muted}>{due.length ? 'These ideas have reached their next review point.' : seen ? 'Nothing is due right now. You can still practise if you feel like it.' : 'Your review rhythm begins after your first practice session.'}</T>
        {due.length > 0 && <Button label="Review due ideas" onPress={() => router.push('/session?mode=due')} />}
        {cards.length > 0 && <Button label="Practise cards" secondary={due.length > 0} onPress={() => router.push('/session?mode=practice')} />}
        {!cards.length && <Button label="Open briefings" onPress={() => router.navigate('/(tabs)/study')} />}
      </Card>
      {data.questions.some(q => q.question_type === 'mcq') && <Button label="Try guided questions" secondary onPress={() => router.push('/session?mode=practice&type=mcq')} />}
      <View style={{ gap: 12, paddingTop: 8 }}><T variant="label" color={t.muted}>AT YOUR OWN PACE</T><T color={t.muted}>No streak to protect. No timer to beat. Just a chance to return to what you’ve studied.</T></View>
      {isPreview && <Notice>Preview sessions stay on this device and never change your account’s progress.</Notice>}
    </>}
  </Page>;
}
