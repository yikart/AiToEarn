/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-04-01 17:00:45
 * @LastEditors: nevin
 * @Description: 测试页面
 */
import { Button } from 'antd';
import { userApi } from '@/api/user';

export default function Test() {
  async function testBtn() {
    userApi.getMinePopularizeCode().then((res) => {
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
