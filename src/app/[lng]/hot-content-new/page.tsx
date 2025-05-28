'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Modal } from 'antd';
import dayjs from 'dayjs';
import { PlatformRanking, RankingContent, Platform } from '@/api/hot';
import { platformApi } from '@/api/hot';
import SideMenu from '@/components/hot-content/SideMenu';
import HotContent from '@/components/hot-content/HotContent';
import './page.css';
import { HotTopic } from '@/api/types/hotTopic';

// 添加必要的类型定义
interface ResponseType<T> {
  data: T;
  code: number;
  message: string;
}

interface TopicContent {
  id: string;
  title: string;
  type: string;
  description: string | null;
  msgType: string;
  category: string;
  subCategory: string | null;
  author: string;
  avatar: string;
  cover: string;
  authorId: string;
  fans: number;
  topics: string[];
  rank: number;
  shareCount: number;
  likeCount: number;
  watchingCount: number | null;
  readCount: number;
  publishTime: string;
  url: string;
  platformId: {
    id: string;
    name: string;
    icon: string;
  };
  hotValue?: number;
  commentCount: number;
  collectCount: number;
}

interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  itemCount: number;
}

interface ApiViralTitle {
  id: string;
  title: string;
  category: string;
  platform: string;
  timeType: string;
  engagement: number;
  url: string;
}

interface PlatformHotTopics {
  platform: {
    id: string;
    name: string;
    icon: string;
    type: string;
  };
  topics: {
    id: string;
    title: string;
    hotValue: number;
    url: string;
    rank: number;
    rankChange: number;
    isRising: boolean;
    hotValueHistory: {
      hotValue: number;
      timestamp: string;
    }[];
  }[];
}

interface HotValueHistoryItem {
  hotValue: number | string;
  sentence?: string;
  updateTime: string;
}

interface HotTopicItem {
  _id: string;
  originalId: string;
  title: string;
  hotValue: string;
  url: string;
  rank: number;
  rankChange: number;
  hotValueHistory: HotValueHistoryItem[];
  plat_name: string;
  platformId: string;
  createdAt: string;
  updatedAt: string;
  fetchTime: string;
}

