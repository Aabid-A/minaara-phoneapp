import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useReviewSession } from '@/review-session';
import { useSession } from '@/session';
import { useTheme } from '@/theme';
import { Brand, Button, Page, T } from '@/ui';
export default function Complete() {
  const finished = useReviewSession(s => s.finished); const count = useReviewSession(s => s.questions.length);
  const signedIn = useSession(s => !!s.session); const t = useTheme();
  if (!finished) return <Redirect href="/(tabs)/review" />;
  return <Page safeTop><Brand /><View style={{ flex: 1, justifyContent: 'center', gap: 24, paddingVertical: 48 }}><T variant="display">A little more{ '\n' }to carry with you.</T><T variant="small" color={t.accent}>Session complete</T><T color={t.muted}>You returned to {count} {count === 1 ? 'idea' : 'ideas'}. Leave it here, or follow a connection.</T><T variant="small" color={t.muted}>{signedIn ? 'Your answers are saved to your account.' : 'Your preview activity is saved on this device only.'}</T></View>
    <Button label="Back to review" onPress={() => { useReviewSession.getState().clear(); router.dismissTo('/(tabs)/review'); }} /><Button label="See the connections" secondary onPress={() => { useReviewSession.getState().clear(); router.dismissTo('/(tabs)/map'); }} />
  </Page>;
}
