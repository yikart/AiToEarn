/*
 * @Author: nevin
 * @Date: 2025-04-17 19:22:11
 * @LastEditTime: 2025-04-29 15:06:56
 * @LastEditors: nevin
 * @Description:
 */
// 修改后（CommonJS）
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  // console.log('--2222---', context);

  const { productFilename, version } = context.packager.appInfo;
  const { electronPlatformName, outDir } = context;
  if (electronPlatformName !== 'darwin') return;

  let appPath = `${outDir}/${productFilename}-${version}-arm64.dmg`;
  console.log('notarizing-------', appPath);

  return await notarize({
    appBundleId: 'cn.aitoearn.pc',
    appPath,
    appleId: 'yika_app@163.com',
    appleIdPassword: 'ivqj-wemu-qnbi-whgr',
    teamId: '26A3V27SYB',
  });
};
