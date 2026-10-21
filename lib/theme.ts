// A colour as RGB channels for light mode and a lighter twin for dark mode.
// Each was chosen for at least 4.5:1 contrast as text on the page and on its
// own 10% tint, and for its fill against `onaccent` text, in its theme.
export interface Tone {
  light: string;
  dark: string;
}

export const TONES = {
  blue: { light: '52 87 140', dark: '138 171 222' },
  navy: { light: '36 64 107', dark: '138 171 222' },
  violet: { light: '109 74 150', dark: '185 160 230' },
  green: { light: '26 104 78', dark: '110 200 160' },
  forest: { light: '30 82 68', dark: '110 200 160' },
  brick: { light: '168 54 40', dark: '240 140 120' },
  amber: { light: '134 88 18', dark: '230 180 90' },
  teal: { light: '15 110 110', dark: '100 200 200' },
  plum: { light: '91 72 140', dark: '185 160 230' },
  bronze: { light: '120 92 60', dark: '215 175 125' },
} satisfies Record<string, Tone>;

type Slot = '--module' | '--phase' | '--vol';

/** Inline style setting a colour slot for both themes (see globals.css). */
export function toneVars(slot: Slot, tone: Tone): React.CSSProperties {
  return { [slot]: tone.light, [`${slot}-d`]: tone.dark } as React.CSSProperties;
}
