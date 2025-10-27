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
  UserOutlined,
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
  id: string;
  title: string;
  hotValue: number;
  url: string;
  rank: number;
  rankChange: number;
  isRising: boolean;
  platformId: {
    id: string;
    name: string;
    icon: string;
  };
  hotValueHistory: HotValueHistory[]; // 热度趋势数据
}

interface PlatformHotTopics {
  platform: {
    id: string;
    name: string;
    icon: string;
    type: string;
  };
  topics: HotTopic[];
}

// 在文件顶部添加爆款标题相关的接口
interface ViralTitle {
  id: string;
  title: string;
  platformId: string | Platform | any; // 使用 any 处理不确定的类型
  category: string;
  publishTime: string | null | Date | undefined; // 添加 Date 和 undefined 类型
  engagement: number;
  url: string;
  rank: number;
  createTime: string | Date; // 添加 Date 类型
  updateTime: string | Date; // 添加 Date 类型
}

interface ViralTitleCategory {
  category: string;
  titles: ViralTitle[];
}

// 在热度趋势图部分修改代码
interface HotValueHistory {
  hotValue: number;
  timestamp: string;
}

interface Topic extends HotTopic {
  // 继承 HotTopic 的所有属性
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
  base: 'px-4 py-2 rounded-md text-sm transition-all duration-200 border-none outline-none',
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

// 格式化数字，超过10000显示为w单位
const formatNumber = (num: number) => {
  if (!num && num !== 0) return '0';

  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }

  return num.toString();
};

