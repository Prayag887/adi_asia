// Tiny shared store for the page's interactive pieces (auth, edit mode, which view is open).

export type Post = { id: string; title: string; excerpt: string; body: string; publishedAt?: string; cover?: string };

type State = {
  signedIn: boolean;
  editing: boolean;
  openPost: Post | null;
  postToEdit: Post | null;
  hiddenSections: string[];
};

type Listener = (state: State, previous: State) => void;

const state: State = { signedIn: false, editing: false, openPost: null, postToEdit: null, hiddenSections: [] };
const listeners = new Set<Listener>();

export function getState(): Readonly<State> {
  return state;
}

export function setState(patch: Partial<State>) {
  const previous = { ...state };
  Object.assign(state, patch);
  listeners.forEach((listener) => listener(state, previous));
}

/** Calls `listener` now and after every change. */
export function subscribe(listener: Listener) {
  listeners.add(listener);
  listener(state, state);
}

export const show = (el: Element | null | undefined, visible: boolean) => {
  if (el instanceof HTMLElement || el instanceof SVGElement) el.style.display = visible ? '' : 'none';
};

/** Clones the first element of a `<template data-tpl="name">`. */
export function fromTemplate<T extends HTMLElement = HTMLElement>(name: string): T {
  const tpl = document.querySelector<HTMLTemplateElement>(`template[data-tpl="${name}"]`);
  if (!tpl) throw new Error(`missing template ${name}`);
  return tpl.content.firstElementChild!.cloneNode(true) as T;
}

export const formatDate = (date?: string) => date
  ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  : 'ADI Journal';
