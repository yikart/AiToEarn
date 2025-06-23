'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Modal, Pagination } from 'antd';
import dayjs from 'dayjs';
import { PlatformRanking, RankingContent, Platform } from '@/api/hot';
import { platformApi } from '@/api/hot';
import SideMenu from '@/components/hot-content/SideMenu';
import HotContent from '@/components/hot-content/HotContent';
import './page.css';
import { HotTopic } from '@/api/types/hotTopic';
import { useTransClient } from '@/app/i18n/client';

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

const buttonStyles = {
  base: 'px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
  primary: 'bg-[#a66ae4] text-white hover:bg-[#8f5bc4]',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
};

const HotContentNew: React.FC = () => {
  const { t } = useTransClient('hot-content');
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
  const [viralTitleData, setViralTitleData] = useState<Record<string, ApiViralTitle[]>>({});
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
  const fetchTopicTypes = async (msgType: string) => {
    console.log('fetchTopicTypes called with msgType:', msgType); // 添加日志
    try {
      const response = await platformApi.getTopicLabels(msgType);
      console.log('getTopicLabels response for', msgType, ':', response); // 添加日志
      if (response?.data) {
        setTopicTypes(response.data);
        console.log('获取到的分类数据:', response.data);
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
  const fetchTopicContents = async (
    msgType: string,
    page: number = 1,
    timeType: string = '',
    platformId?: string,
    topicType?: string,
  ) => {
    if (!msgType) return;

    setTopicLoading(true);
    try {
      // 构建查询参数
      const params: any = {
        msgType,
        page,
        limit: 20,
      };

      // 添加平台ID参数
      if (platformId) {
        params.platformId = platformId;
      }

      // 添加专题类型参数
      if (topicType) {
        params.type = topicType;
      }
      
      // 添加时间类型参数
      if (timeType) {
        params.timeType = timeType;
      }

      const response = await platformApi.getAllTopics(params);
      if (response?.data) {
        const formattedItems = response.data.items.map((item: any) => ({
          id: item._id || '',
          title: item.title || '',
          type: item.type || '',
          description: item.description || null,
          msgType: item.msgType || '',
          category: item.category || '',
          subCategory: item.subCategory || null,
          author: item.author || '',
          avatar: item.avatar || '',
          cover: item.coverUrl || '',
          authorId: item.authorId || '',
          fans: item.fans || 0,
          topics: item.topics || [],
          rank: item.rank || 0,
          shareCount: item.shareCount || 0,
          likeCount: item.likeCount || 0,
          watchingCount: item.watchingCount || null,
          readCount: item.readCount || 0,
          publishTime: item.publishTime || '',
          url: item.url || '',
          platformId: {
            id: item.platformId?.id || '',
            name: item.platformId?.name || '',
            icon: item.platformId?.icon || '',
          },
          hotValue: item.hotValue || 0,
          commentCount: item.commentCount || 0,
          collectCount: item.collectCount || 0,
        }));
        setTopicContents(formattedItems);
        
        // 转换分页数据
        const meta = response.data.meta;
        if (meta) {
          setTopicPagination({
            currentPage: meta.currentPage || 1,
            itemsPerPage: meta.itemsPerPage || 20,
            totalItems: meta.totalItems || 0,
            totalPages: meta.totalPages || 1,
            itemCount: meta.itemCount || 0,
          });
        }
      } else {
        setTopicContents([]);
        setTopicPagination({
          currentPage: 1,
          itemsPerPage: 20,
          totalItems: 0,
          totalPages: 1,
          itemCount: 0,
        });
      }
    } catch (error) {
      console.error('获取专题内容失败:', error);
      setTopicContents([]);
      setTopicPagination({
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 1,
        itemCount: 0,
      });
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
          setTimeTypes(timeTypeData);
          setSelectedTimeType(timeTypeData[0]);
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
      console.log('原始爆款标题数据:', response?.data); // 添加日志
      if (response?.data) {
        // response.data 已经是按分类分组的数据
        // 转换为方便处理的格式
        const categorizedTitles = response.data.reduce<Record<string, ApiViralTitle[]>>((acc, item) => {
          if (item.category) {
            acc[item.category] = item.titles.map(title => ({
              id: title._id || '',
              title: title.title,
              category: item.category,
              platform: platformId,
              timeType: timeType,
              engagement: title.engagement || 0,
              url: title.url || ''
            }));
          }
          return acc;
        }, {});

        setViralTitleData(categorizedTitles);

        // 提取所有分类用于筛选按钮
        const categories = Object.keys(categorizedTitles);
        setViralTitleCategories(categories);

      } else {
        setViralTitleData({});
        setViralTitleCategories([]);
      }
    } catch (error) {
      console.error('获取爆款标题内容失败:', error);
      setViralTitleData({});
      setViralTitleCategories([]);
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
    setExpandedStates(prev => {
      const newState = { ...prev };
      // 如果点击的是当前已经展开的项，则收起
      if (newState[section]) {
        newState[section] = false;
      } else {
        // 展开点击的项，同时收起其他所有项
        Object.keys(newState).forEach(key => {
          (newState as any)[key] = key === section;
        });
      }
      return newState;
    });
    // setContentExpanded(false); // 移除这行，让expandedStates控制主内容显示
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
    if (num === null || num === undefined) return '-';
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}w`;
    }
    return num.toLocaleString();
  };

  // 处理热门专题点击
  const handleTopicExpandClick = async () => {
    const newTopicExpanded = !expandedStates.topic;
    console.log('切换热门专题展开状态:', newTopicExpanded);

    // 更新展开状态
    setExpandedStates(prev => ({
      ...prev,
      topic: newTopicExpanded,
      hotEvent: false,
      viralTitle: false,
      talk: false,
      hotPlatform: false
    }));
    setContentExpanded(false);

    // 如果是展开热门专题，并且有消息类型，则加载数据
    if (newTopicExpanded && msgTypeList.length > 0) {
      console.log('准备加载热门专题数据');
      
      // 如果没有选择消息类型，则自动选择第一个
      if (!selectedMsgType && msgTypeList.length > 0) {
        setSelectedMsgType(msgTypeList[0]);
      }

      // 使用当前选择的消息类型或第一个消息类型
      const msgType = selectedMsgType || msgTypeList[0];

      // 获取时间类型
      await fetchTopicTimeTypes(msgType);

      // 获取分类数据
      try {
        const response = await platformApi.getTopicLabels(msgType);
        if (response?.data) {
          setTopicTypes(response.data);
          console.log('获取到的分类数据:', response.data);
        } else {
          setTopicTypes([]);
        }
      } catch (error) {
        console.error('获取专题分类失败:', error);
        setTopicTypes([]);
      }

      // 如果没有选择平台，则使用第一个平台
      if (!selectedPlatform?.id && platforms.length > 0) {
        setSelectedPlatform(platforms[0]);
      }

      // 调用处理函数获取数据
      setTopicLoading(true);
      try {
        // 获取专题数据 - 使用时间类型参数和当前选择的平台
        const response = await platformApi.getAllTopics({
          msgType: msgType,
          platformId: selectedPlatform?.id || (platforms.length > 0 ? platforms[0].id : undefined),
          timeType: selectedTimeType || selectedTimeType,
        });

        if (response?.data) {
          const { items, meta } = response.data;
          // 类型转换，确保类型兼容
          setTopicContents(items as unknown as TopicContent[]);
          if (meta) {
            setTopicPagination({
              currentPage: meta.currentPage || 1,
              totalPages: meta.totalPages || 1,
              totalItems: meta.totalItems || 0,
              itemCount: meta.itemCount || 0,
              itemsPerPage: meta.itemsPerPage || 20,
            });
          }
        } else {
          setTopicContents([]);
        }
      } catch (error) {
        console.error('获取专题数据失败:', error);
        setTopicContents([]);
      } finally {
        setTopicLoading(false);
      }
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
        setTimeTypes(response.data);
        setSelectedTimeType(response.data[0]);
        fetchViralTitleContents(platform.id, response.data[0]);
      }
    });
  };

  // 重置所有展开状态
  const handleResetExpandedStates = () => {
    setExpandedStates({
      topic: false,
      hotEvent: false,
      viralTitle: false,
      talk: false,
      hotPlatform: false,
    });
  };

  // 处理筛选变化
  const handleFilterChange = async (platformId?: string) => {
    if (!selectedMsgType) return;
    
    console.log('handleFilterChange called'); // 添加日志
    setTopicLoading(true);
    try {
      const currentPlatformId = platformId || selectedPlatform?.id;
      const params: any = {
        msgType: selectedMsgType,
        timeType: selectedTimeType,
        page: 1,
        limit: 20,
      };

      if (currentPlatformId) {
        params.platformId = currentPlatformId;
      }

      if (selectedTopicType) {
        params.type = selectedTopicType;
      }

      console.log('Fetching topics with params:', params); // 添加日志
      const response = await platformApi.getAllTopics(params);
      console.log('getAllTopics response:', response); // 添加日志

      if (response?.data) {
        const formattedItems = response.data.items.map((item: any) => ({
          id: item._id || '',
          title: item.title || '',
          type: item.type || '',
          description: item.description || null,
          msgType: item.msgType || '',
          category: item.category || '',
          subCategory: item.subCategory || null,
          author: item.author || '',
          avatar: item.avatar || '',
          cover: item.coverUrl || '',
          authorId: item.authorId || '',
          fans: item.fans || 0,
          topics: item.topics || [],
          rank: item.rank || 0,
          shareCount: item.shareCount || 0,
          likeCount: item.likeCount || 0,
          watchingCount: item.watchingCount || null,
          readCount: item.readCount || 0,
          publishTime: item.publishTime || '',
          url: item.url || '',
          platformId: {
            id: item.platformId?.id || '',
            name: item.platformId?.name || '',
            icon: item.platformId?.icon || '',
          },
          hotValue: item.hotValue || 0,
          commentCount: item.commentCount || 0,
          collectCount: item.collectCount || 0,
        }));
        setTopicContents(formattedItems);
        
        // 转换分页数据
        const meta = response.data.meta;
        if (meta) {
          setTopicPagination({
            currentPage: meta.currentPage || 1,
            itemsPerPage: meta.itemsPerPage || 20,
            totalItems: meta.totalItems || 0,
            totalPages: meta.totalPages || 1,
            itemCount: meta.itemCount || 0,
          });
        }
      } else {
        setTopicContents([]);
        setTopicPagination({
          currentPage: 1,
          itemsPerPage: 20,
          totalItems: 0,
          totalPages: 1,
          itemCount: 0,
        });
      }
    } catch (error) {
      console.error('筛选专题数据失败:', error);
      setTopicContents([]);
      setTopicPagination({
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 1,
        itemCount: 0,
      });
    } finally {
      setTopicLoading(false);
    }
  };

  // 处理时间范围变化
  const handleTimeRangeChange = async (timeRange: string) => {
    if (!selectedMsgType) return;
    
    console.log('handleTimeRangeChange called with timeRange:', timeRange); // 添加日志
    setSelectedTimeType(timeRange);
    setTopicLoading(true);
    try {
      const params: any = {
        msgType: selectedMsgType,
        timeType: timeRange,
        page: 1,
        limit: 20,
      };

      if (selectedPlatform?.id) {
        params.platformId = selectedPlatform.id;
      }

      if (selectedTopicType) {
        params.type = selectedTopicType;
      }

      console.log('Fetching topics with params:', params); // 添加日志
      const response = await platformApi.getAllTopics(params);
      console.log('getAllTopics response:', response); // 添加日志

      if (response?.data) {
        const formattedItems = response.data.items.map((item: any) => ({
          id: item._id || '',
          title: item.title || '',
          type: item.type || '',
          description: item.description || null,
          msgType: item.msgType || '',
          category: item.category || '',
          subCategory: item.subCategory || null,
          author: item.author || '',
          avatar: item.avatar || '',
          cover: item.coverUrl || '',
          authorId: item.authorId || '',
          fans: item.fans || 0,
          topics: item.topics || [],
          rank: item.rank || 0,
          shareCount: item.shareCount || 0,
          likeCount: item.likeCount || 0,
          watchingCount: item.watchingCount || null,
          readCount: item.readCount || 0,
          publishTime: item.publishTime || '',
          url: item.url || '',
          platformId: {
            id: item.platformId?.id || '',
            name: item.platformId?.name || '',
            icon: item.platformId?.icon || '',
          },
          hotValue: item.hotValue || 0,
          commentCount: item.commentCount || 0,
          collectCount: item.collectCount || 0,
        }));
        setTopicContents(formattedItems);
        
        // 转换分页数据
        const meta = response.data.meta;
        if (meta) {
          setTopicPagination({
            currentPage: meta.currentPage || 1,
            itemsPerPage: meta.itemsPerPage || 20,
            totalItems: meta.totalItems || 0,
            totalPages: meta.totalPages || 1,
            itemCount: meta.itemCount || 0,
          });
        }
      } else {
        setTopicContents([]);
        setTopicPagination({
          currentPage: 1,
          itemsPerPage: 20,
          totalItems: 0,
          totalPages: 1,
          itemCount: 0,
        });
      }
    } catch (error) {
      console.error('筛选专题数据失败:', error);
      setTopicContents([]);
      setTopicPagination({
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 1,
        itemCount: 0,
      });
    } finally {
      setTopicLoading(false);
    }
  };

  // 处理专题分页变化
  const handleTopicPageChange = async (page: number) => {
    if (!selectedMsgType || page === topicPagination?.currentPage) return;
    
    setTopicLoading(true);
    try {
      const params: any = {
        msgType: selectedMsgType,
        timeType: selectedTimeType,
        page,
        limit: 20,
      };

      if (selectedPlatform?.id) {
        params.platformId = selectedPlatform.id;
      }

      if (selectedTopicType) {
        params.type = selectedTopicType;
      }

      const response = await platformApi.getAllTopics(params);
      if (response?.data) {
        const formattedItems = response.data.items.map((item: any) => ({
          id: item._id || '',
          title: item.title || '',
          type: item.type || '',
          description: item.description || null,
          msgType: item.msgType || '',
          category: item.category || '',
          subCategory: item.subCategory || null,
          author: item.author || '',
          avatar: item.avatar || '',
          cover: item.coverUrl || '',
          authorId: item.authorId || '',
          fans: item.fans || 0,
          topics: item.topics || [],
          rank: item.rank || 0,
          shareCount: item.shareCount || 0,
          likeCount: item.likeCount || 0,
          watchingCount: item.watchingCount || null,
          readCount: item.readCount || 0,
          publishTime: item.publishTime || '',
          url: item.url || '',
          platformId: {
            id: item.platformId?.id || '',
            name: item.platformId?.name || '',
            icon: item.platformId?.icon || '',
          },
          hotValue: item.hotValue || 0,
          commentCount: item.commentCount || 0,
          collectCount: item.collectCount || 0,
        }));
        setTopicContents(formattedItems);
        
        // 转换分页数据
        const meta = response.data.meta;
        if (meta) {
          setTopicPagination({
            currentPage: meta.currentPage || 1,
            itemsPerPage: meta.itemsPerPage || 20,
            totalItems: meta.totalItems || 0,
            totalPages: meta.totalPages || 1,
            itemCount: meta.itemCount || 0,
          });
        }
        
        // 滚动到顶部
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    } catch (error) {
      console.error('获取专题数据失败:', error);
      setTopicContents([]);
      setTopicPagination({
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 1,
        itemCount: 0,
      });
    } finally {
      setTopicLoading(false);
    }
  };

  // 处理爆款标题分类选择
  const handleViralTitleCategorySelect = async (category: string) => {
    if (!selectedViralPlatform) return;

    setViralTitleLoading(true);
    try {
      // 调用获取某个平台某个分类全部标题的API
      const response = await platformApi.findByPlatformAndCategory(
        selectedViralPlatform.id,
        { category: category }
      );

      if (response?.data && Array.isArray(response.data.items)) {
        // 更新状态，显示该分类的全部数据
        setViralTitleData(prevData => ({
          ...prevData,
          [category]: response.data.items.map((title: any) => ({
            id: title._id || '',
            title: title.title,
            category: title.category,
            platform: selectedViralPlatform.id,
            timeType: selectedTimeType,
            engagement: title.engagement || 0,
            url: title.url || ''
          }))
        }));
      } else {
        // 如果没有数据，清空该分类的数据
        setViralTitleData(prevData => ({
          ...prevData,
          [category]: []
        }));
      }
      // 设置当前选中的分类
      setSelectedViralCategory(category);
    } catch (error) {
      console.error(`获取分类 ${category} 爆款标题详情失败:`, error);
      // 出错时也清空该分类的数据
      setViralTitleData(prevData => ({
        ...prevData,
        [category]: []
      }));
      setSelectedViralCategory(category);
    } finally {
      setViralTitleLoading(false);
    }
  };

  // 处理查看更多点击
  const handleViewMoreClick = async (category: string) => {
    if (!selectedViralPlatform) return;

    setViralTitleLoading(true);
    try {
      // 调用获取某个平台某个分类全部标题的API
      const response = await platformApi.findByPlatformAndCategory(
        selectedViralPlatform.id,
        { category: category }
      );

      if (response?.data && Array.isArray(response.data.items)) {
        // 更新状态，显示该分类的全部数据
        // 将获取到的该分类的全部数据覆盖viralTitleData中该分类的数据
        setViralTitleData(prevData => ({
          ...prevData,
          [category]: response.data.items.map((title: any) => ({
            id: title._id || '',
            title: title.title,
            category: title.category,
            platform: selectedViralPlatform.id,
            timeType: selectedTimeType,
            engagement: title.engagement || 0,
            url: title.url || ''
          }))
        }));
        // 设置当前选中的分类，触发详情视图的渲染
        setSelectedViralCategory(category);
      } else {
        // 如果没有数据，清空该分类的数据并切换到该分类视图
        setViralTitleData(prevData => ({
          ...prevData,
          [category]: []
        }));
        setSelectedViralCategory(category);
      }
    } catch (error) {
      console.error(`获取分类 ${category} 爆款标题详情失败:`, error);
      // 出错时也尝试切换到该分类视图，但数据可能为空或旧数据
      setViralTitleData(prevData => ({
          ...prevData,
          [category]: []
        }));
      setSelectedViralCategory(category);
    } finally {
      setViralTitleLoading(false);
    }
  };

  // 添加消息类型点击处理函数
  const handleMsgTypeClick = async (type: string) => {
    setSelectedMsgType(type);
    setTopicLoading(true);
    setContentExpanded(false);
    setSelectedTopicType('');

    try {
      // 获取该分类的时间类型
      await fetchTopicTimeTypes(type);

      // 获取专题数据 - 传递当前的筛选条件
      await fetchTopicContents(
        type, // msgType
        1, // page
        selectedTimeType, // timeType
        selectedPlatform?.id, // platformId
        '' // topicType，因为切换msgType时清空了专题类型
      );

    } catch (error) {
      console.error('获取专题数据失败:', error);
      setTopicContents([]);
    } finally {
      setTopicLoading(false);
    }
  };

  // 分页组件类型定义
  interface PaginationProps {
    current: number;
    total: number;
    pageSize: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: (total: number) => string;
    onChange?: (page: number) => void;
  }

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
        onMsgTypeClick={handleMsgTypeClick}
        onHotContentClick={handleResetExpandedStates}
        onViralTitleCategorySelect={handleViralTitleCategorySelect}
        // getImageUrl={getImageUrl}
      />
      <div className="main-content">
        {!expandedStates.topic && !expandedStates.hotEvent && !expandedStates.viralTitle && !expandedStates.talk && !expandedStates.hotPlatform ? (
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
        ) : expandedStates.viralTitle ? (
          <div className="viral-title-container">
            {/* 顶部筛选区 */}
            <div className="viral-title-filter">
              {/* 分类筛选 */}
              <div className="filter-section">
                <span className="filter-label">{t('category')}:</span>
                <div className="filter-buttons">
                  <button
                    className={`filter-button ${selectedViralCategory === '' ? 'active' : ''}`}
                    onClick={() => {
                      if (selectedViralPlatform) {
                        fetchViralTitleContents(selectedViralPlatform.id, selectedTimeType);
                        setSelectedViralCategory('');
                      }
                    }}
                  >
                    {t('all')}
                  </button>
                  {viralTitleCategories.map((category) => (
                    <button
                      key={category}
                      className={`filter-button ${selectedViralCategory === category ? 'active' : ''}`}
                      onClick={() => handleViralTitleCategorySelect(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 时间筛选 */}
              <div className="filter-section">
                <span className="filter-label">{t('timeRange')}:</span>
                <div className="filter-buttons">
                  {timeTypes.map((timeRange) => (
                    <button
                      key={timeRange}
                      className={`filter-button ${selectedTimeType === timeRange ? 'active' : ''}`}
                      onClick={() => handleTimeRangeChange(timeRange)}
                    >
                      {timeRange}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 爆款标题内容 */}
            <div className="viral-title-content">
              {viralTitleLoading ? (
                <div className="loading-state">
                  <span>{t('loading')}</span>
                </div>
              ) : Object.keys(viralTitleData).length > 0 ? (
                selectedViralCategory === '' ? (
                  Object.keys(viralTitleData).map(category => (
                    <div key={category} className="category-section">
                      <h3 className="category-title">{category}</h3>
                      <div className="viral-title-list">
                        {viralTitleData[category].slice(0,5).map((title, index) => (
                          <div
                            key={title.id || index}
                            className="viral-title-list-item"
                            onClick={() => title.url && handleContentClick(title.url, title.title)}
                          >
                            <span className={`list-item-rank ${index < 3 ? 'top' : ''}`}>
                              {index + 1}
                            </span>
                            <div className="list-item-details">
                              <div className="list-item-title">{title.title}</div>
                              <span className="list-item-engagement">
                                {t('engagement')}: {formatNumber(title.engagement)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="view-more-button">
                        <button
                          className="view-more-btn"
                          onClick={() => handleViewMoreClick(category)}
                        >
                          {t('viewMore')}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="category-section">
                    <h3 className="category-title">{selectedViralCategory}</h3>
                    <div className="viral-title-list">
                      {viralTitleData[selectedViralCategory]?.map((title, index) => (
                        <div
                          key={title.id || index}
                          className="viral-title-list-item"
                          onClick={() => title.url && handleContentClick(title.url, title.title)}
                        >
                          <span className={`list-item-rank ${index < 3 ? 'top' : ''}`}>
                            {index + 1}
                          </span>
                          <div className="list-item-details">
                            <span className="list-item-category">{title.category}</span>
                            <div className="list-item-title">{title.title}</div>
                            <span className="list-item-engagement">
                              {t('engagement')}: {formatNumber(title.engagement)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <div>{t('noViralTitles')}</div>
                </div>
              )}
            </div>
          </div>
        ) : expandedStates.topic ? (
          <div className="topic-container">
            {/* 顶部筛选区 */}
            <div className="topic-filter-container">
              {/* 平台筛选 */}
              <div className="topic-filter-options">
                <div className="topic-filter-group">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      className={`topic-filter-button ${
                        selectedPlatform?.id === platform.id ? 'active' : ''
                      }`}
                      onClick={() => {
                        const platformId = platform.id;
                        setSelectedPlatform(platform);
                        handleFilterChange(platformId);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        {platform.icon && !imgErrors[`platform-${platform.id}`] ? (
                          <img
                            src={getImageUrl(platform.icon)}
                            alt={platform.name}
                            className="w-4 h-4"
                            onError={() => handleImageError(`platform-${platform.id}`)}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-4 h-4 bg-gray-200 rounded">
                            <span className="text-xs text-gray-500">
                              {platform.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <span>{platform.name}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* 时间筛选 */}
                <div className="topic-filter-section">
                  <span className="topic-filter-label">{t('timeRange')}:</span>
                  <div className="topic-filter-buttons">
                    {timeTypes.map((timeRange) => (
                      <button
                        key={timeRange}
                        className={`topic-filter-button ${selectedTimeType === timeRange ? 'active' : ''}`}
                        onClick={() => handleTimeRangeChange(timeRange)}
                      >
                        {timeRange}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 分类筛选 */}
                {selectedMsgType === 'aigc' && topicTypes.length > 1 && (
                  <div className="topic-filter-section">
                    <span className="topic-filter-label">{t('category')}:</span>
                    <div className="topic-filter-buttons">
                      {topicTypes.map((type) => (
                        <button
                          key={type}
                          className={`topic-filter-button ${selectedTopicType === type ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedTopicType(type === selectedTopicType ? '' : type);
                            handleFilterChange();
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 专题内容列表 */}
            <div className="topic-list-container">
              {topicLoading ? (
                <div className="topic-loading-state">
                  <span className="topic-loading-text">{t('loading')}</span>
                </div>
              ) : topicContents.length > 0 ? (
                <>
                  {/* 表头 */}
                  <div className="topic-list-header">
                    <div className="topic-header-col topic-header-col.rank-col">{t('rank')}</div>
                    <div className="topic-header-col topic-header-col.cover-col">{t('cover')}</div>
                    <div className="topic-header-col topic-header-col.info-col">{t('title')}/{t('author')}</div>
                    <div className="topic-header-col topic-header-col.category-col">{t('category')}</div>
                    <div className="topic-header-col topic-header-col.stats-col">{t('likes')}</div>
                    <div className="topic-header-col topic-header-col.stats-col">{t('shares')}</div>
                    <div className="topic-header-col topic-header-col.stats-col">{t('comments')}</div>
                    <div className="topic-header-col topic-header-col.stats-col">{t('collections')}</div>
                  </div>

                  {/* 内容列表 */}
                  {topicContents.map((item, index) => (
                    <div
                      key={item.id}
                      className="topic-list-item"
                      onClick={() => handleContentClick(item.url, item.title)}
                    >
                      {/* 排名 */}
                      <div className="topic-item-col topic-item-col.rank-col">
                        {((topicPagination?.currentPage || 1) - 1) *
                          (topicPagination?.itemsPerPage || 20) +
                          index +
                          1}
                      </div>

                      {/* 封面 */}
                      <div className="topic-item-col topic-item-col.cover-col">
                        <div className="topic-item-cover-wrapper">
                          {item.cover && !imgErrors[item.id as string] ? (
                            <img
                              src={getImageUrl(item.cover)}
                              alt={item.title}
                              className="topic-item-cover-image"
                              onError={() =>
                                handleImageError(item.id as string)
                              }
                            />
                          ) : (
                            <div className="topic-item-cover-placeholder">
                              {t('noImage')}
                            </div>
                          )}
                          {item.type === 'video' && (
                            <div className="topic-item-cover-video-tag">
                              {t('video')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 标题和作者信息 */}
                      <div className="topic-item-col topic-item-col.info-col">
                        <h3 className="topic-item-title">
                          {item.title}
                        </h3>
                        <div className="topic-item-author-info">
                          <div className="topic-author-details">
                            {item.avatar &&
                            !imgErrors[`avatar-${item.id}`] ? (
                              <img
                                src={getImageUrl(item.avatar)}
                                alt={item.author}
                                className="topic-author-avatar"
                                onError={() =>
                                  handleImageError(`avatar-${item.id}`)
                                }
                              />
                            ) : (
                              <div className="topic-author-avatar-placeholder">
                                <span className="text-xs text-gray-500">
                                  {item.author?.charAt(0)?.toUpperCase() ||
                                    '?'}
                                </span>
                              </div>
                            )}
                            <span className="topic-author-name">
                              {item.author}
                            </span>
                            {item.fans > 0 && (
                              <span className="topic-author-fans">
                                {item.fans >= 10000
                                  ? `${(item.fans / 10000).toFixed(1)}万${t('fans')}`
                                  : `${item.fans}${t('fans')}`}
                              </span>
                            )}
                            <span className="topic-publish-time">
                              {t('publishTime')}{' '}
                              {dayjs(item.publishTime).format(
                                'YYYY-MM-DD HH:mm',
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 分类信息 */}
                      <div className="topic-item-col topic-item-col.category-col">
                        <div className="topic-item-category">{item.category}</div>
                        {item.subCategory && (
                          <div className="topic-item-subcategory">
                            {item.subCategory}
                          </div>
                        )}
                      </div>

                      {/* 点赞数 */}
                      <div className="topic-item-col topic-item-col.stats-col">
                        <div className="topic-stat-value">
                          {item.likeCount >= 10000
                            ? `${(item.likeCount / 10000).toFixed(1)}w`
                            : item.likeCount}
                        </div>
                        <div className="topic-stat-label">{t('likes')}</div>
                      </div>

                      {/* 分享数 */}
                      <div className="topic-item-col topic-item-col.stats-col">
                        <div className="topic-stat-value">
                          {item.shareCount >= 10000
                            ? `${(item.shareCount / 10000).toFixed(1)}w`
                            : item.shareCount}
                        </div>
                        <div className="topic-stat-label">{t('shares')}</div>
                      </div>

                      {/* 评论数 */}
                      <div className="topic-item-col topic-item-col.stats-col">
                        <div className="topic-stat-value">
                          {item.commentCount
                            ? item.commentCount >= 10000
                              ? `${(item.commentCount / 10000).toFixed(1)}w`
                              : item.commentCount
                            : '-'}
                        </div>
                        <div className="topic-stat-label">{t('comments')}</div>
                      </div>

                      {/* 收藏数 */}
                      <div className="topic-item-col topic-item-col.stats-col">
                        <div className="topic-stat-value">
                          {item.collectCount
                            ? item.collectCount >= 10000
                              ? `${(item.collectCount / 10000).toFixed(1)}w`
                              : item.collectCount
                            : '-'}
                        </div>
                        <div className="topic-stat-label">{t('collections')}</div>
                      </div>
                    </div>
                  ))}

                  {/* 分页组件 */}
                  {topicPagination && topicPagination.totalPages > 1 && (
                    <div className="topic-pagination-container">
                      <Pagination
                        current={topicPagination.currentPage}
                        total={topicPagination.totalItems}
                        pageSize={topicPagination.itemsPerPage}
                        showSizeChanger={false}
                        showQuickJumper
                        showTotal={(total) => `${t('total')} ${total} ${t('items')}`}
                        onChange={handleTopicPageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="topic-empty-state">
                  {t('noTopicData')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hot-events-container">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {hotTopicLoading ? (
                <div className="loading-container col-span-full">
                  <span className="loading-text">{t('loading')}</span>
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
                          {platformData.platform.name} · {t('hotTopics')}
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
                                      {t('rising')}
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
                            <div className="empty-state-text">{t('noHotTopics')}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state col-span-full">
                  <div className="empty-state-icon">📊</div>
                  <div className="empty-state-text">{t('noHotTopics')}</div>
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
          title={t('hotContent')}
        />
      </Modal>
    </div>
  );
};

export default HotContentNew; 