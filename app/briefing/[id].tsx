import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCurriculum } from '@/data';
import { usePreferences } from '@/store';
import { useTheme } from '@/theme';
import { Button, Disclosure, ErrorState, IconButton, LoadingStudy, Notice, Page, T, tick } from '@/ui';
export default function Briefing() {
  const { id } = useLocalSearchParams<{ id: string }>(); const t = useTheme();
  const { data, isPreview, error, refetch } = useCurriculum();
  const block = data?.blocks.find(b => b.id === id);
  const saved = usePreferences(s => s.saved.includes(id)); const toggle = usePreferences(s => s.toggleSaved); const set = usePreferences(s => s.set);
  useEffect(() => { if (block) set({ lastBriefing: block.id }); }, [block?.id, set]);
  const question = data?.questions.find(q => q.source_excerpt_id === id);
  const extended = data?.blocks.filter(b => b.layer === 'extended' && !!b.ayah_range && b.ayah_range === block?.ayah_range) ?? [];
  return <Page>
    <Stack.Screen options={{ headerRight: () => <IconButton name={saved ? 'check' : 'bookmark'} label={saved ? 'Remove saved briefing' : 'Save briefing'} onPress={() => { toggle(id); tick(); }} /> }} />
    {error ? <ErrorState message={error.message} retry={() => void refetch()} /> : !data ? <LoadingStudy /> : !block ? <ErrorState message="This briefing is not available in your study space." /> : <>
      <View style={{ gap: 16 }}><T variant="display">{block.section_title}</T><T variant="small" color={t.accent}>Al-Fatihah · Briefing</T>{block.ayah_range && <T variant="small" color={t.muted}>Study scope · Ayat {block.ayah_range}</T>}</View>
      {isPreview && <Notice>Existing development content, not editorially approved. This is a study summary, not Quran text.</Notice>}
      <T selectable style={{ fontSize: 20, lineHeight: 32 }}>{block.content}</T>
      <View>
        <Disclosure title="Sources and context">
          {isPreview ? <T color={t.muted}>This preview was imported verbatim from MINAARA’s development curriculum. No verified source reference is supplied in this seed. Source attribution needs editorial review before release.</T> : block.source_book ? <><T selectable>{block.source_book}</T><T selectable color={t.muted}>{block.source_reference ?? 'No specific reference is recorded for this briefing.'}</T><T variant="small" color={t.muted}>Attribution is shown as stored in the curriculum. It is not an independent verification.</T></> : <T color={t.muted}>No source attribution is recorded for this briefing yet.</T>}
        </Disclosure>
        <Disclosure title="Read deeper">{extended.length ? extended.map(b => <View key={b.id} style={{ gap: 12 }}><T variant="title">{b.section_title}</T><T selectable>{b.content}</T>{b.source_book && <T variant="small" color={t.muted}>{b.source_book}{b.source_reference ? ` · ${b.source_reference}` : ''}</T>}</View>) : <T color={t.muted}>There is no extended reading linked to this study scope yet. The concise briefing is all that is available here.</T>}</Disclosure>
      </View>
      {question && <Button label="Explore the connection" secondary onPress={() => router.push(`/concept/${question.concept_id}`)} />}
      {question && <Button label="Review this idea" onPress={() => router.push(`/session?concept=${question.concept_id}&mode=practice`)} icon />}
      <T variant="small" color={t.muted}>{saved ? 'Saved on this device.' : 'You can save this briefing to return later.'}</T>
    </>}
  </Page>;
}
