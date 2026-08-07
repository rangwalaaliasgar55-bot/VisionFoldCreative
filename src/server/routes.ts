import { Application } from 'express';
import { registerAuthAndCmsRoutes } from './routesAuth';
import { registerBusinessRoutes } from './routesBusiness';
import { registerMediaRoutes } from './routesMedia';
import { registerGrowthRoutes } from './routesGrowth';
import { registerPlatformRoutes } from './routesPlatform';
import { registerPipelineRoutes } from './routesPipeline';
import { registerSpreadsheetProfileRoute } from './routesGrowthProfile';
import { registerCmsRoutes } from './routesCms';
import { registerClientPortalRoutes } from './routesClientPortal';

export function registerApiRoutes(app: Application) {
  registerPlatformRoutes(app);
  registerAuthAndCmsRoutes(app);
  registerCmsRoutes(app);
  registerClientPortalRoutes(app);
  registerMediaRoutes(app);
  registerGrowthRoutes(app);
  registerSpreadsheetProfileRoute(app);
  registerPipelineRoutes(app);
  registerBusinessRoutes(app);
}
