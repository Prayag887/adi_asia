import { getPublishedPosts } from '@/lib/api';

const host = document.querySelector<HTMLElement>('[data-posts]');
const tpl = document.querySelector<HTMLTemplateElement>('template[data-tpl="post"]');

if (host && tpl) {
  getPublishedPosts()
    .then((posts) => {
      if (!posts.length) {
        host.innerHTML = '<p class="text-slate-500">No posts yet.</p>';
        return;
      }
      host.replaceChildren(...posts.slice(0, 6).map((post) => {
        const el = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
        const cover = el.querySelector<HTMLImageElement>('[data-cover]')!;
        if (post.cover) { cover.src = post.cover; cover.alt = post.title; } else cover.remove();
        el.querySelector('[data-date]')!.textContent = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '';
        el.querySelector('[data-title]')!.textContent = post.title;
        el.querySelector('[data-excerpt]')!.textContent = post.excerpt;
        return el;
      }));
    })
    .catch(() => { host.innerHTML = '<p class="text-slate-500">Posts are unavailable right now.</p>'; });
}
