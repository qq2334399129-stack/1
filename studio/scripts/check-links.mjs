import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { parse } from 'parse5';

const root = resolve('dist');
const files = (await readdir(root, { recursive:true, withFileTypes:true }))
  .filter(file => file.isFile()).map(file => relative(root, join(file.parentPath, file.name)));
const assets = new Set(files);
const documents = new Map();
const references = [];
const origin = 'https://build-check.local';

function walk(node, visitor) {
  visitor(node);
  for (const child of node.childNodes ?? []) walk(child, visitor);
}

for (const file of files.filter(file => file.endsWith('.html'))) {
  const ids = new Set();
  documents.set(file, ids);
  const base = new URL('/' + file.replace(/index\.html$/, ''), origin);
  walk(parse(await readFile(join(root,file), 'utf8')), node => {
    for (const {name,value} of node.attrs ?? []) {
      if (name === 'id') ids.add(value);
      if (name === 'href' && !['a','link'].includes(node.tagName)) continue;
      const paths = name === 'srcset' ? value.split(',').map(item => item.trim().split(/\s+/)[0])
        : ['href','src','poster','data-source'].includes(name) ? [value] : [];
      for (const path of paths) {
        const target = new URL(path, base);
        if (target.origin === origin) references.push({ file, target });
      }
    }
  });
}

for (const {file,target} of references) {
  const name = decodeURIComponent(target.pathname.slice(1));
  const resource = name.endsWith('/') || name === '' ? name + 'index.html' : name;
  const fragment = decodeURIComponent(target.hash.slice(1));
  if (!assets.has(resource) || (fragment && !documents.get(resource)?.has(fragment))) {
    console.error(`${file}: ${target.pathname}${target.hash}`);
    process.exitCode = 1;
  }
}
if (!process.exitCode) console.log(`OK: ${documents.size} HTML pages, ${references.length} internal references`);
