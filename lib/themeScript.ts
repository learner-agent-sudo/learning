// Shared by the theme switch (client) and the root layout (server).
export const THEME_KEY = 'learning:theme';

// Runs in <head> before first paint, so the page never flashes the wrong
// theme. Mirrors apply() in components/ThemeToggle.tsx.
export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem('${THEME_KEY}');var d=c==='dark'||(c!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
