import { randomUUID } from 'node:crypto';
import { store, validateResource, normalizedUrl } from '../store.js';

// A separate store can be supplied for tests without touching the real catalog.
export function createResourceController(resourceStore = store) {
  async function listResources(req, res) {
    let resources = await resourceStore.read();
    const { q, category, level, type, free } = req.query;

    if (q) {
      const query = String(q).toLowerCase();
      resources = resources.filter(resource =>
        [resource.name, resource.description, resource.category, ...resource.keywords]
          .join(' ').toLowerCase().includes(query)
      );
    }
    for (const [key, value] of Object.entries({ category, level, type })) {
      if (value) resources = resources.filter(resource => resource[key] === value);
    }
    if (free === 'true') resources = resources.filter(resource => resource.free);
    res.json(resources);
  }

  async function getResource(req, res) {
    const resource = (await resourceStore.read()).find(row => row.id === req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });
    res.json(resource);
  }

  async function saveResource(req, res) {
    let submitted;
    try {
      submitted = validateResource(req.body);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    try {
      const resource = await resourceStore.mutate(resources => {
        const index = resources.findIndex(row => row.id === req.params.id);
        if (req.method === 'PUT' && index === -1) {
          throw Object.assign(new Error('Resource not found.'), { status: 404 });
        }
        const duplicate = resources.some(row =>
          row.id !== req.params.id && normalizedUrl(row.url) === normalizedUrl(submitted.url)
        );
        if (duplicate) {
          throw Object.assign(new Error('This link already exists.'), { status: 409 });
        }

        const value = {
          ...submitted,
          id: req.method === 'PUT' ? req.params.id : randomUUID()
        };
        if (req.method === 'PUT') resources[index] = value;
        else resources.push(value);
        return value;
      });
      res.status(req.method === 'POST' ? 201 : 200).json(resource);
    } catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      throw error;
    }
  }

  async function deleteResource(req, res) {
    try {
      await resourceStore.mutate(resources => {
        const index = resources.findIndex(row => row.id === req.params.id);
        if (index === -1) {
          throw Object.assign(new Error('Resource not found.'), { status: 404 });
        }
        resources.splice(index, 1);
      });
      res.status(204).end();
    } catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      throw error;
    }
  }

  return { listResources, getResource, saveResource, deleteResource };
}
