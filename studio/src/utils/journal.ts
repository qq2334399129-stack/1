import { getCollection } from 'astro:content';
export const journal = async () => (await getCollection('journal')).sort((a,b) => b.data.date.getTime() - a.data.date.getTime());
export const dateLabel = (date: Date) => date.toISOString().slice(0,10);
