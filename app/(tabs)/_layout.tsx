import { Tabs } from 'expo-router/js-tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { fonts, useTheme } from '@/theme';
export default function WebTabs() {
  const t = useTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: t.accent, tabBarInactiveTintColor: t.muted, tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line, height: 72, paddingBottom: 12, paddingTop: 8 }, tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 }, animation: 'none' }}>
    <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} /> }} />
    <Tabs.Screen name="study" options={{ title: 'Study', tabBarIcon: ({ color }) => <MaterialIcons name="menu-book" size={24} color={color} /> }} />
    <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: ({ color }) => <MaterialIcons name="hub" size={24} color={color} /> }} />
    <Tabs.Screen name="review" options={{ title: 'Review', tabBarIcon: ({ color }) => <MaterialIcons name="history" size={24} color={color} /> }} />
  </Tabs>;
}
