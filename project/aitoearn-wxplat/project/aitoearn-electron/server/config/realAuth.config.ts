export default () => ({
  REAL_NAME_CONFIG: {
    accessKeyId: process.env.REALNAME_ACCESS_KEY_ID || 'xxxx',
    accessKeySecret: process.env.REALNAME_ACCESS_KEY_SECRET || 'xxxx',
  },
});
