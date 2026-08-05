import serverBundle from '../dist/server.cjs';

let appPromise;
const { createApp } = serverBundle;

export default async function handler(req, res) {
  if (!appPromise) {
    appPromise = createApp();
  }

  try {
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error('[API FATAL]', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: error?.message || 'Server error' }));
  }
}
