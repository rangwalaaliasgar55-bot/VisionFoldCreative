import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let appPromise;

async function getApp() {
  if (!appPromise) {
    // Resolve the server bundle path relative to this file's location.
    // On Vercel, the function is at <root>/api/index.js and the bundle is at <root>/.vercel-server/server.cjs.
    const bundlePath = path.resolve(__dirname, '..', '.vercel-server', 'server.cjs');
    appPromise = import(bundlePath).then((serverBundle) => {
      const createApp = serverBundle.createApp || serverBundle.default?.createApp;
      if (typeof createApp !== 'function') {
        throw new Error(
          `Server bundle did not export createApp(). Checked path: ${bundlePath}. Run "npm run build" before deploying.`
        );
      }
      return createApp();
    });
  }

  try {
    return await appPromise;
  } catch (error) {
    appPromise = undefined;
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('[API FATAL]', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: error?.message || 'Server error',
      hint: `API boot failed: ${error?.message}. Confirm the server bundle is included in the deployment and required env vars are set.`,
    }));
  }
}
