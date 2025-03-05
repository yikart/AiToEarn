/*
 * @Author: nevin
 * @Date: 2025-02-26 21:43:19
 * @LastEditTime: 2025-02-26 21:43:30
 * @LastEditors: nevin
 * @Description: 热门事件
 */

import { platformApi } from '@/api/platform';
import React from 'react';

const Page: React.FC = () => {
  async function getAllHotTopics() {
    const res = await platformApi.getAllHotTopics();
    console.log('----', res);
  }

  // 获取热门事件
  getAllHotTopics();

  return (
    <>
      <div>热门内容</div>
    </>
  );
};

export default Page;
