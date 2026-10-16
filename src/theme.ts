import { useColorScheme } from 'react-native';
import { usePreferences } from './store';
import { light, dark } from './design-tokens';
export { light, dark, fonts, radii, space } from './design-tokens';
export function useTheme() {
  const system = useColorScheme();
  const appearance = usePreferences(s => s.appearance);
  const isDark = appearance === 'dark' || (appearance === 'system' && system === 'dark');
  return { ...(isDark ? dark : light), isDark };
}
