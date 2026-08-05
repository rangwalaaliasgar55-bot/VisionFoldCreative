let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = import('../dist/server.cjs').then((serverBundle) => {
      const createApp = serverBundle.createApp || serverBundle.default?.createApp;
      if (typeof createApp !== 'function') {
        throw new Error('Server bundle did not export createApp(). Run npm run build before deploying.');
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
      hint: 'API boot failed. Confirm the server bundle is included in the deployment and required env vars are set.',
    }));
  }
}