const Trending: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null,
  );
  const [selectedRanking, setSelectedRanking] =
    useState<PlatformRanking | null>(null);
  const [rankingList, setRankingList] = useState<PlatformRanking[]>([]);
  const [rankingDatesList, setRankingDatesList] = useState<[]>([]); // 榜单日期列表
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
  );
  const [rankingMinDate, setRankingMinDate] = useState<string>(
    dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
  );
  const [rankingMaxDate, setRankingMaxDate] = useState<string>(
    dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
  );
  const [rankingDateLoading, setRankingDateLoading] = useState(false);
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

  // 话题相关状态
  const [talkExpanded, setTalkExpanded] = useState(false);
  const [talkLoading, setTalkLoading] = useState(false);
  const [talkPagination, setTalkPagination] = useState<PaginationMeta | null>(
    null,
  );
  const [talkPlatforms, setTalkPlatforms] = useState<Platform[]>([]);
  const [selectedTalkPlatform, setSelectedTalkPlatform] =
    useState<Platform | null>(null);
  const [selectedTalkColumn, setSelectedTalkColumn] = useState<string>('');
  const [selectedTalkCategory, setSelectedTalkCategory] = useState<string>('');
  const [selectedTalkXhsTimeRange, setSelectedTalkXhsTimeRange] =
    useState<string>('24小时'); // 小红书话题时间筛选 默认选中24小时

  // 在右侧内容区 - 热门专题界面部分添加筛选区
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('');
  const [selectedTopicType, setSelectedTopicType] = useState<string>('');
  const [topicTypes, setTopicTypes] = useState<string[]>([]);

  // 添加图片错误处理的状态
  const [imgErrors, setImgErrors] = useState<{ [key: string]: boolean }>({});

  // 在组件内添加状态
  const [hotEventExpanded, setHotEventExpanded] = useState(false);
  const [hotPlatformExpanded, setHotPlatformExpanded] = useState(false);
  const [hotTopics, setHotTopics] = useState<PlatformHotTopics[]>([]);
  const [hotTopicLoading, setHotTopicLoading] = useState(false);

  // 添加爆款标题相关的状态
  const [viralTitleExpanded, setViralTitleExpanded] = useState(false);
  const [viralTitlePlatforms, setViralTitlePlatforms] = useState<Platform[]>(
    [],
  );
  const [selectedViralPlatform, setSelectedViralPlatform] =
    useState<Platform | null>(null);
  const [viralTitleCategories, setViralTitleCategories] = useState<string[]>(
    [],
  );
  const [selectedViralCategory, setSelectedViralCategory] =
    useState<string>('');
  const [viralTitleData, setViralTitleData] = useState<ViralTitleCategory[]>(
    [],
  );
  const [viralTitleLoading, setViralTitleLoading] = useState(false);

  // 在 Trending 组件中添加新的状态
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);

  // 添加新的状态
  const [showSingleCategory, setShowSingleCategory] = useState(false);
  const [singleCategoryData, setSingleCategoryData] = useState<ViralTitle[]>(
    [],
  );
  const [singleCategoryName, setSingleCategoryName] = useState('');
  const [singleCategoryLoading, setSingleCategoryLoading] = useState(false);
  const [singleCategoryPagination, setSingleCategoryPagination] =
    useState<PaginationMeta | null>(null);

  // 在 Trending 组件中添加时间筛选状态
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('近7天'); // 默认选中近7天
  const timeRangeOptions = [];
  const [selectedViralTimeRange, setViralSelectedTimeRange] =
    useState<string>('近7天'); // 爆款标题时间筛选 默认选中近7天

  // 在 Trending 组件中添加时间类型状态
  const [timeTypes, setTimeTypes] = useState<string[]>([]);
  const [selectedTimeType, setSelectedTimeType] = useState<string>('');
  const [selectedViralTimeType, setViralSelectedTimeType] =
    useState<string>('近7天');

  // 通用的一些固定值
  const platformIdParams = {
    xhsPlatformId: '6789d6a69b3e38d8da09ba47',
    dyPlatformId: '6789d6a69b3e38d8da09ba48',
    ksPlatformId: '678a3c1b18789840c02c806f',
    biliPlatformId: '678a3c6218789840c02c8070',
    gzhPlatformId: '679095d7df03a9e7d4b30ec9',
    sphPlatformId: '678a3bdb18789840c02c806e',
  };
  // const xhsPlatformId = '6789d6a69b3e38d8da09ba47';
  // const dyPlatformId = '6789d6a69b3e38d8da09ba48';
  // const ksPlatformId = '678a3c1b18789840c02c806f';
  // const biliPlatformId = '678a3c6218789840c02c8070';
  // const gzhPlatformId = '679095d7df03a9e7d4b30ec9';
  // const sphPlatformId = '678a3bdb18789840c02c806e';

  // 添加处理图片加载错误的函数
  const handleImageError = (imageId: string) => {
    setImgErrors((prev) => ({
      ...prev,
      [imageId]: true,
    }));
  };

  // 获取平台数据和专题分类
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取平台列表
        const platformData = await platformApi.getPlatformList();
        console.log('platformData:', platformData);
        setPlatforms(platformData);
        if (platformData.length > 0) {
          const firstPlatform = platformData[0];
          setSelectedPlatform(firstPlatform);
          fetchPlatformRanking(firstPlatform.id);
        }

        // // 获取专题分类
        // const topicData = await platformApi.getMsgType();
        // setMsgTypeList(topicData);
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
    console.log('fetchPlatformRanking:', platformId);
    setRankingLoading(true);
    try {
      const rankingData = await platformApi.getPlatformRanking(platformId);
      console.log('rankingData:', rankingData);
      setRankingList(rankingData);

      // 自动选择第一个榜单并获取其内容
      if (rankingData.length > 0) {
        const firstRanking = rankingData[0];
        // 获取榜单日期
        await fetchRankingDates(firstRanking.id);

        setSelectedRanking(firstRanking);

        // // 获取榜单分类
        await fetchRankingCategories(firstRanking.id);

        // // 获取榜单内容
        // await fetchRankingContents(firstRanking.id, 1);

        // 重置页码到第一页
        setCurrentPage(1);
      } else {
        // 如果没有榜单数据，清空相关状态
        setSelectedRanking(null);
        setCategories(['全部']);
        setSelectedCategory('全部');
        setRankingContents([]);
        setCurrentPage(1);
        // ... 可能还需要清空 datesList, min/max date 等 ...
        setRankingDatesList([]);
        setRankingMaxDate('');
        setRankingMinDate('');
      }
    } catch (error) {
      console.error('获取平台榜单失败:', error);
      setRankingList([]);
      setSelectedRanking(null);
      setCategories(['全部']);
      setSelectedCategory('全部');
      setRankingContents([]);
      setCurrentPage(1);
      setRankingDatesList([]);
      setRankingMaxDate('');
      setRankingMinDate('');
    } finally {
      setRankingLoading(false);
    }
  };

  // 获取榜单分类
  const fetchRankingCategories = async (rankingId: string) => {
    setCategoryLoading(true);
    try {
      const data = await platformApi.getRankingLabel(rankingId);

      // 检查数据中是否已经包含"全部"选项
      if (data.includes('全部')) {
        // 如果已经包含"全部"，则将其移到数组第一位
        const filteredData = data.filter((item) => item !== '全部');
        setCategories(['全部', ...filteredData]);
      } else {
        // 如果不包含"全部"，则添加到列表开头
        setCategories(['全部', ...data]);
      }

      // 默认选中"全部"
      setSelectedCategory('全部');
    } catch (error) {
      console.error('获取榜单分类失败:', error);
      setCategories(['全部']); // 出错时至少保留"全部"选项
    } finally {
      setCategoryLoading(false);
    }
  };

  // 获取榜单日期列表
  const fetchRankingDates = async (rankingId: string) => {
    setRankingDateLoading(true);
    let fetchedMaxDate = ''; // 用于临时存储获取到的日期
    try {
      const rankingDatesData = await platformApi.getRankingDates(rankingId);
      console.log('fetchRankingDates:--', rankingId, rankingDatesData);
      if (rankingDatesData && rankingDatesData.length > 0) {
        const maxDate = (rankingDatesData[0] as any).queryDate;
        const minDate = (rankingDatesData[rankingDatesData.length - 1] as any)
          .queryDate;
        setRankingMaxDate(maxDate);
        setRankingMinDate(minDate);
        fetchedMaxDate = maxDate; // 保存获取到的日期
        setRankingDatesList(rankingDatesData as any);
      } else {
        // 没有日期数据，清空相关状态
        setRankingMaxDate('');
        setRankingMinDate('');
        setRankingDatesList([]);
        fetchedMaxDate = ''; // 没有日期，设为空
      }
    } catch (error) {
      console.error('获取榜单日期列表失败:', error);
      setRankingMaxDate('');
      setRankingMinDate('');
      setRankingDatesList([]);
      fetchedMaxDate = ''; // 出错也设为空
    } finally {
      // 这将触发上面定义的 useEffect (如果 selectedDate 确实改变了)
      setSelectedDate(fetchedMaxDate);
      console.log('检查日期：', fetchedMaxDate, selectedDate);
      setRankingDateLoading(false);
    }
  };

  // 这个 useEffect 负责在依赖变化时获取榜单内容
  useEffect(() => {
    // 从 selectedRanking 中获取 rankingId
    const currentRankingId = selectedRanking?.id; // 使用可选链 ?. 安全访问 id

    // 检查依赖项是否有效，防止在初始状态或无效状态下发起请求
    // 重要：这里的检查条件要根据你的逻辑调整：
    // - currentRankingId 必须存在
    // - selectedDate 必须存在且不为空字符串 (或者你用来表示“未选择”的其他值)
    if (currentRankingId && selectedDate && selectedDate !== '') {
      // 调用 fetchRankingContents，传入当前有效的依赖值
      fetchRankingContents(
        currentRankingId,
        currentPage,
        selectedCategory,
        selectedDate,
      );
    } else {
      // 如果依赖项无效（例如，刚加载还没有选择榜单，或者日期被清空），
      // 你可能想清空内容列表
      console.log(
        'useEffect for content: 依赖项 (rankingId 或 selectedDate) 无效，清空内容',
      );
      setRankingContents([]);
    } // 依赖项数组: 当数组中的任何一个值发生变化时，useEffect 内部的函数会重新执行
  }, [selectedRanking, selectedCategory, selectedDate, currentPage]); // 依赖 selectedRanking, selectedDate 和 currentPage

  // 获取榜单内容
  const fetchRankingContents = async (
    rankingId: string,
    page = 1,
    category?: string,
    formattedDate?: string,
  ) => {
    setRankingLoading(true);
    const dates = formattedDate ? formattedDate : selectedDate;
    try {
      const response = await platformApi.getRankingContents(
        rankingId,
        page,
        20,
        category,
        dates,
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
    // 设置选中的平台
    setSelectedPlatform(platform);

    // 清空原有数据并显示加载动画
    setRankingList([]);
    setSelectedRanking(null);
    setCategories(['全部']);
    setSelectedCategory('全部');
    setRankingContents([]);
    setRankingLoading(true);

    // 关闭热门专题展开
    setTopicExpanded(false);

    // 获取新平台的榜单数据
    fetchPlatformRanking(platform.id);
  };

  // 修改榜单选择处理函数
  const handleRankingSelect = async (ranking: PlatformRanking) => {
    // 如果点击的是当前已选中的榜单，不做任何操作
    if (selectedRanking?.id === ranking.id) return;

    // 设置选中的榜单
    setSelectedRanking(ranking);

    // 重置分页到第一页
    setCurrentPage(1);

    // 获取榜单内容
    await fetchRankingContents(
      ranking.id,
      1,
      selectedCategory !== '全部' ? selectedCategory : undefined,
    );
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
      fetchRankingContents(selectedRanking.id, 1, categoryParam);
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
        selectedRanking.id,
        1,
        selectedCategory === '全部' ? undefined : selectedCategory,
        formattedDate,
      );
    }
  };

  // 获取爆款标题平台列表
  const fetchViralTitlePlatforms = async () => {
    setViralTitleLoading(true);
    try {
      const platforms = await platformApi.findPlatformsWithData();
      const timeTypeData = await platformApi.getViralTitleTimeTypes();
      setViralTitlePlatforms(platforms);
      if (platforms.length > 0) {
        setSelectedViralPlatform(platforms[0]);
        fetchViralTitleCategories(platforms[0].id);
        fetchViralTitleContents(platforms[0].id, timeTypeData[0]);
      }
    } catch (error) {
      console.error('获取爆款标题平台失败:', error);
      setViralTitlePlatforms([]);
    } finally {
      setViralTitleLoading(false);
    }
  };

  // 获取爆款标题时间类型
  const fetchViralTitleTimeTypes = async () => {
    try {
      const timeTypeData = await platformApi.getViralTitleTimeTypes();
      setTimeTypes(timeTypeData);

      // 如果有时间类型，自动选择第一个
      if (timeTypeData.length > 0) {
        setViralSelectedTimeRange(timeTypeData[0]);
      }
    } catch (error) {
      console.error('获取爆款标题时间类型失败:', error);
      setTimeTypes([]);
    }
  };

  // 获取爆款标题分类和时间类型
  const fetchViralTitleCategories = async (platformId: string) => {
    try {
      const categories = await platformApi.findCategoriesByPlatform(platformId);
      setViralTitleCategories(categories);
      fetchViralTitleTimeTypes();
      if (categories.length > 0) {
        setSelectedViralCategory('');
      }
    } catch (error) {
      console.error('获取爆款标题分类失败:', error);
      setViralTitleCategories([]);
    }
  };

  // 获取爆款标题数据
  const fetchViralTitleContents = async (
    platformId: string,
    timeType: string,
  ) => {
    setViralTitleLoading(true);
    try {
      const data = await platformApi.findTopByPlatformAndCategories(
        platformId,
        timeType,
      );
      // 使用 as any 绕过类型检查
      const formattedData = data.map((item) => ({
        category: item.category,
        titles: item.titles.map((title) => ({
          ...title,
          platformId:
            typeof title.platformId === 'object'
              ? title.platformId.id
              : title.platformId,
          // 确保 publishTime 是 string 或 null
          publishTime: title.publishTime ? title.publishTime.toString() : null,
          // 确保 createTime 和 updateTime 是 string
          // createTime: title.createTime.toString(),
          updateTime: title.updateTime,
        })),
      })) as any;

      setViralTitleData(formattedData);
    } catch (error) {
      console.error('获取爆款标题数据失败:', error);
      setViralTitleData([]);
    } finally {
      setViralTitleLoading(false);
    }
  };

  // 处理爆款标题平台选择
  const handleViralPlatformSelect = (platform: Platform, timeType: string) => {
    setSelectedViralPlatform(platform);
    // 清空原有数据并显示加载动画
    setSelectedViralCategory('全部');
    setShowSingleCategory(false);
    setViralTitleData([]);
    fetchViralTitleCategories(platform.id);
    fetchViralTitleTimeTypes(); // 获取时间类型
    fetchViralTitleContents(platform.id, timeType);
  };

  // 修改处理爆款标题分类选择的函数
  const handleViralCategorySelect = async (category: string) => {
    setSelectedViralCategory(category);

    if (category && selectedViralPlatform && selectedViralTimeRange) {
      // 如果选择了特定分类，调用API获取该分类数据
      console.log(
        'handleViralCategorySelect：',
        category,
        selectedViralTimeRange,
        selectedViralTimeType,
      );
      setSingleCategoryName(category);
      setShowSingleCategory(true);
      fetchSingleCategoryData(
        selectedViralPlatform.id,
        category,
        1,
        selectedViralTimeType,
      );
    } else {
      // 如果选择"全部"，返回到分类概览
      setShowSingleCategory(false);
      setSingleCategoryData([]);
      setSingleCategoryName('');
    }
  };

  // 处理爆款标题时间类型选择 全部分类
  const handleViralTimeTypeSelect = (category: string, timeType: string) => {
    setViralSelectedTimeType(timeType);
    console.log(
      'handleViralTimeTypeSelect:',
      selectedViralCategory,
      category,
      timeType,
      selectedViralTimeType,
      selectedViralTimeRange,
    );
    if (category) {
      // 获取单独分类
      fetchSingleCategoryData(selectedViralPlatform!.id, category, 1, timeType);
    } else {
      // 获取爆款标题内容  全部分类
      fetchViralTitleContents(selectedViralPlatform!.id, timeType);
    }
  };

  // 添加获取热门专题二级分类的函数
  const fetchTopicTypes = async (msgType: string) => {
    try {
      const types = await platformApi.getTopicLabels(msgType);
      setTopicTypes(types);
    } catch (error) {
      console.error('获取专题分类失败:', error);
      setTopicTypes([]);
    }
  };

  // 修改热门专题点击处理函数
  const handleTopicExpandClick = async () => {
    const newTopicExpanded = !topicExpanded;
    console.log('切换热门专题展开状态:', newTopicExpanded);

    // 更新展开状态
    setTopicExpanded(newTopicExpanded);

    // 关闭其他展开的内容
    setContentExpanded(false);
    setHotPlatformExpanded(false);
    setHotEventExpanded(false);
    setViralTitleExpanded(false);

    // 如果是展开热门专题，并且有消息类型，则加载数据
    if (newTopicExpanded && msgTypeList.length > 0) {
      console.log('准备加载热门专题数据');
      fetchTopicTimeTypes(msgTypeList[0]);
      // 如果没有选择消息类型，则自动选择第一个
      if (!selectedMsgType && msgTypeList.length > 0) {
        setSelectedMsgType(msgTypeList[0]);
      }

      // 使用当前选择的消息类型或第一个消息类型
      const msgType = selectedMsgType || msgTypeList[0];

      // 如果没有选择平台，则使用第一个平台
      if (!selectedPlatformId && platforms.length > 0) {
        setSelectedPlatformId(platforms[0].id);
      }

      // 调用处理函数获取数据
      setTopicLoading(true);
      try {
        // 获取二级分类
        await fetchTopicTypes(msgType);

        // 获取专题数据 - 使用时间类型参数和当前选择的平台
        const hotTopicsData = await platformApi.getAllTopics({
          msgType: msgType,
          platformId:
            selectedPlatformId ||
            (platforms.length > 0 ? platforms[0].id : undefined),
          timeType: selectedTimeType || selectedTimeRange,
        });

        if (hotTopicsData && hotTopicsData.items) {
          // 类型转换，确保类型兼容
          setTopicContents(hotTopicsData.items as unknown as TopicContent[]);
          if (hotTopicsData.meta) {
            setTopicPagination({
              currentPage: hotTopicsData.meta.currentPage || 1,
              totalPages: hotTopicsData.meta.totalPages || 1,
              totalItems: hotTopicsData.meta.totalItems || 0,
              itemCount: hotTopicsData.meta.itemCount || 0,
              itemsPerPage: hotTopicsData.meta.itemsPerPage || 20,
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

  // 修改 handleMsgTypeClick 函数
  const handleMsgTypeClick = async (type: string) => {
    setSelectedMsgType(type);
    setTopicLoading(true);
    setContentExpanded(false);
    // setSelectedPlatformId(''); // 重置平台选择
    setSelectedTopicType(''); // 重置分类选择

    try {
      // 获取二级分类
      await fetchTopicTypes(type);

      // 获取时间范围参数

      // 获取专题数据 - 使用时间范围参数
      const hotTopicsData = await platformApi.getAllTopics({
        msgType: type,
        platformId: selectedPlatformId,
        timeType: selectedTimeRange,
      });

      if (hotTopicsData && hotTopicsData.items) {
        // 类型转换，确保类型兼容
        setTopicContents(hotTopicsData.items as unknown as TopicContent[]);
        if (hotTopicsData.meta) {
          setTopicPagination({
            currentPage: hotTopicsData.meta.currentPage || 1,
            totalPages: hotTopicsData.meta.totalPages || 1,
            totalItems: hotTopicsData.meta.totalItems || 0,
            itemCount: hotTopicsData.meta.itemCount || 0,
            itemsPerPage: hotTopicsData.meta.itemsPerPage || 20,
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

  // 修改筛选变化处理函数
  const handleFilterChange = async (platformId?: string) => {
    setTopicLoading(true);
    try {
      // 使用传入的 platformId 或当前状态
      const currentPlatformId = platformId || selectedPlatformId;

      // 准备请求参数，只包含非空值
      const params: any = {
        msgType: selectedMsgType,
        timeType: selectedTimeRange,
      };

      // 只有当 platformId 有值时才添加
      if (currentPlatformId) {
        params.platformId = currentPlatformId;
      }

      // 只有当 type 有值时才添加
      if (selectedTopicType && selectedTopicType.trim() !== '') {
        params.type = selectedTopicType;
      }

      console.log('查询参数:', params); // 添加日志，方便调试

      const hotTopicsData = await platformApi.getAllTopics(params);

      if (hotTopicsData && hotTopicsData.items) {
        // 类型转换，确保类型兼容
        setTopicContents(hotTopicsData.items as unknown as TopicContent[]);
        if (hotTopicsData.meta) {
          setTopicPagination({
            currentPage: hotTopicsData.meta.currentPage || 1,
            totalPages: hotTopicsData.meta.totalPages || 1,
            totalItems: hotTopicsData.meta.totalItems || 0,
            itemCount: hotTopicsData.meta.itemCount || 0,
            itemsPerPage: hotTopicsData.meta.itemsPerPage || 20,
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

  // 修改时间筛选处理函数
  const handleTimeRangeChange = async (timeRange: string) => {
    setSelectedTimeRange(timeRange);
    setTopicLoading(true);
    try {
      // 获取时间范围参数

      const hotTopicsData = await platformApi.getAllTopics({
        msgType: selectedMsgType,
        platformId: selectedPlatformId,
        type: selectedTopicType,
        timeType: timeRange,
      });

      if (hotTopicsData && hotTopicsData.items) {
        // 类型转换，确保类型兼容
        setTopicContents(hotTopicsData.items as unknown as TopicContent[]);
        if (hotTopicsData.meta) {
          setTopicPagination({
            currentPage: hotTopicsData.meta.currentPage || 1,
            totalPages: hotTopicsData.meta.totalPages || 1,
            totalItems: hotTopicsData.meta.totalItems || 0,
            itemCount: hotTopicsData.meta.itemCount || 0,
            itemsPerPage: hotTopicsData.meta.itemsPerPage || 20,
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

  // 修改获取热点事件数据的函数，修复类型错误
  const fetchHotTopics = async () => {
    setHotTopicLoading(true);
    try {
      const response = await platformApi.getAllHotTopics();
      console.log('getAllHotTopics:', JSON.stringify(response));
      // 确保 response 和 items 存在
      if (response && Array.isArray(response)) {
        // 类型转换，确保类型兼容
        setHotTopics(response as unknown as PlatformHotTopics[]);
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

  // 修改专题分页处理函数
  const handleTopicPageChange = async (page: number) => {
    if (page !== topicPagination?.currentPage) {
      setTopicLoading(true);
      try {
        // 准备请求参数，只包含非空值
        const params: any = {
          msgType: selectedMsgType,
          timeType: selectedTimeRange,
          page, // 添加页码
        };

        // 只有当 platformId 有值时才添加
        if (selectedPlatformId) {
          params.platformId = selectedPlatformId;
        }

        // 只有当 type 有值时才添加
        if (selectedTopicType && selectedTopicType.trim() !== '') {
          params.type = selectedTopicType;
        }

        const hotTopicsData = await platformApi.getAllTopics(params);

        if (hotTopicsData && hotTopicsData.items) {
          // 类型转换，确保类型兼容
          setTopicContents(hotTopicsData.items as unknown as TopicContent[]);
          if (hotTopicsData.meta) {
            setTopicPagination({
              currentPage: hotTopicsData.meta.currentPage || 1,
              totalPages: hotTopicsData.meta.totalPages || 1,
              totalItems: hotTopicsData.meta.totalItems || 0,
              itemCount: hotTopicsData.meta.itemCount || 0,
              itemsPerPage: hotTopicsData.meta.itemsPerPage || 20,
            });
          }
        } else {
          setTopicContents([]);
        }

        // 滚动到顶部
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      } catch (error) {
        console.error('获取专题数据失败:', error);
        setTopicContents([]);
      } finally {
        setTopicLoading(false);
      }
    }
  };

  // 修改获取单个分类数据的函数
  const fetchSingleCategoryData = async (
    platformId: string,
    category: string,
    page: number = 1,
    timeType: string = '近7天',
  ) => {
    setSingleCategoryLoading(true);
    try {
      // 修改 API 调用，使用正确的参数格式
      const response = await platformApi.findByPlatformAndCategory(platformId, {
        category: category,
        page: page,
        pageSize: 20, // 每页显示数量
        timeType: timeType, // 时间类型  近7天 近30天 近90天
        // 可以添加其他参数，如时间范围
        // startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90天前
        // endTime: new Date(),
      });

      // 获取响应数据
      const items = response.items || [];

      // 转换数据类型
      const formattedItems = items.map((item) => ({
        ...item,
        platformId:
          typeof item.platformId === 'object'
            ? item.platformId.id
            : item.platformId,
        // 确保 publishTime 是 string 或 null
        publishTime: item.publishTime ? item.publishTime.toString() : null,
        // 确保 createTime 和 updateTime 是 string
        // createTime: item.createTime.toString(),
        // updateTime: item.updateTime.toString(),
      })) as any;

      setSingleCategoryData(formattedItems);

      // 使用 API 返回的分页元数据
      const paginationMeta = response.meta || {
        currentPage: page,
        itemsPerPage: 20,
        totalItems: items.length,
        totalPages: Math.ceil(items.length / 20),
        itemCount: items.length,
      };

      setSingleCategoryPagination(paginationMeta as PaginationMeta);
    } catch (error) {
      console.error('获取分类数据失败:', error);
      setSingleCategoryData([]);
      setSingleCategoryPagination(null);
    } finally {
      setSingleCategoryLoading(false);
    }
  };

  // 处理查看更多点击
  const handleViewMoreClick = (category: string, timeType: string) => {
    if (selectedViralPlatform) {
      setSingleCategoryName(category);
      setShowSingleCategory(true);
      fetchSingleCategoryData(selectedViralPlatform.id, category, 1, timeType);
    }
  };

  // 处理返回全部点击
  const handleBackToAllCategories = () => {
    setShowSingleCategory(false);
    setSingleCategoryData([]);
    setSingleCategoryName('');
  };

  // 处理爆款标题单个分类分页
  const handleSingleCategoryPageChange = (page: number) => {
    if (selectedViralPlatform && singleCategoryName && selectedViralTimeType) {
      fetchSingleCategoryData(
        selectedViralPlatform.id,
        singleCategoryName,
        page,
        selectedViralTimeType,
      );
      // 滚动到顶部
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  // 获取专题分类和时间类型
  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        // 获取专题分类
        const topicData = await platformApi.getMsgType();
        setMsgTypeList(topicData);

        // 如果有分类，自动选择第一个并获取其时间类型
        if (topicData.length > 0) {
          setSelectedMsgType(topicData[0]);
          fetchTopicTimeTypes(topicData[0]);
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
      setTimeTypes(timeTypeData);

      // 如果有时间类型，自动选择第一个
      if (timeTypeData.length > 0) {
        setSelectedTimeType(timeTypeData[0]);
      }
    } catch (error) {
      console.error('获取专题时间类型失败:', error);
      setTimeTypes([]);
    }
  };

  // 处理专题分类选择
  const handleMsgTypeSelect = (msgType: string) => {
    setSelectedMsgType(msgType);
    setSelectedTopicCategory('');
    setSelectedTopicSubCategory('');

    // 获取该分类的时间类型
    fetchTopicTimeTypes(msgType);

    // 重置分页
    setCurrentPage(1);

    // 获取专题内容
    fetchTopicContents(msgType, '', '', 1, selectedTimeType);
  };

  // 处理热门专题时间类型选择
  const handleTimeTypeSelect = (timeType: string) => {
    setSelectedTimeType(timeType);

    // 重置分页
    setCurrentPage(1);

    // 获取专题内容
    fetchTopicContents(
      selectedMsgType,
      selectedTopicCategory,
      selectedTopicSubCategory,
      1,
      timeType,
    );
  };

  // 修改获取专题内容的函数
  const fetchTopicContents = async (
    msgType: string,
    category: string = '',
    subCategory: string = '',
    page: number = 1,
    timeType: string = '',
  ) => {
    if (!msgType) return;

    setTopicLoading(true);
    try {
      // 构建查询参数
      const params: any = {
        msgType,
        page,
        limit: 10,
      };

      // 添加分类参数
      if (category) {
        params.category = category;
      }

      // 添加子分类参数
      if (subCategory) {
        params.subCategory = subCategory;
      }

      // 添加时间类型参数
      if (timeType) {
        params.timeType = timeType;
      }

      // 添加平台ID参数
      if (selectedPlatformId) {
        params.platformId = selectedPlatformId;
      }

      // 添加专题类型参数
      if (selectedTopicType) {
        params.type = selectedTopicType;
      }

      const { data, meta } = (await platformApi.getAllTopics(params)) as any;
      setTopicContents(data);
      setTopicPagination(meta);
    } catch (error) {
      console.error('获取专题内容失败:', error);
      setTopicContents([]);
      setTopicPagination(null);
    } finally {
      setTopicLoading(false);
    }
  };

  // 在热门专题界面部分添加时间类型筛选
  <div className="flex items-center">
    <span className="mr-2 text-sm text-gray-500">时间类型:</span>
    <div className="flex flex-wrap gap-2">
      {timeTypes.map((timeType) => (
        <button
          key={timeType}
          className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 border-none outline-none ${
            selectedTimeType === timeType
              ? 'bg-[#a66ae4] text-white hover:bg-[#9559d1]'
              : 'bg-gray-50 text-gray-600 hover:bg-[#f4ebff] hover:text-[#a66ae4]'
          }`}
          onClick={() => handleTimeTypeSelect(timeType)}
        >
          {timeType}
        </button>
      ))}
    </div>
  </div>;

  // 获取话题平台列表
  const fetchTalksPlatforms = async () => {
    setTalkLoading(true);
    try {
      const platforms = await platformApi.findTalksPlatforms();
      // const timeTypeData = await platformApi.getViralTitleTimeTypes();
      setTalkPlatforms(platforms);
      if (platforms.length > 0) {
        setSelectedTalkPlatform(platforms[0]);
        fetchTalkColumns(platforms[0].id); // 获取话题栏目
        // fetchViralTitleCategories(platforms[0].id);
        // fetchViralTitleContents(platforms[0].id, timeTypeData[0]);
      }
    } catch (error) {
      console.error('获取话题平台失败:', error);
      setTalkPlatforms([]);
    } finally {
      setTalkLoading(false);
    }
  };

  // 修改话题点击处理函数
  const handleTalkExpandClick = async () => {
    const newTalkExpanded = !talkExpanded;
    console.log('切换话题展开状态:', newTalkExpanded);

    // 更新展开状态
    setTalkExpanded(newTalkExpanded);

    // 关闭其他展开的内容
    setContentExpanded(false);
    setHotPlatformExpanded(false);
    setHotEventExpanded(false);
    setViralTitleExpanded(false);
    setTopicExpanded(false);

    // 如果是展开话题，并且有消息类型，则加载数据
    if (newTalkExpanded && msgTypeList.length > 0) {
      console.log('准备加载话题数据');

      // 如果没有选择消息类型，则自动选择第一个
      if (!selectedMsgType && msgTypeList.length > 0) {
        setSelectedMsgType(msgTypeList[0]);
      }

      // 使用当前选择的消息类型或第一个消息类型
      const msgType = selectedMsgType || msgTypeList[0];

      // 如果没有选择平台，则使用第一个平台
      if (!selectedPlatformId && platforms.length > 0) {
        setSelectedPlatformId(platforms[0].id);
      }

      // 调用处理函数获取数据
      setTopicLoading(true);
      try {
        // 获取二级分类
        await fetchTopicTypes(msgType);

        // 获取专题数据 - 使用时间类型参数和当前选择的平台
        const hotTopicsData = await platformApi.getAllTopics({
          msgType: msgType,
          platformId:
            selectedPlatformId ||
            (platforms.length > 0 ? platforms[0].id : undefined),
          timeType: selectedTimeType || selectedTimeRange,
        });

        if (hotTopicsData && hotTopicsData.items) {
          // 类型转换，确保类型兼容
          setTopicContents(hotTopicsData.items as unknown as TopicContent[]);
          if (hotTopicsData.meta) {
            setTopicPagination({
              currentPage: hotTopicsData.meta.currentPage || 1,
              totalPages: hotTopicsData.meta.totalPages || 1,
              totalItems: hotTopicsData.meta.totalItems || 0,
              itemCount: hotTopicsData.meta.itemCount || 0,
              itemsPerPage: hotTopicsData.meta.itemsPerPage || 20,
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

  // 获取话题栏目
  const fetchTalkColumns = async (platformId: string) => {
    try {
      const allTalkColumns = await platformApi.findTalksColumn(platformId);
      console.log(allTalkColumns);
      // setViralTitleCategories(categories);
      // fetchViralTitleTimeTypes();
      // if (categories.length > 0) {
      //   setSelectedViralCategory('');
      // }
    } catch (error) {
      console.error('获取话题栏目失败:', error);
      // setViralTitleCategories([]);
    }
  };

  // 处理话题平台选择
  const handleTalkPlatformSelect = async (platform: Platform) => {
    setSelectedTalkPlatform(platform);
    // 小红书话题页面
    if (platform.id === platformIdParams.xhsPlatformId) {
      // params.category = category;
      console.log('小红书话题页面');

      try {
        const xhsDatesList = await platformApi.getXhsDates();
        const xhsCategoryList = await platformApi.getXhsCategories();
        // setViralTitlePlatforms(platforms);
        if (platforms.length > 0) {
          // setSelectedViralPlatform(platforms[0]);
          // fetchViralTitleCategories(platforms[0].id);
          // fetchViralTitleContents(platforms[0].id, timeTypeData[0]);
        }
      } catch (error) {
        console.error('获取小红书话题平台失败:', error);
        // setViralTitlePlatforms([]);
      }
    }

    // 抖音话题页面
    if (platform.id === platformIdParams.dyPlatformId) {
      // params.category = category;
      console.log('抖音话题页面');
    }

    // 清空原有数据并显示加载动画
    // setSelectedViralCategory('全部');
    // setShowSingleCategory(false);
    // setViralTitleData([]);
    // fetchViralTitleCategories(platform.id);
    // fetchViralTitleTimeTypes(); // 获取时间类型
    // fetchViralTitleContents(platform.id, timeType);
  };

  // 修改处理话题分类选择的函数
  const handleTalkCategorySelect = async (category: string) => {
    setSelectedTalkCategory(category);
    console.log('handleTalkCategorySelect:--');

    // if (category && selectedTalkPlatform && selectedTalkTimeRange) {
    //   // 如果选择了特定分类，调用API获取该分类数据
    //   console.log(
    //     'handleViralCategorySelect：',
    //     category,
    //     selectedViralTimeRange,
    //     selectedViralTimeType,
    //   );
    //   setSingleCategoryName(category);
    //   setShowSingleCategory(true);
    //   fetchSingleCategoryData(
    //     selectedViralPlatform.id,
    //     category,
    //     1,
    //     selectedViralTimeType,
    //   );
    // } else {
    //   // 如果选择"全部"，返回到分类概览
    //   setShowSingleCategory(false);
    //   setSingleCategoryData([]);
    //   setSingleCategoryName('');
    // }
  };

  // 处理话题时间类型选择 全部分类
  const handleTalkTimeTypeSelect = (category: string, timeType: string) => {
    console.log('handleTalkTimeTypeSelect:-- ');
    // setSelectedTalkTimeType(timeType);
    // console.log(
    //   'handleViralTimeTypeSelect:',
    //   selectedViralCategory,
    //   category,
    //   timeType,
    //   selectedViralTimeType,
    //   selectedViralTimeRange,
    // );
    // if (category) {
    //   // 获取单独分类
    //   fetchSingleCategoryData(selectedViralPlatform!.id, category, 1, timeType);
    // } else {
    //   // 获取爆款标题内容  全部分类
    //   fetchViralTitleContents(selectedViralPlatform!.id, timeType);
    // }
  };

  return (
    <>
      <div className="flex h-full bg-gray-50" style={{ overflow: 'auto' }}>
        {/* 左侧平台列表 */}
        <div className="flex-shrink-0 w-48 p-4 bg-white border-r border-gray-100">
          {/* 热门内容 */}
          <div className="mb-6">
            <div
              className="flex items-center justify-between font-medium text-gray-900 mb-3 cursor-pointer hover:text-[#a66ae4]"
              onClick={() => {
                setContentExpanded(!contentExpanded);
                setTopicExpanded(false);
                setHotPlatformExpanded(false);
                setHotEventExpanded(false);
                setViralTitleExpanded(false);
                setTalkExpanded(false);
              }}
            >
              <span className="text-base font-bold">热门内容</span>
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
                      key={platform.id}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all duration-200
                        ${
                          selectedPlatform?.id === platform.id
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
          <div className="mb-6">
            <div
              className="flex items-center justify-between font-medium text-gray-900 mb-3 cursor-pointer hover:text-[#a66ae4]"
              onClick={() => {
                setHotEventExpanded(!hotEventExpanded);
                setViralTitleExpanded(false);
              }}
            >
              <span className="text-base font-bold">热点事件</span>
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
                    setViralTitleExpanded(false);
                    if (!hotPlatformExpanded) {
                      fetchHotTopics();
                    }
                  }}
                >
                  {/* <InfoCircleOutlined className="mr-2" /> */}
                  <span>八大平台热点</span>
                </li>
              </ul>
            )}
          </div>

          {/* 热门专题 */}
          <div className="mb-6">
            <div
              className="flex items-center justify-between font-medium text-gray-900 mb-3 cursor-pointer hover:text-[#a66ae4]"
              onClick={handleTopicExpandClick}
            >
              <span className="text-base font-bold">热门专题</span>
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
                      {/* <InfoCircleOutlined className="mr-2" /> */}
                      <span>{type}</span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* 爆款标题 - 新增菜单 */}
          <div className="mb-6">
            <div
              className="flex items-center justify-between font-medium text-gray-900 mb-3 cursor-pointer hover:text-[#a66ae4]"
              onClick={() => {
                setViralTitleExpanded(!viralTitleExpanded);
                setContentExpanded(false);
                setTopicExpanded(false);
                setHotPlatformExpanded(false);
                setHotEventExpanded(false);
                if (!viralTitleExpanded) {
                  fetchViralTitlePlatforms();
                }
              }}
            >
              <span className="text-base font-bold">爆款标题</span>
              {viralTitleExpanded ? <DownOutlined /> : <RightOutlined />}
            </div>
            {viralTitleExpanded && (
              <ul className="space-y-2">
                {viralTitleLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="text-gray-500">加载中...</span>
                  </div>
                ) : (
                  viralTitlePlatforms.map((platform) => (
                    <li
                      key={platform.id}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all duration-200
                        ${
                          selectedViralPlatform?.id === platform.id
                            ? 'bg-[#f4ebff] text-[#a66ae4]'
                            : 'hover:bg-gray-50'
                        }`}
                      onClick={() =>
                        handleViralPlatformSelect(
                          platform,
                          selectedViralTimeType,
                        )
                      }
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

          {/* 话题 */}
          {/* <div className="mb-6">
            <div
              className="flex items-center justify-between font-medium text-gray-900 mb-3 cursor-pointer hover:text-[#a66ae4]"
              onClick={() => {
                setTalkExpanded(!talkExpanded);
                setContentExpanded(false);
                setTopicExpanded(false);
                setHotPlatformExpanded(false);
                setHotEventExpanded(false);
                if (!talkExpanded) {
                  fetchTalksPlatforms();
                }
              }}
            >
              <span className="text-base font-bold">话题/热词</span>
              {talkExpanded ? <DownOutlined /> : <RightOutlined />}
            </div>
            {talkExpanded && (
              <ul className="space-y-2">
                {talkLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="text-gray-500">加载中...</span>
                  </div>
                ) : (
                  talkPlatforms.map((platform) => (
                    <li
                      key={platform.id}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all duration-200
                        ${
                          selectedTalkPlatform?.id === platform.id
                            ? 'bg-[#f4ebff] text-[#a66ae4]'
                            : 'hover:bg-gray-50'
                        }`}
                      onClick={() => handleTalkPlatformSelect(platform)}
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
          </div> */}
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 p-6" style={{ overflow: 'auto' }}>
          {viralTitleExpanded ? (
            // 爆款标题内容区域
            <div>
              {/* 顶部筛选区 */}
              <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
                {/* 分类筛选 - 始终显示 */}
                <div className="flex flex-col space-y-2">
                  <div
                    className={`grid gap-2 transition-[grid-template-rows,max-height] duration-300 ease-in-out relative pr-20`}
                    style={{
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(100px, 1fr))',
                      gridTemplateRows: isCategoryExpanded ? '1fr' : '40px',
                      maxHeight: isCategoryExpanded ? '1000px' : '40px',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="contents">
                      <button
                        className={`${buttonStyles.base} ${
                          !selectedViralCategory
                            ? buttonStyles.primary
                            : buttonStyles.secondary
                        } truncate h-10`}
                        onClick={() => handleViralCategorySelect('')}
                      >
                        全部
                      </button>
                      {viralTitleCategories.map((category) => (
                        <button
                          key={category}
                          className={`${buttonStyles.base} ${
                            selectedViralCategory === category
                              ? buttonStyles.primary
                              : buttonStyles.secondary
                          } truncate h-10`}
                          onClick={() => handleViralCategorySelect(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    {viralTitleCategories.length > 8 && (
                      <button
                        className="absolute right-0 top-0 h-10 px-3 flex items-center text-sm text-gray-500 hover:text-[#a66ae4] transition-colors bg-transparent border-none outline-none shadow-none"
                        onClick={() =>
                          setIsCategoryExpanded(!isCategoryExpanded)
                        }
                      >
                        <span className="mr-1">
                          {isCategoryExpanded ? '收起' : '展开'}
                        </span>
                        <InfoCircleOutlined
                          className={`transform transition-transform duration-300 ${
                            isCategoryExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* 爆款标题时间筛选 */}
                <div className="flex items-center p-4">
                  <span className="mr-3 text-sm text-gray-500">时间范围:</span>
                  <div className="flex flex-wrap gap-2">
                    {timeTypes.map((timeType) => (
                      <button
                        key={timeType}
                        className={`${buttonStyles.base} ${
                          selectedViralTimeType === timeType
                            ? buttonStyles.primary
                            : buttonStyles.secondary
                        }`}
                        onClick={() =>
                          handleViralTimeTypeSelect(
                            selectedViralCategory,
                            timeType,
                          )
                        }
                      >
                        {timeType}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 爆款标题内容展示 */}
              {viralTitleLoading || singleCategoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-gray-500">加载中...</span>
                </div>
              ) : !showSingleCategory ? (
                // 显示所有分类
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {viralTitleData.map((categoryData) => (
                    <div
                      key={categoryData.category}
                      className="p-4 bg-white rounded-lg shadow-sm"
                      style={{
                        display:
                          !selectedViralCategory ||
                          selectedViralCategory === categoryData.category
                            ? 'block'
                            : 'none',
                      }}
                    >
                      {/* 分类标题 */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#a66ae4]">
                          {categoryData.category}
                        </h3>
                        <a
                          href="#"
                          className="text-sm text-gray-500 hover:text-[#a66ae4]"
                        ></a>
                      </div>

                      {/* 标题列表 - 单列布局 */}
                      <div className="space-y-3">
                        {categoryData.titles.slice(0, 5).map((title, index) => (
                          <div
                            key={title.id}
                            className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-[#e6d3f7] bg-gray-50"
                            onClick={() =>
                              handleContentClick(title.url, title.title)
                            }
                          >
                            {/* 排名 */}
                            <div className="w-8 text-lg font-bold text-orange-500">
                              {index + 1}
                            </div>

                            {/* 标题信息 */}
                            <div className="flex-1 ml-2">
                              <div className="text-base font-bold text-left hover:text-[#a66ae4]">
                                {title.title}
                              </div>
                            </div>

                            {/* 数据指标 */}
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="text-center">
                                <div className="text-[#a66ae4]">
                                  {title.engagement.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  互动量
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 底部查看更多按钮 */}
                      <div className="mt-4 text-center">
                        <div
                          className="px-4 py-2 text-sm text-gray-600 hover:text-[#a66ae4] border border-gray-200 rounded-full hover:border-[#e6d3f7]"
                          onClick={() =>
                            // handleViewMoreClick(categoryData.category, selectedViralTimeRange)
                            handleViralCategorySelect(categoryData.category)
                          }
                        >
                          查看更多
                        </div>
                      </div>
                    </div>
                  ))}

                  {viralTitleData.length === 0 && (
                    <div className="py-8 text-center text-gray-500 md:col-span-2">
                      暂无爆款标题数据
                    </div>
                  )}
                </div>
              ) : (
                // 显示单个分类的所有数据
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <div className="space-y-3">
                    {singleCategoryData.map((title, index) => (
                      <div
                        key={title.id}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-[#e6d3f7] bg-gray-50"
                        onClick={() =>
                          handleContentClick(title.url, title.title)
                        }
                      >
                        {/* 排名 */}
                        <div className="w-8 text-lg font-bold text-orange-500">
                          {(singleCategoryPagination!.currentPage - 1) *
                            (singleCategoryPagination?.itemsPerPage || 20) +
                            index +
                            1 || title.rank}
                        </div>

                        {/* 标题信息 */}
                        <div className="flex-1 ml-2">
                          <div className="text-base font-bold text-left hover:text-[#a66ae4]">
                            {title.title}
                          </div>
                        </div>

                        {/* 数据指标 */}
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="text-center">
                            <div className="text-[#a66ae4]">
                              {title.engagement.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">互动量</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 分页组件 */}
                  {singleCategoryPagination &&
                    singleCategoryPagination.totalPages > 1 && (
                      <div className="flex justify-center mt-6 mb-8">
                        <Pagination
                          current={singleCategoryPagination.currentPage}
                          total={singleCategoryPagination.totalItems}
                          pageSize={singleCategoryPagination.itemsPerPage}
                          showSizeChanger={false}
                          showQuickJumper
                          showTotal={(total) => `共 ${total} 条`}
                          onChange={handleSingleCategoryPageChange}
                        />
                      </div>
                    )}

                  {singleCategoryData.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      暂无爆款标题数据
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : hotPlatformExpanded ? (
            <div>
              {/* 热点事件内容列表 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
                {hotTopicLoading ? (
                  <div className="flex items-center justify-center py-8 col-span-full">
                    <span className="text-gray-500">加载中...</span>
                  </div>
                ) : hotTopics && hotTopics.length > 0 ? (
                  <>
                    {hotTopics.map((platformData: PlatformHotTopics) => (
                      <div
                        key={platformData.platform.id}
                        className="flex flex-col w-full p-4 bg-white rounded-lg"
                        style={{
                          minWidth: '300px',
                          maxWidth: '550px',
                          height: '500px',
                        }}
                      >
                        {/* 平台标题 */}
                        <div className="flex items-center mb-4">
                          <div className="flex items-center space-x-2">
                            {platformData.platform.icon &&
                            !imgErrors[
                              `platform-${platformData.platform.id}`
                            ] ? (
                              <img
                                src={getImageUrl(platformData.platform.icon)}
                                alt={platformData.platform.name}
                                className="w-6 h-6"
                                onError={() =>
                                  handleImageError(
                                    `platform-${platformData.platform.id}`,
                                  )
                                }
                              />
                            ) : (
                              <div className="w-6 h-6 bg-[#fff1f0] rounded flex items-center justify-center">
                                <span className="text-[#ff4d4f]">
                                  {platformData.platform.name
                                    ?.charAt(0)
                                    ?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <span className="text-base font-medium">
                              {platformData.platform.name} · 热点
                            </span>
                          </div>
                        </div>

                        {/* 热点列表 - 固定高度，超出滚动，隐藏滚动条 */}
                        <div
                          className="flex-1 pr-1 overflow-y-auto scrollbar-hide"
                          style={{ maxHeight: '480px' }}
                        >
                          <div className="space-y-2">
                            {platformData.topics &&
                            Array.isArray(platformData.topics) ? (
                              platformData.topics.map((topic, index) => (
                                <div
                                  key={topic.id || index}
                                  className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-50"
                                  onClick={() =>
                                    topic.url &&
                                    handleContentClick(topic.url, topic.title)
                                  }
                                >
                                  {/* 排名 */}
                                  <div className="flex-shrink-0 w-6 text-base">
                                    <span
                                      className={`font-medium ${index < 3 ? 'text-[#ff4d4f]' : 'text-gray-400'}`}
                                    >
                                      {index + 1}
                                    </span>
                                  </div>

                                  {/* 标题和热度 */}
                                  <div className="flex items-center justify-between flex-1 min-w-0">
                                    <div className="flex-1 min-w-0 mr-2">
                                      <span
                                        className="block text-gray-900 truncate"
                                        style={{
                                          textAlign: 'left',
                                          fontSize: '14px',
                                        }}
                                      >
                                        {typeof topic.title === 'string'
                                          ? topic.title
                                          : '无标题'}
                                      </span>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 space-x-2">
                                      {topic.isRising && (
                                        <span className="text-xs text-[#ff4d4f] bg-[#fff1f0] px-1 rounded flex-shrink-0">
                                          热
                                        </span>
                                      )}
                                      <span className="text-[#ff4d4f] whitespace-nowrap">
                                        {(topic.hotValue / 10000).toFixed(1) +
                                          'w'}
                                      </span>
                                      <div className="relative flex-shrink-0 w-16 h-4 group">
                                        {/* 热度趋势图 */}
                                        <div className="relative w-full h-full">
                                          <svg
                                            width="100%"
                                            height="100%"
                                            viewBox="0 0 100 20"
                                            preserveAspectRatio="none"
                                          >
                                            <polyline
                                              points={
                                                Array.isArray(
                                                  topic.hotValueHistory,
                                                )
                                                  ? topic.hotValueHistory
                                                      .map(
                                                        (
                                                          item: HotValueHistory,
                                                          i: number,
                                                        ) => {
                                                          const x =
                                                            (i /
                                                              (topic
                                                                .hotValueHistory
                                                                .length -
                                                                1)) *
                                                              100 || 0;
                                                          // 归一化热度值到0-20的范围
                                                          const maxHot =
                                                            Math.max(
                                                              ...topic.hotValueHistory.map(
                                                                (
                                                                  h: HotValueHistory,
                                                                ) => h.hotValue,
                                                              ),
                                                            );
                                                          const minHot =
                                                            Math.min(
                                                              ...topic.hotValueHistory.map(
                                                                (
                                                                  h: HotValueHistory,
                                                                ) => h.hotValue,
                                                              ),
                                                            );
                                                          const range =
                                                            maxHot - minHot;
                                                          const y =
                                                            range === 0
                                                              ? 10
                                                              : 20 -
                                                                ((item.hotValue -
                                                                  minHot) /
                                                                  range) *
                                                                  20;
                                                          return `${x},${y}`;
                                                        },
                                                      )
                                                      .join(' ')
                                                  : ''
                                              }
                                              fill="none"
                                              stroke="#ff4d4f"
                                              strokeWidth="1.5"
                                            />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-gray-500">
                                暂无热点数据
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500 col-span-full">
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
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        className={`${buttonStyles.base} ${
                          selectedPlatformId === platform.id
                            ? buttonStyles.primary
                            : buttonStyles.secondary
                        }`}
                        onClick={() => {
                          const platformId = platform.id;
                          // 先设置平台 ID
                          setSelectedPlatformId(platformId);
                          // 直接调用查询，传入当前点击的平台 ID
                          handleFilterChange(platformId);
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          {platform.icon &&
                          !imgErrors[`platform-${platform.id}`] ? (
                            <img
                              src={getImageUrl(platform.icon)}
                              alt={platform.name}
                              className="w-4 h-4"
                              onError={() =>
                                handleImageError(`platform-${platform.id}`)
                              }
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

                  {/* 时间筛选 - 新增 */}
                  <div className="flex items-center">
                    <span className="mr-3 text-sm text-gray-500">
                      时间范围:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {timeTypes.map((timeRange) => (
                        <button
                          key={timeRange}
                          className={`${buttonStyles.base} ${
                            selectedTimeRange === timeRange
                              ? buttonStyles.primary
                              : buttonStyles.secondary
                          }`}
                          onClick={() => {
                            // 先设置时间范围
                            setSelectedTimeRange(timeRange);
                            // 使用 setTimeout 确保状态更新后再调用查询
                            setTimeout(() => {
                              handleTimeRangeChange(timeRange);
                            }, 0);
                          }}
                        >
                          {timeRange}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 分类筛选 - 如果有的话 */}
                  {topicTypes.length > 1 && (
                    <div className="flex items-center">
                      <span className="mr-3 text-sm text-gray-500">分类:</span>
                      <div className="flex flex-wrap gap-2">
                        {topicTypes.map((type) => (
                          <button
                            key={type}
                            className={`${buttonStyles.base} ${
                              selectedTopicType === type
                                ? buttonStyles.primary
                                : buttonStyles.secondary
                            }`}
                            onClick={() => {
                              setSelectedTopicType(
                                type === selectedTopicType ? '' : type,
                              );
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
              <div className="bg-white rounded-lg shadow-sm">
                {topicLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-gray-500">加载中...</span>
                  </div>
                ) : topicContents.length > 0 ? (
                  <>
                    {/* 表头 */}
                    <div className="grid grid-cols-12 p-4 text-sm text-gray-500 bg-gray-50">
                      <div className="col-span-1 text-center">排名</div>
                      <div className="col-span-2 pl-2">封面</div>
                      <div className="col-span-4 pl-2">标题/作者</div>
                      <div className="col-span-1 text-center">分类</div>
                      <div className="col-span-1 text-center">点赞</div>
                      <div className="col-span-1 text-center">分享</div>
                      <div className="col-span-1 text-center">评论数</div>
                      <div className="col-span-1 text-center">收藏数</div>
                    </div>

                    {/* 内容列表 */}
                    {topicContents.map((item, index) => (
                      <div
                        key={item.id}
                        className="grid items-center grid-cols-12 px-4 py-5 transition-colors border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleContentClick(item.url, item.title)}
                      >
                        {/* 排名 */}
                        <div className="col-span-1 text-lg font-bold text-center text-orange-500">
                          {((topicPagination?.currentPage || 1) - 1) *
                            (topicPagination?.itemsPerPage || 20) +
                            index +
                            1}
                        </div>

                        {/* 封面 */}
                        <div className="col-span-2 pl-2">
                          <div className="relative w-full overflow-hidden bg-gray-100 rounded-lg aspect-video">
                            {item.cover && !imgErrors[item.id as string] ? (
                              <img
                                src={getImageUrl(item.cover)}
                                alt={item.title}
                                className="object-cover w-full h-full"
                                onError={() =>
                                  handleImageError(item.id as string)
                                }
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-center text-gray-400">
                                暂无图片
                              </div>
                            )}
                            {item.type === 'video' && (
                              <div className="absolute px-2 py-1 text-xs text-white bg-black rounded bottom-2 right-2 bg-opacity-60">
                                视频
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 标题和作者信息 */}
                        <div className="col-span-4 pl-4 ">
                          <h3 className="text-base font-medium line-clamp-2 hover:text-[#a66ae4] text-left">
                            {item.title}
                          </h3>
                          <div style={{ width: '100%', height: '60px' }}></div>
                          <div className="flex items-center mt-2">
                            <div className="flex items-center">
                              {item.avatar &&
                              !imgErrors[`avatar-${item.id}`] ? (
                                <img
                                  src={getImageUrl(item.avatar)}
                                  alt={item.author}
                                  className="w-5 h-5 mr-1 rounded-full"
                                  onError={() =>
                                    handleImageError(`avatar-${item.id}`)
                                  }
                                />
                              ) : (
                                <div className="flex items-center justify-center w-5 h-5 mr-1 bg-gray-200 rounded-full">
                                  <span className="text-xs text-gray-500">
                                    {item.author?.charAt(0)?.toUpperCase() ||
                                      '?'}
                                  </span>
                                </div>
                              )}
                              <span className="mr-2 text-sm text-gray-600">
                                {item.author}
                              </span>
                              {item.fans > 0 && (
                                <span className="mr-2 text-xs text-gray-400">
                                  {item.fans >= 10000
                                    ? `${(item.fans / 10000).toFixed(1)}万粉丝`
                                    : `${item.fans}粉丝`}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                发布于{' '}
                                {dayjs(item.publishTime).format(
                                  'YYYY-MM-DD HH:mm',
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 分类信息 */}
                        <div className="col-span-1 text-center">
                          <div className="text-sm text-gray-600">
                            {item.category}
                          </div>
                          {item.subCategory && (
                            <div className="mt-1 text-xs text-gray-400">
                              {item.subCategory}
                            </div>
                          )}
                        </div>

                        {/* 点赞数 */}
                        <div className="col-span-1 text-center">
                          <div className="text-[#a66ae4] font-medium">
                            {item.likeCount >= 10000
                              ? `${(item.likeCount / 10000).toFixed(1)}w`
                              : item.likeCount}
                          </div>
                          <div className="text-xs text-gray-400">点赞</div>
                        </div>

                        {/* 分享数 */}
                        <div className="col-span-1 text-center">
                          <div className="text-[#a66ae4] font-medium">
                            {item.shareCount >= 10000
                              ? `${(item.shareCount / 10000).toFixed(1)}w`
                              : item.shareCount}
                          </div>
                          <div className="text-xs text-gray-400">分享</div>
                        </div>

                        {/* 评论数 */}
                        <div className="col-span-1 text-center">
                          <div className="text-[#a66ae4] font-medium">
                            {item.commentCount
                              ? item.commentCount >= 10000
                                ? `${(item.commentCount / 10000).toFixed(1)}w`
                                : item.commentCount
                              : '-'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {'评论数'}
                          </div>
                        </div>

                        {/* 收藏数 */}
                        <div className="col-span-1 text-center">
                          <div className="text-[#a66ae4] font-medium">
                            {item.collectCount
                              ? item.collectCount >= 10000
                                ? `${(item.collectCount / 10000).toFixed(1)}w`
                                : item.collectCount
                              : '-'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {'收藏数'}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 分页组件 */}
                    {topicPagination && topicPagination.totalPages > 1 && (
                      <div className="flex justify-center py-6">
                        <Pagination
                          current={topicPagination.currentPage}
                          total={topicPagination.totalItems}
                          pageSize={topicPagination.itemsPerPage}
                          showSizeChanger={false}
                          showQuickJumper
                          showTotal={(total) => `共 ${total} 条`}
                          onChange={handleTopicPageChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    暂无专题数据
                  </div>
                )}
              </div>
            </div>
          ) : talkExpanded ? (
            // 话题内容区域
            <div>
              {/* 顶部筛选区 */}
              <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
                {/* 分类筛选 - 始终显示 */}
                <div className="flex flex-col space-y-2">
                  <div
                    className={`grid gap-2 transition-[grid-template-rows,max-height] duration-300 ease-in-out relative pr-20`}
                    style={{
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(100px, 1fr))',
                      gridTemplateRows: isCategoryExpanded ? '1fr' : '40px',
                      maxHeight: isCategoryExpanded ? '1000px' : '40px',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="contents">
                      <button
                        className={`${buttonStyles.base} ${
                          !selectedViralCategory
                            ? buttonStyles.primary
                            : buttonStyles.secondary
                        } truncate h-10`}
                        onClick={() => handleTalkCategorySelect('')}
                      >
                        全部
                      </button>
                      {/* {talkCategory.map((category) => (
                        <button
                          key={category}
                          className={`${buttonStyles.base} ${
                            selectedViralCategory === category
                              ? buttonStyles.primary
                              : buttonStyles.secondary
                          } truncate h-10`}
                          onClick={() => handleViralCategorySelect(category)}
                        >
                          {category}
                        </button>
                      ))} */}
                    </div>
                    {/* {viralTitleCategories.length > 8 && (
                      <button
                        className="absolute right-0 top-0 h-10 px-3 flex items-center text-sm text-gray-500 hover:text-[#a66ae4] transition-colors bg-transparent border-none outline-none shadow-none"
                        onClick={() =>
                          setIsCategoryExpanded(!isCategoryExpanded)
                        }
                      >
                        <span className="mr-1">
                          {isCategoryExpanded ? '收起' : '展开'}
                        </span>
                        <InfoCircleOutlined
                          className={`transform transition-transform duration-300 ${
                            isCategoryExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )} */}
                  </div>
                </div>

                {/* 爆款标题时间筛选 */}
                <div className="flex items-center p-4">
                  <span className="mr-3 text-sm text-gray-500">时间范围:</span>
                  <div className="flex flex-wrap gap-2">
                    {timeTypes.map((timeType) => (
                      <button
                        key={timeType}
                        className={`${buttonStyles.base} ${
                          selectedViralTimeType === timeType
                            ? buttonStyles.primary
                            : buttonStyles.secondary
                        }`}
                        onClick={() =>
                          handleViralTimeTypeSelect(
                            selectedViralCategory,
                            timeType,
                          )
                        }
                      >
                        {timeType}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // 热门内容界面
            <>
              {/* 榜单选择 */}
              {rankingList.length > 1 && (
                <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
                  <div className="flex space-x-4">
                    {rankingList
                      .filter((ranking) => !ranking.parentId)
                      .map((ranking) => (
                        <button
                          key={ranking.id}
                          className={`${buttonStyles.base} ${
                            selectedRanking?.id === ranking.id
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

              {/* 顶部筛选区 - 保持不变 */}
              <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
                {/* 分类筛选 */}
                <div className="flex flex-col space-y-2">
                  <div
                    className={`grid gap-2 transition-[grid-template-rows,max-height] duration-300 ease-in-out relative pr-20`}
                    style={{
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(80px, 1fr))',
                      gridTemplateRows: isExpanded ? '1fr' : '36px',
                      maxHeight: isExpanded ? '1000px' : '36px',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="contents">
                      {categories.map((category) => (
                        <button
                          key={category}
                          className={`${
                            selectedCategory === category
                              ? 'bg-[#a66ae4] text-white hover:bg-[#9559d1]'
                              : 'bg-gray-50 text-gray-600 hover:bg-[#f4ebff] hover:text-[#a66ae4]'
                          } px-2 py-1 rounded-md text-xs transition-all duration-200 border-none outline-none truncate h-8`}
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    {categories.length > 8 && (
                      <button
                        className="absolute right-0 top-0 h-8 px-2 flex items-center text-xs text-gray-500 hover:text-[#a66ae4] transition-colors bg-transparent border-none outline-none shadow-none"
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

                {/* 日期选择和子榜单选择 */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    <DatePicker
                      value={dayjs(selectedDate)}
                      onChange={handleDateChange}
                      locale={locale}
                      allowClear={false}
                      className="w-32"
                      placeholder="选择日期"
                      disabledDate={(current) => {
                        return (
                          current < dayjs(rankingMinDate) ||
                          current > dayjs(rankingMaxDate)
                        );
                      }}
                      //   disabledDate={(current) => {
                      //     return current && current > dayjs().endOf('day');
                      //   }}
                    />

                    {/* 子榜单选择 - 只在选择了父榜单后显示 */}
                    {selectedRanking &&
                      rankingList.filter(
                        (ranking) =>
                          // 如果当前选中的是子榜单，则显示与其父榜单相关的所有子榜单
                          ranking.parentId ===
                          (selectedRanking.parentId || selectedRanking.id),
                      ).length > 0 && (
                        <div className="flex flex-wrap gap-2 ml-4">
                          {rankingList
                            .filter(
                              (ranking) =>
                                // 如果当前选中的是子榜单，则显示与其父榜单相关的所有子榜单
                                ranking.parentId ===
                                (selectedRanking.parentId ||
                                  selectedRanking.id),
                            )
                            .map((ranking) => (
                              <button
                                key={ranking.id}
                                className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 border-none outline-none ${
                                  selectedRanking?.id === ranking.id
                                    ? 'bg-[#a66ae4] text-white hover:bg-[#9559d1]'
                                    : 'bg-gray-50 text-gray-600 hover:bg-[#f4ebff] hover:text-[#a66ae4]'
                                }`}
                                onClick={() => handleRankingSelect(ranking)}
                              >
                                {ranking.name}
                              </button>
                            ))}
                        </div>
                      )}
                  </div>

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
                          {/* 快手增量榜单字段单独设置 */}
                          {selectedRanking?.name.includes('增量') && (selectedPlatform?.id === platformIdParams.ksPlatformId) && (
                            <div className="flex items-center flex-1">
                              <div className="flex items-center space-x-12">
                                <div className="w-24 text-center">互动增量</div>
                                <div className="w-24 text-center">新增播放</div>
                                <div className="w-24 text-center">新增分享</div>
                                <div className="w-24 text-center">新增评论</div>
                              </div>
                            </div>
                          )}


                          {selectedRanking?.name.includes('增量') && !(selectedPlatform?.id === platformIdParams.ksPlatformId) &&(
                            <div className="flex items-center flex-1">
                              <div className="flex items-center space-x-12">
                                <div className="w-24 text-center">互动增量</div>
                                <div className="w-24 text-center">新增收藏</div>
                                <div className="w-24 text-center">新增分享</div>
                                <div className="w-24 text-center">新增评论</div>
                              </div>
                            </div>
                          )}

                          {(selectedRanking?.name.includes('阅读榜') ||
                            selectedRanking?.name.includes('低粉爆文榜')) && (
                            <div className="flex items-center flex-1">
                              <div className="flex items-center space-x-12">
                                <div className="w-24 text-center">在看数</div>
                                <div className="w-24 text-center">阅读数</div>
                                <div className="w-24 text-center">点赞数</div>
                                <div className="w-24 text-center">转发数</div>
                              </div>
                            </div>
                          )}

                          {!selectedRanking?.name.includes('增量') &&
                            !selectedRanking?.name.includes('阅读榜') &&
                            !selectedRanking?.name.includes('低粉爆文榜') && (
                              <div className="flex items-center flex-1">
                                <div className="flex items-center space-x-12">
                                  <div className="w-24 text-center">点赞</div>
                                  <div className="w-24 text-center">评论</div>
                                  <div className="w-24 text-center">分享</div>
                                  <div className="w-24 text-center">收藏</div>
                                </div>
                              </div>
                            )}
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
                            {item.cover && !imgErrors[item.id || ''] ? (
                              <img
                                src={getImageUrl(item.cover)}
                                alt={item.title}
                                className="object-cover w-full h-full"
                                onError={() => handleImageError(item.id || '')}
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
                                {item.author &&
                                !imgErrors[`${item.id || ''}-avatar`] ? (
                                  <img
                                    src={getImageUrl(item.author.avatar)}
                                    alt={item.author.name}
                                    className="w-5 h-5 rounded-full"
                                    onError={() =>
                                      handleImageError(
                                        `${item.id || ''}-avatar`,
                                      )
                                    }
                                  />
                                ) : (
                                  <div className="flex items-center justify-center w-5 h-5 bg-gray-200 rounded-full">
                                    <UserOutlined className="text-xs text-gray-500" />
                                  </div>
                                )}
                                <span className="text-sm text-gray-600">
                                  {item.author.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {item.author.fansCount !== null &&
                                    item.author.fansCount.toLocaleString() !==
                                      '' && (
                                      <>
                                        粉丝数{' '}
                                        {item.author.fansCount.toLocaleString()}
                                      </>
                                    )}
                                </span>

                                <span className="text-xs text-gray-400">
                                  发布于{' '}
                                  {dayjs(item.publishTime).format(
                                    'YYYY-MM-DD HH:mm',
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center text-sm">
                            <div className="w-32 text-gray-500">
                              <span>{item.category}</span>
                              {/* <span className="ml-2">{item.type}</span> */}
                            </div>

                            {/* 快手增量榜单字段单独设置 */}
                            {selectedRanking?.name.includes('增量') && (selectedPlatform?.id === platformIdParams.ksPlatformId) && (
                              <div className="flex items-center justify-between flex-1">
                                <div className="flex items-center space-x-12">
                                  <div className="w-24 text-center">
                                    {item.anaAdd.addInteractiveCount ? (
                                      <span className="text-[#a66ae4] flex items-center justify-center">
                                        <span className="mr-1 font-bold text-red-500">
                                          ↑
                                        </span>
                                        {formatNumber(
                                          item.anaAdd.addInteractiveCount,
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-[#a66ae4] flex items-center justify-center">
                                        -
                                      </span>
                                    )}

                                    {item.anaAdd.interactiveCount ? (
                                      <p
                                        className="text-[#a66ae4]"
                                        style={{
                                          fontSize: '12px',
                                          border: '1px solid #a66ae4',
                                          borderRadius: '15px',
                                          padding: '2px',
                                          marginTop: '6px',
                                        }}
                                      >
                                        <span className="mr-1 font-bold text-red-500">
                                          ↑
                                        </span>
                                        总
                                        {formatNumber(
                                          item.anaAdd.interactiveCount,
                                        )}
                                      </p>
                                    ) : (
                                      <p
                                        style={{
                                          fontSize: '12px',
                                          padding: '2px',
                                          marginTop: '6px',
                                        }}
                                      >
                                        -
                                      </p>
                                    )}
                                  </div>
                                  <div className="w-24 text-center">
                                    <span className="text-[#a66ae4] flex items-center justify-center">
                                      <span className="mr-1 text-red-500">
                                        ↑
                                      </span>
                                      {formatNumber(
                                        item.anaAdd.addLikeCount,
                                      )}
                                    </span>
                                    <p
                                      className="text-[#a66ae4]"
                                      style={{
                                        fontSize: '12px',
                                        border: '1px solid #a66ae4',
                                        borderRadius: '15px',
                                        padding: '2px',
                                        marginTop: '6px',
                                      }}
                                    >
                                      总
                                      {formatNumber(item.anaAdd.useLikeCount)}
                                    </p>
                                  </div>
                                  <div className="w-24 text-center">
                                    <span className="text-[#a66ae4] flex items-center justify-center">
                                      <span className="mr-1 text-red-500">
                                        ↑
                                      </span>
                                      {formatNumber(item.anaAdd.addShareCount)}
                                    </span>
                                    <p
                                      className="text-[#a66ae4]"
                                      style={{
                                        fontSize: '12px',
                                        border: '1px solid #a66ae4',
                                        borderRadius: '15px',
                                        padding: '2px',
                                        marginTop: '6px',
                                      }}
                                    >
                                      总
                                      {formatNumber(item.anaAdd.useShareCount)}
                                    </p>
                                  </div>
                                  <div className="w-24 text-center">
                                    <span className="text-[#a66ae4] flex items-center justify-center">
                                      <span className="mr-1 text-red-500">
                                        ↑
                                      </span>
                                      {formatNumber(
                                        item.anaAdd.addCommentCount,
                                      )}
                                    </span>
                                    <p
                                      className="text-[#a66ae4]"
                                      style={{
                                        fontSize: '12px',
                                        border: '1px solid #a66ae4',
                                        borderRadius: '15px',
                                        padding: '2px',
                                        marginTop: '6px',
                                      }}
                                    >
                                      总
                                      {formatNumber(
                                        item.anaAdd.useCommentCount,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}


                            {selectedRanking?.name.includes('增量') && !(selectedPlatform?.id === platformIdParams.ksPlatformId) && (
                              <div className="flex items-center justify-between flex-1">
                                <div className="flex items-center space-x-12">
                                  <div className="w-24 text-center">
                                    {item.anaAdd.addInteractiveCount ? (
                                      <span className="text-[#a66ae4] flex items-center justify-center">
                                        <span className="mr-1 font-bold text-red-500">
                                          ↑
                                        </span>
                                        {formatNumber(
                                          item.anaAdd.addInteractiveCount,
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-[#a66ae4] flex items-center justify-center">
                                        -
                                      </span>
                                    )}

                                    {item.anaAdd.interactiveCount ? (
                                      <p
                                        className="text-[#a66ae4]"
                                        style={{
                                          fontSize: '12px',
                                          border: '1px solid #a66ae4',
                                          borderRadius: '15px',
                                          padding: '2px',
                                          marginTop: '6px',
                                        }}
                                      >
                                        <span className="mr-1 font-bold text-red-500">
                                          ↑
                                        </span>
                                        总
                                        {formatNumber(
                                          item.anaAdd.interactiveCount,
                                        )}
                                      </p>
                                    ) : (
                                      <p
                                        style={{
                                          fontSize: '12px',
                                          padding: '2px',
                                          marginTop: '6px',
                                        }}
                                      >
                                        -
                                      </p>
                                    )}
                                  </div>
                                  <div className="w-24 text-center">
                                    <span className="text-[#a66ae4] flex items-center justify-center">
                                      <span className="mr-1 text-red-500">
                                        ↑
                                      </span>
                                      {formatNumber(
                                        item.anaAdd.addCollectCount,
                                      )}
                                    </span>
                                    <p
                                      className="text-[#a66ae4]"
                                      style={{
                                        fontSize: '12px',
                                        border: '1px solid #a66ae4',
                                        borderRadius: '15px',
                                        padding: '2px',
                                        marginTop: '6px',
                                      }}
                                    >
                                      总
                                      {formatNumber(item.anaAdd.useCollectCount)}
                                    </p>
                                  </div>
                                  <div className="w-24 text-center">
                                    <span className="text-[#a66ae4] flex items-center justify-center">
                                      <span className="mr-1 text-red-500">
                                        ↑
                                      </span>
                                      {formatNumber(item.anaAdd.addShareCount)}
                                    </span>
                                    <p
                                      className="text-[#a66ae4]"
                                      style={{
                                        fontSize: '12px',
                                        border: '1px solid #a66ae4',
                                        borderRadius: '15px',
                                        padding: '2px',
                                        marginTop: '6px',
                                      }}
                                    >
                                      总
                                      {formatNumber(item.anaAdd.useShareCount)}
                                    </p>
                                  </div>
                                  <div className="w-24 text-center">
                                    <span className="text-[#a66ae4] flex items-center justify-center">
                                      <span className="mr-1 text-red-500">
                                        ↑
                                      </span>
                                      {formatNumber(
                                        item.anaAdd.addCommentCount,
                                      )}
                                    </span>
                                    <p
                                      className="text-[#a66ae4]"
                                      style={{
                                        fontSize: '12px',
                                        border: '1px solid #a66ae4',
                                        borderRadius: '15px',
                                        padding: '2px',
                                        marginTop: '6px',
                                      }}
                                    >
                                      总
                                      {formatNumber(
                                        item.anaAdd.useCommentCount,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {(selectedRanking?.name.includes('阅读榜') ||
                              selectedRanking?.name.includes('低粉爆文榜')) && (
                              <div className="flex items-center justify-between flex-1">
                                <div className="flex items-center space-x-12">
                                  <div className="w-24 text-center">
                                    <span className="text-[#a66ae4] flex items-center justify-center">
                                      {item.stats.watchCount || '-'}
                                    </span>
                                  </div>
                                  <div className="w-24 text-center">
                                    <span className="text-[#a66ae4] flex items-center justify-center">
                                      {item.stats.viewCount || '-'}
                                    </span>
                                  </div>
                                  <div className="w-24 text-center">
                                    <span className="text-[#a66ae4] flex items-center justify-center">
                                      {item.stats.likeCount || '-'}
                                    </span>
                                  </div>
                                  <div className="w-24 text-center">
                                    <span className="text-[#a66ae4] flex items-center justify-center">
                                      {(item as any).shareCount || '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {!selectedRanking?.name.includes('增量') &&
                              !selectedRanking?.name.includes('阅读榜') &&
                              !selectedRanking?.name.includes('低粉爆文榜') && (
                                <div className="flex items-center justify-between flex-1">
                                  <div className="flex items-center space-x-12">
                                    <div className="w-24 text-center">
                                      <span className="text-[#a66ae4] flex items-center justify-center">
                                        {item.stats.likeCount || '-'}
                                      </span>
                                    </div>
                                    <div className="w-24 text-center">
                                      <span className="text-[#a66ae4] flex items-center justify-center">
                                        {item.stats.commentCount || '-'}
                                      </span>
                                    </div>
                                    <div className="w-24 text-center">
                                      <span className="text-[#a66ae4] flex items-center justify-center">
                                        {(item as any).shareCount || '-'}
                                      </span>
                                    </div>
                                    <div className="w-24 text-center">
                                      <span className="text-[#a66ae4] flex items-center justify-center">
                                        {(item as any).collectCount || '-'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
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
          <div style={{ width: '100%', height: '20px' }}></div>
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

      {/* 添加必要的CSS和JavaScript */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hover-trigger:hover + circle {
          r: 3;
        }
      `,
        }}
      />

      <script
        dangerouslySetInnerHTML={{
          __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const hoverTriggers = document.querySelectorAll('.hover-trigger');
            const tooltip = document.querySelector('.tooltip');
            const hotvalueEl = document.querySelector('.tooltip .hotvalue');
            const timeEl = document.querySelector('.tooltip .time');
            
            hoverTriggers.forEach(trigger => {
              trigger.addEventListener('mouseenter', function(e) {
                const value = this.getAttribute('data-value');
                const time = this.getAttribute('data-time');
                
                hotvalueEl.textContent = (value / 10000).toFixed(1) + 'w';
                timeEl.textContent = time;
                
                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + 'px';
                tooltip.style.top = (rect.top - 40) + 'px';
                tooltip.style.opacity = '1';
              });
              
              trigger.addEventListener('mouseleave', function() {
                tooltip.style.opacity = '0';
              });
            });
          });
        `,
        }}
      />

      {/* 添加隐藏滚动条的样式 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </>
  );
};

export default Trending;
