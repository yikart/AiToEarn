/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: Reply reply
 */
import { Injectable } from '../core/decorators';
import PQueue from 'p-queue';

@Injectable()
export class ReplyService {
  replyQueue: PQueue;
  constructor() {
    this.replyQueue = new PQueue({ concurrency: 2 });
  }
}
