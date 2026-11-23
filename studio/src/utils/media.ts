export function media(path: string) {
  if (/^(https?:\/\/|\/)/i.test(path)) return path;
  const base = (import.meta.env.PUBLIC_MEDIA_BASE_URL ?? '').replace(/\/+$/, '');
  return `${base}/${path}`;
}
