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
  hotValue?: number;
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
  hotValueHistory: HotValueHistory[]; // 热度趋势数据
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

// 在文件顶部添加爆款标题相关的接口
interface ViralTitle {
  _id: string;
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

  // 在 Trending 组件中添加时间类型状态
  const [timeTypes, setTimeTypes] = useState<string[]>([]);
  const [selectedTimeType, setSelectedTimeType] = useState<string>('');

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
        await fetchRankingCategories(firstRanking._id);
        
        // 获取榜单内容
        await fetchRankingContents(firstRanking._id, 1);
      } else {
        // 如果没有榜单数据，清空相关状态
        setSelectedRanking(null);
        setCategories(['全部']);
        setSelectedCategory('全部');
        setRankingContents([]);
      }
    } catch (error) {
      console.error('获取平台榜单失败:', error);
      setRankingList([]);
      setSelectedRanking(null);
      setCategories(['全部']);
      setSelectedCategory('全部');
      setRankingContents([]);
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
        const filteredData = data.filter(item => item !== '全部');
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
    fetchPlatformRanking(platform._id);
  };

  // 修改榜单选择处理函数
  const handleRankingSelect = async (ranking: PlatformRanking) => {
    // 如果点击的是当前已选中的榜单，不做任何操作
    if (selectedRanking?._id === ranking._id) return;
    
    // 设置选中的榜单
    setSelectedRanking(ranking);
    
    // 重置分页到第一页
    setCurrentPage(1);
    
    
    // 获取榜单内容
    await fetchRankingContents(ranking._id, 1, selectedCategory !== '全部' ? selectedCategory : undefined);
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

  // 获取爆款标题平台列表
  const fetchViralTitlePlatforms = async () => {
    setViralTitleLoading(true);
    try {
      const platforms = await platformApi.findPlatformsWithData();
      setViralTitlePlatforms(platforms);
      if (platforms.length > 0) {
        setSelectedViralPlatform(platforms[0]);
        fetchViralTitleCategories(platforms[0]._id);
        fetchViralTitleData(platforms[0]._id);
      }
    } catch (error) {
      console.error('获取爆款标题平台失败:', error);
      setViralTitlePlatforms([]);
    } finally {
      setViralTitleLoading(false);
    }
  };

  // 获取爆款标题分类
  const fetchViralTitleCategories = async (platformId: string) => {
    try {
      const categories = await platformApi.findCategoriesByPlatform(platformId);
      setViralTitleCategories(categories);
      if (categories.length > 0) {
        setSelectedViralCategory('');
      }
    } catch (error) {
      console.error('获取爆款标题分类失败:', error);
      setViralTitleCategories([]);
    }
  };

  // 获取爆款标题数据
  const fetchViralTitleData = async (platformId: string) => {
    setViralTitleLoading(true);
    try {
      const data = await platformApi.findTopByPlatformAndCategories(platformId);
      // 使用 as any 绕过类型检查
      const formattedData = data.map((item) => ({
        category: item.category,
        titles: item.titles.map((title) => ({
          ...title,
          platformId:
            typeof title.platformId === 'object'
              ? title.platformId._id
              : title.platformId,
          // 确保 publishTime 是 string 或 null
          publishTime: title.publishTime ? title.publishTime.toString() : null,
          // 确保 createTime 和 updateTime 是 string
          createTime: title.createTime.toString(),
          updateTime: title.updateTime.toString(),
        })),
      })) as ViralTitleCategory[];

      setViralTitleData(formattedData);
    } catch (error) {
      console.error('获取爆款标题数据失败:', error);
      setViralTitleData([]);
    } finally {
      setViralTitleLoading(false);
    }
  };

  // 处理爆款标题平台选择
  const handleViralPlatformSelect = (platform: Platform) => {
    setSelectedViralPlatform(platform);
    fetchViralTitleCategories(platform._id);
    fetchViralTitleData(platform._id);
  };

  // 修改处理分类选择的函数
  const handleViralCategorySelect = async (category: string) => {
    setSelectedViralCategory(category);

    if (category && selectedViralPlatform) {
      // 如果选择了特定分类，调用API获取该分类数据
      setSingleCategoryName(category);
      setShowSingleCategory(true);
      fetchSingleCategoryData(selectedViralPlatform._id, category);
    } else {
      // 如果选择"全部"，返回到分类概览
      setShowSingleCategory(false);
      setSingleCategoryData([]);
      setSingleCategoryName('');
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
      
      // 如果没有选择消息类型，则自动选择第一个
      if (!selectedMsgType && msgTypeList.length > 0) {
        setSelectedMsgType(msgTypeList[0]);
      }
      
      // 使用当前选择的消息类型或第一个消息类型
      const msgType = selectedMsgType || msgTypeList[0];
      
      // 如果没有选择平台，则使用第一个平台
      if (!selectedPlatformId && platforms.length > 0) {
        setSelectedPlatformId(platforms[0]._id);
      }
      
      // 调用处理函数获取数据
      setTopicLoading(true);
      try {
        // 获取二级分类
        await fetchTopicTypes(msgType);
        
        // 获取专题数据 - 使用时间类型参数和当前选择的平台
        const hotTopicsData = await platformApi.getAllTopics({
          msgType: msgType,
          platformId: selectedPlatformId || (platforms.length > 0 ? platforms[0]._id : undefined),
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
        timeType: selectedTimeRange
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
        timeType: timeRange
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
          page,      // 添加页码
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
  ) => {
    setSingleCategoryLoading(true);
    try {
      // 修改 API 调用，使用正确的参数格式
      const response = await platformApi.findByPlatformAndCategory(platformId, {
        category: category,
        page: page,
        pageSize: 20, // 每页显示数量
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
            ? item.platformId._id
            : item.platformId,
        // 确保 publishTime 是 string 或 null
        publishTime: item.publishTime ? item.publishTime.toString() : null,
        // 确保 createTime 和 updateTime 是 string
        createTime: item.createTime.toString(),
        updateTime: item.updateTime.toString(),
      })) as ViralTitle[];

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
  const handleViewMoreClick = (category: string) => {
    if (selectedViralPlatform) {
      setSingleCategoryName(category);
      setShowSingleCategory(true);
      fetchSingleCategoryData(selectedViralPlatform._id, category);
    }
  };

  // 处理返回全部点击
  const handleBackToAllCategories = () => {
    setShowSingleCategory(false);
    setSingleCategoryData([]);
    setSingleCategoryName('');
  };

  // 处理单个分类分页
  const handleSingleCategoryPageChange = (page: number) => {
    if (selectedViralPlatform && singleCategoryName) {
      fetchSingleCategoryData(
        selectedViralPlatform._id,
        singleCategoryName,
        page,
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

  // 处理时间类型选择
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
      timeType
    );
  };

  // 修改获取专题内容的函数
  const fetchTopicContents = async (
    msgType: string,
    category: string = '',
    subCategory: string = '',
    page: number = 1,
    timeType: string = ''
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
      
      const { data, meta } = await platformApi.getAllTopics(params);
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
    <span className="text-sm text-gray-500 mr-2">时间类型:</span>
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
  </div>

  return (
    <>
      <div className="flex h-full bg-gray-50">
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
                      <InfoCircleOutlined className="mr-2" />
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
                      key={platform._id}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all duration-200
                        ${
                          selectedViralPlatform?._id === platform._id
                            ? 'bg-[#f4ebff] text-[#a66ae4]'
                            : 'hover:bg-gray-50'
                        }`}
                      onClick={() => handleViralPlatformSelect(platform)}
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
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 p-6">
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

                {/* 如果是单个分类视图，显示返回全部按钮 */}
                {showSingleCategory && (
                  <div className="flex justify-end mt-4">
                    <div
                      className="px-4 py-2 text-sm text-gray-600 hover:text-[#a66ae4] border border-gray-200 rounded-full hover:border-[#e6d3f7]"
                      onClick={handleBackToAllCategories}
                    >
                      返回全部
                    </div>
                  </div>
                )}
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
                            key={title._id}
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
                              <div className="flex items-center mt-1 text-sm text-gray-500">
                                <span>{title.category}</span>
                                <span className="mx-2">•</span>
                                <span>
                                  {title.createTime
                                    ? dayjs(title.createTime).format(
                                        'YYYY-MM-DD',
                                      )
                                    : '未知日期'}
                                </span>
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
                            handleViewMoreClick(categoryData.category)
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
                        key={title._id}
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
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <span>{title.category}</span>
                            <span className="mx-2">•</span>
                            <span>
                              {title.createTime
                                ? dayjs(title.createTime).format('YYYY-MM-DD')
                                : '未知日期'}
                            </span>
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
                        key={platformData.platform._id}
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
                              `platform-${platformData.platform._id}`
                            ] ? (
                              <img
                                src={getImageUrl(platformData.platform.icon)}
                                alt={platformData.platform.name}
                                className="w-6 h-6"
                                onError={() =>
                                  handleImageError(
                                    `platform-${platformData.platform._id}`,
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
                                  key={topic._id || index}
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
                                        {typeof topic.hotValue === 'number'
                                          ? (topic.hotValue / 10000).toFixed(
                                              1,
                                            ) + 'w'
                                          : '0w'}
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
                        key={platform._id}
                        className={`${buttonStyles.base} ${
                          selectedPlatformId === platform._id
                            ? buttonStyles.primary
                            : buttonStyles.secondary
                        }`}
                        onClick={() => {
                          const platformId = platform._id;
                          // 先设置平台 ID
                          setSelectedPlatformId(platformId);
                          // 直接调用查询，传入当前点击的平台 ID
                          handleFilterChange(platformId);
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          {platform.icon &&
                          !imgErrors[`platform-${platform._id}`] ? (
                            <img
                              src={getImageUrl(platform.icon)}
                              alt={platform.name}
                              className="w-4 h-4"
                              onError={() =>
                                handleImageError(`platform-${platform._id}`)
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
                    <span className="text-sm text-gray-500 mr-3">时间范围:</span>
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
                      <span className="text-sm text-gray-500 mr-3">分类:</span>
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
                      <div className="col-span-5 pl-2">标题/作者</div>
                      <div className="col-span-1 text-center">分类</div>
                      <div className="col-span-1 text-center">点赞</div>
                      <div className="col-span-1 text-center">分享</div>
                      <div className="col-span-1 text-center">阅读</div>
                    </div>

                    {/* 内容列表 */}
                    {topicContents.map((item, index) => (
                      <div
                        key={item._id}
                        className="grid grid-cols-12 py-5 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer items-center"
                        onClick={() => handleContentClick(item.url, item.title)}
                      >
                        {/* 排名 */}
                        <div className="col-span-1 text-lg font-bold text-orange-500 text-center">
                          {((topicPagination?.currentPage || 1) - 1) *
                            (topicPagination?.itemsPerPage || 20) +
                            index +
                            1}
                        </div>

                        {/* 封面 */}
                        <div className="col-span-2 pl-2">
                          <div className="relative w-full overflow-hidden bg-gray-100 rounded-lg aspect-video">
                            {item.cover && !imgErrors[item._id as string] ? (
                              <img
                                src={getImageUrl(item.cover)}
                                alt={item.title}
                                className="object-cover w-full h-full"
                                onError={() =>
                                  handleImageError(item._id as string)
                                }
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-center text-gray-400">
                                暂无图片
                              </div>
                            )}
                            {item.type === 'video' && (
                              <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                                视频
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 标题和作者信息 */}
                        <div className="col-span-5 pl-4 ">
                          <h3 className="text-base font-medium line-clamp-2 hover:text-[#a66ae4] text-left">
                            {item.title}
                          </h3>
                          <div style={{width:'100%', height:'60px'}}></div>
                          <div className="flex items-center mt-2">
                            <div className="flex items-center">
                              {item.avatar && !imgErrors[`avatar-${item._id}`] ? (
                                <img
                                  src={getImageUrl(item.avatar)}
                                  alt={item.author}
                                  className="w-5 h-5 rounded-full mr-1"
                                  onError={() => handleImageError(`avatar-${item._id}`)}
                                />
                              ) : (
                                <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mr-1">
                                  <span className="text-xs text-gray-500">
                                    {item.author?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm text-gray-600 mr-2">{item.author}</span>
                              {item.fans > 0 && (
                                <span className="text-xs text-gray-400 mr-2">
                                  {item.fans >= 10000 
                                    ? `${(item.fans / 10000).toFixed(1)}万粉丝` 
                                    : `${item.fans}粉丝`}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                发布于 {dayjs(item.publishTime).format('YYYY-MM-DD HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 分类信息 */}
                        <div className="col-span-1 text-center">
                          <div className="text-sm text-gray-600">{item.category}</div>
                          {item.subCategory && (
                            <div className="text-xs text-gray-400 mt-1">{item.subCategory}</div>
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

                        {/* 阅读/观看数 */}
                        <div className="col-span-1 text-center">
                          <div className="text-[#a66ae4] font-medium">
                            {item.readCount 
                              ? (item.readCount >= 10000 
                                  ? `${(item.readCount / 10000).toFixed(1)}w` 
                                  : item.readCount)
                              : '-'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.watchingCount !== null ? '观看' : '阅读'}
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
          ) : (
            // 热门内容界面
            <>
              {/* 榜单选择 */}
              {rankingList.length > 0 && (
                <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
                  <div className="flex space-x-4">
                    {rankingList
                      .filter(ranking => !ranking.parentId)
                      .map((ranking) => (
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
                        return current && current > dayjs().endOf('day');
                      }}
                    />
                    
                    {/* 子榜单选择 - 只在选择了父榜单后显示 */}
                    {selectedRanking && rankingList.filter(ranking => 
                      // 如果当前选中的是子榜单，则显示与其父榜单相关的所有子榜单
                      ranking.parentId === (selectedRanking.parentId || selectedRanking._id)
                    ).length > 0 && (
                      <div className="flex flex-wrap gap-2 ml-4">
                        {rankingList
                          .filter(ranking => 
                            // 如果当前选中的是子榜单，则显示与其父榜单相关的所有子榜单
                            ranking.parentId === (selectedRanking.parentId || selectedRanking._id)
                          )
                          .map((ranking) => (
                            <button
                              key={ranking._id}
                              className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 border-none outline-none ${
                                selectedRanking?._id === ranking._id
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
                                  粉丝数{' '}
                                  {item.author.fansCount?.toLocaleString()}
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
