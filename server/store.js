import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export const dataFile = new URL('./data/resources.json', import.meta.url);
export const categories = JSON.parse(
  await readFile(new URL('./data/categories.json', import.meta.url), 'utf8')
);
export const levels = ['Beginner', 'Intermediate', 'Advanced'];
export const types = [
  'Documentation', 'Course', 'Book', 'Interactive', 'Roadmap', 'Video', 'Article'
];

export function normalizedUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Use an HTTP or HTTPS URL without credentials.');
  }
  url.hash = '';
  return url.href.replace(/\/$/, '');
}

export function validateResource(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('A resource object is required.');
  }
  const resource = {};
  for (const [key, maximum] of [['name', 120], ['description', 1200], ['url', 2048]]) {
    if (typeof body[key] !== 'string' || !body[key].trim()
      || body[key].length > maximum) {
      throw new Error(`${key} is required and must be at most ${maximum} characters.`);
    }
    resource[key] = body[key].trim();
  }
  normalizedUrl(resource.url);
  if (!categories.includes(body.category)) throw new Error('Choose a valid category.');
  if (!levels.includes(body.level) || !types.includes(body.type)) {
    throw new Error('Choose a valid level and resource type.');
  }
  if (typeof body.free !== 'boolean') throw new Error('free must be a boolean.');
  if (body.featured !== undefined && typeof body.featured !== 'boolean') {
    throw new Error('featured must be a boolean.');
  }
  const keywords = body.keywords ?? [];
  if (!Array.isArray(keywords) || keywords.length > 20
    || keywords.some(keyword => typeof keyword !== 'string' || keyword.length > 60)) {
    throw new Error('Use up to 20 keywords, at most 60 characters each.');
  }
  return {
    ...resource,
    category: body.category,
    level: body.level,
    type: body.type,
    free: body.free,
    featured: body.featured ?? false,
    keywords: keywords.map(keyword => keyword.trim()).filter(Boolean)
  };
}

export function createStore(file = dataFile) {
  let queue = Promise.resolve();

  async function read() {
    const resources = JSON.parse(await readFile(file, 'utf8'));
    if (!Array.isArray(resources)) throw new Error('Invalid resource storage.');
    const ids = new Set();
    const urls = new Set();
    for (const resource of resources) {
      validateResource(resource);
      const url = normalizedUrl(resource.url);
      if (typeof resource.id !== 'string' || !resource.id
        || ids.has(resource.id) || urls.has(url)) {
        throw new Error('Invalid or duplicate stored resource.');
      }
      ids.add(resource.id);
      urls.add(url);
    }
    return resources;
  }

  function mutate(callback) {
    // Queue the complete read/modify/write cycle so simultaneous requests do not
    // read the same old file and overwrite each other's changes.
    const operation = queue.then(async () => {
      const resources = await read();
      const result = callback(resources);
      const temporary = new URL(`${file.href}.${randomUUID()}.tmp`);
      try {
        await writeFile(temporary, JSON.stringify(resources, null, 2) + '\n', { flag: 'wx' });
        await rename(temporary, file);
      } catch (error) {
        await unlink(temporary).catch(() => {});
        throw error;
      }
      return result;
    });
    // A failed operation must not prevent the next request from being processed.
    queue = operation.catch(() => {});
    return operation;
  }
  return { read, mutate };
}

export const store = createStore();
