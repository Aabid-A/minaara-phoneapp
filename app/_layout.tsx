import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond/500Medium';
import { Cinzel_500Medium } from '@expo-google-fonts/cinzel/500Medium';
import { useEffect } from 'react';
import { useInitializeSession, useSession } from '@/session';
import { usePreferences } from '@/store';
import { queryClient } from '@/data';
import { fonts, useTheme } from '@/theme';
import { ErrorState, Page } from '@/ui';

void SplashScreen.preventAutoHideAsync();
export const unstable_settings = { initialRouteName: '(tabs)' };
export default function Layout() {
  const [loaded, fontError] = useFonts({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, CormorantGaramond_500Medium, Cinzel_500Medium });
  useInitializeSession();
  const ready = useSession(s => s.ready); const session = useSession(s => s.session);
  const authPending = useSession(s => s.authPending);
  const hydrated = usePreferences(s => s.hydrated); const preview = usePreferences(s => s.preview);
  const t = useTheme();
  const available = (!!session && !authPending) || preview;
  useEffect(() => { if ((loaded || fontError) && ready && hydrated) void SplashScreen.hideAsync(); }, [loaded, fontError, ready, hydrated]);
  if ((!loaded && !fontError) || !ready || !hydrated) return null;
  if (fontError) return <SafeAreaProvider><Page safeTop><ErrorState message="The local font could not be loaded. Please restart MINAARA." /></Page></SafeAreaProvider>;
  const nav = { ...(t.isDark ? DarkTheme : DefaultTheme), colors: { ...(t.isDark ? DarkTheme : DefaultTheme).colors, background: t.background, card: t.background, text: t.text, border: t.line, primary: t.accent } };
  return <SafeAreaProvider><QueryClientProvider client={queryClient}><ThemeProvider value={nav}>
    <StatusBar style={t.isDark ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerTintColor: t.text, headerStyle: { backgroundColor: t.background }, headerTitleStyle: { fontFamily: fonts.medium }, headerShadowVisible: false, contentStyle: { backgroundColor: t.background } }}>
      <Stack.Protected guard={!available}><Stack.Screen name="index" options={{ headerShown: false }} /></Stack.Protected>
      <Stack.Protected guard={available}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="briefing/[id]" options={{ title: 'Briefing', headerBackTitle: 'Back' }} />
        <Stack.Screen name="concept/[id]" options={{ title: 'Connection', presentation: 'formSheet', sheetAllowedDetents: [.65, 1], sheetGrabberVisible: true }} />
        <Stack.Screen name="session" options={{ title: 'Review', presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="session-complete" options={{ title: 'Session complete', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session || authPending}><Stack.Screen name="auth" options={{ title: 'Your MINAARA account', presentation: 'modal' }} /></Stack.Protected>
      <Stack.Screen name="+not-found" options={{ title: 'Not found' }} />
    </Stack>
  </ThemeProvider></QueryClientProvider></SafeAreaProvider>;
}
