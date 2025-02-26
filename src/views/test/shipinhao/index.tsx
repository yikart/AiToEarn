/*
 * @Author: nevin
 * @Date: 2025-01-17 20:44:02
 * @LastEditTime: 2025-02-07 21:47:26
 * @LastEditors: nevin
 * @Description: 视频号-发布
 */

import React, { useCallback, useState } from 'react';
import { Button, Layout, message, Card, Avatar } from 'antd';
import WebView from '@/components/WebView';
import { AccountInfo } from '@/views/account/comment';
import VideoChoose from '@/components/Choose/VideoChoose';
import { useXiaohongshuStore } from '@/store/xiaohongshu';

const { Sider, Content } = Layout;

const contentStyle: React.CSSProperties = {
  padding: '1rem',
  backgroundColor: '#fff',
  height: '100%',
};

const siderStyle: React.CSSProperties = {
  padding: '1rem',
  backgroundColor: '#fff',
};

const layoutStyle = {
  borderRadius: 8,
  overflow: 'hidden',
  width: 'calc(100% - 2rem)',
  height: '100%',
  marginRight: '1rem',
};

// 修改类型定义
interface LoginUserInfo {
  authorId: string;
  avatar: string;
  fansCount: number;
  nickname: string;
}

interface LoginInfo {
  cookie: string;
  userInfo: LoginUserInfo;
}

interface DashboardData {
  zhangfen: number;
  bofang: number;
  pinglun: number;
  dianzan: number;
  fenxiang: number;
  zhuye: number;
}

