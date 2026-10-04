import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/theme';
export default function NativeTabLayout() {
  const t = useTheme();
  return <NativeTabs tintColor={t.accent} backgroundColor={t.surface} labelStyle={{ color: t.muted }} disableTransparentOnScrollEdge>
    <NativeTabs.Trigger name="home"><NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" /><NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="study"><NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} md="menu_book" /><NativeTabs.Trigger.Label>Study</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="map"><NativeTabs.Trigger.Icon sf="point.3.connected.trianglepath.dotted" md="hub" /><NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="review"><NativeTabs.Trigger.Icon sf="arrow.counterclockwise" md="history" /><NativeTabs.Trigger.Label>Review</NativeTabs.Trigger.Label></NativeTabs.Trigger>
  </NativeTabs>;
}
