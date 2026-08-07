export const fontChoices = {
  cormorant: { label: 'Cormorant Garamond', value: "'Cormorant Garamond', Georgia, serif" },
  garamond: { label: 'EB Garamond', value: "'EB Garamond', Georgia, serif" },
  cinzel: { label: 'Cinzel', value: "'Cinzel', serif" },
  baskerville: { label: 'Libre Baskerville', value: "'Libre Baskerville', Georgia, serif" },
  inter: { label: 'Inter', value: "'Inter', sans-serif" },
} as const;
export type FontKey = keyof typeof fontChoices;

export function applySiteFont(font?: FontKey) {
  if (!font) { delete document.body.dataset.siteFont; delete document.documentElement.dataset.siteFont; document.body.style.removeProperty('--site-font'); return; }
  document.body.dataset.siteFont = font;
  document.documentElement.dataset.siteFont = font;
  document.body.style.setProperty('--site-font', fontChoices[font].value);
}
