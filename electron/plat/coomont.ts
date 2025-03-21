import os from 'os';
import { Browser, chromium, webkit } from 'playwright';
import path from 'path';
import { getChromiumPath } from '../util/chromium';

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
        executablePath: getChromiumPath(),
      });
    }
    return browser;
  } catch (e) {
    console.error(e);
    return undefined;
  }
};