interface ApiResponse {
  platform: Platform;
  hotTopic: HotTopic;
}

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
  const [expandedStates, setExpandedStates] = useState({
    topic: false,
    hotEvent: false,
    viralTitle: false,
    talk: false,
    hotPlatform: false
  });
  const [contentExpanded, setContentExpanded] = useState(true);
  const [categoryListExpanded, setCategoryListExpanded] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [rankingMinDate, setRankingMinDate] = useState('');
  const [rankingMaxDate, setRankingMaxDate] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [msgTypeList, setMsgTypeList] = useState<string[]>([]);
  const [selectedMsgType, setSelectedMsgType] = useState<string>('');
  const [topicTypes, setTopicTypes] = useState<string[]>([]);
  const [selectedTopicType, setSelectedTopicType] = useState<string>('');
  const [timeTypes, setTimeTypes] = useState<string[]>([]);
  const [selectedTimeType, setSelectedTimeType] = useState<string>('');
  const [topicContents, setTopicContents] = useState<TopicContent[]>([]);
  const [topicLoading, setTopicLoading] = useState(false);
  const [topicPagination, setTopicPagination] = useState<PaginationMeta>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1,
    itemCount: 0
  });
  const [viralTitlePlatforms, setViralTitlePlatforms] = useState<Platform[]>([]);
  const [selectedViralPlatform, setSelectedViralPlatform] = useState<Platform | null>(null);
  const [viralTitleCategories, setViralTitleCategories] = useState<string[]>([]);
  const [selectedViralCategory, setSelectedViralCategory] = useState<string>('');
  const [viralTitleData, setViralTitleData] = useState<ApiViralTitle[]>([]);
  const [viralTitleLoading, setViralTitleLoading] = useState(false);
  const [viralTitlePagination, setViralTitlePagination] = useState<PaginationMeta>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1,
    itemCount: 0
  });
  const [hotTopics, setHotTopics] = useState<PlatformHotTopics[]>([]);
  const [hotTopicLoading, setHotTopicLoading] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

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

  // 获取专题分类和时间类型
  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        const topicData = await platformApi.getMsgType();
        if (topicData?.data) {
          setMsgTypeList(topicData.data);
          if (topicData.data.length > 0) {
            setSelectedMsgType(topicData.data[0]);
            fetchTopicTimeTypes(topicData.data[0]);
          }
        }
      } catch (error) {
        console.error('获取专题分类失败:', error);
      }
    };

    fetchTopicData();
  }, []);

  // 获取专题时间类型
  const fetchTopicTimeTypes = async (msgType: string) => {
    try {
      const timeTypeData = await platformApi.getTopicTimeTypes(msgType);
      if (timeTypeData?.data) {
        setTimeTypes(timeTypeData.data);
        if (timeTypeData.data.length > 0) {
          setSelectedTimeType(timeTypeData.data[0]);
        }
      }
    } catch (error) {
      console.error('获取专题时间类型失败:', error);
      setTimeTypes([]);
    }
  };

  // 获取专题类型
  const fetchTopicTypes = async () => {
    try {
      const response = await platformApi.getTopics();
      if (response?.data && Array.isArray(response.data)) {
        setTopicTypes(response.data);
        if (response.data.length > 0) {
          setSelectedTopicType(response.data[0]);
        }
      }
    } catch (error) {
      console.error('获取专题类型失败:', error);
    }
  };

  // 获取时间类型
  const fetchTimeTypes = async () => {
    try {
      const response = await platformApi.getViralTitleTimeTypes();
      if (response?.data && Array.isArray(response.data)) {
        setTimeTypes(response.data);
        if (response.data.length > 0) {
          setSelectedTimeType(response.data[0]);
        }
      }
    } catch (error) {
      console.error('获取时间类型失败:', error);
    }
  };

  // 获取专题内容
  const fetchTopicContents = async (page: number = 1) => {
    if (!selectedTopicType) return;
    
    setTopicLoading(true);
    try {
      const response = await platformApi.getAllTopics({
        page,
        pageSize: 10,
        type: selectedTopicType
      });
      
      if (response?.data) {
        const { items, meta } = response.data;
        if (Array.isArray(items)) {
          const formattedItems = items.map(item => ({
            id: item._id || '',
            title: item.title,
            type: selectedTopicType,
            description: item.description || null,
            msgType: selectedMsgType,
            category: item.category,
            subCategory: item.subCategory || null,
            author: item.author || '',
            avatar: '',
            cover: item.coverUrl || '',
            authorId: '',
            fans: 0,
            topics: item.topics || [],
            rank: item.rank,
            shareCount: item.shareCount,
            likeCount: item.likeCount,
            watchingCount: item.watchingCount,
            readCount: item.readCount,
            publishTime: item.publishTime?.toISOString() || '',
            url: item.url,
            platformId: {
              id: '',
              name: '',
              icon: ''
            },
            hotValue: 0,
            commentCount: 0,
            collectCount: 0
          }));
          setTopicContents(formattedItems);
        }
        if (meta) {
          setTopicPagination({
            currentPage: meta.currentPage || 1,
            itemsPerPage: meta.itemsPerPage || 10,
            totalItems: meta.totalItems || 0,
            totalPages: meta.totalPages || 1,
            itemCount: meta.itemCount || 0
          });
        }
      }
    } catch (error) {
      console.error('获取专题内容失败:', error);
    } finally {
      setTopicLoading(false);
    }
  };

  // 获取爆款标题平台
  const fetchViralTitlePlatforms = async () => {
    try {
      const [platformsResponse, timeTypeResponse] = await Promise.all([
        platformApi.findPlatformsWithData(),
        platformApi.getViralTitleTimeTypes()
      ]);
      
      const platforms = platformsResponse?.data || [];
      const timeTypeData = timeTypeResponse?.data || [];
      
      setViralTitlePlatforms(platforms);
      if (platforms.length > 0) {
        setSelectedViralPlatform(platforms[0]);
        fetchViralTitleCategories(platforms[0].id);
        if (timeTypeData.length > 0) {
          fetchViralTitleContents(platforms[0].id, timeTypeData[0]);
        }
      }
    } catch (error) {
      console.error('获取爆款标题平台失败:', error);
      setViralTitlePlatforms([]);
    }
  };

  // 获取爆款标题分类
  const fetchViralTitleCategories = async (platformId: string) => {
    try {
      const response = await platformApi.findCategoriesByPlatform(platformId);
      const categories = response?.data || [];
      setViralTitleCategories(categories);
      if (categories.length > 0) {
        setSelectedViralCategory('');
      }
    } catch (error) {
      console.error('获取爆款标题分类失败:', error);
      setViralTitleCategories([]);
    }
  };

  // 获取爆款标题内容
  const fetchViralTitleContents = async (platformId: string, timeType: string) => {
    setViralTitleLoading(true);
    try {
      const response = await platformApi.findTopByPlatformAndCategories(platformId, timeType);
      if (response?.data) {
        const titles = response.data.flatMap(item => item.titles.map(title => ({
          id: title._id || '',
          title: title.title,
          category: item.category,
          platform: platformId,
          timeType: timeType,
          engagement: title.engagement || 0,
          url: title.url || ''
        })));
        setViralTitleData(titles);
      } else {
        setViralTitleData([]);
      }
    } catch (error) {
      console.error('获取爆款标题内容失败:', error);
      setViralTitleData([]);
    } finally {
      setViralTitleLoading(false);
    }
  };

  // 获取八大平台热点
  const fetchHotTopics = async () => {
    setHotTopicLoading(true);
    try {
      const response:any = await platformApi.getAllHotTopics();
      if (response?.data && Array.isArray(response.data)) {
        setHotTopics(response?.data);
      } else {
        setHotTopics([]);
      }
    } catch (error) {
      console.error('获取热点事件失败:', error);
      setHotTopics([]);
    } finally {
      setHotTopicLoading(false);
    }
  };

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

  // 处理左侧菜单展开/收起
  const handleMenuExpandToggle = (section: keyof typeof expandedStates) => {
    setExpandedStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 处理右侧内容区域展开/收起
  const handleContentExpandToggle = () => {
    setContentExpanded(prev => !prev);
  };

  // 处理分类列表展开/收起
  const handleCategoryListExpandToggle = () => {
    setCategoryListExpanded(prev => !prev);
  };

  // 获取图片URL
  const getImageUrl = (path: string) => {
    return path.startsWith('http') ? path : `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  };

  // 格式化数字
  const formatNumber = (num: number | null) => {
    if (num === null) return '0';
    return num >= 10000 ? `${(num / 10000).toFixed(1)}w` : num.toString();
  };

  // 处理热门专题点击
  const handleTopicExpandClick = async () => {
    const newTopicExpanded = !expandedStates.topic;
    setExpandedStates(prev => ({
      ...prev,
      topic: newTopicExpanded,
      hotEvent: false,
      viralTitle: false,
      talk: false,
      hotPlatform: false
    }));
    setContentExpanded(false);

    if (newTopicExpanded && msgTypeList.length > 0) {
      if (!selectedMsgType && msgTypeList.length > 0) {
        setSelectedMsgType(msgTypeList[0]);
      }
      const msgType = selectedMsgType || msgTypeList[0];
      await fetchTopicTimeTypes(msgType);
    }
  };

  // 处理爆款标题点击
  const handleViralTitleExpandClick = async () => {
    const newViralTitleExpanded = !expandedStates.viralTitle;
    setExpandedStates(prev => ({
      ...prev,
      viralTitle: newViralTitleExpanded,
      topic: false,
      hotEvent: false,
      talk: false,
      hotPlatform: false
    }));
    setContentExpanded(false);

    if (newViralTitleExpanded) {
      await fetchViralTitlePlatforms();
    }
  };

  // 处理热点事件点击
  const handleHotEventExpandClick = async () => {
    const newHotEventExpanded = !expandedStates.hotEvent;
    setExpandedStates(prev => ({
      ...prev,
      hotEvent: newHotEventExpanded,
      topic: false,
      viralTitle: false,
      talk: false,
      hotPlatform: false
    }));
    setContentExpanded(false);

    if (newHotEventExpanded) {
      await fetchHotTopics();
    }
  };

  // 处理图片加载错误
  const handleImageError = (key: string) => {
    setImgErrors(prev => ({
      ...prev,
      [key]: true
    }));
  };

  // 处理爆款标题平台选择
  const handleViralPlatformSelect = (platform: Platform) => {
    setSelectedViralPlatform(platform);
    fetchViralTitleCategories(platform.id);
    platformApi.getViralTitleTimeTypes().then(response => {
      if (response?.data && response.data.length > 0) {
        fetchViralTitleContents(platform.id, response.data[0]);
      }
    });
  };

  return (
    <div className="hot-content-layout" style={{ display: 'flex', flexDirection: 'row' }}>
      <SideMenu
        platforms={platforms}
        selectedPlatform={selectedPlatform}
        loading={rankingLoading}
        contentExpanded={contentExpanded}
        topicExpanded={expandedStates.topic}
        hotEventExpanded={expandedStates.hotEvent}
        viralTitleExpanded={expandedStates.viralTitle}
        talkExpanded={expandedStates.talk}
        hotPlatformExpanded={expandedStates.hotPlatform}
        viralTitleLoading={viralTitleLoading}
        viralTitlePlatforms={viralTitlePlatforms}
        selectedViralPlatform={selectedViralPlatform}
        msgTypeList={msgTypeList}
        selectedMsgType={selectedMsgType}
        onPlatformSelect={handlePlatformSelect}
        onContentExpand={handleContentExpandToggle}
        onTopicExpand={handleTopicExpandClick}
        onHotEventExpand={handleHotEventExpandClick}
        onViralTitleExpand={handleViralTitleExpandClick}
        onTalkExpand={() => handleMenuExpandToggle('talk')}
        onHotPlatformExpand={() => handleMenuExpandToggle('hotPlatform')}
        onViralPlatformSelect={handleViralPlatformSelect}
        onMsgTypeClick={(type) => {
          setSelectedMsgType(type);
          fetchTopicTimeTypes(type);
        }}
        getImageUrl={getImageUrl}
      />
      <div className="main-content">
        {!expandedStates.hotEvent ? (
          <HotContent
            rankingList={rankingList}
            selectedRanking={selectedRanking}
            rankingContents={rankingContents}
            rankingLoading={rankingLoading}
            pagination={pagination}
            categories={categories}
            selectedCategory={selectedCategory}
            isExpanded={categoryListExpanded}
            selectedDate={selectedDate}
            rankingMinDate={rankingMinDate}
            rankingMaxDate={rankingMaxDate}
            onRankingSelect={handleRankingSelect}
            onCategorySelect={handleCategorySelect}
            onDateChange={handleDateChange}
            onPageChange={handlePageChange}
            onContentClick={handleContentClick}
            onExpandToggle={handleCategoryListExpandToggle}
            getImageUrl={getImageUrl}
            formatNumber={formatNumber}
          />
        ) : (
          <div className="hot-events-container">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {hotTopicLoading ? (
                <div className="loading-container col-span-full">
                  <span className="loading-text">加载中...</span>
                </div>
              ) : hotTopics && hotTopics.length > 0 ? (
                hotTopics.map((platformData) => (
                  <div
                    key={platformData.platform.id}
                    className="hot-topic-card h-full"
                  >
                    {/* 平台标题 */}
                    <div className="platform-header">
                      <div className="flex items-center space-x-2">
                        {platformData.platform.icon && !imgErrors[`platform-${platformData.platform.id}`] ? (
                          <img
                            src={getImageUrl(platformData.platform.icon)}
                            alt={platformData.platform.name}
                            className="platform-icon"
                            onError={() => handleImageError(`platform-${platformData.platform.id}`)}
                          />
                        ) : (
                          <div className="platform-icon bg-[#fff1f0] flex items-center justify-center">
                            <span className="text-[#ff4d4f]">
                              {platformData.platform.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <span className="platform-name">
                          {platformData.platform.name} · 热点
                        </span>
                      </div>
                    </div>

                    {/* 热点列表 */}
                    <div className="hot-topic-content">
                      <div className="space-y-2">
                        {platformData.topics && platformData.topics.length > 0 ? (
                          platformData.topics.map((topic, index) => (
                            <div
                              key={topic.id || index}
                              className="hot-topic-item"
                              onClick={() => topic.url && handleContentClick(topic.url, topic.title)}
                            >
                              {/* 排名 */}
                              <div className="hot-topic-rank">
                                <span className={index < 3 ? 'top-3' : ''}>
                                  {index + 1}
                                </span>
                              </div>

                              {/* 标题和热度 */}
                              <div className="hot-topic-details">
                                <div className="hot-topic-title">
                                  {topic.title}
                                </div>
                                <div className="hot-topic-metrics">
                                  {topic.isRising && (
                                    <span className="text-xs text-[#ff4d4f] bg-[#fff1f0] px-1 rounded">
                                      热
                                    </span>
                                  )}
                                  <span className="hot-topic-value">
                                    {(topic.hotValue / 10000).toFixed(1)}w
                                  </span>
                                  <div className="hot-value-trend">
                                    <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
                                      <polyline
                                        points={topic.hotValueHistory?.map((item, i) => {
                                          const x = (i / (topic.hotValueHistory.length - 1)) * 100 || 0;
                                          const maxHot = Math.max(...topic.hotValueHistory.map(h => h.hotValue));
                                          const minHot = Math.min(...topic.hotValueHistory.map(h => h.hotValue));
                                          const range = maxHot - minHot;
                                          const y = range === 0 ? 10 : 20 - ((item.hotValue - minHot) / range) * 20;
                                          return `${x},${y}`;
                                        }).join(' ')}
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-state">
                            <div className="empty-state-icon">📊</div>
                            <div className="empty-state-text">暂无热点数据</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state col-span-full">
                  <div className="empty-state-icon">📊</div>
                  <div className="empty-state-text">暂无热点事件数据</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default HotContentNew; 