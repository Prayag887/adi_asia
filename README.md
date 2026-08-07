# Asia Dialogue Initiative

ADI is a Vite/React website with a private editorial experience, Supabase authentication/database, and Cloudflare R2 blog-image storage.

## Local product

- Public site: `http://127.0.0.1:5173`
- Editor workflow: sign in from the site, select **Edit site**, edit text directly in the live layout, and use **Save changes** at the bottom of the page.
- Blog workflow: sign in, select **Write a post**, upload a cover image, and publish. Published posts are public and open in a dedicated reader screen.

## Supabase setup

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
3. Disable public user registration in **Authentication → Providers → Email**. Create editor accounts from the Supabase dashboard.
4. Copy `.env.example` to `.env` and add the project URL and public anon key.

Row Level Security permits public reads, while all content changes require an authenticated editor. Blog authors can only modify their own posts.

## Cloudflare Pages and R2

1. Create an R2 Standard bucket named `adi-blog-images` and enable public access through a custom domain such as `images.example.com`.
2. Copy `wrangler.toml.example` to `wrangler.toml` and update the project and bucket names.
3. In Cloudflare Pages, bind the R2 bucket as `BLOG_IMAGES`.
4. Add `PUBLIC_R2_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` as Pages environment variables.
5. Deploy with build command `npm run build` and output directory `dist`.

The upload endpoint in `functions/api/blog-images.ts` verifies the Supabase session, accepts only JPG/PNG/WebP files up to 5 MB, and writes them to R2 without exposing storage credentials to the browser.

For local frontend development, run `npm start`. Image uploads require Cloudflare Pages local development or a deployed Pages Function. The previous `pocketbase/` directory is retained only as a local data/schema backup during migration and is no longer used by the application.

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
