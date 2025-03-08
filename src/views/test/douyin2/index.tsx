/*
 * @Author: nevin
 * @Date: 2025-01-17 20:44:02
 * @LastEditTime: 2025-02-13 16:58:36
 * @LastEditors: nevin
 * @Description: 抖音-发布
 */

import React, { useState } from 'react';
import { Button, Layout } from 'antd';

const { Sider, Content } = Layout;

const Account: React.FC = () => {
  const [loginInfo, setLoginInfo] = useState<{
    cookie: string;
    token: string;
  }>({
    cookie: '',
    token: '',
  });

  const handleLogin = async () => {
    const result = await window.ipcRenderer.invoke('ICP_TEST_DOUYIN_LOGIN');
    console.log('-------- douyin login result: ', result.cookie, result.token);

    // 设置用户信息
    setLoginInfo({
      cookie: result.cookie,
      token: result.token,
    });
  };

  const handlePublishVideo = async () => {
    // const result = await window.ipcRenderer.invoke('ICP_TEST_DOUYIN_VIDEO_PUB');
    const result = await window.ipcRenderer.invoke(
      'ICP_TEST_DOUYIN_VIDEO_PUB_2',
      loginInfo.cookie,
      loginInfo.token,
    );
    console.log('Login response:', result);
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="h-[calc(100%-2rem)]">
          <Layout>
            <Sider width="300">
              <div className="flex flex-col space-y-4">
                <Button onClick={handleLogin}>登录</Button>
                <Button onClick={handlePublishVideo}>发布抖音</Button>
              </div>
            </Sider>
            <Content>
              <div className="flex flex-col h-full">
                <p>{loginInfo.token}</p>
              </div>
            </Content>
          </Layout>
        </div>
      </div>
    </div>
  );
};

export default Account;
