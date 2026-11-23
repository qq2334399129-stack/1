import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const { SITE_URL } = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
export default defineConfig({
  site: process.env.SITE_URL || SITE_URL || 'https://stillframe.example.com',
  integrations: [sitemap()],
  trailingSlash: 'always',
});
