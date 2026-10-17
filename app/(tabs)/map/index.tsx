import { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { useCurriculum } from '@/data';
import { buildMap } from '@/map-model';
import { useTheme, fonts } from '@/theme';
import { Button, Disclosure, ErrorState, LoadingStudy, Notice, Page, Row, T, tick } from '@/ui';

export default function MapScreen() {
  const t = useTheme(); const { width, fontScale } = useWindowDimensions();
  const { data, isPreview, error, isPending, refetch } = useCurriculum(); const [list, setList] = useState(false); const [selected, setSelected] = useState('surah-1');
  const model = data ? buildMap(data) : null; const node = model?.items.find(n => n.id === selected) ?? model?.items[0];
  const canvasWidth = Math.min(width - 48, 512); const scale = canvasWidth / 340;
  const forcedList = fontScale > 1.25 || canvasWidth < 290;
  const showList = list || forcedList;
  return <Page>
    <View style={{ gap: 12 }}><T variant="display">Nothing in isolation.</T><T color={t.muted}>Tap an idea. Follow its connection.</T></View>
    {error ? <ErrorState message={error.message} retry={() => void refetch()} /> : isPending && !data ? <LoadingStudy /> : !model || !data?.concepts.length ? <Notice>No connected concepts are available yet. Open Study to begin with a briefing.</Notice> : <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <T variant="label" color={t.muted}>AL-FATIHAH · FOCUSED MAP</T>
        {forcedList ? <T variant="small" color={t.muted}>List view</T> : <Pressable accessibilityRole="button" onPress={() => setList(!list)} style={{ minHeight: 44, minWidth: 64, justifyContent: 'center' }}><T variant="small" color={t.accent}>{showList ? 'Map view' : 'List view'}</T></Pressable>}
      </View>
      {showList ? <View>{model.items.map(n => <Row key={n.id} title={n.label} detail={n.kind === 'concept' ? 'Concept in Al-Fatihah' : n.kind === 'domain' ? 'Curriculum domain' : 'Surah'} onPress={() => { setSelected(n.id); tick(); if (n.conceptId) router.push(`/concept/${n.conceptId}`); }} />)}</View> : <View style={{ width: canvasWidth, height: 432 * scale, alignSelf: 'center' }}>
        <Svg width={canvasWidth} height={432 * scale} viewBox="0 0 340 432">
          {model.edges.map((edge, i) => <Path key={i} d={edge.path} fill="none" stroke={t.accent} strokeWidth={selected === edge.from || selected === edge.to ? 1.5 : 1} opacity={selected === edge.from || selected === edge.to ? .7 : .17} />)}
          {model.items.map(n => <Circle key={n.id} cx={n.x} cy={n.y} r={n.kind === 'surah' ? 26 : 18} fill={n.id === selected ? t.accent : t.background} stroke={t.accent} strokeWidth={n.id === selected ? 1.5 : 1} />)}
        </Svg>
        {model.items.map(n => <Pressable key={n.id} accessibilityRole="button" accessibilityLabel={`${n.label}, ${n.kind}. ${n.kind === 'concept' ? 'Open context.' : 'Select for context.'}`} accessibilityState={{ selected: n.id === selected }} onPress={() => { setSelected(n.id); tick(); if (n.conceptId) router.push(`/concept/${n.conceptId}`); }} style={({ pressed }) => ({ position: 'absolute', left: (n.x - 54) * scale, top: (n.y - 24) * scale, width: 108 * scale, minHeight: 80, alignItems: 'center', gap: 8, opacity: pressed ? .7 : 1 })}>
          <View style={{ height: 48 * scale, alignItems: 'center', justifyContent: 'center' }}><T variant="small" color={selected === n.id ? t.onAccent : t.accent} style={{ fontFamily: fonts.medium }}>{n.kind === 'surah' ? '01' : n.kind === 'domain' ? 'D' : String(model.items.filter(x => x.kind === 'concept').findIndex(x => x.id === n.id) + 1).padStart(2, '0')}</T></View>
          <T variant="small" color={selected === n.id ? t.text : t.muted} style={{ textAlign: 'center', fontFamily: fonts.medium, backgroundColor: t.background, paddingHorizontal: 4 }}>{n.label}</T>
        </Pressable>)}
      </View>}
      {node && <View style={{ gap: 12, borderTopWidth: 1, borderColor: t.line, paddingTop: 20 }}>
        <T variant="label" color={t.accent}>{node.kind === 'concept' ? 'SELECTED CONNECTION' : node.kind === 'domain' ? 'CURRICULUM DOMAIN' : 'YOUR STARTING POINT'}</T>
        <T variant="title">{node.label}</T>
        <Button secondary label={node.conceptId ? 'Explore the connection' : 'Open briefings'} onPress={() => node.conceptId ? router.push(`/concept/${node.conceptId}`) : router.navigate('/(tabs)/study')} />
      </View>}
      {isPreview && <T variant="small" color={t.muted}>Development preview · awaiting editorial review.</T>}
      <Disclosure title="About these connections"><T color={t.muted}>Lines show recorded surah and domain membership—not theological inference.{model.hiddenConcepts > 0 ? ` ${model.hiddenConcepts} more concepts are available in Study.` : ''}</T></Disclosure>
    </>}
  </Page>;
}
