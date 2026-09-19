import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    lang: z.enum(['en', 'zh']).default('en'),
    // Shown as an editorial note when a date is provisional.
    dateNote: z.string().optional(),
    // Shown above the article when its content is a historical snapshot.
    historical: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const quotes = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/quotes' }),
  schema: z.object({
    title: z.string().optional(),
    author: z.string(),
    source: z.string().optional(),
    text: z.string(),
    enabled: z.boolean().default(true),
    // The quote shown when JavaScript is unavailable. Exactly one should be true.
    default: z.boolean().default(false),
  }),
});

export const collections = { posts, quotes };
