import { createApp } from './src/server/createApp';

const PORT = Number(process.env.PORT || 3000);

// Only bind a persistent port when NOT running as a Vercel serverless
// function. On Vercel, api/index.ts imports createApp() and exports the
// Express app directly as the request handler instead.
if (!process.env.VERCEL) {
  createApp().then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Vision Fold Creative Server running on port ${PORT}`);
    });
  });
}

export { createApp };
