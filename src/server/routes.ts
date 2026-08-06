import { Application } from 'express';
import { registerAuthAndCmsRoutes } from './routesAuth';
import { registerBusinessRoutes } from './routesBusiness';

export function registerApiRoutes(app: Application) {
  registerAuthAndCmsRoutes(app);
  registerBusinessRoutes(app);
}
