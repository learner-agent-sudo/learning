import type { Config } from 'tailwindcss';

// Colours that change per module or per stage are CSS variables holding RGB
// channels, so opacity modifiers (bg-module/10) still work.
const channel = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  // `dark` on <html>, set before paint from the saved choice or the system
  // setting (see app/layout.tsx).
  darkMode: 'class',
  theme: {
    extend: {
      // Every colour is a theme variable (light values in :root, dark in
      // .dark; see globals.css).
      colors: {
        ink: channel('--ink'),
        muted: channel('--muted'),
        paper: channel('--paper'),
        panel: channel('--panel'),
        line: channel('--line'),
        accent: channel('--accent'),
        // Text on a solid module/phase/accent fill.
        onaccent: channel('--on-accent'),
        module: channel('--module'),
        phase: channel('--phase'),
        vol: channel('--vol'),
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Newsreader Variable"', 'Georgia', 'ui-serif', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 rgb(28 31 38 / 0.04), 0 1px 3px rgb(28 31 38 / 0.06)',
        lift: '0 2px 4px rgb(28 31 38 / 0.04), 0 12px 28px -8px rgb(28 31 38 / 0.18)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        rise: 'rise 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        fade: 'fade 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
