import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { useCurriculum } from '@/data';
import { usePreferences } from '@/store';
import { useTheme, fonts, radii } from '@/theme';
import { Button, ErrorState, Icon, LoadingStudy, Notice, Page, Row, T } from '@/ui';

export default function Home() {
  const t = useTheme(); const last = usePreferences(s => s.lastBriefing);
  const { data, error, isPending, isPreview, refetch } = useCurriculum();
  const blocks = data?.blocks.filter(b => b.layer === 'high_yield') ?? [];
  const next = blocks.find(b => b.id === last) ?? blocks[0];
  return <Page>
    <View style={{ gap: 12 }}><T variant="label" color={t.muted}>YOUR QUIET STUDY SPACE</T><T variant="display">Make room for{ '\n' }understanding.</T></View>
    {error ? <ErrorState message={error.message} retry={() => void refetch()} /> : isPending && !data ? <LoadingStudy /> : <>
      <Pressable accessibilityRole="button" accessibilityLabel="Open Al-Fatihah study" onPress={() => next ? router.push(`/briefing/${next.id}`) : router.push('/(tabs)/study')}
        style={({ pressed }) => ({ backgroundColor: '#783447', borderRadius: radii.card, borderCurve: 'continuous', padding: 24, overflow: 'hidden', gap: 20, opacity: pressed ? .9 : 1 })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><T variant="label" color="#E8D3DA">YOUR STARTING POINT</T><T variant="small" color="#E8D3DA">01</T></View>
        <View style={{ gap: 8 }}><T variant="title" color="#FAFAF8" style={{ fontSize: 28, lineHeight: 34 }}>Al-Fatihah</T><T color="#E8D3DA">One surah. A place to begin.</T></View>
        <Svg width="100%" height={72} viewBox="0 0 290 72">
          <Path d="M-12 55 C48 55 10 9 77 15 C132 20 111 64 172 52 C207 45 223 12 298 22" fill="none" stroke="#D7AEBB" strokeWidth={1.2} />
          <Circle cx={77} cy={15} r={4} fill="#FAFAF8" /><Circle cx={172} cy={52} r={4} fill="#FAFAF8" />
        </Svg>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><T color="#FAFAF8" style={{ fontFamily: fonts.medium }}>{last ? 'Continue reading' : 'Open briefing'}</T><Icon name="arrow" color="#FAFAF8" /></View>
      </Pressable>
      <View><T variant="label" color={t.muted}>FOLLOW YOUR CURIOSITY</T>
        <Row title="See the connections" detail="A little context, one relationship at a time." icon="map" onPress={() => router.navigate('/(tabs)/map')} />
        <Row title="Return and reflect" detail="A short review, at your own pace." icon="review" onPress={() => router.navigate('/(tabs)/review')} />
      </View>
      {isPreview && <Notice>Development preview · content awaits editorial review. Your preview activity stays on this device.</Notice>}
      {isPreview && <Button label="Sign in" secondary onPress={() => router.push('/auth')} />}
    </>}
  </Page>;
}
