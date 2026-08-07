import { Application } from 'express';
import { registerAuthAndCmsRoutes } from './routesAuth';
import { registerBusinessRoutes } from './routesBusiness';
import { registerMediaRoutes } from './routesMedia';
import { registerGrowthRoutes } from './routesGrowth';

export function registerApiRoutes(app: Application) {
  registerAuthAndCmsRoutes(app);
  registerMediaRoutes(app);
  registerGrowthRoutes(app);
  registerBusinessRoutes(app);
}
