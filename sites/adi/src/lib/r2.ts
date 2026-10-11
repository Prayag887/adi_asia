const baseUrl = (import.meta.env.PUBLIC_R2_URL || '').replace(/\/$/, '');

/** The site logo lives in Cloudflare R2 (set PUBLIC_R2_URL). */
export const logoUrl = `${baseUrl}/assets/adi-logo.png`;
