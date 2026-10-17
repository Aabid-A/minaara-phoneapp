import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useCurriculum } from '@/data';
import { usePreferences } from '@/store';
import { useTheme, fonts, radii } from '@/theme';
import { Button, ErrorState, Icon, LoadingStudy, MinaretMark, Notice, Page, Row, T } from '@/ui';

export default function Home() {
  const t = useTheme(); const last = usePreferences(s => s.lastBriefing);
  const { data, error, isPending, isPreview, refetch } = useCurriculum();
  const blocks = data?.blocks.filter(b => b.layer === 'high_yield') ?? [];
  const next = blocks.find(b => b.id === last) ?? blocks[0];
  return <Page>
    <T variant="display">Make room for understanding.</T>
    {error ? <ErrorState message={error.message} retry={() => void refetch()} /> : isPending && !data ? <LoadingStudy /> : <>
      <Pressable accessibilityRole="button" accessibilityLabel="Open Al-Fatihah study" onPress={() => next ? router.push(`/briefing/${next.id}`) : router.push('/(tabs)/study')}
        style={({ pressed }) => ({ backgroundColor: t.brandFill, borderRadius: radii.card, borderCurve: 'continuous', padding: 24, gap: 24, opacity: pressed ? .9 : 1 })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 8 }}><T variant="editorial" color={t.brandText}>Al-Fatihah</T><T color={t.brandMuted}>One surah. A place to begin.</T></View>
          <MinaretMark color={t.brandText} />
        </View>
        <T variant="small" color={t.brandMuted}>Your current collection · Surah 1</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}><T color={t.brandText} style={{ flex: 1, fontFamily: fonts.medium }}>{last ? 'Continue reading' : 'Open briefing'}</T><Icon name="arrow" color={t.brandText} /></View>
      </Pressable>
      <View><T variant="title">Follow your curiosity</T>
        <Row title="See the connections" detail="A little context, one relationship at a time." icon="map" onPress={() => router.navigate('/(tabs)/map')} />
        <Row title="Return and reflect" detail="A short review, at your own pace." icon="review" onPress={() => router.navigate('/(tabs)/review')} />
      </View>
      {isPreview && <Notice>Development preview · content awaits editorial review. Your preview activity stays on this device.</Notice>}
      {isPreview && <Button label="Sign in" secondary onPress={() => router.push('/auth')} />}
    </>}
  </Page>;
}
