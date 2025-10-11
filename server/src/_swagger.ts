/*
 * @Author: nevin
 * @Date: 2021-12-21 18:05:12
 * @LastEditors: nevin
 * @LastEditTime: 2025-01-15 14:24:51
 * @Description: 文档插件
 */
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
const API_URL = '/docs';
export function createSwagger(app: INestApplication) {
  // const version = require('../package.json').version || ''; // 获取同项目一致版本号
  const version = '1.0.0'; // 获取同项目一致版本号

  const docConfig = new DocumentBuilder()
    .setTitle('爱团团AiToEarnAPI文档')
    .setVersion(version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, docConfig, {});
  SwaggerModule.setup(API_URL, app, document, {
    customSiteTitle: `爱团团AiToEarnAPI文档`,
    jsonDocumentUrl: `${API_URL}/openapi.json`, // 文档JSON
    swaggerOptions: {
      persistAuthorization: true, // 保持登录
    },
  });
  return API_URL;
}
