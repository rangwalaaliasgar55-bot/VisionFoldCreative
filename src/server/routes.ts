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
import { registerAiCoreRoutes } from './routesAiCore';
import { registerReviewRoutes } from './routesReview';
import { registerAutoclipRoutes } from './routesAutoclip';

export function registerApiRoutes(app: Application) {
  registerPlatformRoutes(app);
  registerAuthAndCmsRoutes(app);
  registerAiCoreRoutes(app);
  registerCmsRoutes(app);
  registerClientPortalRoutes(app);
  registerReviewRoutes(app);
  registerAutoclipRoutes(app);
  registerMediaRoutes(app);
  registerGrowthRoutes(app);
  registerSpreadsheetProfileRoute(app);
  registerPipelineRoutes(app);
  registerBusinessRoutes(app);
}
