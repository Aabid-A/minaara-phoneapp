import { Stack, router } from 'expo-router';
import { fonts, useTheme } from './theme';
import { IconButton } from './ui';
export function TabStack({ title }: { title: string }) {
  const t = useTheme();
  return <Stack screenOptions={{ headerStyle: { backgroundColor: t.background }, headerTintColor: t.text, headerTitleStyle: { fontFamily: fonts.medium }, headerShadowVisible: false, contentStyle: { backgroundColor: t.background } }}>
    <Stack.Screen name="index" options={{ title, headerRight: () => <IconButton name="settings" label="Settings" onPress={() => router.push('/settings')} /> }} />
  </Stack>;
}
