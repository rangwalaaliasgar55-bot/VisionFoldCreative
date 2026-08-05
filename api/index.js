import serverBundle from '../dist/server.cjs';

let appPromise;
const { createApp } = serverBundle;

export default async function handler(req, res) {
  if (!appPromise) {
    appPromise = createApp();
  }

  const app = await appPromise;
  return app(req, res);
}
