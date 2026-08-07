import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, PenLine, Pencil, Plus, Trash2 } from 'lucide-react';
import { createPost, deletePost, getPublishedPosts, updatePost, uploadBlogImage } from '@/lib/supabase';

export type Post = { id: string; title: string; excerpt: string; body: string; publishedAt?: string; cover?: string };

const formatDate = (date?: string) => date
  ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  : 'ADI Journal';

function PostImage({ post, className }: { post: Post; className: string }) {
  if (post.cover) {
    return <img src={post.cover} alt={`Cover for ${post.title}`} className={className} />;
  }

  return <div role="img" aria-label="ADI Journal cover" className={`${className} relative overflow-hidden bg-[#0f1e33]`}>
    <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-[#b8946a]/30" />
    <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full border border-[#b8946a]/20" />
    <div className="absolute inset-0 flex items-center justify-center font-cinzel text-xs uppercase tracking-[.35em] text-[#d9bd94]">ADI Journal</div>
  </div>;
}

function PostForm({ post, saving, error, onCancel, onSubmit }: { post?: Post; saving: boolean; error: string; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const isEdit = Boolean(post);
  const [coverPreview, setCoverPreview] = useState(post?.cover || '');
  const [selectedCover, setSelectedCover] = useState<File | null>(null);

  useEffect(() => () => { if (coverPreview && coverPreview !== post?.cover) URL.revokeObjectURL(coverPreview); }, [coverPreview, post?.cover]);

  const selectCover = (file?: File) => {
    if (coverPreview && coverPreview !== post?.cover) URL.revokeObjectURL(coverPreview);
    setSelectedCover(file || null);
    setCoverPreview(file ? URL.createObjectURL(file) : post?.cover || '');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get('title') || '').trim();
    const body = String(data.get('body') || '').trim();
    // Attach cover file to the form event so the parent can access it
    (event as any)._coverFile = selectedCover;
    (event as any)._title = title;
    (event as any)._body = body;
    onSubmit(event);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded border border-[#b8946a]/30 bg-white p-6 shadow-sm">
      <input required name="title" defaultValue={post?.title} placeholder="A title for your post" className="mb-5 w-full border-b border-[#b8946a]/40 px-0 py-3 font-cormorant text-4xl text-[#0f1e33] outline-none" />
      <label className="mb-5 block cursor-pointer overflow-hidden rounded border border-dashed border-[#b8946a]/50 font-inter text-sm text-[#4a5568] hover:bg-[#faf9f6]">
        {coverPreview ? (
          <><img src={coverPreview} alt="Cover preview" className="aspect-[16/7] w-full object-cover" /><span className="flex items-center gap-2 px-4 py-3"><ImagePlus className="h-4 w-4 text-[#9a7b52]" />{selectedCover?.name || (post?.cover ? 'Current cover' : '')}<span className="ml-auto text-[#9a7b52]">{selectedCover ? 'Replace image' : 'Change image'}</span></span></>
        ) : (
          <span className="flex items-center gap-2 px-4 py-6"><ImagePlus className="h-4 w-4 text-[#9a7b52]" />Select a cover image from your device <span className="text-[#64748b]">(optional)</span></span>
        )}
        <input name="cover" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => selectCover(event.target.files?.[0])} className="sr-only" />
      </label>
      <textarea required name="body" defaultValue={post?.body} placeholder="Start writing…" className="min-h-80 w-full resize-y font-inter leading-relaxed text-[#334155] outline-none" />
      {error && <p className="mt-4 font-inter text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={() => { selectCover(); onCancel(); }} className="px-4 py-2 text-sm text-[#4a5568]">Cancel</button>
        <button disabled={saving} className="rounded bg-[#b8946a] px-5 py-2 text-sm text-[#0f1e33] disabled:opacity-60">
          {saving && <LoaderCircle className="mr-1 inline h-4 w-4 animate-spin" />}
          {saving ? (isEdit ? 'Saving…' : 'Publishing…') : (isEdit ? 'Save changes' : 'Publish')}
        </button>
      </div>
    </form>
  );
}

export function BlogReader({ post, canWrite, onBack, onEdit }: { post: Post; canWrite: boolean; onBack: () => void; onEdit: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try { await deletePost(post.id); onBack(); } catch { setDeleting(false); }
  };

  return <main className="min-h-screen bg-[#faf9f6] pb-24 pt-32 sm:pt-40">
    <article className="mx-auto max-w-5xl px-6 sm:px-8">
      <div className="mb-12 flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 font-inter text-sm text-[#4a5568] transition-colors hover:text-[#9a7b52]"><ArrowLeft className="h-4 w-4" />Back to all stories</button>
        {canWrite && (
          <div className="flex gap-2">
            <button onClick={onEdit} className="inline-flex items-center gap-1 rounded border border-[#0f1e33]/20 px-3 py-1.5 font-inter text-xs text-[#4a5568] hover:bg-[#0f1e33] hover:text-[#f8f6f1]"><Pencil className="h-3.5 w-3.5" />Edit</button>
            <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-1 rounded border border-red-300 px-3 py-1.5 font-inter text-xs text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />{deleting ? 'Deleting…' : 'Delete'}</button>
          </div>
        )}
      </div>
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="font-inter text-xs uppercase tracking-[.2em] text-[#9a7b52]\">{formatDate(post.publishedAt)}</p>
        <h1 className="mt-5 font-cormorant text-5xl font-semibold leading-[1.05] text-[#0f1e33] sm:text-7xl">{post.title}</h1>
        {post.excerpt && <p className="mx-auto mt-6 max-w-2xl font-inter text-lg leading-relaxed text-[#64748b]\">{post.excerpt}</p>}
      </header>
      <PostImage post={post} className="aspect-[16/8] w-full rounded-sm object-cover" />
      <div className="mx-auto mt-12 max-w-2xl whitespace-pre-wrap font-inter text-[17px] leading-8 text-[#334155] sm:text-lg">{post.body}</div>
    </article>
  </main>;
}

export default function Blog({ canWrite, onOpenPost, postToEdit, onEdited }: { canWrite: boolean; onOpenPost: (post: Post) => void; postToEdit?: Post | null; onEdited?: () => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [writing, setWriting] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishError, setPublishError] = useState('');

  const load = async () => {
    try { setPosts(await getPublishedPosts()); }
    catch { setPosts([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Auto-open edit form when postToEdit comes from the reader
  useEffect(() => {
    if (postToEdit) {
      setEditingPost(postToEdit);
      setWriting(true);
      onEdited?.();
    }
  }, [postToEdit, onEdited]);

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    const customEvent = event as any;
    const title = customEvent._title;
    const body = customEvent._body;
    const coverFile = customEvent._coverFile as File | null;
    setSaving(true);
    setPublishError('');
    try {
      const coverUrl = coverFile ? await uploadBlogImage(coverFile) : undefined;
      if (editingPost) {
        await updatePost(editingPost.id, { title, body, cover: coverUrl });
      } else {
        await createPost({ title, body, excerpt: body.slice(0, 180), cover: coverUrl });
      }
      setEditingPost(null); setWriting(false); await load();
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Could not save the post.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try { await deletePost(post.id); await load(); } catch { /* ignore */ }
  };

  const startEdit = (post: Post) => {
    setEditingPost(post);
    setWriting(true);
  };

  return <section id="blog" className="scroll-mt-20 bg-[#faf9f6] py-24 sm:py-28">
    <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="mb-14 flex items-end justify-between gap-4 border-b border-[#b8946a]/25 pb-8"><div><p className="section-label">Perspectives</p><h1 className="mt-3 font-cormorant text-5xl font-semibold text-[#0f1e33] sm:text-6xl">ADI Journal</h1></div>{canWrite && !writing && <button onClick={() => { setEditingPost(null); setWriting(true); }} className="inline-flex items-center gap-2 rounded bg-[#0f1e33] px-4 py-2 font-inter text-sm text-[#f8f6f1] hover:bg-[#1a2942]\"><Plus className="h-4 w-4" />Write a post</button>}</div>
        {writing ? <PostForm post={editingPost || undefined} saving={saving} error={publishError} onCancel={() => { setWriting(false); setEditingPost(null); setPublishError(''); }} onSubmit={publish} /> : loading ? <LoaderCircle className="h-6 w-6 animate-spin text-[#b8946a]" /> : posts.length ? <>
          <div className="grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{posts.slice(0, showAll ? posts.length : 3).map(post => <article key={post.id} className="group relative">
            <button onClick={() => onOpenPost(post)} className="block w-full text-left" aria-label={`Read ${post.title}`}>
              <PostImage post={post} className="aspect-[16/10] w-full rounded-sm object-cover transition-transform duration-500 group-hover:scale-[1.015]" />
              <p className="mt-5 font-inter text-[11px] uppercase tracking-[.18em] text-[#9a7b52]\">{formatDate(post.publishedAt)}</p>
              <h2 className="mt-2 font-cormorant text-3xl font-semibold leading-tight text-[#0f1e33] transition-colors group-hover:text-[#9a7b52]\">{post.title}</h2>
              {post.excerpt && <p className="mt-3 line-clamp-3 font-inter text-sm leading-6 text-[#64748b]\">{post.excerpt}</p>}
              <span className="mt-4 inline-flex items-center gap-2 font-inter text-xs font-medium uppercase tracking-[.12em] text-[#0f1e33]\">Read story <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
            </button>
            {canWrite && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={(e) => { e.stopPropagation(); startEdit(post); }} className="rounded bg-[#0f1e33]/90 p-1.5 text-[#f8f6f1] hover:bg-[#0f1e33]" title="Edit post"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(post); }} className="rounded bg-red-600/90 p-1.5 text-white hover:bg-red-600" title="Delete post"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </article>)}</div>
          {posts.length > 3 && !showAll && <div className="mt-14 text-center"><button onClick={() => setShowAll(true)} className="rounded border border-[#0f1e33] px-7 py-3 font-inter text-sm font-medium text-[#0f1e33] transition-colors hover:bg-[#0f1e33] hover:text-[#f8f6f1]\">Show more</button></div>}
        </> : <div className="py-16 text-center"><PenLine className="mx-auto mb-4 h-8 w-8 text-[#b8946a]" /><p className="font-cormorant text-3xl text-[#0f1e33]\">Stories and insights are on their way.</p>{canWrite && <button onClick={() => { setEditingPost(null); setWriting(true); }} className="mt-5 font-inter text-sm text-[#9a7b52] underline\">Write the first post</button>}</div>}
    </div>
  </section>;
}
