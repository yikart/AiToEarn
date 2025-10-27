/*
 * @Author: nevin
 * @Date: 2025-01-15 14:17:16
 * @LastEditTime: 2025-02-25 22:17:43
 * @LastEditors: nevin
 * @Description:
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { createSwagger } from './_swagger';
import {
  BadRequestException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 200,
  });

  app.setGlobalPrefix('api', { exclude: ['/'] }); // 路由添加api开头

  const { ENABLE_SWAGGER, NODE_ENV, PORT } = config.get('SERVER_CONFIG');

  const docsUrl = ENABLE_SWAGGER ? createSwagger(app) : ''; // 文档插件

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
      // forbidNonWhitelisted: true, // 禁止 无装饰器验证的数据通过
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      stopAtFirstError: true,
      exceptionFactory: (errors) =>
        new BadRequestException(
          errors.map((e) => {
            const rule = Object.keys(e.constraints!)[0];
            const msg = e.constraints![rule];
            return msg;
          })[0],
        ),
    }),
  );
  app.useBodyParser('json', { limit: '50mb' });
  app.useBodyParser('urlencoded', { limit: '50mb', extended: true });
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  // app.useGlobalInterceptors(
  //   new TransformInterceptor(),
  //   new LoggingInterceptor(),
  // ); // 全局注册拦截器
  // app.useGlobalFilters(new HttpExceptionFilter()); // 全局错误拦截器
  await app.listen(PORT);
  console.info(
    `Application-${NODE_ENV} is running on: http://127.0.0.1:${PORT}`,
  );
  console.info(`Swagger Docs: http://127.0.0.1:${PORT}${docsUrl}`);
}
bootstrap();
