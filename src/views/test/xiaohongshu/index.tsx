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
  const [filePath, setFilePath] = useState<string>(
    '922.mp4',
  );
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
  const handleChooseVideo = useCallback((e: any) => {
    console.log('选择的视频路径:', e.videoPath);
    setFilePath(e.videoPath);
  }, []);

  // 修改登录处理函数
  const handleLogin = async () => {
    console.log('Initiating login request');
    try {
      const result = await window.ipcRenderer.invoke(
        'ICP_XHS_Login',
        'https://creator.douyin.com/',
      );
      console.log('Login response:', result);

      if (result.success && result.data) {
        console.log('result.data@@:', JSON.stringify(result.data.cookie));
        setLoginInfo(result.data);
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
        cookie: [{"name":"acw_tc","value":"0a0d09d017398662023601636e6b3678b5453e72c449955a71a88dce9aa8b8","domain":"creator.xiaohongshu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1739868001.880623,"sameSite":"unspecified"},{"name":"xsecappid","value":"ugc","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1771402203,"sameSite":"unspecified"},{"name":"a1","value":"195181b64e1uk2zdwtecq2bg07ka2lc03dyrv1j6750000218505","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1771402203,"sameSite":"unspecified"},{"name":"webId","value":"448e8a71902ed4e5bd9221d673d5f64a","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1771402203,"sameSite":"unspecified"},{"name":"websectiga","value":"6169c1e84f393779a5f7de7303038f3b47a78e47be716e7bec57ccce17d45f99","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1740125404,"sameSite":"unspecified"},{"name":"sec_poison_id","value":"1b93d373-5581-4c3f-86a5-162894a5f930","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1739866809,"sameSite":"unspecified"},{"name":"gid","value":"yj2yYyDWyqqfyj2yYyDK4fyVdy7TJufE9dSAvKWJDk8WTF280J1S8h888JyY2828Kj2yK0Ky","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1774426205.902804,"sameSite":"unspecified"},{"name":"customer-sso-sid","value":"68c5174726686778508354287f952ccbdf2fb1dc","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1740471057.305251,"sameSite":"unspecified"},{"name":"x-user-id-creator.xiaohongshu.com","value":"65755c46000000003d02be4d","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1774426258.305439,"sameSite":"unspecified"},{"name":"customerClientId","value":"534324456763569","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1774426258.305536,"sameSite":"unspecified"},{"name":"access-token-creator.xiaohongshu.com","value":"customer.creator.AT-68c517472668677850667525pjzcjw0rje0xar0k","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1742458257.305611,"sameSite":"unspecified"},{"name":"galaxy_creator_session_id","value":"aVIvKrLoRitPPJGXFIZH6oRpXH7IUAHpOG3c","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1742458258.305697,"sameSite":"unspecified"},{"name":"galaxy.creator.beaker.session.id","value":"1739866258632030794988","domain":".xiaohongshu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1742458258.305777,"sameSite":"unspecified"}],
        userInfo: {
          authorId: '1234567890',
          nickname: '测试账号',
          avatar:
            'https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo315md1gj6hc6g5ph48itjcgmo6a2sir8?imageView2/2/w/80/format/jpg',
          fansCount: 1000,
        },
      };
      setLoginInfo(mockLoginInfo);
      console.log('mockLoginInfo:', mockLoginInfo);
      message.success('Mock login info set successfully');
    }
  };

  const handleGetDashboardFunc = async () => {
    console.log('Stored login info:', loginInfo);
    const cookies = loginInfo?.cookie;
    const result = await window.ipcRenderer.invoke('ICP_XHS_GetDashboardFunckApi', cookies);
    console.log('handleGetDashboardFunc result:', JSON.stringify(result.data));
    if (result.success && Array.isArray(result.data)) {
      setDashboardList(result.data);
    }
  };

  const handleGetDashboardFunc1 = async () => {
    console.log('Stored login info:', loginInfo);
    const cookies = loginInfo?.cookie;
    const result = await window.ipcRenderer.invoke('ICP_XHS_GetDashboardFunckApi', cookies, '2025-02-10', '2025-02-18');
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

                <Button onClick={handleLogin}>登录小红书</Button>

                <Button onClick={handleGetLoginInfo}>获取登录信息</Button>

                <Button onClick={handlePublishVideo}>发布小红书</Button>

                <Button onClick={handlePublishImage}>发布图文</Button>

                <Button onClick={handleGetDashboardFunc}>获取昨日数据</Button>

                <Button onClick={handleGetDashboardFunc1}>获取指定日期数据</Button>

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
                  <div className="mb-6" style={{ height: '100%', overflowY: 'auto' }}>
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
