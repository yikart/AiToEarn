import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { config } from './config';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getSysInfo() {
    return {
      env: config.env,
    };
  }
}
