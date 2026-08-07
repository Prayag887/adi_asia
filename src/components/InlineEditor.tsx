import { useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle, Pencil, X } from 'lucide-react';
import { getSiteContent, saveSiteContent } from '@/lib/supabase';

type Props = { enabled: boolean; onClose: () => void };

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

export default function InlineEditor({ enabled, onClose }: Props) {
  const changes = useRef<Record<string, string>>({});
  const originals = useRef<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    let cancelled = false;

    const prepare = async () => {
      const existingMarkers = Array.from(main.querySelectorAll<HTMLElement>('[data-inline-key]'));
      if (existingMarkers.length) {
        existingMarkers.forEach((marker) => {
          marker.contentEditable = String(enabled);
          marker.className = enabled ? 'inline-editor-text' : '';
        });
        return;
      }
      let values = new Map<string, string>();
      try {
        values = new Map((await getSiteContent()).map((item) => [item.key, item.value]));
      } catch {
        // Keep the live page editable even when the remote content table is
        // temporarily unavailable. Saving will still report the backend error.
      }
      if (cancelled) return;
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let current: Node | null;
      while ((current = walker.nextNode())) if (isEditableText(current as Text)) nodes.push(current as Text);

      nodes.forEach((node) => {
        const key = keyFor(node);
        const text = values.get(key);
        if (text !== undefined) node.textContent = text;
        const marker = document.createElement('span');
        marker.dataset.inlineKey = key;
        marker.contentEditable = String(enabled);
        marker.spellcheck = true;
        marker.className = enabled ? 'inline-editor-text' : '';
        marker.textContent = node.textContent;
        originals.current[key] = marker.textContent || '';
        marker.addEventListener('input', () => {
          changes.current[key] = marker.textContent || '';
          setStatus('idle');
        });
        node.parentNode?.replaceChild(marker, node);
      });
    };
    prepare().catch(() => setStatus('error'));
    return () => { cancelled = true; };
  }, [enabled]);

  const save = async () => {
    if (!Object.keys(changes.current).length) return onClose();
    setStatus('saving');
    try {
      await saveSiteContent(changes.current);
      changes.current = {};
      setStatus('saved');
      window.setTimeout(onClose, 700);
    } catch {
      setStatus('error');
    }
  };

  const cancel = () => {
    Object.keys(changes.current).forEach((key) => {
      const marker = document.querySelector<HTMLElement>(`[data-inline-key="${key}"]`);
      if (marker) marker.textContent = originals.current[key];
    });
    changes.current = {};
    onClose();
  };

  if (!enabled) return null;
  return (
    <div data-editor-ignore className="fixed bottom-0 inset-x-0 z-[60] border-t border-[#b8946a]/40 bg-[#0a1525]/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <p className="font-inter text-sm text-[#f8f6f1]/75"><Pencil className="mr-2 inline h-4 w-4 text-[#b8946a]" />Editing the live page — click any highlighted text to change it.</p>
        <div className="flex gap-2">
          <button onClick={cancel} className="rounded border border-[#f8f6f1]/25 px-4 py-2 text-sm text-[#f8f6f1] transition hover:border-[#f8f6f1]/60"><X className="mr-1 inline h-4 w-4" />Cancel</button>
          <button onClick={save} disabled={status === 'saving'} className="rounded bg-[#b8946a] px-4 py-2 text-sm font-medium text-[#0a1525] transition hover:bg-[#c9a87a] disabled:opacity-70">
            {status === 'saving' ? <LoaderCircle className="mr-1 inline h-4 w-4 animate-spin" /> : <Check className="mr-1 inline h-4 w-4" />}
            {status === 'saved' ? 'Saved' : status === 'error' ? 'Could not save' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
