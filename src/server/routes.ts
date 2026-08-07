import { Application } from 'express';
import { registerAuthAndCmsRoutes } from './routesAuth';
import { registerBusinessRoutes } from './routesBusiness';
import { registerMediaRoutes } from './routesMedia';

export function registerApiRoutes(app: Application) {
  registerAuthAndCmsRoutes(app);
  registerMediaRoutes(app);
  registerBusinessRoutes(app);
}
