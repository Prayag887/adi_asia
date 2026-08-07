const baseUrl = (import.meta.env.PUBLIC_R2_URL || '').replace(/\/$/, '');

/** Build a public R2 URL for an object key. */
export function r2Url(key: string) {
  return `${baseUrl}/${key.replace(/^\//, '')}`;
}

/** Key prefix for blog cover images uploaded via the composer. */
export const R2_BLOG_IMAGES_PREFIX = 'blog-images';

/** Key prefix for static site assets (logos, icons, etc.). */
export const R2_ASSETS_PREFIX = 'assets';

/** Pre-defined asset keys — add entries as assets are uploaded to R2. */
export const R2_ASSETS = {
  logo: `${R2_ASSETS_PREFIX}/adi-logo.png`,
} as const;

/** Convenience: fully qualified public URL for each pre-defined asset. */
export const R2_ASSET_URLS: Record<keyof typeof R2_ASSETS, string> = Object.fromEntries(
  Object.entries(R2_ASSETS).map(([name, key]) => [name, r2Url(key)]),
) as Record<keyof typeof R2_ASSETS, string>;
