import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const api = env.FOLIO_API_URL || 'http://127.0.0.1:3000';
// Dev only: the Host header tells Folio which tenant this is.
const proxy = { target: api, headers: { host: env.FOLIO_DEV_HOST || 'adi.localhost' } };

export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false },
  vite: {
    server: { proxy: { '/api': proxy, '/uploads': proxy } },
  },
});
