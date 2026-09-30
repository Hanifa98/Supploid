import { defineConfig } from 'astro/config';
export default defineConfig({ site: 'https://supploid.com', output: 'static', trailingSlash: 'always', devToolbar: { enabled: false }, build: { inlineStylesheets: 'never' } });
