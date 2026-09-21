// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages serves this repo at the custom domain in CNAME.
export default defineConfig({
  site: 'https://jingliu.mind-pixels.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (page) => !page.includes('/magic/') && !page.includes('/preview/') })],
});
