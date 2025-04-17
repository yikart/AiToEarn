/*
 * @Author: nevin
 * @Date: 2025-04-17 19:22:11
 * @LastEditTime: 2025-04-18 01:27:38
 * @LastEditors: nevin
 * @Description:
 */
// 修改后（CommonJS）
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const appName = context.packager.appInfo.productFilename;
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;

  let appPath = `${appOutDir}/${appName}.app`;
  console.log('notarizing-------', appPath);

  return await notarize({

  });
};
