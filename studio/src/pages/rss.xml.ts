import type { APIContext } from 'astro';
import rss from '@astrojs/rss';
import { journal } from '../utils/journal';
import { site } from '../data/site';
export async function GET(context: APIContext) {
  return rss({ title: site.chineseName + ' / 创作日志', description: site.description, site: context.site!,
    items: (await journal()).map(({id,data}) => ({title:data.title, description:data.description, pubDate:data.date, link:`/journal/${id}/`})) });
}
