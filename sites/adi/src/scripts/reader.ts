import { deletePost } from '@/lib/api';
import { formatDate, fromTemplate, getState, setState, show, subscribe } from './state';

const home = document.querySelector<HTMLElement>('main[data-home]')!;
const reader = document.querySelector<HTMLElement>('main[data-reader]')!;
const q = <T extends HTMLElement = HTMLElement>(sel: string) => reader.querySelector<T>(sel)!;

const backToBlog = () => requestAnimationFrame(() => document.querySelector('#blog')?.scrollIntoView());

subscribe((state, previous) => {
  show(q('[data-reader-admin]'), state.signedIn);
  if (state.openPost === previous.openPost && state.openPost !== null) return;
  const post = state.openPost;
  show(home, !post);
  show(reader, Boolean(post));
  if (!post) return;
  q('[data-reader-date]').textContent = formatDate(post.publishedAt);
  q('[data-reader-title]').textContent = post.title;
  const excerpt = q('[data-reader-excerpt]');
  excerpt.textContent = post.excerpt;
  show(excerpt, Boolean(post.excerpt));
  q('[data-reader-body]').textContent = post.body;
  const slot = q('[data-reader-image]');
  const className = 'aspect-[16/8] w-full rounded-sm object-cover';
  let image: HTMLElement;
  if (post.cover) {
    const img = fromTemplate<HTMLImageElement>('post-cover');
    img.src = post.cover;
    img.alt = `Cover for ${post.title}`;
    img.className = className;
    image = img;
  } else {
    image = fromTemplate('post-placeholder');
    image.className = `${className} relative overflow-hidden bg-[#0f1e33]`;
  }
  image.dataset.readerImage = '';
  slot.replaceWith(image);
  q('[data-reader-delete-label]').textContent = 'Delete';
  q<HTMLButtonElement>('[data-reader-delete]').disabled = false;
});

q('[data-reader-back]').addEventListener('click', () => {
  setState({ openPost: null });
  backToBlog();
});

q('[data-reader-edit]').addEventListener('click', () => {
  setState({ openPost: null, postToEdit: getState().openPost });
  backToBlog();
});

q('[data-reader-delete]').addEventListener('click', async () => {
  const post = getState().openPost;
  if (!post || !confirm('Delete this post? This cannot be undone.')) return;
  const button = q<HTMLButtonElement>('[data-reader-delete]');
  button.disabled = true;
  q('[data-reader-delete-label]').textContent = 'Deleting…';
  try {
    await deletePost(post.id);
    setState({ openPost: null });
    window.dispatchEvent(new Event('posts-changed'));
    backToBlog();
  } catch {
    button.disabled = false;
    q('[data-reader-delete-label]').textContent = 'Delete';
  }
});
