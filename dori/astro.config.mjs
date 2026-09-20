// @ts-check
import { defineConfig } from 'astro/config';

// Dori's site. Built into dori/dist and served from the Mac mini through the
// Cloudflare tunnel at dori-homepage.mind-pixels.com (not GitHub Pages).
export default defineConfig({
  site: 'https://dori-homepage.mind-pixels.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
