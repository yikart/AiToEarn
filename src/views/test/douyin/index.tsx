/*
 * @Author: nevin
 * @Date: 2025-01-17 20:44:02
 * @LastEditTime: 2025-02-14 21:49:20
 * @LastEditors: nevin
 * @Description: 抖音-发布
 */

import React, { useCallback, useState } from 'react';
import { Button, Layout, message, Card, Avatar } from 'antd';
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
  localStorage: string;
}

interface MetricData {
  english_metric_name: string;
  metric_name: string;
  metric_value: number;
  trends: Array<{
    date_time: string;
    value: number;
    douyin_value?: number;
    xigua_value?: number;
  }>;
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [dashboardList, setDashboardList] = useState<
    Array<{
      date: string;
      zhangfen: number;
      bofang: number;
      pinglun: number;
      dianzan: number;
      fenxiang: number;
      zhuye: number;
    }>
  >([]);

  // 修改选择视频的处理函数
  const handleChooseVideo = useCallback((e: any) => {
    console.log('选择的视频路径:', e.videoPath);
    setFilePath(e.videoPath);
  }, []);

  // 修改登录处理函数
  const handleLogin = async () => {
    console.log('Initiating login request');
    try {
      const result = await window.ipcRenderer.invoke(
        'ICP_DY_Login',
        'https://creator.douyin.com/',
      );
      console.log('Login response:', result);

      if (result.success && result.data) {
        console.log('result.data@@:', JSON.stringify(result.data.cookie));
        const loginData: LoginInfo = {
          cookie: result.data.cookie,
          userInfo: {
            authorId: result.data.userInfo.authorId,
            avatar: result.data.userInfo.avatar,
            fansCount: result.data.userInfo.fansCount,
            nickname: result.data.userInfo.nickname,
          },
          localStorage: result.data.localStorage,
        };
        localStorage.setItem('douyin_cookie', result.data.cookie);
        setLoginInfo(loginData);
        console.log('登录成功', JSON.stringify(result.data.localStorage));
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
        cookie: localStorage.getItem('douyin_cookie'),
        userInfo: {
          authorId: 'douyintitoktest',
          nickname: '测试账号',
          avatar:
            'https://p11.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813c001_ogzADiaL8CyEQAiewA1IF3nAATAmgifCMWCBih.jpeg?from=2956013662',
          fansCount: 99999,
        },
        localStorage: `{\"privateKey\":\"-----BEGIN PRIVATE KEY-----\\r\\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgMl5+u6ZAawUJX+vR\\r\\nOyJEurLiLYwSkaiPCFktwrPAJHShRANCAATHgdF1Fmi5f4UxdMdXE8NpOhtp2O67\\r\\nK17GiPnY1YSHjquAna2aMGfZ+r+njYcpmqtCYoE9VfD1FMEXSWxwcBlp\\r\\n-----END PRIVATE KEY-----\\r\\n\",\"webProtect\":\"{\\\"ticket\\\":\\\"hash.hOe4DGkdQa75ggG6hpdGGF3dct3uMX/Zmz+lpK5MxBE=\\\",\\\"ts_sign\\\":\\\"ts.2.26d61d8567ddb46b4145437cb5a49f996cfdadd4e2697a40d42d929a7beb84b7c4fbe87d2319cf05318624ceda14911ca406dedbebeddb2e30fce8d4fa02575d\\\",\\\"client_cert\\\":\\\"pub.BMeB0XUWaLl/hTF0x1cTw2k6G2nY7rsrXsaI+djVhIeOq4CdrZowZ9n6v6eNhymaq0JigT1V8PUUwRdJbHBwGWk=\\\"}\"}`,
      };
      setLoginInfo(mockLoginInfo);
      console.log('mockLoginInfo:', mockLoginInfo);
      message.success('Mock login info set successfully');
    }
  };

  const testQingqiu = async () => {
    const result = await window.ipcRenderer.invoke('ICP_DY_makePublishRequest');
    console.log('testQingqiu result:', result);
  };

  const handleGetDashboardFunc = async () => {
    const cookies = loginInfo?.cookie;
    const result = await window.ipcRenderer.invoke(
      'ICP_DY_GetDashboardFunckApi',
      cookies,
    );
    console.log('handleGetDashboardFunc result:', JSON.stringify(result));
    if (result.success && Array.isArray(result.data)) {
      setDashboardList(result.data);
    }
  };

  const handleGetDashboardFunc1 = async () => {
    const cookies = loginInfo?.cookie;
    const result = await window.ipcRenderer.invoke(
      'ICP_DY_GetDashboardFunckApi',
      cookies,
      '2025-02-10',
      '2025-02-19',
    );
    console.log('handleGetDashboardFunc1 result:', JSON.stringify(result));
    if (result.success && Array.isArray(result.data)) {
      setDashboardList(result.data);
    }
  };

  const handlePublishImage = async () => {
    console.log('Initiating handlePublishImage request');
    console.log('Stored login info:', loginInfo);
    const cookies = loginInfo?.cookie;
    const token = loginInfo?.localStorage ? loginInfo?.localStorage : 'token';
    console.log('token:', token);
    const imagePath = [
      'https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/6069415171/p792953.png',
    ];

    const platformSetting = {
      // 标题
      title: '这是一条爱团团作品',
      // 话题(抖音,抖音机构号,视频号平台格式)
      topics: ['立夏', '二十四节气'],
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
        'ICP_DY_PublishImageWorkApi',
        cookies,
        token,
        imagePath,
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

  const handlePublishVideo = async () => {
    console.log('Initiating publish request');
    console.log('Stored login info:', loginInfo);
    const cookies = loginInfo?.cookie;
    const token = loginInfo?.localStorage ? loginInfo?.localStorage : 'token';

    const platformSetting = {
      // 标题
      title: 'ai爱爱爱爱爱爱ai爱了吗爱团团',
      // 话题(抖音,抖音机构号,视频号平台格式)
      topics: ['爱团团', 'AI', '极品美女'],

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
        'ICP_DY_PublishVideoWorkApi',
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

  // 添加渲染列表数据的方法
  const renderDashboardList = () => (
    <div className="space-y-4">
      {dashboardList.map((item, index) => (
        <Card key={index} className="shadow-sm">
          <div className="text-lg font-medium mb-4">{item.date}</div>
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

                <VideoChoose onChoose={handleChooseVideo} />

                <Button onClick={handleLogin}>登录抖音</Button>

                <Button onClick={handleGetLoginInfo}>获取登录信息</Button>

                <Button onClick={handlePublishVideo}>发布抖音</Button>

                <Button onClick={handlePublishImage}>发布图文</Button>

                <Button onClick={handleGetDashboardFunc}>获取昨日数据</Button>

                <Button onClick={handleGetDashboardFunc1}>
                  获取指定日期数据
                </Button>

                <Button onClick={testQingqiu}>测试请求</Button>

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
                {dashboardList.length > 0 && (
                  <div
                    className="mb-6"
                    style={{ height: '100%', overflowY: 'auto' }}
                  >
                    <h2 className="text-lg font-medium mb-4">数据概览</h2>
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
