/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-04-01 17:00:45
 * @LastEditors: nevin
 * @Description: 测试页面
 */
import { Button } from 'antd';
import { toolsApi } from '@/api/tools';

export default function Test() {
  async function testBtn() {
    toolsApi
      .aiArticleHtml(
        '主图使用该图片https://ai-to-earn.oss-cn-beijing.aliyuncs.com/development/temp/nopath/202504/d8a3278e-fd0c-42cf-8339-02bf85b6c4e4.png生成一个卡通任务介绍页',
      )
      .then((res) => {
        console.log('----------', res);
      });
  }

  return (
    <div>
      <Button
        onClick={() => {
          testBtn();
        }}
      >
        测试
      </Button>
    </div>
  );
}
