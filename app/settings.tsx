import { useState } from 'react';
import { Linking, Pressable, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { usePreferences } from '@/store';
import { useSession } from '@/session';
import { supabase } from '@/supabase';
import { useTheme } from '@/theme';
import { Brand, Button, Disclosure, Notice, Page, Row, T } from '@/ui';
export default function Settings() {
  const t = useTheme(); const appearance = usePreferences(s => s.appearance); const haptics = usePreferences(s => s.haptics); const set = usePreferences(s => s.set);
  const session = useSession(s => s.session); const restoreError = useSession(s => s.error); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function signOut() {
    if (busy || !supabase) return; setBusy(true); setError('');
    const { error } = await supabase.auth.signOut();
    if (error) setError('Could not sign out. Please try again.');
    else { usePreferences.getState().set({ preview: false }); useSession.setState({ session: null }); }
    setBusy(false);
  }
  return <Page><T variant="display">Make yourself{ '\n' }at home.</T>
    <View style={{ gap: 12 }}>
      <T variant="label" color={t.muted}>APPEARANCE</T>
      {(['system', 'light', 'dark'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: appearance === value }} aria-checked={appearance === value} onPress={() => set({ appearance: value })} style={({ pressed }) => ({ minHeight: 52, borderBottomWidth: 1, borderColor: t.line, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: pressed ? t.inset : 'transparent' })}>
        <T>{value === 'system' ? 'Follow device' : value === 'light' ? 'Light' : 'Dark'}</T>
        {appearance === value && <T color={t.accent}>Selected</T>}
      </Pressable>)}
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52 }}><T>Gentle haptics</T><Switch accessibilityLabel="Gentle haptics" value={haptics} onValueChange={value => set({ haptics: value })} trackColor={{ false: t.line, true: t.accent }} thumbColor="#FAFAF8" /></View>
    <T variant="small" color={t.muted}>Text follows your device’s text-size settings. The map uses a readable list at larger sizes.</T>
    <View style={{ gap: 12 }}><T variant="label" color={t.muted}>YOUR ACCOUNT</T><T selectable>{session?.user.email ?? 'Exploring the development preview'}</T><T variant="small" color={t.muted}>{session ? 'Review answers sync to your MINAARA account. Saved briefings remain on this device.' : 'Preview review history and saved briefings stay on this device. Signing in does not upload preview activity.'}</T>
      {!!restoreError && <Notice>{restoreError}</Notice>}{!!error && <Notice>{error}</Notice>}
      {session ? <Button label="Sign out" secondary busy={busy} onPress={() => void signOut()} /> : <Button label="Sign in" onPress={() => router.push('/auth')} />}
    </View>
    <Disclosure title="About this first build"><T color={t.muted}>MINAARA is a guided space to understand the Quran. This phone build covers the Al-Fatihah study loop. It is not a complete Quran curriculum, and development content needs editorial review before release.</T><T variant="small" color={t.muted}>The map shows curriculum membership, not inferred religious relationships.</T></Disclosure>
    <Row title="Visit MINAARA" detail="minaara.app" onPress={() => void Linking.openURL('https://minaara.app')} />
    <Brand compact /><T variant="small" color={t.muted}>Phone preview · 0.1.0</T>
  </Page>;
}
