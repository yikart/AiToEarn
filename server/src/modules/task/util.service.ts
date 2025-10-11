/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-02-27 22:43:33
 * @LastEditors: nevin
 * @Description: 任务模块的工具服务
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from '../../db/schema/task.schema';
import { UserTask } from '../../db/schema/user-task.schema';
import { TaskMaterial } from 'src/db/schema/taskMaterial.schema';
import axios from 'axios';
import * as natural from 'natural';
import { URL } from 'url';

@Injectable()
export class TaskUtilService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTask>,
    @InjectModel(TaskMaterial.name)
    private taskMaterialModel: Model<TaskMaterial>,
  ) {}

  /**
   * 小红书内容相似度检测
   * @param content 内容
   * @param articleUrl 文章链接
   * @returns
   */
  async articleXhsContentCheck(
    content: string,
    articleUrl: string,
  ): Promise<{
    status: 1 | 0;
    extent: number;
  }> {
    try {
      // 解析URL
      // https://www.xiaohongshu.com/explore/68063228000000001202f814?xsec_token=AB1nbuHhtoNuSMgYHIwZMaZqY1eo-IsGJkdrW04BZHKZQ=&xsec_source=pc_feed

      const inUrl = new URL(articleUrl);
      const xsecToken = inUrl.searchParams.get('xsec_token');
      const noteId = inUrl.pathname.split('/').pop();

      const body = {
        note_id: noteId,
        xsec_token: xsecToken,
      };

      const response = await axios.post<{
        code: number; // 200
        msg: string;
        data: {
          xsec_token: string;
          title: string;
          desc: string;
        };
      }>(`https://platapi.yikart.cn/api/xhs/note_detail_v2`, body);
      let { desc } = response.data.data;

      // desc 根据"[话题]"分割取出第一个
      const descArr = desc.split('[话题]');
      if (descArr.length > 1) desc = descArr[0];
      const res: number = natural.JaroWinklerDistance(content, desc);
      return {
        status: 1,
        extent: res,
      };
    } catch (error) {
      console.log('------- 小红书内容相似度检测失败 -------', error);
      return {
        status: 0,
        extent: 0,
      };
    }
  }
}
