/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-03-19 15:41:06
 * @LastEditors: nevin
 * @Description: 应用
 */
import { Injectable } from '@nestjs/common';
import * as yaml from 'yaml';

async function parseYml(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    const text = await response.text();
    return yaml.parse(text.replace(/\\/g, ''));
  } catch (error) {
    console.error(`YAML解析失败: ${url}`, error);
    throw error;
  }
}

@Injectable()
export class AppService {
  async getDownUrl() {
    const winYml = 'https://ylzsfile.yikart.cn/att/latest.yml';
    const macYml = 'https://ylzsfile.yikart.cn/att/latest-mac.yml';

    const [winYmlJson, macYmlJson] = await Promise.all([
      parseYml(winYml),
      parseYml(macYml),
    ]);

    return {
      win: winYmlJson,
      mac: macYmlJson,
      hostUrl: 'https://ylzsfile.yikart.cn/att/',
    };
  }

  getHello(): string {
    return 'Hello!This is 爱团团AiToEarn';
  }
}
