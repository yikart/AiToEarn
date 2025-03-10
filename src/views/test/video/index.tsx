/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-21 21:18:45
 * @LastEditors: nevin
 * @Description: 视频测试
 */
import { operateApi } from '@/api/operate';
import { Button } from 'antd';

export default function Page() {
  async function getBanner() {
    const res = await operateApi.getBannerList();
    console.log('----banner ', res);
  }

  return (
    <div>
      <Button onClick={getBanner}>获取banner</Button>
    </div>
  );
}
