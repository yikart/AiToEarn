/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 22:21:01
 * @LastEditors: nevin
 * @Description: 评论用API
 */
import http from './request';
export const commentApi = {
  /**
   * 发起获取评论任务
   * @param taskType
   * @param keywords
   */
  runCommentSearchNotesTask(taskType: string, keywords: string) {
    return http.get<string>(
      `/dataResource/comment/runTask?taskType=${taskType}&keywords=${keywords}`,
      {
        isToken: true,
      },
    );
  },

  /**
   * 获取抓取数据的结果
   * @param taskType
   * @param taskId
   */
  getCommentSearchNotes(taskType: string, taskId: string) {
    return http.get<any[]>(
      `/dataResource/comment/list?taskType=${taskType}&taskId=${taskId}`,
      {
        isToken: true,
      },
    );
  },
};
