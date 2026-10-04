import { useColorScheme } from 'react-native';
import palette from './generated/palette.json';
import { usePreferences } from './store';

export const light = {
  background: palette.page, surface: palette.white, inset: palette.surface,
  text: palette.ink, muted: palette.muted, line: palette.line,
  accent: palette.accent, onAccent: palette.page, accentWash: '#F0E8EA',
};
export const dark = {
  background: '#211F23', surface: '#2C292E', inset: '#353137',
  text: '#FAFAF8', muted: '#C1B8BF', line: '#494249',
  accent: '#E2A5B7', onAccent: '#32151F', accentWash: '#483039',
};
export function useTheme() {
  const system = useColorScheme();
  const appearance = usePreferences(s => s.appearance);
  const isDark = appearance === 'dark' || (appearance === 'system' && system === 'dark');
  return { ...(isDark ? dark : light), isDark };
}
export const fonts = { regular: 'Outfit_400Regular', medium: 'Outfit_500Medium', semibold: 'Outfit_600SemiBold' };
// Shape lock: cards 20, controls 12, pills circular. All spacing on a 4pt grid.
export const radii = { card: 20, control: 12, pill: 999 };
