export default () => ({
  GOOGLE_CONFIG: {
    WEB_CLIENT_SECRET: process.env.GOOGLE_WEB_CLIENT_SECRET || '',
    WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID || '',
    WEB_RENDER_URL: process.env.GOOGLE_RENDER_URL || '',
  },
  TWITTER_CONFIG: {
    WEB_CLIENT_SECRET: process.env.TWITTER_WEB_CLIENT_SECRET || '',
    WEB_CLIENT_ID: process.env.TWITTER_WEB_CLIENT_ID || '',
    WEB_RENDER_URL: process.env.TWITTER_WEB_RENDER_URL || '',
  },
});
