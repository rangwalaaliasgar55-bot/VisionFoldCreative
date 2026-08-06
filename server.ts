import { createApp } from './src/server/createApp';

const PORT = Number(process.env.PORT || 3000);

if (!process.env.VERCEL) {
  createApp().then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Vision Fold Creative Server running on port ${PORT}`);
    });
  });
}

export { createApp };
