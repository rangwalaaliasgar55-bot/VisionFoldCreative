import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server';

// Reuse one Express app instance across warm serverless invocations.
let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appPromise) {
    appPromise = createApp();
  }
  const app = await appPromise;
  // Express apps are just (req, res) request handlers, so this works
  // directly as a Vercel Node serverless function.
  (app as any)(req, res);
}
