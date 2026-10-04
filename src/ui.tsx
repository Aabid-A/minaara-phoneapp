import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, type TextProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SvgXml } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { fonts, radii, useTheme } from './theme';
import { logoXml } from './generated/logo';
import { usePreferences } from './store';

type IconName = 'arrow' | 'book' | 'map' | 'review' | 'chevron' | 'settings' | 'bookmark' | 'close' | 'check' | 'source';
const icons = {
  arrow: ['arrow.right', 'arrow-forward'], book: ['book', 'menu-book'], map: ['point.3.connected.trianglepath.dotted', 'hub'],
  review: ['arrow.counterclockwise', 'history'], chevron: ['chevron.right', 'chevron-right'], settings: ['slider.horizontal.3', 'tune'],
  bookmark: ['bookmark', 'bookmark-border'], close: ['xmark', 'close'], check: ['checkmark', 'check'], source: ['text.book.closed', 'source'],
} as const;
export function Icon({ name, color, size = 22 }: { name: IconName; color?: string; size?: number }) {
  const theme = useTheme();
  const [sf, md] = icons[name];
  return <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {process.env.EXPO_OS === 'ios'
      ? <SymbolView name={sf} tintColor={color ?? theme.text} size={size} weight="regular" style={{ width: size, height: size }} />
      : <MaterialIcons name={md} size={size} color={color ?? theme.text} />}
  </View>;
}
export function T({ variant = 'body', color, style, ...props }: TextProps & { variant?: 'display' | 'title' | 'body' | 'small' | 'label'; color?: string }) {
  const theme = useTheme();
  const type = {
    display: { fontSize: 34, lineHeight: 40, fontFamily: fonts.medium, letterSpacing: -.6 },
    title: { fontSize: 22, lineHeight: 28, fontFamily: fonts.medium },
    body: { fontSize: 17, lineHeight: 25, fontFamily: fonts.regular },
    small: { fontSize: 14, lineHeight: 21, fontFamily: fonts.regular },
    label: { fontSize: 12, lineHeight: 18, fontFamily: fonts.semibold, letterSpacing: 1.4 },
  }[variant];
  return <Text {...props} style={[type, { color: color ?? theme.text }, style]} />;
}
export function Brand({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><SvgXml xml={logoXml.replace(/aria-labelledby="[^"]*"/, '').replace(/<title[^>]*>.*?<\/title>/, '').replaceAll('#783447', inverse ? '#FAFAF8' : theme.accent)} width={compact ? 18 : 26} height={compact ? 36 : 52} /></View>
    <T variant="small" color={inverse ? '#FAFAF8' : theme.text} style={{ fontFamily: fonts.medium, letterSpacing: 3 }}>MINAARA</T>
  </View>;
}
export function Page({ children, bottom = 24, safeTop = false }: { children: ReactNode; bottom?: number; safeTop?: boolean }) {
  const theme = useTheme(); const insets = useSafeAreaInsets();
  return <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentInsetAdjustmentBehavior="automatic"
    keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: safeTop ? insets.top + 20 : 24, paddingBottom: bottom + insets.bottom, gap: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
    {children}
  </ScrollView>;
}
export function Button({ label, onPress, secondary = false, busy = false, disabled = false, icon = false }: { label: string; onPress: () => void; secondary?: boolean; busy?: boolean; disabled?: boolean; icon?: boolean }) {
  const t = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || busy, busy }} aria-disabled={disabled || busy} aria-busy={busy} onPress={onPress} disabled={disabled || busy}
    style={({ pressed }) => ({ minHeight: 52, paddingVertical: 14, paddingHorizontal: 20, borderRadius: radii.control, borderCurve: 'continuous', backgroundColor: secondary ? t.inset : t.accent, opacity: disabled ? .5 : pressed ? .8 : 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 })}>
    {busy ? <ActivityIndicator color={secondary ? t.text : t.onAccent} /> : <><T style={{ fontFamily: fonts.medium }} color={secondary ? t.text : t.onAccent}>{label}</T>{icon && <Icon name="arrow" color={secondary ? t.text : t.onAccent} size={20} />}</>}
  </Pressable>;
}
export function IconButton({ name, label, onPress }: { name: IconName; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? .5 : 1 })}><Icon name={name} /></Pressable>;
}
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useTheme(); return <View style={[{ padding: 20, gap: 16, borderRadius: radii.card, borderCurve: 'continuous', backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }, style]}>{children}</View>;
}
export function Row({ title, detail, icon, onPress }: { title: string; detail?: string; icon?: IconName; onPress: () => void }) {
  const t = useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', gap: 16, alignItems: 'center', paddingVertical: 18, minHeight: 64, borderBottomWidth: 1, borderColor: t.line, backgroundColor: pressed ? t.inset : 'transparent' })}>
    {icon && <Icon name={icon} color={t.accent} />}
    <View style={{ flex: 1, gap: 4 }}><T style={{ fontFamily: fonts.medium }}>{title}</T>{detail && <T variant="small" color={t.muted}>{detail}</T>}</View>
    <Icon name="chevron" size={18} color={t.muted} />
  </Pressable>;
}
export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme(); const [open, setOpen] = useState(false);
  return <View style={{ borderTopWidth: 1, borderColor: t.line }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} aria-expanded={open} onPress={() => setOpen(!open)} style={({ pressed }) => ({ minHeight: 56, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: pressed ? .6 : 1 })}>
      <T style={{ fontFamily: fonts.medium }}>{title}</T><View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}><Icon name="chevron" size={18} /></View>
    </Pressable>
    {open && <View style={{ paddingBottom: 20, gap: 12 }}>{children}</View>}
  </View>;
}
export function Notice({ children }: { children: ReactNode }) {
  const t = useTheme(); return <View style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: t.inset, borderRadius: radii.control, borderCurve: 'continuous' }}><T variant="small" color={t.muted}>{children}</T></View>;
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <Card><T variant="title">Let’s try that again.</T><T accessibilityRole="alert">{message}</T>{retry && <Button label="Try again" onPress={retry} />}</Card>;
}
export function LoadingStudy() {
  const t = useTheme(); return <View accessibilityLabel="Loading study space" accessibilityRole="progressbar" style={{ gap: 20 }}>
    {[180, 260, 220].map((width, i) => <View key={i} style={{ height: i ? 80 : 32, width: `${width / 3}%`, maxWidth: '100%', backgroundColor: t.inset, borderRadius: radii.control }} />)}
  </View>;
}
export function tick() {
  if (process.env.EXPO_OS !== 'web' && usePreferences.getState().haptics) void Haptics.selectionAsync().catch(() => {});
}
