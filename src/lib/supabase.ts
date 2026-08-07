import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL
  ?.replace(/\/rest\/v1\/?$/, '')
  .replace(/\/$/, '');
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured ? createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
}) : null;

export type SiteContent = { key: string; value: string };
export type CustomSection = { id: string; title: string; body: string; position: number };
export type PostRecord = { id: string; title: string; excerpt: string; body: string; publishedAt?: string; cover?: string };

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function getSiteContent() {
  const client = requireClient();
  const { data, error } = await client.from('site_content').select('key,value').order('key');
  if (error) throw error;
  return data as SiteContent[];
}

export async function saveSiteContent(changes: Record<string, string>) {
  const client = requireClient();
  const { error } = await client.from('site_content').upsert(
    Object.entries(changes).map(([key, value]) => ({ key, value })),
    { onConflict: 'key' },
  );
  if (error) throw error;
}

export async function getPublishedPosts() {
  const client = requireClient();
  const { data, error } = await client.from('posts').select('id,title,excerpt,body,published_at,cover_url').eq('published', true).order('published_at', { ascending: false });
  if (error) throw error;
  return data.map(post => ({ ...post, publishedAt: post.published_at, cover: post.cover_url })) as PostRecord[];
}

export async function uploadBlogImage(file: File) {
  const client = requireClient();
  const { data: { session } } = await client.auth.getSession();
  if (!session) throw new Error('You must be signed in to upload an image.');
  const form = new FormData();
  form.set('image', file);
  const response = await fetch(import.meta.env.VITE_IMAGE_UPLOAD_URL || '/api/blog-images', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: form,
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Image upload failed.');
  return (await response.json() as { url: string }).url;
}

export async function createPost(input: { title: string; body: string; excerpt: string; cover?: string }) {
  const client = requireClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('You must be signed in to publish.');
  const { title, body, excerpt, cover } = input;
  const { error } = await client.from('posts').insert({ title, body, excerpt, cover_url: cover || null, published: true, published_at: new Date().toISOString(), author: user.id });
  if (error) throw error;
}

export async function deletePost(id: string) {
  const client = requireClient();
  const { error } = await client.from('posts').delete().eq('id', id);
  if (error) throw error;
}

export async function updatePost(id: string, input: { title?: string; body?: string; excerpt?: string; cover?: string }) {
  const client = requireClient();
  const { error } = await client.from('posts').update({
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.body !== undefined ? { body: input.body, excerpt: input.excerpt || input.body.slice(0, 180) } : {}),
    ...(input.cover !== undefined ? { cover_url: input.cover || null } : {}),
  }).eq('id', id);
  if (error) throw error;
}

export async function getSectionVisibility() {
  const client = requireClient();
  const { data, error } = await client.from('section_visibility').select('section_key,visible');
  if (error) throw error;
  return data as { section_key: string; visible: boolean }[];
}

export async function setSectionVisibility(sectionKey: string, visible: boolean) {
  const client = requireClient();
  const { error } = await client.from('section_visibility').upsert({ section_key: sectionKey, visible }, { onConflict: 'section_key' });
  if (error) throw error;
}

export async function getCustomSections() {
  const client = requireClient();
  const { data, error } = await client.from('custom_sections').select('id,title,body,position').order('position');
  if (error) throw error;
  return data as CustomSection[];
}

export async function createCustomSection(input: Omit<CustomSection, 'id'>) {
  const client = requireClient();
  const { error } = await client.from('custom_sections').insert(input);
  if (error) throw error;
}

export async function deleteCustomSection(id: string) {
  const client = requireClient();
  const { error } = await client.from('custom_sections').delete().eq('id', id);
  if (error) throw error;
}
