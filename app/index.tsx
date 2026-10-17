import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Brand, Button, Disclosure, Page, T } from '@/ui';
import { useTheme } from '@/theme';
import { usePreferences } from '@/store';

export default function Welcome() {
  const t = useTheme(); const set = usePreferences(s => s.set);
  return <Page safeTop bottom={32}>
    <Brand />
    <View style={{ gap: 16, paddingTop: 20 }}>
      <T variant="display">One question.{ '\n' }A clearer beginning.</T>
      <T color={t.muted}>A guided space to understand the Quran.</T>
    </View>
    <View accessible={false} style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Svg width="100%" height={216} viewBox="0 0 340 216">
        <Path d="M-15 145 C30 145 18 39 86 42 C143 45 100 152 168 141 C238 130 183 70 252 72 C307 74 286 182 353 172" stroke={t.accent} strokeWidth={1.5} fill="none" />
        <Rect x={116} y={69} width={112} height={100} rx={16} fill={t.background} stroke={t.line} />
        <Path d="M133 90 C150 86 161 88 172 94 C181 88 197 86 211 90 L211 145 C197 141 183 141 172 149 C162 142 148 141 133 145 Z M172 94 L172 149" stroke={t.accent} strokeWidth={1.5} fill="none" />
        <Circle cx={86} cy={42} r={4} fill={t.accent} /><Circle cx={252} cy={72} r={4} fill={t.accent} />
      </Svg>
    </View>
    <View style={{ gap: 12 }}><T variant="title">Clear briefings. Connected ideas.{ '\n' }Room to reflect.</T>
      <Disclosure title="How MINAARA works"><T color={t.muted}>Start with a short briefing. Open its sources when you want more context. Explore connected concepts on the map, then return with gentle practice and review.</T><T variant="small" color={t.muted}>This first phone build starts with Al-Fatihah. The preview is development content, not a reviewed Quran curriculum.</T></Disclosure>
    </View>
    <View style={{ gap: 12, marginTop: 'auto' }}>
      <Button label="Get started" onPress={() => router.push('/auth?mode=signup')} icon />
      <Button label="Explore preview" secondary onPress={() => { set({ preview: true }); router.replace('/(tabs)/home'); }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Sign in" onPress={() => router.push('/auth')} style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', alignItems: 'center', opacity: pressed ? .5 : 1 })}><T variant="small" color={t.muted}>Already have an account? <T variant="small" color={t.accent}>Sign in</T></T></Pressable>
    </View>
  </Page>;
}
