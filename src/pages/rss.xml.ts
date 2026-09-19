import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { site } from '../data/site';

export async function GET(context: APIContext) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: `${site.name} — Blogs`,
    description: site.description,
    site: context.site!,
    items: posts.map((p) => ({ title: p.data.title, description: p.data.description, pubDate: p.data.date, link: `/blogs/${p.id}/` })),
  });
}