const Account: React.FC = () => {
  // 账户
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const { setLoginInfo, loginInfo } = useXiaohongshuStore();
  const [publishResult, setPublishResult] = useState<any>(null);
  const [filePath, setFilePath] = useState<string>('922.mp4');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardList, setDashboardList] = useState<Array<{
    date: string;
    zhangfen: number;
    bofang: number;
    pinglun: number;
    dianzan: number; 
    fenxiang: number;
    zhuye: number;
  }>>([]);

  // 修改选择视频的处理函数
  const handleChooseVideo = useCallback((path: string) => {
    console.log('选择的视频路径:', path);
    setFilePath(path);
  }, []);

  // 修改登录处理函数
  const handleLogin = async () => {
    console.log('Initiating login request');
    try {
      const result = await window.ipcRenderer.invoke(
        'ICP_SPH_Login',
        'https://channels.weixin.qq.com',
      );
      console.log('Login response:', JSON.stringify(result));

      if (result.success && result.data) {
        const loginData: LoginInfo = {
          cookie: result.data.cookie,
          userInfo: {
            authorId: result.data.userInfo.authorId,
            avatar: result.data.userInfo.avatar,
            fansCount: result.data.userInfo.fansCount,
            nickname: result.data.userInfo.nickname,
          },
        };
        setLoginInfo(loginData);
        message.success('登录成功');
      } else {
        console.error('登录失败:', result.error);
        message.error('登录失败: ' + result.error);
      }
    } catch (error) {
      console.error('登录请求错误:', error);
      message.error(
        '登录失败: ' + (error instanceof Error ? error.message : String(error)),
      );
    }
  };

  // 获取存储的登录信息
  const handleGetLoginInfo = () => {
    console.log('Stored login info:', loginInfo);
    if (loginInfo) {
      message.success('Login info retrieved successfully');
    } else {
      // 设置测试数据
      const mockLoginInfo = {
        cookie: `[{"name":"sessionid","value":"BgAAZDbdl13U8HQhGdpbowuMSz0SXG4n5uege8Ml4JQabcIDmdOS6V1cCKpOf3lgbZq4LmzOdpxwEFP6ZPV3dLpCz6sVKlwwR8dNmJ1oyllW","domain":"channels.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1774502488.113307,"sameSite":"no_restriction"},{"name":"wxuin","value":"4108987180","domain":"channels.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1774502488.113377,"sameSite":"no_restriction"}]`,
        userInfo: {
          authorId: 'sphSeVW1LNN5QW9',
          nickname: '测试账号',
          avatar:
            'https://wx.qlogo.cn/finderhead/Q3auHgzwzM6fV2MJdRWicvU5mqiaFyTVrKmHqdG6dFFwg91U7vmvPpmw/0',
          fansCount: 99999,
        },
      };

      setLoginInfo(mockLoginInfo);
      message.success('Mock login info set successfully');
    }
  };

  // 获取账户数据 
  const handleGetDashboardFunc = async () => {
    const cookies = loginInfo?.cookie;
    const result = await window.ipcRenderer.invoke('ICP_SPH_GetDashboardFunckApi', cookies);
    console.log('handleGetDashboardFunc result:', result);
    if (result.success && result.data) {
      setDashboardData(result.data);
    }
  };

  // 获取指定日期范围的数据
  const handleGetDashboardFunc1 = async () => {
    const cookies = loginInfo?.cookie;
    const result = await window.ipcRenderer.invoke(
      'ICP_SPH_GetDashboardFunckApi',
      cookies,
      '2025-02-10',
      '2025-02-18'
    );
    console.log('handleGetDashboardFunc result:', result);
    if (result.success && Array.isArray(result.data)) {
      setDashboardList(result.data);
    }
  };

  const handlePublishImage = async () => {
    console.log('Initiating publish request');
    console.log('Stored login info:', loginInfo);
    const cookies = loginInfo?.cookie;
    const token = 'token';

    const platformSetting = {
      // 标题
      title: 'ai爱爱爱爱爱爱ai爱了吗爱团团',
      // 话题(抖音,抖音机构号,视频号平台格式)
      topics: ['爱团团', 'AI', '极品美女'],
      // 话题(小红书平台格式)
      // topicsDetail: [
      //   {
      //     topicId: '0',
      //     topicName: '爱团团',
      //     link: 'https://www.xiaohongshu.com/page/topics/5f116704e44f2900012f1d86?naviHidden=yes',
      //   },
      // ],
      // 封面(填写远程地址即可)
      cover:
        'https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/6069415171/p792953.png',
      // 定时发布,秒级时间戳,若时间小于当前时间戳,则立即发布,不填也是立即发布
      timingTime: '1737703280',
      // POI信息_抖音格式
      // poiInfo: {
      //     poiId: "6601136811005708292",
      //     poiName: "河南省电子商务产业园",
      // },
    };

    try {
      const result = await window.ipcRenderer.invoke(
        'ICP_SPH_PublishVideoWorkApi',
        cookies,
        token,
        filePath, // 使用状态变量中的文件路径
        platformSetting,
      );
      console.log('Publish response:', result);

      if (result.success) {
        console.log('Publish successful:', result.data);
        message.success('发布成功');
        setPublishResult(result.data);
      } else {
        console.error('Publish failed:', result.error);
        message.error('发布失败: ' + result.error);
      }
    } catch (error) {
      console.error('Publish request error:', error);
      message.error(
        '发布失败: ' + (error instanceof Error ? error.message : String(error)),
      );
    }
  };

  // 渲染数据卡片
  const renderMetricCard = (title: string, value: number, icon: string) => (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-600 text-sm">{title}</div>
        <span className="text-gray-400 text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-[#a66ae4]">
        {value.toLocaleString()}
      </div>
    </div>
  );

  // 渲染列表数据
  const renderDashboardList = () => (
    <div className="space-y-4">
      {dashboardList.map((item, index) => (
        <Card key={index} className="shadow-sm">
          {/* <div className="text-lg font-medium mb-4">{item.date}</div> */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {renderMetricCard('涨粉数', item.zhangfen, '👥')}
            {renderMetricCard('播放量', item.bofang, '▶️')}
            {renderMetricCard('评论数', item.pinglun, '💬')}
            {renderMetricCard('点赞数', item.dianzan, '❤️')}
            {renderMetricCard('分享数', item.fenxiang, '🔄')}
            {renderMetricCard('主页访问', item.zhuye, '🏠')}
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="h-[calc(100%-2rem)]">
          <Layout style={layoutStyle}>
            <Sider width="300" style={siderStyle}>
              <div className="flex flex-col space-y-4">
                {accountInfo && (
                  <Card>
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar
                        size={64}
                        src={accountInfo.avatar}
                        alt={accountInfo.nickname}
                      />
                      <div className="text-center">
                        <div className="text-lg font-bold">
                          {accountInfo.nickname}
                        </div>
                        <div className="text-gray-500">
                          账号: {accountInfo.account}
                        </div>
                        <div className="text-gray-500">
                          UID: {accountInfo.uid}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                <VideoChoose
                  onChoose={(vf) => handleChooseVideo(vf.videoPath)}
                />

                <Button onClick={handleLogin}>登录视频号</Button>

                <Button onClick={handleGetLoginInfo}>获取登录信息</Button>

                <Button onClick={handleGetDashboardFunc}>获取昨日数据</Button>

                <Button onClick={handleGetDashboardFunc1}>获取指定日期数据</Button>

                <Button onClick={handlePublishImage}>发布图文</Button>

                {publishResult && (
                  <Card title="发布结果">
                    <div className="flex flex-col space-y-2">
                      <div>
                        发布时间:{' '}
                        {new Date(
                          publishResult.publishTime * 1000,
                        ).toLocaleString()}
                      </div>
                      <div>作品ID: {publishResult.publishId}</div>
                      <div>
                        分享链接:{' '}
                        <a
                          href={publishResult.shareLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {publishResult.shareLink}
                        </a>
                      </div>
                    </div>
                  </Card>
                )}

                {loginInfo && (
                  <Card>
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar
                        size={64}
                        src={loginInfo.userInfo?.avatar}
                        alt={loginInfo.userInfo?.nickname}
                      />
                      <div className="text-center">
                        <div className="text-lg font-bold">
                          {loginInfo.userInfo?.nickname}
                        </div>
                        <div className="text-gray-500">
                          ID: {loginInfo.userInfo?.authorId}
                        </div>
                        <div className="text-gray-500">
                          粉丝数: {loginInfo.userInfo?.fansCount}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </Sider>
            <Content style={contentStyle}>
              <div className="flex flex-col h-full">
                {dashboardData && (
                  <div className="mb-6">
                    <h2 className="text-lg font-medium mb-4">昨日数据概览</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {renderMetricCard('涨粉数', dashboardData.zhangfen, '👥')}
                      {renderMetricCard('播放量', dashboardData.bofang, '▶️')}
                      {renderMetricCard('评论数', dashboardData.pinglun, '💬')}
                      {renderMetricCard('点赞数', dashboardData.dianzan, '❤️')}
                      {renderMetricCard('分享数', dashboardData.fenxiang, '🔄')}
                      {renderMetricCard('主页访问', dashboardData.zhuye, '🏠')}
                    </div>
                  </div>
                )}
                
                {dashboardList.length > 0 && (
                  <div className="mb-6" style={{ height: '100%' , overflowY: 'auto' }}>
                    <h2 className="text-lg font-medium mb-4">历史数据概览</h2>
                    {renderDashboardList()}
                  </div>
                )}
              </div>
            </Content>
          </Layout>
        </div>
      </div>
    </div>
  );
};

export default Account;
