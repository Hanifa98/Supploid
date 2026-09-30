import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const base = { title: z.string(), description: z.string(), eyebrow: z.string().default('Supploid') };
const pages = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/pages' }), schema: z.object(base) });
const services = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/services' }), schema: z.object({ ...base, category: z.enum(['aviation', 'industrial']), order: z.number(), shortTitle: z.string(), parts: z.array(z.string()) }) });
const insights = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/insights' }), schema: z.object({ title: z.string(), description: z.string(), publishDate: z.coerce.date(), author: z.string(), tags: z.array(z.string()), heroImage: z.string(), draft: z.boolean().default(false) }) });
export const collections = { pages, services, insights };
