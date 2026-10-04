import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Linking, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { supabase } from '@/supabase';
import { usePreferences } from '@/store';
import { useSession } from '@/session';
import { fonts, useTheme } from '@/theme';
import { Brand, Button, IconButton, Notice, Page, T } from '@/ui';
export default function Auth() {
  const params = useLocalSearchParams<{ mode?: string }>(); const [signup, setSignup] = useState(params.mode === 'signup');
  const t = useTheme(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [failed, setFailed] = useState(false);
  const fields = useRef({ email: '', password: '', firstName: '' }); const lock = useRef(false);
  const preview = usePreferences(s => s.preview);
  usePreventRemove(busy, () => {});
  async function submit() {
    if (!supabase || lock.current) return;
    const { email, password, firstName } = fields.current;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < (signup ? 8 : 1) || (signup && !firstName.trim())) {
      setFailed(true); setMessage(signup ? 'Enter your first name, a valid email, and a password of at least 8 characters.' : 'Enter a valid email and your password.'); return;
    }
    lock.current = true; setBusy(true); useSession.setState({ authPending: true }); setMessage(''); setFailed(false);
    try {
      const response = signup
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { first_name: firstName.trim() } } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (response.error) throw response.error;
      if (response.data.session) {
        useSession.setState({ session: response.data.session, ready: true });
        // Auth guard removes this one-way door. A feature-initiated modal
        // dismisses to the underlying screen rather than losing the user's place.
      } else { setMessage('Check your email to confirm your account. Once confirmed, return here and sign in.'); }
    } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : 'Could not connect. Check your connection and try again.'); }
    finally {
      lock.current = false; setBusy(false);
      useSession.setState({ authPending: false });
      if (useSession.getState().session) usePreferences.getState().set({ preview: false });
    }
  }
  const fieldStyle = { minHeight: 52, padding: 16, borderWidth: 1, borderColor: t.line, borderRadius: 12, borderCurve: 'continuous' as const, backgroundColor: t.surface, fontSize: 17, fontFamily: fonts.regular, color: t.text };
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={64}>
    <Stack.Screen options={{ headerLeft: () => <IconButton name="close" label="Close sign in" onPress={() => { if (!busy) router.back(); }} /> }} />
    <Page><Brand /><View style={{ gap: 12 }}><T variant="display">{signup ? 'A space of your own.' : 'Welcome back.'}</T><T color={t.muted}>{signup ? 'Create your MINAARA account.' : 'Continue your study with MINAARA.'}</T></View>
      {!supabase && <Notice>Account connection is not configured yet. You can explore the phone preview without an account.</Notice>}
      <View style={{ gap: 16 }}>
        {signup && <View style={{ gap: 8 }}><T variant="small">First name</T><TextInput key="name" accessibilityLabel="First name" placeholder="Your first name" placeholderTextColor={t.muted} autoComplete="given-name" textContentType="givenName" onChangeText={value => { fields.current.firstName = value; }} style={fieldStyle} /></View>}
        <View style={{ gap: 8 }}><T variant="small">Email</T><TextInput accessibilityLabel="Email" placeholder="you@example.com" placeholderTextColor={t.muted} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" onChangeText={value => { fields.current.email = value; }} style={fieldStyle} /></View>
        <View style={{ gap: 8 }}><T variant="small">Password</T><TextInput accessibilityLabel="Password" placeholder={signup ? 'At least 8 characters' : 'Your password'} placeholderTextColor={t.muted} autoCapitalize="none" autoCorrect={false} secureTextEntry autoComplete={signup ? 'new-password' : 'current-password'} textContentType={signup ? 'newPassword' : 'password'} onChangeText={value => { fields.current.password = value; }} returnKeyType="done" onSubmitEditing={() => void submit()} style={fieldStyle} /></View>
      </View>
      {!!message && <Notice><T accessibilityRole={failed ? 'alert' : undefined} variant="small">{message}</T></Notice>}
      <Button label={signup ? 'Create account' : 'Sign in'} disabled={!supabase} busy={busy} onPress={() => void submit()} />
      <Button label={signup ? 'Already have an account? Sign in' : 'New here? Create account'} secondary disabled={busy} onPress={() => { setSignup(!signup); setMessage(''); }} />
      {!signup && <Button label="Forgot password?" secondary onPress={() => void Linking.openURL('https://minaara.app/forgot-password')} />}
      {!preview && <Button label="Explore preview" secondary disabled={busy} onPress={() => { usePreferences.getState().set({ preview: true }); router.dismissTo('/(tabs)/home'); }} />}
      <T variant="small" color={t.muted}>Uses the same MINAARA account as the web app. An account does not imply the curriculum is complete or editorially approved.</T>
    </Page>
  </KeyboardAvoidingView>;
}
