/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-04-14 17:45:14
 * @LastEditors: nevin
 * @Description: QA
 */
import { Controller, Post } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { GetToken } from 'src/auth/auth.guard';
import { Manager } from 'src/auth/manager.guard';

@Manager()
@Controller('admin/qa')
export class AdminQaController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // 创建QA
  @Post()
  async createQa(@GetToken() token: TokenInfo) {
    return 1;
  }
}
