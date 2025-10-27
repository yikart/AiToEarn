export default () => ({
  TMS_CONFIG: {
    secretId: process.env.TENCENT_TMS_SECRET_ID || '',
    secretKey: process.env.TENCENT_TMS_SECRET_KEY || '',
  },
});
