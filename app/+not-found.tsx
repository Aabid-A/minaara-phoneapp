import { router } from 'expo-router';
import { Button, Page, T } from '@/ui';
import { useSession } from '@/session';
import { usePreferences } from '@/store';
export default function NotFound() {
  const available = useSession(s => !!s.session) || usePreferences(s => s.preview);
  return <Page safeTop><T variant="display">Let’s find your place.</T><T>This page isn’t available in this build.</T><Button label="Go home" onPress={() => router.replace(available ? '/(tabs)/home' : '/')} /></Page>;
}
