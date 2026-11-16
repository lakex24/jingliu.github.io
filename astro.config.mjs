// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// GitHub Pages serves this repo at the custom domain in CNAME.
export default defineConfig({
  site: 'https://jingliu.mind-pixels.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/magic/') && !page.includes('/preview/') })],
});
