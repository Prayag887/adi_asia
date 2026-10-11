// Inline text editing. Every visitor gets saved text overrides applied; signed-in editors can
// switch the same spans to contentEditable. Keys are derived from DOM position, so keep the
// section markup stable once content has been edited.
import { saveSiteContent } from '@/lib/api';
import { setState, show, subscribe } from './state';

const bar = document.querySelector<HTMLElement>('[data-editor-bar]')!;
const saveButton = bar.querySelector<HTMLButtonElement>('[data-editor-save]')!;
const saveLabel = bar.querySelector<HTMLElement>('[data-save-label]')!;
const changes: Record<string, string> = {};
const originals: Record<string, string> = {};
let markers: HTMLElement[] = [];

function keyFor(node: Text) {
  const parent = node.parentElement!;
  const section = parent.closest('section')?.id || 'page';
  const siblings = Array.from(parent.childNodes).filter((item) => item.nodeType === Node.TEXT_NODE && item.textContent?.trim());
  return `${section}:${parent.tagName.toLowerCase()}:${Array.from(parent.parentElement?.children || []).indexOf(parent)}:${siblings.indexOf(node)}`;
}

function isEditableText(node: Text) {
  const parent = node.parentElement;
  if (!parent || !node.textContent?.trim()) return false;
  if (parent.closest('[data-editor-ignore], canvas, svg, button, input, textarea, select')) return false;
  return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'LI', 'A'].includes(parent.tagName);
}

/** Wraps editable text in marker spans and applies saved values. Runs once per page load. */
export function prepareEditor(values: Map<string, string>) {
  const main = document.querySelector('main');
  if (!main || markers.length) return;
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current: Node | null;
  while ((current = walker.nextNode())) if (isEditableText(current as Text)) nodes.push(current as Text);

  // Keys are computed one node at a time, after earlier nodes were wrapped. This mirrors the
  // original React editor exactly, so content saved by it keeps landing in the same place.
  markers = nodes.map((node) => {
    const key = keyFor(node);
    const text = values.get(key);
    const marker = document.createElement('span');
    marker.dataset.inlineKey = key;
    marker.spellcheck = true;
    marker.textContent = text !== undefined ? text : node.textContent;
    originals[key] = marker.textContent || '';
    marker.addEventListener('input', () => {
      changes[key] = marker.textContent || '';
      setLabel('idle');
    });
    node.parentNode?.replaceChild(marker, node);
    return marker;
  });
}

function setLabel(status: 'idle' | 'saving' | 'saved' | 'error') {
  saveButton.disabled = status === 'saving';
  show(bar.querySelector('[data-icon-saving]'), status === 'saving');
  show(bar.querySelector('[data-icon-check]'), status !== 'saving');
  saveLabel.textContent = status === 'saved' ? 'Saved' : status === 'error' ? 'Could not save' : 'Save changes';
}

subscribe((state) => {
  show(bar, state.editing);
  markers.forEach((marker) => {
    marker.contentEditable = String(state.editing);
    marker.className = state.editing ? 'inline-editor-text' : '';
  });
});

saveButton.addEventListener('click', async () => {
  if (!Object.keys(changes).length) return setState({ editing: false });
  setLabel('saving');
  try {
    await saveSiteContent(changes);
    Object.entries(changes).forEach(([key, value]) => { originals[key] = value; delete changes[key]; });
    setLabel('saved');
    window.setTimeout(() => { setLabel('idle'); setState({ editing: false }); }, 700);
  } catch {
    setLabel('error');
  }
});

bar.querySelector('[data-editor-cancel]')!.addEventListener('click', () => {
  Object.keys(changes).forEach((key) => {
    const marker = document.querySelector<HTMLElement>(`[data-inline-key="${CSS.escape(key)}"]`);
    if (marker) marker.textContent = originals[key];
    delete changes[key];
  });
  setState({ editing: false });
});
