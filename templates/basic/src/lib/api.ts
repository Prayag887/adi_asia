// Client for the shared Folio API. The site and the API share an origin (Caddy proxies
// `/api/*`), so the session cookie is sent automatically and the tenant is resolved
// from the Host header.

const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export type SiteContent = { key: string; value: string };
export type CustomSection = { id: string; title: string; body: string; position: number };
export type PostRecord = { id: string; title: string; excerpt: string; body: string; publishedAt?: string; cover?: string };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${base}${path}`, { ...init, headers, credentials: 'same-origin' });
  if (!response.ok) {
    const message = (await response.json().catch(() => null))?.error;
    throw new Error(message || `Request failed (${response.status}).`);
  }
  if (response.status === 204 || response.status === 201) return undefined as T;
  return response.json() as Promise<T>;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export async function signIn(email: string, password: string) {
  await request('/auth/login', json('POST', { email, password }));
}

export async function signOut() {
  await request('/auth/logout', { method: 'POST' });
}

export async function getCurrentUser() {
  try { return await request<{ email: string }>('/auth/me'); }
  catch { return null; }
}

export function getSiteContent() {
  return request<SiteContent[]>('/content');
}

export function saveSiteContent(changes: Record<string, string>) {
  return request<void>('/content', json('PUT', changes));
}

export function getPublishedPosts() {
  return request<PostRecord[]>('/posts');
}

export async function uploadBlogImage(file: File) {
  const form = new FormData();
  form.set('image', file);
  return (await request<{ url: string }>('/uploads', { method: 'POST', body: form })).url;
}

export function createPost(input: { title: string; body: string; excerpt: string; cover?: string }) {
  return request<void>('/posts', json('POST', input));
}

export function deletePost(id: string) {
  return request<void>(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function updatePost(id: string, input: { title?: string; body?: string; excerpt?: string; cover?: string }) {
  return request<void>(`/posts/${encodeURIComponent(id)}`, json('PATCH', input));
}

export function getSectionVisibility() {
  return request<{ section_key: string; visible: boolean }[]>('/sections');
}

export function setSectionVisibility(sectionKey: string, visible: boolean) {
  return request<void>(`/sections/${encodeURIComponent(sectionKey)}`, json('PUT', { visible }));
}

export function getCustomSections() {
  return request<CustomSection[]>('/custom-sections');
}

export function createCustomSection(input: Omit<CustomSection, 'id'>) {
  return request<void>('/custom-sections', json('POST', input));
}

export function deleteCustomSection(id: string) {
  return request<void>(`/custom-sections/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function sendContactMessage(input: { name: string; email: string; subject: string; message: string }) {
  return request<void>('/contact', json('POST', input));
}
