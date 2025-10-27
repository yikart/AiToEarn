export default () => ({
  SMS_CONFIG: {
    config: {
      accessKeyId: process.env.SMS_ACCESS_KEY_ID || 'xxxx',
      accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || 'xxxx',
      endpoint: process.env.SMS_ENDPOINT || 'dysmsapi.aliyuncs.com',
    },
    defaults: {
      regionId: process.env.SMS_REGION_ID || undefined,
      signName: process.env.SMS_SIGN_NAME || '',
      templateCode: process.env.SMS_TEMPLATE_CODE || '',
    },
  },
});
