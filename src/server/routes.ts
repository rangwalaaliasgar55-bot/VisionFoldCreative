import { Application } from 'express';
import { registerAuthAndCmsRoutes } from './routesAuth';
import { registerBusinessRoutes } from './routesBusiness';
import { registerMediaRoutes } from './routesMedia';
import { registerGrowthRoutes } from './routesGrowth';
import { registerPlatformRoutes } from './routesPlatform';
import { registerPipelineRoutes } from './routesPipeline';

export function registerApiRoutes(app: Application) {
  registerPlatformRoutes(app);
  registerAuthAndCmsRoutes(app);
  registerMediaRoutes(app);
  registerGrowthRoutes(app);
  registerPipelineRoutes(app);
  registerBusinessRoutes(app);
}
