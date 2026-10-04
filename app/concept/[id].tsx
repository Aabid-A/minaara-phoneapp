import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCurriculum } from '@/data';
import { useTheme } from '@/theme';
import { Button, ErrorState, IconButton, LoadingStudy, Notice, Page, T } from '@/ui';
export default function Concept() {
  const { id } = useLocalSearchParams<{ id: string }>(); const t = useTheme();
  const { data, isPreview, error, refetch } = useCurriculum();
  const concept = data?.concepts.find(c => c.id === id); const question = data?.questions.find(q => q.concept_id === id);
  const block = data?.blocks.find(b => b.id === question?.source_excerpt_id); const domain = data?.domains.find(d => d.id === concept?.domain_id);
  return <Page>
    <Stack.Screen options={{ headerRight: () => <IconButton name="close" label="Close connection" onPress={() => router.back()} /> }} />
    {error ? <ErrorState message={error.message} retry={() => void refetch()} /> : !data ? <LoadingStudy /> : !concept ? <ErrorState message="This connection is not available." /> : <>
      <T variant="label" color={t.accent}>AL-FATIHAH · CONCEPT</T><T variant="title">{block?.section_title ?? 'A connected idea'}</T>
      {isPreview && <Notice>Development concept · statement awaits editorial review.</Notice>}
      <T selectable style={{ fontSize: 20, lineHeight: 30 }}>{concept.primary_statement}</T>
      {domain && <T variant="small" color={t.muted}>Curriculum domain · {domain.name}</T>}
      {block && <Button label="Open briefing" secondary onPress={() => router.dismissTo(`/briefing/${block.id}`)} />}
      {question && <Button label="Review this idea" onPress={() => router.dismissTo(`/session?concept=${id}&mode=practice`)} />}
    </>}
  </Page>;
}
