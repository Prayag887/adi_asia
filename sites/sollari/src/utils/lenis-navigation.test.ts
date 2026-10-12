import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

it('prevents router navigation before bubbling and defers scrolling until drawer close', () => {
  const listeners = new Map<string, { callback: Function; capture: boolean }>();
  const frames = new Map<number, Function>();
  let frame = 0;
  let drawerOpen = true;
  const target = {};
  const scrollTo = vi.fn(() => expect(drawerOpen).toBe(false));
  const resize = vi.fn();
  function Lenis() { return { raf() {}, scrollTo, resize }; }
  const window = { location: new URL('https://www.sollari.app/'), Lenis,
    matchMedia: () => ({ matches: false }), addEventListener() {} };
  runInNewContext(readFileSync(new URL('../../public/js/lenis.js', import.meta.url), 'utf8'), {
    window, Lenis, URL, history: { pushState() {} },
    document: { documentElement: { getAttribute: () => 'true' },
      getElementById: () => target,
      addEventListener: (type: string, callback: Function, capture = false) => listeners.set(type, { callback, capture }) },
    requestAnimationFrame: (fn: Function) => { frames.set(++frame, fn); return frame; },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  });
  const click = listeners.get('click')!;
  expect(click.capture).toBe(true);
  const event = { button: 0, defaultPrevented: false,
    target: { closest: () => ({ target: '', hasAttribute: () => false,
      getAttribute: () => '#services', href: 'https://www.sollari.app/#services' }) },
    preventDefault() { this.defaultPrevented = true; } };
  click.callback(event);
  expect(event.defaultPrevented).toBe(true);
  expect(scrollTo).not.toHaveBeenCalled();
  click.callback({ ...event, defaultPrevented: false });
  drawerOpen = false;
  frames.delete(1); // The animation loop is independent of queued anchor clicks.
  expect(frames.size).toBe(1);
  for (const fn of frames.values()) fn();
  expect(resize).toHaveBeenCalledOnce();
  expect(scrollTo).toHaveBeenCalledOnce();
  expect(scrollTo).toHaveBeenCalledWith(target, expect.any(Object));
});
