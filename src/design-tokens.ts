import palette from './generated/palette.json';

// Mirror the web's derived colour roles without introducing another light palette.
function mix(foreground: string, background: string, amount: number) {
  const channels = [1, 3, 5].map(offset => Math.round(
    parseInt(foreground.slice(offset, offset + 2), 16) * amount
    + parseInt(background.slice(offset, offset + 2), 16) * (1 - amount),
  ).toString(16).padStart(2, '0'));
  return `#${channels.join('')}`;
}

const identity = {
  brandFill: palette.accent,
  brandText: palette.white,
  brandMuted: mix(palette.white, palette.accent, .88),
};

export const light = {
  background: palette.page, surface: palette.white, inset: palette.surface,
  text: palette.ink, muted: palette.muted, line: palette.line,
  accent: palette.accent, onAccent: palette.white,
  accentWash: mix(palette.accent, palette.page, .1),
  ...identity,
};

// Retain the existing phone dark adaptation; the web has no shared dark palette.
export const dark = {
  background: '#211F23', surface: '#2C292E', inset: '#353137',
  text: '#FAFAF8', muted: '#C1B8BF', line: '#494249',
  accent: '#E2A5B7', onAccent: '#32151F', accentWash: '#483039',
  ...identity,
};

export const fonts = {
  regular: 'Outfit_400Regular', medium: 'Outfit_500Medium', semibold: 'Outfit_600SemiBold',
  editorial: 'CormorantGaramond_500Medium', brand: 'Cinzel_500Medium',
};
export const radii = { card: 12, control: 12, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, page: 24, section: 32 };
