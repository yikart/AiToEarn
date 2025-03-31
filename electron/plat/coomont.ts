/*
 * @Author: nevin
 * @Date: 2025-03-21 19:08:17
 * @LastEditTime: 2025-03-31 11:29:54
 * @LastEditors: nevin
 * @Description:
 */
import os from 'os';
import { Browser, chromium, webkit } from 'playwright';
import path from 'path';

export const getBrowser = async () => {
  let browser: Browser;
  const platform = os.platform();
  try {
    if (platform === 'darwin') {
      browser = await webkit.launch({
        // headless: true,
        headless: import.meta.env.MODE !== 'development',
        executablePath: path.join(
          process.resourcesPath,
          'bin',
          'webkit',
          'pw_run.sh',
        ),
      });
    } else {
      browser = await chromium.launch({
        headless: import.meta.env.MODE !== 'development',
        executablePath: '',
      });
    }
    return browser;
  } catch (e) {
    console.error(e);
    return undefined;
  }
};
