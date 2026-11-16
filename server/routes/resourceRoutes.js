import { Router } from 'express';
import { createResourceController } from '../controllers/resourceController.js';

export function resourceRoutes(protectWrites, resourceStore) {
  const router = Router();
  const controller = createResourceController(resourceStore);
  router.get('/', controller.listResources);
  router.get('/:id', controller.getResource);
  router.post('/', protectWrites, controller.saveResource);
  router.put('/:id', protectWrites, controller.saveResource);
  router.delete('/:id', protectWrites, controller.deleteResource);
  return router;
}
