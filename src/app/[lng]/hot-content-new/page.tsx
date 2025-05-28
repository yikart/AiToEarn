'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Modal } from 'antd';
import dayjs from 'dayjs';
import { PlatformRanking, RankingContent, Platform } from '@/api/hot';
import { platformApi } from '@/api/hot';
import SideMenu from '@/components/hot-content/SideMenu';
import HotContent from '@/components/hot-content/HotContent';
import './page.css';

const { Content } = Layout;

const HotContentNew: React.FC = () => {
  // 状态管理
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [rankingList, setRankingList] = useState<PlatformRanking[]>([]);
  const [selectedRanking, setSelectedRanking] = useState<PlatformRanking | null>(null);
  const [rankingContents, setRankingContents] = useState<RankingContent[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 0,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [rankingMinDate, setRankingMinDate] = useState('');
  const [rankingMaxDate, setRankingMaxDate] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // 获取平台列表
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const response = await platformApi.getPlatformList();
        if (response && response.data) {
          setPlatforms(response.data);
          if (response.data.length > 0) {
            setSelectedPlatform(response.data[0]);
          }
        }
      } catch (error) {
        console.error('获取平台列表失败:', error);
      }
    };

    fetchPlatforms();
  }, []);

  // 获取平台榜单数据
  useEffect(() => {
    const fetchPlatformRankings = async () => {
      if (!selectedPlatform) return;

      try {
        const response = await platformApi.getPlatformRanking(selectedPlatform.id);
        if (response && response.data) {
          setRankingList(response.data);
          if (response.data.length > 0) {
            setSelectedRanking(response.data[0]);
          }
        }
      } catch (error) {
        console.error('获取平台榜单失败:', error);
      }
    };

    fetchPlatformRankings();
  }, [selectedPlatform]);

  // 获取榜单内容数据
  useEffect(() => {
    const fetchRankingContents = async () => {
      if (!selectedRanking) return;

      setRankingLoading(true);
      try {
        const response = await platformApi.getRankingContents(
          selectedRanking.id,
          pagination.currentPage,
          pagination.itemsPerPage,
          selectedCategory === '全部' ? undefined : selectedCategory,
          selectedDate
        );

        if (response && response.data) {
          setRankingContents(response.data.items);
          setPagination({
            ...pagination,
            totalItems: response.data.meta.totalItems,
            totalPages: response.data.meta.totalPages,
          });

          // 获取日期范围
          const datesResponse:any = await platformApi.getRankingDates(selectedRanking.id);
          console.log('获取榜单日历列表——datesResponse:',datesResponse)
          if (datesResponse && datesResponse.data && datesResponse.data.length > 0) {
            setSelectedDate(datesResponse.data[0].queryDate);
            setRankingMaxDate(datesResponse.data[0].queryDate);
            setRankingMinDate(datesResponse.data[datesResponse.data.length - 1].queryDate);
          }

          // 获取分类列表
          const categoriesResponse = await platformApi.getRankingLabel(selectedRanking.id);
          if (categoriesResponse && categoriesResponse.data) {
            setCategories(['全部', ...categoriesResponse.data]);
          }
        }
      } catch (error) {
        console.error('获取榜单内容失败:', error);
      } finally {
        setRankingLoading(false);
      }
    };

    fetchRankingContents();
  }, [selectedRanking, selectedDate, pagination.currentPage, selectedCategory]);

  // 处理平台选择
  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    setPagination({ ...pagination, currentPage: 1 });
  };

  // 处理榜单选择
  const handleRankingSelect = (ranking: PlatformRanking) => {
    setSelectedRanking(ranking);
    setPagination({ ...pagination, currentPage: 1 });
  };

  // 处理分类选择
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setPagination({ ...pagination, currentPage: 1 });
  };

  // 处理日期变化
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date.format('YYYY-MM-DD'));
      setPagination({ ...pagination, currentPage: 1 });
    }
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  // 处理内容点击
  const handleContentClick = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setPreviewVisible(true);
  };

  // 处理展开/收起
  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // 获取图片URL
  const getImageUrl = (path: string) => {
    return path.startsWith('http') ? path : `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    return num >= 10000 ? `${(num / 10000).toFixed(1)}w` : num.toString();
  };

  return (
    <Layout className="hot-content-layout" style={{ flexDirection: 'row' }}>
      <SideMenu
        platforms={platforms}
        selectedPlatform={selectedPlatform}
        loading={rankingLoading}
        contentExpanded={isExpanded}
        topicExpanded={false}
        hotEventExpanded={false}
        viralTitleExpanded={false}
        talkExpanded={false}
        hotPlatformExpanded={false}
        viralTitleLoading={false}
        viralTitlePlatforms={[]}
        selectedViralPlatform={null}
        msgTypeList={[]}
        selectedMsgType=""
        onPlatformSelect={handlePlatformSelect}
        onContentExpand={handleExpandToggle}
        onTopicExpand={() => {}}
        onHotEventExpand={() => {}}
        onViralTitleExpand={() => {}}
        onTalkExpand={() => {}}
        onHotPlatformExpand={() => {}}
        onViralPlatformSelect={() => {}}
        onMsgTypeClick={() => {}}
        getImageUrl={getImageUrl}
      />
      <Content className="main-content">
        <HotContent
          rankingList={rankingList}
          selectedRanking={selectedRanking}
          rankingContents={rankingContents}
          rankingLoading={rankingLoading}
          pagination={pagination}
          categories={categories}
          selectedCategory={selectedCategory}
          isExpanded={isExpanded}
          selectedDate={selectedDate}
          rankingMinDate={rankingMinDate}
          rankingMaxDate={rankingMaxDate}
          onRankingSelect={handleRankingSelect}
          onCategorySelect={handleCategorySelect}
          onDateChange={handleDateChange}
          onPageChange={handlePageChange}
          onContentClick={handleContentClick}
          onExpandToggle={handleExpandToggle}
          getImageUrl={getImageUrl}
          formatNumber={formatNumber}
        />
      </Content>

      {/* 预览弹窗 */}
      <Modal
        title={previewTitle}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        className="preview-modal"
      >
        <iframe
          src={previewUrl}
          style={{ width: '100%', height: '600px', border: 'none' }}
          title="内容预览"
        />
      </Modal>
    </Layout>
  );
};

export default HotContentNew; 