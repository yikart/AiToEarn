/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-04-01 17:00:45
 * @LastEditors: nevin
 * @Description: 测试页面
 */
import { toolsApi } from '@/api/tools';
import { Button } from 'antd';
export default function Test() {
  async function testBtn() {
    toolsApi.textModeration('嫖娼去');
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
