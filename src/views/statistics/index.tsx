/*
 * @Author: nevin
 * @Date: 2025-01-17 20:05:00
 * @LastEditTime: 2025-02-24 12:15:15
 * @LastEditors: nevin
 * @Description: 数据页
 */
import { useEffect, useState, useRef } from 'react';
import './statistics.css';
import { icpGetAccountDashboard, icpGetAccountStatistics } from '@/icp/account';
import { DashboardData, StatisticsInfo } from './comment';
import { Button, Card, Layout, Avatar, DatePicker } from 'antd';
import {
  InfoCircleOutlined,
  DownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Dayjs } from 'dayjs';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { message } from 'antd';
import WebView from '@/components/WebView';

import douyinIcon from '@/assets/svgs/account/douyin.svg';
import xhsIcon from '@/assets/svgs/account/xhs.svg';
import wxSphIcon from '@/assets/svgs/account/wx-sph.svg';
import ksIcon from '@/assets/svgs/account/ks.svg';

const { Content } = Layout;

const Statistics = () => {
  const [statisticsInfo, setStatisticsInfo] =
    useState<Partial<StatisticsInfo>>();

  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [dashboardData7, setDashboardData7] = useState<any[]>([]);

  const [selectedDateRange, setSelectedDateRange] = useState<
    [Dayjs | null, Dayjs | null]
  >([dayjs().subtract(7, 'day'), dayjs().subtract(1, 'day')]);

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts>();

  // 添加选中的账户ID列表
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  // 添加选中的指标类型
  const [selectedMetric, setSelectedMetric] = useState<string>('fans');

  // 添加状态来控制WebView的显示
  const [examineVideoData, setExamineVideoData] = useState<{
    url: string;
    account: any;
    open: boolean;
  }>({
    url: '',
    account: null,
    open: false,
  });

  useEffect(() => {
    getAccountStatistics();
    getAccountStatistics7();
  }, []);

  // 初始化图表
  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  // 在获取账户统计信息后，默认选中所有账户
  useEffect(() => {
    if (statisticsInfo?.list) {
      setSelectedAccounts(statisticsInfo.list.map((account) => account.id));
    }
  }, [statisticsInfo]);

  // 更新图表数据
  useEffect(() => {
    if (chartInstance.current) {
      // 如果没有选中的账户或没有数据，显示空图表
      if (selectedAccounts.length === 0 || dashboardData7.length === 0) {
        const emptyOption = {
          title: {
            text: '数据趋势',
            left: 'center',
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '10%',
            containLabel: true,
          },
          xAxis: {
            type: 'category',
            data: [],
          },
          yAxis: {
            type: 'value',
          },
          series: [],
        };
        chartInstance.current.setOption(emptyOption, true);
        return;
      }

      // 获取所有日期
      const allDates =
        dashboardData7[0]?.data.map((_: any, index: number) => {
          const date = selectedDateRange[0]?.clone().add(index, 'day');
          return date?.format('YYYY-MM-DD');
        }) || [];

      // 平台类型对应的颜色
      const platformColors: Record<string, string> = {
        douyin: '#183641', // 抖音
        xhs: '#FF2442', // 小红书
        wxSph: '#FA9A32', // 微信视频号
        KWAI: '#F64806', // 快手
      };

      const option = {
        title: {
          text: '数据趋势',
          left: 'center',
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        },
        legend: {
          data: dashboardData7.map((item) => item.name),
          bottom: 0,
          textStyle: {
            color: '#666',
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '10%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: allDates,
          axisLabel: {
            interval: 0,
            rotate: 30,
            color: '#666',
            fontSize: 12,
          },
          axisTick: {
            alignWithLabel: true,
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: '#666',
            fontSize: 12,
          },
        },
        series: dashboardData7.map((account) => ({
          name: account.name,
          type: 'bar',
          data: account.data.map(
            (item: Record<string, any>) => Number(item[selectedMetric]) || 0,
          ),
          barMaxWidth: 30,
          itemStyle: {
            color: platformColors[account.type] || '#a66ae4', // 根据账户类型设置颜色，默认使用紫色
            borderRadius: [4, 4, 0, 0],
          },
        })),
      };
      chartInstance.current.setOption(option, true);
    }
  }, [dashboardData7, selectedMetric]);

  // 获取日期数组
  const getDatesArray = (start: Dayjs | null, end: Dayjs | null) => {
    if (!start || !end) return [];
    const dates = [];
    let curr = start;
    while (curr <= end) {
      dates.push(curr.format('YYYY-MM-DD'));
      curr = curr.add(1, 'day');
    }
    return dates;
  };

  // 获取指标趋势数据
  const getMetricTrend = (metric: string) => {
    if (!selectedDateRange?.[0] || !selectedDateRange?.[1]) return [];
    const dates = getDatesArray(selectedDateRange[0], selectedDateRange[1]);
    return dates.map((date) => {
      return dashboardData7.reduce((sum, item: any) => {
        // 这里需要根据实际数据结构调整
        return sum + Number(item[metric] || 0);
      }, 0);
    });
  };

  // 获取昨日新增总和
  const getTotalYesterdayIncrease = (metric: string) => {
    return dashboardData.reduce((sum, item: any) => {
      // 这里需要根据实际数据结构调整
      return Number(sum) + Number(item[`${metric}`] || 0);
    }, 0);
  };

  // 获取日期范围内的总计值
  const getRangeTotalMetricValue = (metric: string) => {
    if (!dashboardData7.length) return 0;
    return dashboardData7.reduce((sum, account) => {
      const accountSum = account.data.reduce(
        (acc: number, item: Record<string, any>) =>
          acc + Number(item[metric] || 0),
        0,
      );
      return sum + accountSum;
    }, 0);
  };

  // 获取昨日数据总和
  const getYesterdayTotalValue = (metric: string) => {
    return dashboardData.reduce(
      (sum, item: any) => sum + Number(item[metric] || 0),
      0,
    );
  };

  // 导出数据
  const handleExportData = () => {
    const data = dashboardData.map((item: any) => ({
      账户ID: item.id,
      粉丝数: item.fans,
      播放数: item.read,
      评论数: item.comment,
      点赞数: item.like,
      分享数: item.collect,
      主页访问: item.forward,
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(data[0]).join(',') +
      '\n' +
      data.map((row) => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `数据统计_${new Date().toLocaleDateString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function getAccountStatistics() {
    setDashboardData([]);
    const res: StatisticsInfo = await icpGetAccountStatistics();
    setStatisticsInfo(res);
    // 获取到账号列表后,遍历获取每个账号的看板数据
    if (res.list && res.list.length > 0) {
      for (const account of res.list) {
        const dashboardRes = await getAccountDashboard(account.id);
        // const accountInfo = await icpGetAccountInfo(account.type, account.uid);
        setDashboardData((prev) => [
          ...prev,
          { ...dashboardRes[0], id: account.id },
        ]);
      }
    }
  }

  async function getAccountStatistics7() {
    setDashboardData7([]);
    const res: any = statisticsInfo;
    const dataAll = [];

    // 获取到账号列表后,遍历获取每个账号的看板数据
    if (res?.list && res.list.length > 0) {
      // 只获取选中账户的数据
      const selectedAccountsList = res.list.filter((account: any) =>
        selectedAccounts.includes(account.id),
      );

      for (const account of selectedAccountsList) {
        const startDate = selectedDateRange[0]?.format('YYYY-MM-DD');
        const endDate = selectedDateRange[1]?.format('YYYY-MM-DD');
        const dashboardRes = await icpGetAccountDashboard(account.id, [
          startDate,
          endDate,
        ]);

        const datas = {
          id: account.id,
          type: account.type,
          name: account.nickname,
          data: dashboardRes,
        };
        console.log('datas$$$:', datas);
        dataAll.push(datas);
      }

      // 所有数据获取完成后再一次性更新
      setDashboardData7(dataAll);
    }
  }

  /**
   * 获取账号看板信息
   * @param id
   */
  async function getAccountDashboard(id: number) {
    const res = await icpGetAccountDashboard(id);
    return res;
  }

  // 渲染数据卡片
  const renderMetricCard = (
    title: string,
    value: number | string,
    icon: string,
  ) => (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">{title}</div>
        <span className="text-lg text-gray-400">{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-[#a66ae4]">
        {value.toLocaleString()}
      </div>
    </div>
  );

  // 获取一个月前的日期
  const disabledDate = (current: Dayjs) => {
    const oneMonthAgo = dayjs().subtract(1, 'month');
    const today = dayjs();
    return current && (current < oneMonthAgo || current > today);
  };

  // 处理账户选择
  const toggleAccountSelection = async (accountId: number) => {
    const newSelectedAccounts = selectedAccounts.includes(accountId)
      ? selectedAccounts.filter((id) => id !== accountId)
      : [...selectedAccounts, accountId];

    setSelectedAccounts(newSelectedAccounts);

    // 重新获取数据
    setDashboardData7([]);
    const res: any = statisticsInfo;
    const dataAll = [];

    if (res.list && res.list.length > 0) {
      // 只获取选中账户的数据
      const selectedAccountsList = res.list.filter((account: any) =>
        newSelectedAccounts.includes(account.id),
      );

      for (const account of selectedAccountsList) {
        const startDate = selectedDateRange[0]?.format('YYYY-MM-DD');
        const endDate = selectedDateRange[1]?.format('YYYY-MM-DD');
        const dashboardRes = await icpGetAccountDashboard(account.id, [
          startDate,
          endDate,
        ]);

        const datas = {
          id: account.id,
          type: account.type,
          name: account.nickname,
          data: dashboardRes,
        };
        dataAll.push(datas);
      }
      setDashboardData7(dataAll);
    }
  };

  // 处理指标类型选择
  const handleMetricSelect = (metric: string) => {
    setSelectedMetric(metric);
  };

  // 刷新账户数据
  const refreshAccountData = () => {
    // 清空现有数据
    setDashboardData([]);
    // 重新获取所有选中账户的数据
    getAccountStatistics();
    message.success('数据已刷新');
  };

  // 添加获取平台图标的函数
  const getPlatformIcon = (type: string) => {
    switch (type) {
      case 'douyin':
        return douyinIcon;
      case 'xhs':
        return xhsIcon;
      case 'wxSph':
        return wxSphIcon;
      case 'KWAI':
        return ksIcon;
      default:
        return '';
    }
  };

  // 修改检查视频的函数
  const examineVideo = (account: any) => {
    console.log('检查视频', account);
    // 根据账户类型确定要打开的URL
    let url = '';
    switch (account.type) {
      case 'douyin':
        url = `https://creator.douyin.com/`;
        break;
      case 'xhs':
        url = `https://www.xiaohongshu.com/`;
        break;
      case 'wxSph':
        url = `https://channels.weixin.qq.com`;
        break;
      case 'KWAI':
        url = `https://id.kuaishou.com/pass/kuaishou/login/passToken?sid=kuaishou.web.cp.api`;
        break;
      default:
        url = '';
    }

    setExamineVideoData({
      url,
      account,
      open: true,
    });
  };

  // 关闭WebView
  const closeWebView = () => {
    setExamineVideoData((prev) => ({ ...prev, open: false }));
  };

  return (
    <div className="min-h-screen page-container bg-gray-50">
      {/* WebView组件 */}
      {examineVideoData.open && examineVideoData.account ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-4/5 h-4/5 bg-white rounded-lg overflow-hidden">
            <button
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
              style={{
                zIndex: 1000,
                width: '36px',
                height: '36px',
                color: '#a66ae4',
                border: '1px solid rgba(166, 106, 228, 0.2)',
              }}
              onClick={closeWebView}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <WebView
              url={examineVideoData.url}
              cookieParams={{
                cookies: JSON.parse(
                  examineVideoData.account.loginCookie || '{}',
                ),
              }}
              key={examineVideoData.url + examineVideoData.open}
            />
          </div>
        </div>
      ) : null}

      <div className="px-6 py-6">
        {/* 顶部标题区域 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">数据中心</h1>
          <div className="flex items-center space-x-2 text-gray-600 cursor-pointer hover:text-[#a66ae4]">
            <InfoCircleOutlined />
            <span>数据说明</span>
          </div>
        </div>

        {/* 总体数据概览和账户列表 */}
        <div className="flex gap-8 mb-8">
          {/* 总体数据概览 */}
          <div className="w-[500px] flex-shrink-0">
            <h2 className="mb-4 text-lg font-medium">总体数据概览</h2>
            <div className="bg-white rounded-lg shadow-sm p-6 h-[120px] flex items-center">
              <div className="grid w-full grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">账户总数</div>
                    <span className="text-lg text-gray-400">👥</span>
                  </div>
                  <div className="text-2xl font-semibold text-[#a66ae4]">
                    {statisticsInfo?.accountTotal?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">粉丝总数</div>
                    <span className="text-lg text-gray-400">🌟</span>
                  </div>
                  <div className="text-2xl font-semibold text-[#a66ae4]">
                    {statisticsInfo?.fansCount?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 账户列表 */}
          <div className="flex-1">
            <h2 className="mb-4 text-lg font-medium">账户列表</h2>
            <div className="bg-white rounded-lg shadow-sm p-6 h-[120px]">
              {!statisticsInfo?.list || statisticsInfo.list.length === 0 ? (
                // 无数据状态 - 使用Ant Design图标
                <div className="flex flex-col items-center justify-center h-full">
                  <QuestionCircleOutlined
                    style={{ fontSize: '32px', color: '#CCCCCC' }}
                  />
                  <div className="text-sm text-gray-500 mt-2">暂无数据</div>
                </div>
              ) : (
                // 有数据状态
                <div
                  className="flex items-center h-full gap-4 overflow-x-auto custom-scrollbar"
                  style={{ padding: '2px 10px' }}
                >
                  {statisticsInfo?.list?.map((account) => (
                    <div
                      key={account.id}
                      className={`flex-shrink-0 flex items-center px-6 py-4 space-x-3 transition-all rounded-lg bg-gray-50 hover:shadow-sm cursor-pointer ${
                        selectedAccounts.includes(account.id)
                          ? 'ring-2 ring-[#a66ae4]'
                          : ''
                      }`}
                      onClick={() => toggleAccountSelection(account.id)}
                    >
                      <div style={{ position: 'relative' }}>
                        <img
                          className="w-12 h-12 rounded-full"
                          src={account.avatar}
                          alt=""
                        />
                        {getPlatformIcon(account.type) && (
                          <img
                            src={getPlatformIcon(account.type)}
                            alt={account.type}
                            className="w-4 h-4 ml-2"
                            style={{
                              position: 'absolute',
                              bottom: '0',
                              right: '0',
                            }}
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-base font-medium text-gray-900 text-left">
                          {account.nickname}
                        </div>

                        <div className="text-sm flex text-left">
                          <span className="text-gray-500">
                            粉丝:{' '}
                            {(account as any).fansCount?.toLocaleString() || 0}
                          </span>
                        </div>

                        <div
                          className="text-gray-500 text-left"
                          style={{ fontSize: '12px' }}
                        >
                          ID: {account.uid}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 数据明细 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">数据明细</h2>
            <div className="flex items-center space-x-4">
              <DatePicker.RangePicker
                value={selectedDateRange}
                onChange={(dates) => {
                  if (dates) {
                    setSelectedDateRange([
                      dates[0] as Dayjs,
                      dates[1] as Dayjs,
                    ]);
                  }
                }}
                disabledDate={disabledDate}
                className="w-64"
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  // 清空现有数据
                  setDashboardData7([]);
                  // 重新获取所有选中账户的数据
                  getAccountStatistics7();
                }}
                className="bg-[#a66ae4] hover:bg-[#9559d1]"
              >
                搜索
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExportData}
                className="bg-[#a66ae4] hover:bg-[#9559d1]"
              >
                导出数据
              </Button>
            </div>
          </div>

          {/* 总体数据卡片 */}
          <div className="grid grid-cols-6 gap-4 mb-6">
            {[
              { key: 'fans', title: '总粉丝数', icon: '👥' },
              { key: 'read', title: '总播放数', icon: '▶️' },
              { key: 'comment', title: '总评论数', icon: '💬' },
              { key: 'like', title: '总点赞数', icon: '👍' },
              { key: 'collect', title: '总分享数', icon: '🔄' },
              { key: 'forward', title: '总主页访问', icon: '🏠' },
            ].map((metric) => (
              <div
                key={metric.key}
                className={`p-4 bg-white rounded-lg shadow-sm cursor-pointer transition-all ${
                  selectedMetric === metric.key ? 'ring-2 ring-[#a66ae4]' : ''
                }`}
                onClick={() => handleMetricSelect(metric.key)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">{metric.title}</div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-400">
                      昨日:{' '}
                      {getYesterdayTotalValue(metric.key).toLocaleString()}
                    </div>
                    <div className="text-lg text-gray-400">{metric.icon}</div>
                  </div>
                </div>
                <div className="text-2xl font-semibold text-[#a66ae4]">
                  {getRangeTotalMetricValue(metric.key).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* 趋势图表 */}
          <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
            <div ref={chartRef} style={{ height: '400px' }} />
          </div>
        </div>

        {/* 账户数据 */}
        <div className="mb-8" style={{ paddingBottom: '80px' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">昨日账户数据</h2>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={refreshAccountData}
              className="flex items-center hover:text-blue-500 transition-colors"
            >
              刷新
            </Button>
          </div>

          {!statisticsInfo?.list || statisticsInfo.list.length === 0 ? (
            // 无数据状态 - 使用Ant Design图标
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm">
              <QuestionCircleOutlined
                style={{ fontSize: '32px', color: '#CCCCCC' }}
              />
              <div className="text-sm text-gray-500 mt-2">暂无数据</div>
            </div>
          ) : (
            // 有数据状态
            <div className="space-y-4">
              {statisticsInfo?.list?.map((account) => {
                const accountData = dashboardData.find(
                  (item: any) => item.id == account.id,
                );
                return (
                  <Card
                    key={account.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center">
                      {/* 账户信息 */}
                      <div className="flex items-center flex-shrink-0 w-64 space-x-3">
                        <Avatar size={48} src={account.avatar} />
                        <div>
                          <div className="font-medium">{account.nickname}</div>

                          <div className="text-sm text-gray-500">
                            ID: {account.uid}{' '}
                          </div>
                        </div>
                      </div>

                      {/* 数据展示 */}
                      <div className="grid flex-1 grid-cols-7 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">粉丝数</div>
                          <div className="font-medium text-[#a66ae4]">
                            {(accountData?.fans || 0) > 0 ? '+ ' : '- '}
                            {Math.abs(accountData?.fans || 0)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">阅读数</div>
                          <div className="font-medium text-[#a66ae4]">
                            {accountData?.read || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">评论数</div>
                          <div className="font-medium text-[#a66ae4]">
                            {accountData?.comment || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">点赞数</div>
                          <div className="font-medium text-[#a66ae4]">
                            {accountData?.like || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">分享数</div>
                          <div className="font-medium text-[#a66ae4]">
                            {accountData?.collect || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">主页访问</div>
                          <div className="font-medium text-[#a66ae4]">
                            {accountData?.forward || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div
                            className="text-sm text-gray-500"
                            style={{
                              marginTop: '10px',
                              color: '#a66ae4',
                              cursor: 'pointer',
                            }}
                            onClick={() => examineVideo(account)}
                          >
                            查看详情
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* <div>
          <h2> {JSON.stringify(selectedDateRange[0])} </h2>
          <p> {JSON.stringify(dashboardData7)} </p>
        </div> */}
      </div>
    </div>
  );
};

export default Statistics;
