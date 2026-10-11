import { createPost, deletePost, getPublishedPosts, updatePost, uploadBlogImage } from '@/lib/api';
import { formatDate, fromTemplate, getState, setState, show, subscribe, type Post } from './state';

const body = document.querySelector<HTMLElement>('[data-blog-body]')!;
const writeButton = document.querySelector<HTMLElement>('[data-blog-write]')!;

let posts: Post[] = [];
let loading = true;
let writing = false;
let editingPost: Post | null = null;
let showAll = false;

function postImage(post: Post, className: string) {
  if (post.cover) {
    const img = fromTemplate<HTMLImageElement>('post-cover');
    img.src = post.cover;
    img.alt = `Cover for ${post.title}`;
    img.className = className;
    return img;
  }
  const placeholder = fromTemplate('post-placeholder');
  placeholder.className = `${className} relative overflow-hidden bg-[#0f1e33]`;
  return placeholder;
}

function card(post: Post, canWrite: boolean) {
  const el = fromTemplate('blog-card');
  const open = el.querySelector<HTMLButtonElement>('[data-open]')!;
  open.setAttribute('aria-label', `Read ${post.title}`);
  open.addEventListener('click', () => readPost(post));
  el.querySelector('[data-image]')!.replaceWith(postImage(post, 'aspect-[16/10] w-full rounded-sm object-cover transition-transform duration-500 group-hover:scale-[1.015]'));
  el.querySelector('[data-date]')!.textContent = formatDate(post.publishedAt);
  el.querySelector('[data-title]')!.textContent = post.title;
  const excerpt = el.querySelector<HTMLElement>('[data-excerpt]')!;
  if (post.excerpt) excerpt.textContent = post.excerpt;
  else excerpt.remove();
  const admin = el.querySelector<HTMLElement>('[data-admin]')!;
  if (!canWrite) admin.remove();
  admin.querySelector('[data-edit]')!.addEventListener('click', (e) => { e.stopPropagation(); startWriting(post); });
  admin.querySelector('[data-delete]')!.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try { await deletePost(post.id); await load(); } catch { /* ignore */ }
  });
  return el;
}

function form(post: Post | null) {
  const el = fromTemplate<HTMLFormElement>('blog-form');
  const title = el.querySelector<HTMLInputElement>('input[name=title]')!;
  const text = el.querySelector<HTMLTextAreaElement>('textarea[name=body]')!;
  const fileInput = el.querySelector<HTMLInputElement>('input[name=cover]')!;
  const preview = el.querySelector<HTMLImageElement>('[data-preview]')!;
  const error = el.querySelector<HTMLElement>('[data-error]')!;
  const submit = el.querySelector<HTMLButtonElement>('[data-submit]')!;
  const label = el.querySelector<HTMLElement>('[data-submit-label]')!;
  const isEdit = Boolean(post);
  title.value = post?.title ?? '';
  text.value = post?.body ?? '';
  label.textContent = isEdit ? 'Save changes' : 'Publish';

  let selected: File | null = null;
  let objectUrl = '';
  const renderCover = () => {
    const src = objectUrl || post?.cover || '';
    show(el.querySelector('[data-with-preview]'), Boolean(src));
    show(el.querySelector('[data-without-preview]'), !src);
    preview.src = src;
    el.querySelector('[data-cover-name]')!.textContent = selected?.name || (post?.cover ? 'Current cover' : '');
    el.querySelector('[data-cover-action]')!.textContent = selected ? 'Replace image' : 'Change image';
  };
  const selectCover = (file?: File) => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    selected = file || null;
    objectUrl = file ? URL.createObjectURL(file) : '';
    renderCover();
  };
  renderCover();
  fileInput.addEventListener('change', () => selectCover(fileInput.files?.[0]));

  el.querySelector('[data-cancel]')!.addEventListener('click', () => {
    selectCover();
    writing = false;
    editingPost = null;
    render();
  });

  el.addEventListener('submit', async (event) => {
    event.preventDefault();
    const titleValue = title.value.trim();
    const bodyValue = text.value.trim();
    submit.disabled = true;
    show(el.querySelector('[data-spinner]'), true);
    label.textContent = isEdit ? 'Saving…' : 'Publishing…';
    show(error, false);
    try {
      const cover = selected && selected.size > 0 ? await uploadBlogImage(selected) : undefined;
      if (post) await updatePost(post.id, { title: titleValue, body: bodyValue, cover });
      else await createPost({ title: titleValue, body: bodyValue, excerpt: bodyValue.slice(0, 180), cover });
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      editingPost = null;
      writing = false;
      await load();
    } catch (err) {
      error.textContent = err instanceof Error ? err.message : 'Could not save the post.';
      show(error, true);
      submit.disabled = false;
      show(el.querySelector('[data-spinner]'), false);
      label.textContent = isEdit ? 'Save changes' : 'Publish';
    }
  });
  return el;
}

function render() {
  const { signedIn } = getState();
  show(writeButton, signedIn && !writing);
  body.replaceChildren();
  if (writing) {
    body.append(form(editingPost));
  } else if (loading) {
    body.append(fromTemplate('blog-loader'));
  } else if (posts.length) {
    const grid = fromTemplate('blog-grid');
    posts.slice(0, showAll ? posts.length : 3).forEach((post) => grid.append(card(post, signedIn)));
    body.append(grid);
    if (posts.length > 3 && !showAll) {
      const more = fromTemplate('blog-more');
      more.querySelector('button')!.addEventListener('click', () => { showAll = true; render(); });
      body.append(more);
    }
  } else {
    const empty = fromTemplate('blog-empty');
    const first = empty.querySelector<HTMLElement>('[data-first]')!;
    show(first, signedIn);
    first.addEventListener('click', () => startWriting(null));
    body.append(empty);
  }
}

function startWriting(post: Post | null) {
  editingPost = post;
  writing = true;
  render();
}

function readPost(post: Post) {
  setState({ editing: false, openPost: post });
  window.scrollTo({ top: 0 });
}

async function load() {
  try { posts = await getPublishedPosts(); }
  catch { posts = []; }
  finally { loading = false; }
  render();
}

writeButton.addEventListener('click', () => startWriting(null));
window.addEventListener('posts-changed', () => load());

subscribe((state, previous) => {
  if (state.signedIn !== previous.signedIn) render();
  if (state.postToEdit && state.postToEdit !== previous.postToEdit) {
    startWriting(state.postToEdit);
    setState({ postToEdit: null });
  }
});

load();
