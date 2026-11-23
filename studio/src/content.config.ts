import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
export const collections = {
  journal: defineCollection({
    loader: glob({ base: './src/content/journal', pattern: '*.md' }),
    schema: z.object({ title:z.string(), description:z.string(), category:z.string(), tags:z.array(z.string()), date:z.coerce.date(), cover:z.string(), alt:z.string() }),
  }),
};
