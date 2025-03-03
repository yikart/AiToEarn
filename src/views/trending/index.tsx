import React, { useState, useEffect } from 'react';
import {
  platformApi,
  Platform,
  PlatformRanking,
  RankingContent,
  PaginationMeta,
} from '@/api/platform';
import { Pagination, Modal, Popover, DatePicker } from 'antd';
import {
  InfoCircleOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { getImageUrl } from '@/config';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'antd/es/date-picker/locale/zh_CN';

// 声明全局 electron 对象
declare global {
  interface Window {
    electron: {
      openExternal: (url: string) => Promise<void>;
    };
  }
}

// 定义榜单内容项的接口
interface RankingItem {
  id: string;
  title: string;
  author: {
    name: string;
    avatar: string;
    followers: string;
  };
  category: {
    name: string;
    subCategory: string;
  };
  duration: string;
  views: string;
  likes: string;
  comments: string;
  engagement: string;
  thumbnail: string;
  createTime: string;
}

// 在文件顶部添加或更新接口定义
interface TopicContent {
  _id: string;
  title: string;
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
    _id: string;
    name: string;
    icon: string;
  };
  // ... 其他属性
}

interface TopicResponse {
  items: TopicContent[];
  meta: {
    currentPage: number;
    itemCount: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

// 在文件顶部添加热点事件相关的接口
interface HotTopic {
  _id: string;
  title: string;
  hotValue: number;
  url: string;
  rank: number;
  rankChange: number;
  isRising: boolean;
  platformId: {
    _id: string;
    name: string;
    icon: string;
  };
  hotValueHistory: string; // 热度趋势数据
}

interface PlatformHotTopics {
  platform: {
    _id: string;
    name: string;
    icon: string;
    type: string;
  };
  topics: HotTopic[];
}

// 修改主题色常量
const THEME = {
  primary: '#a66ae4',
  primaryHover: '#9559d1',
  primaryLight: '#f4ebff',
  primaryBorder: '#e6d3f7',
};

// 修改按钮相关的样式类
const buttonStyles = {
  base: 'px-4 py-2 rounded-full text-sm transition-all duration-200 border-none outline-none',
  primary: `bg-[#a66ae4] text-white hover:bg-[#9559d1]`,
  secondary: `bg-gray-50 text-gray-600 hover:bg-[#f4ebff] hover:text-[#a66ae4]`,
};

// 数据说明内容组件
const DataInfoContent: React.FC<{ ranking: PlatformRanking }> = ({
  ranking,
}) => (
  <div className="text-sm text-gray-600">
    <div className="mb-1">
      <span className="font-medium">更新时间：</span>
      {ranking.updateFrequency}
    </div>
    <div className="mb-1">
      <span className="font-medium">统计数据截止：</span>
      {new Date(ranking.updateTime).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })}
    </div>
    <div className="mb-1">
      <span className="font-medium">时间查看：</span>
      按日
    </div>
    <div>
      <span className="font-medium">排序规则：</span>
      统计当日点赞量前500名的作品推荐
    </div>
  </div>
);

