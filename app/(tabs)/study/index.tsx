import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurriculum } from '@/data';
import { usePreferences } from '@/store';
import { fonts, useTheme } from '@/theme';
import { ErrorState, Icon, LoadingStudy, Notice, T } from '@/ui';
export default function Study() {
  const t = useTheme(); const insets = useSafeAreaInsets(); const [search, setSearch] = useState(''); const [savedOnly, setSavedOnly] = useState(false);
  const saved = usePreferences(s => s.saved);
  const { data, isPreview, error, refetch, isPending } = useCurriculum();
  const blocks = (data?.blocks ?? []).filter(b => b.layer === 'high_yield' && (!savedOnly || saved.includes(b.id)) && b.section_title.toLowerCase().includes(search.toLowerCase()));
  return <FlashList data={blocks} keyExtractor={b => b.id} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" style={{ backgroundColor: t.background }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 + insets.bottom }}
    ListHeaderComponent={<View style={{ gap: 20, paddingBottom: 20, maxWidth: 520 }}>
      <T variant="display">Begin with clarity.</T><T color={t.muted}>Al-Fatihah · short briefings</T>
      <TextInput accessibilityLabel="Search briefings" placeholder="Find a briefing" placeholderTextColor={t.muted} onChangeText={setSearch} autoCorrect={false} style={{ minHeight: 52, padding: 16, borderRadius: 12, borderCurve: 'continuous', backgroundColor: t.inset, fontSize: 17, fontFamily: fonts.regular, color: t.text }} />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: savedOnly }} aria-checked={savedOnly} onPress={() => setSavedOnly(!savedOnly)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 }}><Icon name={savedOnly ? 'check' : 'bookmark'} color={t.accent} /><T>Saved briefings only</T></Pressable>
      {isPreview && <Notice>Development briefings · not yet editorially reviewed.</Notice>}
      {error && <ErrorState message={error.message} retry={() => void refetch()} />}
    </View>}
    renderItem={({ item, index }) => <Pressable accessibilityRole="button" onPress={() => router.push(`/briefing/${item.id}`)} style={({ pressed }) => ({ paddingVertical: 22, minHeight: 88, flexDirection: 'row', gap: 16, alignItems: 'flex-start', borderTopWidth: 1, borderColor: t.line, backgroundColor: pressed ? t.inset : 'transparent', maxWidth: 520 })}>
      <T variant="small" color={t.accent} style={{ fontVariant: ['tabular-nums'], width: 24, paddingTop: 4 }}>{String(index + 1).padStart(2, '0')}</T>
      <View style={{ gap: 8, flex: 1 }}><T variant="title">{item.section_title}</T><T variant="small" color={t.muted}>Briefing{item.ayah_range ? ` · Ayat ${item.ayah_range}` : ''}{saved.includes(item.id) ? ' · Saved' : ''}</T></View><Icon name="chevron" size={18} color={t.muted} />
    </Pressable>}
    ListEmptyComponent={isPending && !data ? <LoadingStudy /> : !error ? <View style={{ gap: 12, paddingVertical: 24 }}><T variant="title">{savedOnly ? 'A place for what you keep.' : search ? 'No matching briefings.' : 'No briefings yet.'}</T><T color={t.muted}>{savedOnly ? 'Open a briefing and save it to return here.' : search ? 'Try a different title or clear your search.' : 'Your study content will appear here when available.'}</T></View> : null}
    ListFooterComponent={<View style={{ gap: 12, paddingTop: 28, paddingBottom: 12 }}><T variant="label" color={t.muted}>A FOCUSED FIRST CHAPTER</T><T variant="small" color={t.muted}>This build begins with Al-Fatihah. More surahs are not available in this phone build yet.</T></View>}
  />;
}
