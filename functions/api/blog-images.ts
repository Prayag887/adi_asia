interface Env {
  BLOG_IMAGES: {
    put(key: string, value: ArrayBuffer, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
  };
  PUBLIC_R2_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

type PagesContext = { request: Request; env: Env };

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxBytes = 5 * 1024 * 1024;

export async function onRequestPost({ request, env }: PagesContext) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const supabaseUrl = env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authorization, apikey: env.SUPABASE_ANON_KEY },
  });
  if (!authResponse.ok) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const form = await request.formData();
  const image = form.get('image');
  if (!(image instanceof File)) return Response.json({ error: 'An image is required.' }, { status: 400 });
  if (!allowedTypes.has(image.type)) return Response.json({ error: 'Use a JPG, PNG, or WebP image.' }, { status: 415 });
  if (image.size > maxBytes) return Response.json({ error: 'Images must be 5 MB or smaller.' }, { status: 413 });

  const extension = image.type === 'image/jpeg' ? 'jpg' : image.type.split('/')[1];
  const key = `blog/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  await env.BLOG_IMAGES.put(key, await image.arrayBuffer(), { httpMetadata: { contentType: image.type } });

  return Response.json({ url: `${env.PUBLIC_R2_URL.replace(/\/$/, '')}/${key}` });
}
