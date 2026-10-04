// src/app/theme-init.tsx
export function ThemeInitScript() {
  const script = `
    (function() {
      try {
        var t = localStorage.getItem('app-theme') || 'system';
        var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (dark) document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}