const Trending: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null,
  );
  const [selectedRanking, setSelectedRanking] =
    useState<PlatformRanking | null>(null);
  const [rankingList, setRankingList] = useState<PlatformRanking[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
  );
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingContents, setRankingContents] = useState<RankingContent[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [categories, setCategories] = useState<string[]>(['全部']);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [topicCategories, setTopicCategories] = useState<string[]>([]);
  const [contentExpanded, setContentExpanded] = useState(true);
  const [topicExpanded, setTopicExpanded] = useState(false);

  // 热门专题的独立状态
  const [selectedMsgType, setSelectedMsgType] = useState<string>('');
  const [msgTypeList, setMsgTypeList] = useState<string[]>([]);
  const [topicList, setTopicList] = useState<string[]>([]); // 专题标签列表
  const [topicSubCategories, setTopicSubCategories] = useState<string[]>([]);
  const [selectedTopicCategory, setSelectedTopicCategory] =
    useState<string>('');
  const [selectedTopicSubCategory, setSelectedTopicSubCategory] =
    useState<string>('');
  const [topicContents, setTopicContents] = useState<TopicContent[]>([]);
  const [topicLoading, setTopicLoading] = useState(false);
  const [topicPagination, setTopicPagination] = useState<PaginationMeta | null>(
    null,
  );

  // 在右侧内容区 - 热门专题界面部分添加筛选区
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('');
  const [selectedTopicType, setSelectedTopicType] = useState<string>('');
  const [topicTypes, setTopicTypes] = useState<string[]>([]);

  // 添加图片错误处理的状态
  const [imgErrors, setImgErrors] = useState<{[key: string]: boolean}>({});

  // 在组件内添加状态
  const [hotEventExpanded, setHotEventExpanded] = useState(false);
  const [hotPlatformExpanded, setHotPlatformExpanded] = useState(false);
  const [hotTopics, setHotTopics] = useState<PlatformHotTopics[]>([]);
  const [hotTopicLoading, setHotTopicLoading] = useState(false);

  // 添加处理图片加载错误的函数
  const handleImageError = (imageId: string) => {
    setImgErrors(prev => ({
      ...prev,
      [imageId]: true
    }));
  };

  // 获取平台数据和专题分类
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取平台列表
        const platformData = await platformApi.getPlatformList();
        setPlatforms(platformData);
        if (platformData.length > 0) {
          const firstPlatform = platformData[0];
          setSelectedPlatform(firstPlatform);
          fetchPlatformRanking(firstPlatform._id);
        }

        // 获取专题分类
        const topicData = await platformApi.getMsgType();
        setMsgTypeList(topicData);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 获取平台榜单数据
  const fetchPlatformRanking = async (platformId: string) => {
    setRankingLoading(true);
    try {
      const data = await platformApi.getPlatformRanking(platformId);
      setRankingList(data);
      // 自动选择第一个榜单并获取其内容
      if (data.length > 0) {
        const firstRanking = data[0];
        setSelectedRanking(firstRanking);
        // 获取榜单分类   
        fetchRankingCategories(firstRanking._id);
        // 获取榜单内容
        fetchRankingContents(firstRanking._id, 1);
      }
    } catch (error) {
      console.error('获取平台榜单失败:', error);
      setRankingList([]);
      setSelectedRanking(null);
    } finally {
      setRankingLoading(false);
    }
  };

  // 获取榜单分类
  const fetchRankingCategories = async (rankingId: string) => {
    setCategoryLoading(true);
    try {
      const data = await platformApi.getRankingLabel(rankingId);
      // 添加"全部"选项到分类列表开头
      setCategories(['全部', ...data]);
      // 默认选中"全部"
      setSelectedCategory('全部');
    } catch (error) {
      console.error('获取榜单分类失败:', error);
      setCategories(['全部']); // 出错时至少保留"全部"选项
    } finally {
      setCategoryLoading(false);
    }
  };

  // 获取榜单内容
  const fetchRankingContents = async (
    rankingId: string,
    page = 1,
    category?: string,
  ) => {
    setRankingLoading(true);
    try {
      const response = await platformApi.getRankingContents(
        rankingId,
        page,
        20,
        category,
        selectedDate,
      );
      setRankingContents(response.items);
      setPagination(response.meta);
    } catch (error) {
      console.error('获取榜单内容失败:', error);
      setRankingContents([]);
      setPagination(null);
    } finally {
      setRankingLoading(false);
    }
  };

  // 处理平台选择
  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    fetchPlatformRanking(platform._id);
  };

  // 处理榜单选择
  const handleRankingSelect = (ranking: PlatformRanking) => {
    setSelectedRanking(ranking);
    setCurrentPage(1);
    // 获取该榜单的分类
    fetchRankingCategories(ranking._id);
    // 获取榜单内容时添加分类参数
    fetchRankingContents(ranking._id, 1, selectedCategory);
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    if (selectedRanking && page !== pagination?.currentPage) {
      setCurrentPage(page);
      fetchRankingContents(selectedRanking.id, page, selectedCategory);
      // 滚动到顶部
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  // 处理内容点击
  const handleContentClick = (url: string, title: string) => {
    setCurrentUrl(url);
    setCurrentTitle(title);
    setIsModalVisible(true);
  };

  // 处理模态框关闭
  const handleModalClose = () => {
    setIsModalVisible(false);
    setCurrentUrl('');
    setCurrentTitle('');
  };

  // 处理分类选择
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (selectedRanking) {
      // 当选择"全部"时，不传递 category 参数
      const categoryParam = category === '全部' ? undefined : category;
      fetchRankingContents(selectedRanking._id, 1, categoryParam);
    }
  };

  // 处理日期变化
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    const formattedDate = date
      ? date.format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD');
    setSelectedDate(formattedDate);
    if (selectedRanking) {
      fetchRankingContents(
        selectedRanking._id,
        1,
        selectedCategory === '全部' ? undefined : selectedCategory,
      );
    }
  };

  // 获取专题数据
  const fetchTopicData = async () => {
    setTopicLoading(true);
    try {
      // 1. 获取专题标签
      const topics = await platformApi.getTopics();
      setTopicList(topics);

      // 2. 获取专题分类
      const categories = await platformApi.getTopicCategories();
      setTopicCategories(categories);

      if (categories.length > 0) {
        const firstCategory = categories[0];
        setSelectedTopicCategory(firstCategory);

        // 3. 获取第一个分类的子分类
        const subCategories = await platformApi.getSubCategories(firstCategory);
        setTopicSubCategories(subCategories);

        if (subCategories.length > 0) {
          const firstSubCategory = subCategories[0];
          setSelectedTopicSubCategory(firstSubCategory);

          // 4. 获取专题内容
          const response = await platformApi.getAllTopics({
            category: firstCategory,
            subCategory: firstSubCategory,
            startTime: selectedDate,
            endTime: selectedDate,
          });

          setTopicContents(response.items || []);
          if (response.meta) {
            setTopicPagination({
              currentPage: response.meta.currentPage || 1,
              totalPages: response.meta.totalPages || 1,
              totalItems: response.meta.totalItems || 0,
              itemsPerPage: response.meta.itemsPerPage || 20,
            });
          }
        }
      }
    } catch (error) {
      console.error('获取专题数据失败:', error);
    } finally {
      setTopicLoading(false);
    }
  };

  // 添加获取二级分类的函数
  const fetchTopicTypes = async (msgType: string) => {
    try {
      const types = await platformApi.getTopicLabels(msgType);
      setTopicTypes(types);
    } catch (error) {
      console.error('获取专题分类失败:', error);
      setTopicTypes([]);
    }
  };

  // 更新 handleMsgTypeClick 函数
  const handleMsgTypeClick = async (type: string) => {
    setSelectedMsgType(type);
    setTopicLoading(true);
    setContentExpanded(false);
    setSelectedPlatformId(''); // 重置平台选择
    setSelectedTopicType(''); // 重置分类选择

    try {
      // 获取二级分类
      await fetchTopicTypes(type);

      // 获取专题数据
      const hotTopicsData: TopicResponse = await platformApi.getAllTopics({
        msgType: type
      });

      if (hotTopicsData && hotTopicsData.items.length > 0) {
        setTopicContents(hotTopicsData.items);
        if (hotTopicsData.meta) {
          setTopicPagination({
            currentPage: hotTopicsData.meta.currentPage,
            totalPages: hotTopicsData.meta.totalPages,
            totalItems: hotTopicsData.meta.totalItems,
            itemCount: hotTopicsData.meta.itemCount,
            itemsPerPage: hotTopicsData.meta.itemsPerPage
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
  };

  // 添加筛选变化处理函数
  const handleFilterChange = async () => {
    setTopicLoading(true);
    try {
      const hotTopicsData: TopicResponse = await platformApi.getAllTopics({
        msgType: selectedMsgType,
        platformId: selectedPlatformId,
        type: selectedTopicType,
      });

      if (hotTopicsData && hotTopicsData.items.length > 0) {
        setTopicContents(hotTopicsData.items);
        if (hotTopicsData.meta) {
          setTopicPagination({
            currentPage: hotTopicsData.meta.currentPage,
            totalPages: hotTopicsData.meta.totalPages,
            totalItems: hotTopicsData.meta.totalItems,
            itemCount: hotTopicsData.meta.itemCount,
            itemsPerPage: hotTopicsData.meta.itemsPerPage
          });
        }
      } else {
        setTopicContents([]);
      }
    } catch (error) {
      console.error('筛选专题数据失败:', error);
      setTopicContents([]);
    } finally {
      setTopicLoading(false);
    }
  };

  // 修改获取热点事件数据的函数
  const fetchHotTopics = async () => {
    setHotTopicLoading(true);
    try {
      const response = await platformApi.getAllHotTopics();
      console.log('getAllHotTopics:',JSON.stringify(response))
      // 确保 response 和 items 存在
      if (response && Array.isArray(response)) {
        setHotTopics(response);
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

  return (
    <>
      <div className="flex h-full bg-gray-50">
        {/* 左侧平台列表 */}
        <div className="flex-shrink-0 w-48 p-4 bg-white border-r border-gray-100">


          {/* 热门内容 */}
          <div className="mb-8">
            <div
              className="flex items-center justify-between font-medium text-gray-900 mb-4 cursor-pointer hover:text-[#a66ae4]"
              onClick={() => {
                setContentExpanded(!contentExpanded);
                setTopicExpanded(false);
              }}
            >
              <span>热门内容</span>
              {contentExpanded ? <DownOutlined /> : <RightOutlined />}
            </div>
            {contentExpanded && (
              <ul className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="text-gray-500">加载中...</span>
                  </div>
                ) : (
                  platforms.map((platform) => (
                    <li
                      key={platform._id}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all duration-200
                        ${
                          selectedPlatform?._id === platform._id
                            ? 'bg-[#f4ebff] text-[#a66ae4]'
                            : 'hover:bg-gray-50'
                        }`}
                      onClick={() => {
                        handlePlatformSelect(platform);
                        setTopicExpanded(false);
                      }}
                    >
                      <img
                        src={getImageUrl(platform.icon)}
                        alt={platform.name}
                        className="w-5 h-5"
                      />
                      <span>{platform.name}</span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* 热点事件 */}
          <div className="mb-8">
            <div
              className="flex items-center justify-between font-medium text-gray-900 mb-4 cursor-pointer hover:text-[#a66ae4]"
              onClick={() => setHotEventExpanded(!hotEventExpanded)}
            >
              <span>热点事件</span>
              {hotEventExpanded ? <DownOutlined /> : <RightOutlined />}
            </div>
            {hotEventExpanded && (
              <ul className="space-y-2">
                <li
                  className={`flex items-center p-2 rounded cursor-pointer transition-all duration-200 hover:bg-gray-50 
                    ${hotPlatformExpanded ? 'bg-[#f4ebff] text-[#a66ae4]' : ''}`}
                  onClick={() => {
                    setHotPlatformExpanded(!hotPlatformExpanded);
                    setContentExpanded(false);
                    setTopicExpanded(false);
                    fetchHotTopics();
                  }}
                >
                  <InfoCircleOutlined className="mr-2" />
                  <span>八大平台热点</span>
                </li>
              </ul>
            )}
          </div>

          {/* 热门专题 */}
          <div>
            <div
              className="flex items-center justify-between font-medium text-gray-900 mb-4 cursor-pointer hover:text-[#a66ae4]"
              onClick={() => setTopicExpanded(!topicExpanded)}
            >
              <span>热门专题</span>
              {topicExpanded ? <DownOutlined /> : <RightOutlined />}
            </div>
            {topicExpanded && (
              <ul className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="text-gray-500">加载中...</span>
                  </div>
                ) : (
                  msgTypeList.map((type) => (
                    <li
                      key={type}
                      className={`flex items-center p-2 rounded cursor-pointer transition-all duration-200 hover:bg-gray-50 
                        ${selectedMsgType === type ? 'bg-[#f4ebff] text-[#a66ae4]' : ''}`}
                      onClick={() => handleMsgTypeClick(type)}
                    >
                      <InfoCircleOutlined className="mr-2" />
                      <span>{type}</span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 p-6">
          {hotPlatformExpanded ? (
            <div>
              {/* 热点事件内容列表 */}
              <div className="space-y-6">
                {hotTopicLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-gray-500">加载中...</span>
                  </div>
                ) : hotTopics && hotTopics.length > 0 ? (
                  <>
                    {hotTopics.map((platformData: PlatformHotTopics) => (
                      <div key={platformData.platform._id} className="bg-white rounded-lg p-4">
                        {/* 平台标题 */}
                        <div className="flex items-center mb-4">
                          <div className="flex items-center space-x-2">
                            {platformData.platform.icon && !imgErrors[`platform-${platformData.platform._id}`] ? (
                              <img
                                src={getImageUrl(platformData.platform.icon)}
                                alt={platformData.platform.name}
                                className="w-6 h-6"
                                onError={() => handleImageError(`platform-${platformData.platform._id}`)}
                              />
                            ) : (
                              <div className="w-6 h-6 bg-[#fff1f0] rounded flex items-center justify-center">
                                <span className="text-[#ff4d4f]">
                                  {platformData.platform.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <span className="text-base font-medium">{platformData.platform.name} · 热点</span>
                          </div>
                        </div>

                        {/* 热点列表 */}
                        <div className="space-y-4">
                          {platformData.topics.map((topic, index) => (
                            <div
                              key={topic._id}
                              className="flex items-center hover:bg-gray-50 p-2 rounded cursor-pointer"
                              onClick={() => topic.url && handleContentClick(topic.url, topic.title)}
                            >
                              {/* 排名 */}
                              <div className="w-8 text-base">
                                <span className={`font-medium ${index < 3 ? 'text-[#ff4d4f]' : 'text-gray-400'}`}>
                                  {index + 1}
                                </span>
                              </div>

                              {/* 标题和热度 */}
                              <div className="flex flex-1 items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-900">{topic.title}</span>
                                  {topic.isRising && (
                                    <span className="text-xs text-[#ff4d4f] bg-[#fff1f0] px-1 rounded">
                                      热
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4">
                                  <span className="text-[#ff4d4f]">
                                    {(topic.hotValue / 10000).toFixed(1)}w
                                  </span>
                                  <div className="w-24 h-4">
                                    {/* 热度趋势图 - 可以使用简单的SVG线图 */}
                                    <div className="text-xs text-gray-400">
                                      {topic.hotValueHistory}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    暂无热点事件数据
                  </div>
                )}
              </div>
            </div>
          ) : topicExpanded ? (
            // 热门专题界面
            <div>
              {/* 顶部筛选区 */}
              <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
                {/* 平台筛选 */}
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`${buttonStyles.base} ${
                        !selectedPlatformId ? buttonStyles.primary : buttonStyles.secondary
                      }`}
                      onClick={() => {
                        setSelectedPlatformId('');
                        handleFilterChange();
                      }}
                    >
                      全部
                    </button>
                    {platforms.map((platform) => (
                      <button
                        key={platform._id}
                        className={`${buttonStyles.base} ${
                          selectedPlatformId === platform._id
                            ? buttonStyles.primary
                            : buttonStyles.secondary
                        }`}
                        onClick={() => {
                          setSelectedPlatformId(platform._id);
                          handleFilterChange();
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          {platform.icon && !imgErrors[`platform-${platform._id}`] ? (
                            <img
                              src={getImageUrl(platform.icon)}
                              alt={platform.name}
                              className="w-4 h-4"
                              onError={() => handleImageError(`platform-${platform._id}`)}
                            />
                          ) : (
                            <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
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
                </div>

                {/* 二级分类筛选 */}
                {selectedMsgType && (
                  <div className="flex flex-col space-y-2 mt-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`${buttonStyles.base} ${
                          !selectedTopicType ? buttonStyles.primary : buttonStyles.secondary
                        }`}
                        onClick={() => {
                          setSelectedTopicType('');
                          handleFilterChange();
                        }}
                      >
                        全部
                      </button>
                      {topicTypes.map((type) => (
                        <button
                          key={type}
                          className={`${buttonStyles.base} ${
                            selectedTopicType === type
                              ? buttonStyles.primary
                              : buttonStyles.secondary
                          }`}
                          onClick={() => {
                            setSelectedTopicType(type);
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

              {/* 专题内容列表 */}
              <div className="space-y-3">
                {topicLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-gray-500">加载中...</span>
                  </div>
                ) : topicContents.length > 0 ? (
                  <>
                    {topicContents.map((item, index) => (
                      <div
                        key={item._id}
                        className="flex bg-white p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-[#e6d3f7]"
                        onClick={() => handleContentClick(item.url, item.title)}
                      >
                        {/* 排名 */}
                        <div className="w-8 text-lg font-bold text-orange-500">
                          {item.rank || index + 1}
                        </div>

                        {/* 专题信息区域 */}
                        <div className="w-48">
                          <div className="relative flex items-center justify-center w-full overflow-hidden bg-gray-100 rounded-lg h-28">
                            {item.cover && !imgErrors[item._id] ? (
                              <img
                                src={getImageUrl(item.cover)}
                                alt={item.title}
                                className="object-cover w-full h-full"
                                onError={() => handleImageError(item._id)}
                              />
                            ) : (
                              <div className="text-center text-gray-400">
                                暂无图片
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 内容信息 */}
                        <div className="flex-1 ml-4">
                          <div className="flex flex-col justify-between h-full">
                            <div>
                              <h3 className="mb-2 text-base font-medium hover:text-blue-500">
                                {item.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-400">
                                  发布于 {dayjs(item.publishTime).format('YYYY-MM-DD HH:mm')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center mt-2">
                              <div className="w-32 text-gray-500">
                                <span>{item.category}</span>
                              </div>
                              <div className="flex items-center space-x-12">
                                <div className="w-24 text-center">
                                  <span className="text-[#a66ae4]">
                                    {item.hotValue?.toLocaleString() || '0'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    暂无专题数据
                  </div>
                )}
              </div>
            </div>
          ) : (
            // 热门内容界面
            <>
              {/* 榜单选择 */}
              {rankingList.length > 0 && (
                <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
                  <div className="flex space-x-4">
                    {rankingList.map((ranking) => (
                      <button
                        key={ranking._id}
                        className={`${buttonStyles.base} ${
                          selectedRanking?._id === ranking._id
                            ? buttonStyles.primary
                            : buttonStyles.secondary
                        }`}
                        onClick={() => handleRankingSelect(ranking)}
                      >
                        {ranking.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 顶部筛选区 */}
              <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
                {/* 分类筛选 */}
                <div className="flex flex-col space-y-2">
                  <div
                    className={`grid gap-2 transition-[grid-template-rows,max-height] duration-300 ease-in-out relative pr-20`}
                    style={{
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(100px, 1fr))',
                      gridTemplateRows: isExpanded ? '1fr' : '40px',
                      maxHeight: isExpanded ? '1000px' : '40px',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="contents">
                      {categories.map((category) => (
                        <button
                          key={category}
                          className={`${buttonStyles.base} ${
                            selectedCategory === category
                              ? buttonStyles.primary
                              : buttonStyles.secondary
                          } truncate h-10`}
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    {categories.length > 8 && (
                      <button
                        className="absolute right-0 top-0 h-10 px-3 flex items-center text-sm text-gray-500 hover:text-[#a66ae4] transition-colors bg-transparent border-none outline-none shadow-none"
                        onClick={() => setIsExpanded(!isExpanded)}
                      >
                        <span className="mr-1">
                          {isExpanded ? '收起' : '展开'}
                        </span>
                        <InfoCircleOutlined
                          className={`transform transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* 日期选择和数据说明 */}
                <div className="flex items-center justify-between mt-4 space-x-4">
                  <DatePicker
                    value={dayjs(selectedDate)}
                    onChange={handleDateChange}
                    locale={locale}
                    allowClear={false}
                    className="w-32"
                    placeholder="选择日期"
                    disabledDate={(current) => {
                      return current && current > dayjs().endOf('day');
                    }}
                  />

                  {selectedRanking && (
                    <Popover
                      content={<DataInfoContent ranking={selectedRanking} />}
                      title="数据说明"
                      trigger="hover"
                      placement="bottomRight"
                      overlayClassName="max-w-sm"
                    >
                      <div className="flex items-center space-x-1 cursor-pointer text-gray-600 hover:text-[#a66ae4] transition-colors">
                        <InfoCircleOutlined />
                        <span>数据说明</span>
                      </div>
                    </Popover>
                  )}
                </div>
              </div>

              {/* 内容列表 */}
              <div className="space-y-3">
                {rankingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-gray-500">加载榜单数据中...</span>
                  </div>
                ) : rankingContents.length > 0 ? (
                  <>
                    {/* 表头 */}
                    <div
                      className="flex p-4 text-sm text-gray-500 bg-gray-50"
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'flex-start',
                        }}
                      >
                        <div className="w-8">排名</div>
                        <div className="w-48">笔记信息</div>
                      </div>

                      <div className="">
                        <div className="flex items-center">
                          <div className="w-32">作品分类</div>
                          <div className="flex items-center flex-1">
                            <div className="flex items-center space-x-12">
                              <div className="w-24 text-center">点赞</div>
                              <div className="w-24 text-center">评论</div>
                              {/* <div className="w-24 text-center">分享</div>
                              <div className="w-24 text-center">收藏</div> */}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {rankingContents.map((item) => (
                      <div
                        key={item.id}
                        className="flex bg-white p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-[#e6d3f7]"
                        onClick={() => handleContentClick(item.url, item.title)}
                      >
                        {/* 排名 */}
                        <div className="w-8 text-lg font-bold text-orange-500">
                          {item.rankingPosition}
                        </div>

                        {/* 笔记信息区域 */}
                        <div className="w-48">
                          <div className="relative w-full overflow-hidden rounded-lg h-28">
                            {item.cover && !imgErrors[item._id] ? (
                              <img
                                src={getImageUrl(item.cover)}
                                alt={item.title}
                                className="object-cover w-full h-full"
                                onError={() => handleImageError(item._id)}
                              />
                            ) : (
                              <div className="text-center text-gray-400">
                                暂无图片
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 内容信息 */}
                        <div
                          className="ml-4"
                          style={{
                            display: 'flex',
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div className="flex">
                            <div
                              style={{
                                display: 'flex',
                                flex: 1,
                                justifyContent: 'space-between',
                                flexDirection: 'column',
                              }}
                            >
                              <h3
                                className="mb-2 text-base font-medium hover:text-blue-500"
                                style={{
                                  textAlign: 'left',
                                }}
                              >
                                {item.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                {item.author && !imgErrors[`${item._id}-avatar`] ? (
                                  <img
                                    src={getImageUrl(item.author.avatar)}
                                    alt={item.author.name}
                                    className="w-5 h-5 rounded-full"
                                    onError={() => handleImageError(`${item._id}-avatar`)}
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-xs text-gray-500">
                                      {item.author.name?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                  </div>
                                )}
                                <span className="text-sm text-gray-600">
                                  {item.author.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  粉丝数 {item.author.fansCount?.toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-400">
                                  发布于 {dayjs(item.publishTime).format('YYYY-MM-DD HH:mm')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center text-sm">
                            <div className="w-32 text-gray-500">
                              <span>{item.category}</span>
                              {/* <span className="ml-2">{item.type}</span> */}
                            </div>
                            <div className="flex items-center justify-between flex-1">
                              <div className="flex items-center space-x-12">
                                
                                <div className="w-24 text-center">
                                  <span className="text-[#a66ae4]">
                                    {item.stats.likeCount || '1w'}
                                  </span>
                                </div>
                                <div className="w-24 text-center">
                                  <span className="text-[#a66ae4]">
                                    {item.stats.commentCount || '1w'}
                                  </span>
                                </div>
                                {/* <div className="w-24 text-center">
                                  <span className="text-[#a66ae4]">
                                    {item.stats.shareCount || '1w'} 
                                  </span>
                                </div>
                                <div className="w-24 text-center">
                                  <span className="text-[#a66ae4]">
                                    {item.stats.collectCount || '1w'}
                                  </span>
                                </div> */}
                              </div>
                              {/* <div className="flex items-center space-x-2">
                                <button className="text-[#a66ae4] hover:text-[#9559d1] px-3 py-1 rounded-full border border-[#e6d3f7] text-sm">
                                  收藏
                                </button>
                                <button className="text-gray-600 hover:text-[#a66ae4] px-3 py-1 rounded-full border border-gray-200 text-sm">
                                  更多
                                </button>
                              </div> */}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 分页 */}
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex justify-center mt-6 mb-8">
                        <Pagination
                          current={pagination.currentPage}
                          total={pagination.totalItems}
                          pageSize={pagination.itemsPerPage}
                          showSizeChanger={false}
                          showQuickJumper
                          showTotal={(total) => `共 ${total} 条`}
                          onChange={handlePageChange}
                          className={`hover:text-[${THEME.primary}]`}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    暂无榜单数据
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 内容预览模态框 */}
      <Modal
        title={
          <div
            className={`text-[${THEME.primary}] font-medium truncate max-w-3xl`}
          >
            {currentTitle}
          </div>
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width="80%"
        destroyOnClose={true}
        styles={{
          body: {
            height: 'calc(100vh - 160px)',
            padding: 0,
            overflow: 'hidden',
          },
          content: {},
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
          },
        }}
        style={{ top: 80, padding: 0 }}
      >
        {isModalVisible && (
          <webview
            src={currentUrl}
            style={{
              width: '100%',
              height: '100%',
              margin: 0,
              padding: 0,
              border: 'none',
            }}
            allowpopups={true}
            webpreferences="nativeWindowOpen=true"
          />
        )}
      </Modal>
    </>
  );
};

export default Trending;
