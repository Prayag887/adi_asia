import { saveSiteContent } from '@/lib/api';
import { applySiteFont, type FontKey } from '@/lib/typography';
import { show, subscribe } from './state';

const openButton = document.querySelector<HTMLElement>('[data-type-open]')!;
const panel = document.querySelector<HTMLElement>('[data-type-panel]')!;
const selectedClasses = ['border-[#b8946a]', 'bg-[#b8946a]/10', 'ring-1', 'ring-[#b8946a]'];
const idleClasses = ['border-[#0f1e33]/10', 'bg-white', 'hover:border-[#b8946a]/50'];
let current: FontKey | undefined;
let choice: FontKey = 'cormorant';
let open = false;
let editing = false;

export function setInitialFont(font?: FontKey) {
  current = font;
  if (font) applySiteFont(font);
}

const render = () => {
  show(openButton, editing && !open);
  show(panel, editing && open);
  panel.querySelectorAll<HTMLElement>('[data-font]').forEach((button) => {
    const on = button.dataset.font === choice;
    button.classList.remove(...(on ? idleClasses : selectedClasses));
    button.classList.add(...(on ? selectedClasses : idleClasses));
  });
};

subscribe((state) => {
  editing = state.editing;
  if (!editing) open = false;
  render();
});

openButton.addEventListener('click', () => { choice = current || 'cormorant'; open = true; render(); });
panel.querySelectorAll('[data-type-close]').forEach((b) => b.addEventListener('click', () => { open = false; render(); }));
panel.querySelectorAll<HTMLElement>('[data-font]').forEach((button) => button.addEventListener('click', () => {
  choice = button.dataset.font as FontKey;
  applySiteFont(choice);
  render();
}));
panel.querySelector('[data-type-save]')!.addEventListener('click', async () => {
  show(panel.querySelector('[data-type-spin]'), true);
  show(panel.querySelector('[data-type-check]'), false);
  try {
    await saveSiteContent({ 'settings:site-font': choice });
    current = choice;
    open = false;
    render();
  } finally {
    show(panel.querySelector('[data-type-spin]'), false);
    show(panel.querySelector('[data-type-check]'), true);
  }
});
