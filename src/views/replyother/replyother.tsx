import {
  icpGetCommentListByOther,
  icpGetSecondCommentListByOther,
  WorkData,
  CommentData,
  getCommentSearchNotes,
  ipcGetInteractionRecordList,
  ipcGetAutoRunOfInteractionInfo,
  icpDianzanDyOther,
  icpShoucangDyOther,
} from '@/icp/replyother';
import {
  Avatar,
  Button,
  Card,
  Col,
  Row,
  message,
  Modal,
  List,
  Space,
  Typography,
  Divider,
  Empty,
  Form,
  Input,
  Slider,
  InputNumber,
  Radio,
  Tooltip,
  Spin,
  Checkbox,
  Tabs,
  Table,
} from 'antd';
import { useCallback, useRef, useState, useEffect } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import styles from './reply.module.scss';
import ReplyWorks, { ReplyWorksRef } from './components/replyWorks';
import ReplyComment, { ReplyCommentRef } from './components/replyComment';
import AddAutoRun, { AddAutoRunRef } from './components/addAutoRun';
import {
  LikeOutlined,
  StarOutlined,
  CloseOutlined,
  CommentOutlined,
  UnorderedListOutlined,
  SearchOutlined,
  SettingOutlined,
  RobotOutlined,
  UserOutlined,
  SendOutlined,
  DownOutlined,
  QuestionCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import Masonry from 'react-masonry-css';
import { AccountModel } from '../../../electron/db/models/account';
import WebView from '../../components/WebView';
// @ts-ignore
import { useInView } from 'react-intersection-observer';
import { icpCreatorList } from '@/icp/reply';
import { icpCreateInteractionOneKey } from '@/icp/replyother';
import { forEach } from 'lodash';

export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [postFirstId, setPostFirstId] = useState<string>('');
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);
  const [activeAccountType, setActiveAccountType] = useState<string>('');
  const [activeAccount, setActiveAccount] = useState<AccountModel>();
  const Ref_ReplyWorks = useRef<ReplyWorksRef>(null);
  const Ref_AddAutoRun = useRef<AddAutoRunRef>(null);
  const Ref_ReplyComment = useRef<ReplyCommentRef>(null);
  const [postList, setPostList] = useState<any[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentPost, setCurrentPost] = useState<any>(null);
  const [currentComments, setCurrentComments] = useState<any[]>([]);
  const { Text, Title } = Typography;
  const [webviewModalVisible, setWebviewModalVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isWebviewLoading, setIsWebviewLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState<{
    count: number;
    hasMore: boolean;
    pcursor?: any;
  }>({
    count: 0,
    hasMore: true,
    pcursor: 1,
  });

  // 创建 webview 的引用
  const webviewRef = useRef<any>(null);

  // 在组件挂载后添加事件监听器
  useEffect(() => {
    const webviewElement = webviewRef.current;
    if (webviewElement && webviewModalVisible) {
      // 添加事件监听器
      const handleLoad = () => {
        setIsWebviewLoading(false);
      };

      webviewElement.addEventListener('did-finish-load', handleLoad);

      // 清理函数
      return () => {
        if (webviewElement) {
          webviewElement.removeEventListener('did-finish-load', handleLoad);
        }
      };
    }
  }, [webviewModalVisible, webviewRef.current]);

  // 添加状态记录
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [collectedPosts, setCollectedPosts] = useState<Record<string, boolean>>(
    {},
  );

  // 添加互动记录相关状态
  const [interactionRecords, setInteractionRecords] = useState<any[]>([]);
  const [interactionPageInfo, setInteractionPageInfo] = useState({
    page_size: 10,
    page_no: 1,
    total: 0,
  });

  // 添加进程中互动相关状态
  const [runningInteractions, setRunningInteractions] = useState<
    {
      createTime: number; // 1744200185113;
      message: string; // '进行中';
      status: number; // 0;
      title: string; // '互动任务';
      updateTime: number; // 1744200185113;
    }[]
  >([]);

  // 获取进程中互动信息
  const getRunningInteractions = async () => {
    try {
      // console.log('------ 开始获取进程中互动信息');
      const res = await ipcGetAutoRunOfInteractionInfo();
      // console.log('------ 获取进程中互动信息结果:', res);
      if (res) {
        setRunningInteractions([{ ...res }]);
      } else {
        setRunningInteractions([]);
      }
    } catch (error) {
      // console.error('------ 获取进程中互动信息失败:', error);
      message.error('获取进程中互动信息失败');
    }
  };

  // 定期获取进程中互动信息
  useEffect(() => {
    if (activeAccountId !== -1) {
      getRunningInteractions();
      const timer = setInterval(() => {
        getRunningInteractions();
      }, 5000); // 每5秒更新一次
      return () => clearInterval(timer);
    }
  }, [activeAccountId]);

  // 获取互动记录
  const getInteractionRecords = async () => {
    try {
      console.log(
        '------ 开始获取互动记录',
        activeAccountId,
        'activeAccountType:',
        activeAccountType,
      );
      const res = await ipcGetInteractionRecordList(
        {
          page_size: interactionPageInfo.page_size,
          page_no: interactionPageInfo.page_no,
        },
        {
          accountId: activeAccountId,
          type: activeAccountType as any,
        },
      );
      console.log('------ 获取互动记录结果:', res);
      const data: any = res;
      setInteractionRecords(data.list || []);
      setInteractionPageInfo((prev) => ({
        ...prev,
        total: data.total || 0,
      }));
    } catch (error) {
      console.error('------ 获取互动记录失败:', error);
      message.error('获取互动记录失败');
    }
  };

  // 监听账户变化，重新获取记录
  useEffect(() => {
    if (activeAccountId !== -1) {
      getInteractionRecords();
    }
  }, [activeAccountId, activeAccountType]);

  // 添加任务表单相关状态
  const [taskForm] = Form.useForm();
  const [commentType, setCommentType] = useState<'ai' | 'custom'>('ai');
  const [customComments, setCustomComments] = useState<string[]>([
    '很棒！',
    '喜欢这个',
    '支持一下',
    '不错哦',
  ]);

  // 添加任务弹窗状态
  const [taskModalVisible, setTaskModalVisible] = useState(false);

  // 添加加载状态
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 使用 react-intersection-observer 创建一个观察器
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5, // 当元素50%可见时触发
    triggerOnce: false, // 允许多次触发
  });

  // 监听 inView 变化，当元素可见时加载更多
  useEffect(() => {
    if (inView && pageInfo.hasMore && !isLoadingMore) {
      loadMorePosts();
    }
  }, [inView, pageInfo.hasMore, isLoadingMore]);

  // 加载更多帖子
  const loadMorePosts = async () => {
    // console.log('------ loadMorePosts == 1');
    if (
      !pageInfo.hasMore ||
      isLoadingMore ||
      !searchKeyword ||
      searchKeyword == ''
    )
      return;
    // console.log('------ loadMorePosts == 2');
    if (activeAccountType !== 'xhs') {
      if (!postFirstId || postFirstId == '') return;
    }
    // console.log('------ loadMorePosts == 3');
    setIsLoadingMore(true);
    try {
      setTimeout(async () => {
        await getSearchListFunc(activeAccountId, searchKeyword);
      }, 0);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 添加选择模式状态
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  // 处理选择模式切换
  const handleSelectModeToggle = () => {
    console.log('isSelectMode', isSelectMode);
    // if (!isSelectMode) {
    setSelectedPosts([]); // 清空已选择的帖子
    // }
    setIsSelectMode(!isSelectMode);
  };

  // 处理帖子选择
  const handlePostSelect = (postId: string) => {
    setSelectedPosts((prev) => {
      if (prev.includes(postId)) {
        return prev.filter((id) => id !== postId);
      } else {
        return [...prev, postId];
      }
    });
  };

  // 修改提交任务函数
  const submitTask = async (values: any) => {
    console.log('任务参数:', values);
    console.log('选中的帖子:', selectedPosts);
    message.success('任务已下发');
    setTaskModalVisible(false);
    setIsSelectMode(false);

    // return;

    forEach(postList, (postId) => {
      const post = postList.find((item) => item.dataId === postId);
      if (!post) return;
      likePost(post);
    });

    if (!selectedPosts.length) return;

    // 从postList中提取选中的帖子数据
    const selectedPostData = selectedPosts.map((postId) => {
      return postList.find((item) => item.dataId === postId);
    }); // 过滤掉undefined的值

    console.log('------ selectedPostData', selectedPostData);

    // 调用icpCreateInteractionOneKey函数

    let option: any = {
      platform: activeAccountType,
      ...values,
    };
    if (values.commentType != 'ai') {
      option.commentContent = customComments.join(',');
    }

    console.log('------ option', option);

    // return;

    const res = await icpCreateInteractionOneKey(
      activeAccountId,
      selectedPostData,
      option,
    );
    console.log('------ res', res);

    // if (res) {
    message.success('互动任务已下发，前往记录查看');
    // } else {
    //   message.error('任务下发失败，请重试');
    // }

    setSelectedPosts([]);
  };

  // 添加自定义评论
  const addCustomComment = (value: string, type: 'comment') => {
    if (!value.trim()) return;
    setCustomComments([...customComments, value.trim()]);
    taskForm.setFieldValue('newComment', '');
  };

  // 删除自定义评论
  const removeCustomComment = (index: number, type: 'comment') => {
    const newComments = [...customComments];
    newComments.splice(index, 1);
    setCustomComments(newComments);
  };

  // 修改状态结构，使用Map存储二级评论
  const [secondCommentsMap, setSecondCommentsMap] = useState<
    Record<string, any[]>
  >({});

  // 添加搜索关键词状态
  const [searchKeyword, setSearchKeyword] = useState('爱优赚');

  async function getCreatorList(thisid: any) {
    setWordList([]);
    if (activeAccountId === -1) {
      return;
    }
    const thisida = thisid ? thisid : activeAccountId;
    const res = await icpCreatorList(thisida);
    console.log('------ icpCreatorList', res);
    setWordList(res.list);
  }

  // 搜索列表 - 平台自己搜索
  async function getSearchListFunc(
    thisid: number,
    qe?: any,
    isfirst?: boolean,
  ) {
    if (!pageInfo.hasMore && pageInfo.pcursor !== 1 && !isfirst) {
      console.log('没有更多数据了，不再发送请求');
      return;
    }

    const res = await getCommentSearchNotes(thisid, qe, {
      ...pageInfo,
      postFirstId: postFirstId,
    });
    console.log('------ getSearchListFunc -- @@:', res);
    if (isfirst && activeAccountType == 'douyin') {
      setPostFirstId(res.orgList?.log_pb?.impr_id);
    } else if (isfirst && activeAccountType == 'KWAI') {
      console.log(
        '------ getSearchListFunc -- @@:',
        res.orgList?.searchSessionId,
      );
      setPostFirstId(res.orgList?.searchSessionId);
    }
    if (res.list?.length) {
      // 如果是加载更多，则追加到现有列表
      setPostList((prev) =>
        pageInfo.pcursor !== 1 ? [...prev, ...res.list] : res.list,
      );

      // 更新分页信息
      setPageInfo({
        count: res.pageInfo.count || 0,
        hasMore: res.pageInfo.hasMore || false,
        pcursor: res.pageInfo.pcursor || '',
      });
    } else {
      // 如果没有返回数据，设置hasMore为false
      setPageInfo((prev) => ({
        ...prev,
        hasMore: false,
      }));
    }
  }

  /**
   * 获取二级评论列表
   */
  async function getSecondCommentList(item: any) {
    try {
      const res = await icpGetSecondCommentListByOther(
        activeAccountId,
        item,
        item.data.id,
        item.data.sub_comment_cursor,
      );
      console.log('------ getSecondCommentList', res);

      // 更新二级评论Map
      setSecondCommentsMap((prev) => ({
        ...prev,
        [item.data.id]: res.list || [],
      }));

      // 更新当前评论列表中的二级评论
      setCurrentComments((prevComments) =>
        prevComments.map((comment) =>
          comment.data.id === item.data.id
            ? {
                ...comment,
                subCommentList: res.list || [],
                isSubCommentsLoaded: true,
              }
            : comment,
        ),
      );
    } catch (error) {
      console.error('获取二级评论失败', error);
      message.error('获取二级评论失败');
    }
  }

  /**
   * 打开作品评论
   * @param data
   */
  function openReplyWorks(data: any) {
    // 确保数据格式兼容
    const workData: WorkData = {
      dataId: data.dataId || data.dataId,
      title: data.title || '',
      coverUrl: data.cover || data.coverUrl || '',
      // 添加其他必要的字段
      authorId: data.author.id,
    };
    Ref_ReplyWorks.current?.init(activeAccountId, workData);
  }

  /**
   * 打开评论回复
   * @param data
   */
  function openReplyComment(data: CommentData) {
    data.videoAuthId = currentPost.author.id;
    console.log('------ openReplyComment', data);
    Ref_ReplyComment.current?.init(activeAccountId, data);
  }

  /**
   * 打开创建自动任务
   * @param data
   */
  function openAddAutoRun(data: WorkData) {
    Ref_AddAutoRun.current?.init(activeAccountId, data.dataId);
  }

  /**
   * 显示评论列表弹窗
   */
  const showCommentModal = async (post: any) => {
    console.log('------ showCommentModal post', post);
    setCurrentPost(post);
    setCommentModalVisible(true);

    try {
      // 获取评论列表
      const res = await icpGetCommentListByOther(activeAccountId, {
        dataId: post.dataId,
        option: {
          xsec_token: post.option.xsec_token || post.xsec_token,
        },
      });
      console.log('------ getCommentListByOther res', res);
      // 为每个评论添加加载状态标记
      const commentsWithLoadingState = (res.list || []).map((comment) => ({
        ...comment,
        isSubCommentsLoaded: false,
        isLoadingSubComments: false,
      }));

      setCurrentComments(commentsWithLoadingState);
    } catch (error) {
      console.error('获取评论失败', error);
      message.error('获取评论失败');
    }
  };

  /**
   * 加载二级评论
   */
  const loadSubComments = async (comment: any) => {
    // 如果已经加载过，直接返回
    if (comment.isSubCommentsLoaded) return;

    // 设置加载状态
    setCurrentComments((prevComments) =>
      prevComments.map((item) =>
        item.data.id === comment.data.id
          ? { ...item, isLoadingSubComments: true }
          : item,
      ),
    );

    try {
      await getSecondCommentList(comment);
    } finally {
      // 无论成功失败，都取消加载状态
      setCurrentComments((prevComments) =>
        prevComments.map((item) =>
          item.data.id === comment.data.id
            ? { ...item, isLoadingSubComments: false }
            : item,
        ),
      );
    }
  };

  /**
   * 点赞帖子
   */
  const likePost = async (post: any) => {
    try {
      // 如果已经点赞，则不重复操作
      if (likedPosts[post.dataId]) {
        message.info('已经点赞过了');
        return;
      }

      const res = await icpDianzanDyOther(activeAccountId, post.dataId, {
        authid: post.author.id,
      });
      console.log('------ likePost', res);
      if (
        res === true ||
        res.status_code == 0 ||
        res.data?.code == 0 ||
        res.data?.visionVideoLike.result == 1
      ) {
        message.success('点赞成功');
        // 更新点赞状态
        setLikedPosts((prev) => ({
          ...prev,
          [post.dataId]: true,
        }));

        // 更新点赞数量
        setPostList((prevList) =>
          prevList.map((item) =>
            item.dataId === post.dataId
              ? {
                  ...item,
                  stats: {
                    ...item.stats,
                    likeCount: (item.stats?.likeCount || 0) + 1,
                  },
                }
              : item,
          ),
        );
      } else {
        message.error('点赞失败');
      }
    } catch (error) {
      message.error('点赞操作失败');
    }
  };

  /**
   * 收藏帖子
   */
  const collectPost = async (post: any) => {
    try {
      // 如果已经收藏，则不重复操作
      if (collectedPosts[post.dataId]) {
        message.info('已经收藏过了');
        return;
      }

      const res = await icpShoucangDyOther(activeAccountId, post.dataId);
      if (res.status_code == 0 || res.data?.code == 0) {
        message.success('收藏成功');
        // 更新收藏状态
        setCollectedPosts((prev) => ({
          ...prev,
          [post.dataId]: true,
        }));

        // 更新收藏数量
        setPostList((prevList) =>
          prevList.map((item) =>
            item.dataId === post.dataId
              ? {
                  ...item,
                  stats: {
                    ...item.stats,
                    collectCount: (item.stats?.collectCount || 0) + 1,
                  },
                }
              : item,
          ),
        );
      } else {
        message.error('收藏失败');
      }
    } catch (error) {
      message.error('收藏操作失败');
    }
  };

  /**
   * 点击图片打开链接
   */
  const handleImageClick = (post: any) => {
    if (!post || !post.dataId) return;

    let url = '';
    // 判断平台类型
    if (activeAccountType === 'xhs' || post.url?.includes('xiaohongshu.com')) {
      // 小红书链接格式
      url = `https://www.xiaohongshu.com/explore/${post.dataId}?xsec_token=${post.option.xsec_token || ''}&xsec_source=pc_search&source=web_explore_feed`;
    } else if (
      activeAccountType === 'douyin' ||
      post.url?.includes('douyin.com')
    ) {
      // 抖音链接格式
      console.log('------ post.dataId', post.dataId);
      url = `https://www.douyin.com/video/${post.dataId}`;
      console.log('------ url 2:', url);
    } else if (activeAccountType == 'KWAI') {
      // 快手链接格式
      url = `https://www.kuaishou.com/short-video/${post.dataId}`;
    } else {
      // 默认使用已有的url或者根据noteId构建通用链接
      url = post.url || `https://www.xiaohongshu.com/explore/${post.dataId}`;
    }

    setCurrentUrl(url);
    setIsWebviewLoading(true);
    setWebviewModalVisible(true);
  };

  // 计算断点值，用于响应式布局
  const breakpointColumnsObj = {
    default: 6, // 默认显示5列
    2270: 5, // 宽度小于2270px时显示5列
    1939: 4, // 宽度小于1900px时显示4列
    1600: 3, // 宽度小于1600px时显示4列
    1200: 2, // 宽度小于1200px时显示3列
    900: 2, // 宽度小于900px时显示2列
    600: 1, // 宽度小于600px时显示1列
  };

  // 处理搜索提交
  const handleSearch = () => {
    // 重置列表和分页信息
    setPostList([]);
    setPageInfo({
      count: 0,
      hasMore: true,
      pcursor: 1,
    });

    // 执行搜索
    setTimeout(() => {
      getSearchListFunc(activeAccountId, searchKeyword, true);
    }, 1000);
  };

  return (
    <div className={styles.reply} style={{ alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
        <AccountSidebar
          activeAccountId={activeAccountId}
          excludePlatforms={['wxSph']}
          onAccountChange={useCallback(
            (info) => {
              console.log('------ onAccountChange', info);
              setPageInfo({
                count: 0,
                hasMore: false,
                pcursor: 1,
              });
              setActiveAccount(info);
              setActiveAccountType(info.type);

              setPostList([]);

              setActiveAccountId(info.id);
              setTimeout(() => {
                getSearchListFunc(info.id, searchKeyword, true);
              }, 600);
            },
            [getCreatorList],
          )}
        />

        <div className={styles.postList} style={{ flex: 1, padding: '20px' }}>
          {activeAccountId === -1 ? (
            <div className={styles.account}>
              <div className="account-noSelect">
                <QuestionCircleOutlined />
                <span>请选择账户</span>
              </div>
            </div>
          ) : (
            <>
              <Tabs
                defaultActiveKey="1"
                items={[
                  {
                    key: '1',
                    label: '作品列表',
                    children: (
                      <>
                        <Row
                          justify="space-between"
                          align="middle"
                          style={{ marginBottom: 20 }}
                        >
                          <Col>
                            <Typography.Title level={4} style={{ margin: 0 }}>
                              任务：
                            </Typography.Title>
                          </Col>
                          <Col flex="auto" style={{ margin: '0 20px' }}>
                            <Input.Search
                              placeholder="输入关键词搜索"
                              value={searchKeyword}
                              onChange={(e) => setSearchKeyword(e.target.value)}
                              onSearch={handleSearch}
                              style={{ width: '100%' }}
                              enterButton
                            />
                          </Col>
                          <Col>
                            <Space>
                              <Button
                                type={isSelectMode ? 'primary' : 'default'}
                                icon={<DownOutlined />}
                                onClick={handleSelectModeToggle}
                                size="large"
                              >
                                {isSelectMode ? '取消选择' : '选择作品'}
                              </Button>
                              {isSelectMode && (
                                <Button
                                  type="primary"
                                  icon={<SendOutlined />}
                                  onClick={() => setTaskModalVisible(true)}
                                  size="large"
                                  disabled={selectedPosts.length === 0}
                                >
                                  下发任务 ({selectedPosts.length})
                                </Button>
                              )}
                              {!isSelectMode && (
                                <Button
                                  type="primary"
                                  icon={<DownOutlined />}
                                  onClick={() => {
                                    if (selectedPosts.length === 0) {
                                      message.error('请选择作品');
                                      return;
                                    }
                                    setTaskModalVisible(true);
                                  }}
                                  size="large"
                                >
                                  下发任务
                                </Button>
                              )}
                            </Space>
                          </Col>
                        </Row>

                        <Masonry
                          breakpointCols={breakpointColumnsObj}
                          className={styles.myMasonryGrid}
                          columnClassName={styles.myMasonryGridColumn}
                        >
                          {postList.map((item: any, index: number) => (
                            <List.Item
                              key={`${item.dataId || item.coverUrl}-${index}`}
                              className={styles.masonryItem}
                              onClick={() => {
                                if (isSelectMode) {
                                  handlePostSelect(item.dataId);
                                }
                              }}
                              style={{
                                cursor: isSelectMode ? 'pointer' : 'default',
                                background: selectedPosts.some(
                                  (p) => (p as any).dataId === item.dataId,
                                )
                                  ? 'rgba(24, 144, 255, 0.1)'
                                  : 'transparent',
                              }}
                            >
                              <Card
                                hoverable={isSelectMode}
                                className={styles.postCard}
                                cover={
                                  <div
                                    style={{
                                      cursor: 'pointer',
                                      position: 'relative',
                                    }}
                                    onClick={() =>
                                      !isSelectMode && handleImageClick(item)
                                    }
                                  >
                                    {isSelectMode && (
                                      <div
                                        style={{
                                          position: 'absolute',
                                          top: 10,
                                          left: 10,
                                          zIndex: 1,
                                        }}
                                      >
                                        <Checkbox
                                          checked={selectedPosts.includes(
                                            item.dataId,
                                          )}
                                          onChange={() =>
                                            handlePostSelect(item.dataId)
                                          }
                                        />
                                      </div>
                                    )}
                                    <img
                                      alt={item.title}
                                      src={item.coverUrl}
                                      style={{
                                        width: '100%',
                                        borderRadius: '10px 10px 0 0',
                                        objectFit: 'cover',
                                      }}
                                    />
                                  </div>
                                }
                                actions={[
                                  <Space
                                    key="like"
                                    onClick={() => likePost(item)}
                                  >
                                    <LikeOutlined
                                      style={{
                                        color: likedPosts[item.dataId]
                                          ? '#ff4d4f'
                                          : undefined,
                                        fontSize: likedPosts[item.dataId]
                                          ? '18px'
                                          : undefined,
                                      }}
                                    />
                                    <span>{item.likeCount || 0}</span>
                                  </Space>,
                                  <Space
                                    key="comment-list"
                                    onClick={() => showCommentModal(item)}
                                  >
                                    <UnorderedListOutlined />
                                    <span>{item.commentCount || ''}</span>
                                  </Space>,
                                  <Space
                                    key="reply"
                                    onClick={() => openReplyWorks(item)}
                                  >
                                    <CommentOutlined />
                                    <span>评论</span>
                                  </Space>,
                                  <Space
                                    key="collect"
                                    onClick={() => collectPost(item)}
                                  >
                                    <StarOutlined
                                      style={{
                                        color: collectedPosts[item.dataId]
                                          ? '#faad14'
                                          : undefined,
                                        fontSize: collectedPosts[item.dataId]
                                          ? '18px'
                                          : undefined,
                                      }}
                                    />
                                    <span>{item.collectCount || ''}</span>
                                  </Space>,
                                ]}
                              >
                                <Card.Meta
                                  avatar={
                                    <Avatar src={`${item.author?.avatar}`} />
                                  }
                                  title={item.author?.name}
                                  description={
                                    <div>
                                      <Text
                                        strong
                                        ellipsis
                                        style={{ display: 'block' }}
                                      >
                                        {item.title}
                                      </Text>
                                      <Text type="secondary" ellipsis={{}}>
                                        {item.content}
                                      </Text>
                                    </div>
                                  }
                                />
                              </Card>
                            </List.Item>
                          ))}
                        </Masonry>

                        {/* 加载更多区域 */}
                        <div ref={loadMoreRef} className={styles.loadMoreArea}>
                          {isLoadingMore && (
                            <div className={styles.loadingMore}>
                              <Spin size="small" />
                              <span style={{ marginLeft: 8 }}>加载中...</span>
                            </div>
                          )}

                          {!pageInfo.hasMore && postList.length > 0 && (
                            <div className={styles.noMoreData}>
                              <Divider plain>没有更多数据了</Divider>
                            </div>
                          )}
                        </div>
                      </>
                    ),
                  },
                  {
                    key: '2',
                    label: '互动记录',
                    children: (
                      <div style={{ marginTop: 0 }}>
                        <div style={{ marginBottom: 16, textAlign: 'right' }}>
                          <Button
                            type="primary"
                            icon={<SyncOutlined />}
                            onClick={getInteractionRecords}
                          >
                            刷新
                          </Button>
                        </div>
                        <Table
                          columns={[
                            {
                              title: '作品ID',
                              dataIndex: 'worksId',
                              key: 'worksId',
                            },
                            {
                              title: '作品标题',
                              dataIndex: 'worksTitle',
                              key: 'worksTitle',
                            },
                            {
                              title: '评论内容',
                              dataIndex: 'commentContent',
                              key: 'commentContent',
                            },
                            {
                              title: '点赞状态',
                              dataIndex: 'isLike',
                              key: 'isLike',
                              render: (isLike) =>
                                isLike ? '已点赞' : '未点赞',
                            },
                            {
                              title: '收藏状态',
                              dataIndex: 'isCollect',
                              key: 'isCollect',
                              render: (isCollect) =>
                                isCollect == 1 ? '已收藏' : '未收藏',
                            },
                            {
                              title: '互动时间',
                              dataIndex: 'updateTime',
                              key: 'updateTime',
                              render: (updateTime: any) => {
                                const date = new Date(updateTime);
                                const month = (date.getMonth() + 1)
                                  .toString()
                                  .padStart(2, '0');
                                const day = date
                                  .getDate()
                                  .toString()
                                  .padStart(2, '0');
                                const hours = date
                                  .getHours()
                                  .toString()
                                  .padStart(2, '0');
                                const minutes = date
                                  .getMinutes()
                                  .toString()
                                  .padStart(2, '0');
                                return `${month}-${day} ${hours}:${minutes}`;
                              },
                            },
                          ]}
                          dataSource={interactionRecords}
                          rowKey="id"
                          pagination={{
                            total: interactionPageInfo.total,
                            pageSize: interactionPageInfo.page_size,
                            current: interactionPageInfo.page_no,
                            onChange: (page, pageSize) => {
                              setInteractionPageInfo((prev) => ({
                                ...prev,
                                page_no: page,
                                page_size: pageSize,
                              }));
                              getInteractionRecords();
                            },
                          }}
                        />
                      </div>
                    ),
                  },
                  {
                    key: '3',
                    label: '进程中互动',
                    children: (
                      <div style={{ marginTop: 20 }}>
                        <div style={{ marginBottom: 16, textAlign: 'right' }}>
                          <Button
                            type="primary"
                            icon={<SyncOutlined />}
                            onClick={getRunningInteractions}
                          >
                            刷新
                          </Button>
                        </div>
                        <Table
                          columns={[
                            {
                              title: '标题',
                              dataIndex: 'title',
                              key: 'title',
                            },
                            {
                              title: '信息',
                              dataIndex: 'message',
                              key: 'message',
                            },
                            {
                              title: '状态',
                              dataIndex: 'status',
                              key: 'status',
                              render: (status: number) => {
                                const statusMap: Record<
                                  number | string,
                                  string
                                > = {
                                  0: '进行中',
                                  1: '已完成',
                                  '-1': '失败',
                                };
                                return statusMap[status] || '未知';
                              },
                            },
                            {
                              title: '开始时间',
                              dataIndex: 'createTime',
                              key: 'createTime',
                              render: (startTime: any) => {
                                const date = new Date(startTime);
                                const month = (date.getMonth() + 1)
                                  .toString()
                                  .padStart(2, '0');
                                const day = date
                                  .getDate()
                                  .toString()
                                  .padStart(2, '0');
                                const hours = date
                                  .getHours()
                                  .toString()
                                  .padStart(2, '0');
                                const minutes = date
                                  .getMinutes()
                                  .toString()
                                  .padStart(2, '0');
                                return `${month}-${day} ${hours}:${minutes}`;
                              },
                            },
                          ]}
                          dataSource={runningInteractions}
                          rowKey="id"
                          pagination={false}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </>
          )}
        </div>
      </div>

      {/* 任务下发弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SettingOutlined style={{ marginRight: 8 }} />
            <span>任务下发设置</span>
          </div>
        }
        open={taskModalVisible}
        onCancel={() => setTaskModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
        maskClosable={false}
      >
        <Form
          form={taskForm}
          layout="vertical"
          onFinish={submitTask}
          initialValues={{
            likeProb: 70,
            commentProb: 90,
            commentType: 'ai',
            collectProb: 30,
          }}
        >
          {/* 点赞概率 */}
          <Form.Item label="点赞概率" name="likeProb">
            <Slider
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%',
              }}
            />
          </Form.Item>

          <Divider orientation="left">评论设置</Divider>

          {/* 评论概率 */}
          <Form.Item label="评论概率" name="commentProb">
            <Slider
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%',
              }}
            />
          </Form.Item>

          {/* 评论类型 */}
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="评论类型" name="commentType">
                <Radio.Group onChange={(e) => setCommentType(e.target.value)}>
                  <Tooltip title="使用AI生成评论">
                    <Radio.Button value="ai">
                      <RobotOutlined /> Deepseek评论
                    </Radio.Button>
                  </Tooltip>
                  <Tooltip title="使用自定义评论">
                    <Radio.Button value="custom">
                      <UserOutlined /> 自定义评论
                    </Radio.Button>
                  </Tooltip>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          {/* 自定义评论列表 */}
          {commentType === 'custom' && (
            <div className={styles.customCommentsSection}>
              <div className={styles.commentsList}>
                {customComments.map((comment, index) => (
                  <div key={index} className={styles.commentItem}>
                    <span>{comment}</span>
                    <Button
                      type="text"
                      danger
                      size="small"
                      onClick={() => removeCustomComment(index, 'comment')}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>

              <Row gutter={8}>
                <Col flex="auto">
                  <Form.Item name="newComment">
                    <Input placeholder="添加自定义评论" />
                  </Form.Item>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    onClick={() =>
                      addCustomComment(
                        taskForm.getFieldValue('newComment'),
                        'comment',
                      )
                    }
                  >
                    添加
                  </Button>
                </Col>
              </Row>
            </div>
          )}

          {/* 收藏概率 */}
          <Form.Item label="收藏概率" name="collectProb">
            <Slider
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%',
              }}
            />
          </Form.Item>

          {/* 提交按钮 */}
          <Form.Item style={{ marginTop: 20, textAlign: 'right' }}>
            <Button
              onClick={() => setTaskModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
              下发任务
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 评论弹窗 */}
      <Modal
        title={
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Avatar src={`${currentPost?.author?.avatar}`} />
              <Text strong style={{ marginLeft: 10 }}>
                {currentPost?.author?.name}
              </Text>
            </div>
            <Text
              style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: 20 }}
            >
              {currentPost?.title}
            </Text>
          </div>
        }
        open={commentModalVisible}
        onCancel={() => setCommentModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <List
            itemLayout="vertical"
            dataSource={currentComments}
            renderItem={(comment) => (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    size="small"
                    onClick={() => openReplyComment(comment)}
                  >
                    回复
                  </Button>,
                  comment.data?.sub_comment_count > 0 &&
                    !comment.isSubCommentsLoaded && (
                      <Button
                        type="text"
                        size="small"
                        loading={comment.isLoadingSubComments}
                        onClick={() => loadSubComments(comment)}
                      >
                        查看{comment.data.sub_comment_count}条回复
                      </Button>
                    ),
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={comment.headUrl} />}
                  title={comment.nikeName}
                  description={comment.content}
                />

                {/* 二级评论列表 */}
                {comment.isSubCommentsLoaded &&
                  comment.subCommentList &&
                  comment.subCommentList.length > 0 && (
                    <div style={{ marginLeft: 40, marginTop: 10 }}>
                      <List
                        itemLayout="vertical"
                        dataSource={comment.subCommentList}
                        renderItem={(subComment: any) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={
                                <Avatar src={subComment.headUrl} size="small" />
                              }
                              title={
                                <Space>
                                  <span>{subComment.nikeName}</span>
                                  <span
                                    onClick={() => openReplyComment(subComment)}
                                    style={{
                                      color: '#999',
                                      fontSize: '10px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    回复
                                  </span>
                                </Space>
                              }
                              description={
                                subComment.content +
                                ' @ ' +
                                subComment.data.target_comment?.user_info
                                  .nickname
                              }
                            />
                          </List.Item>
                        )}
                      />

                      {/* 如果还有更多二级评论 */}
                      {/* {comment.data.sub_comment_has_more && (
                      <div style={{ textAlign: 'center', marginTop: 8 }}>
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => getSecondCommentList(comment)}
                        >
                          加载更多回复
                        </Button>
                      </div>
                    )} */}
                    </div>
                  )}
              </List.Item>
            )}
          />
        </div>
      </Modal>

      {/* 自定义网页内容弹出层 */}
      {webviewModalVisible && (
        <div className={styles.customWebviewModal}>
          <div
            className={styles.modalOverlay}
            onClick={() => setWebviewModalVisible(false)}
          ></div>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setWebviewModalVisible(false)}
                className={styles.closeButton}
              />
            </div>
            <div className={styles.modalBody}>
              {/*{isWebviewLoading && (*/}
              {/*  <div className={styles.loadingContainer}>*/}
              {/*    <Spin size="large" tip="加载中..." />*/}
              {/*  </div>*/}
              {/*)}*/}
              {currentUrl ? (
                <WebView
                  url={currentUrl}
                  partition={true}
                  cookieParams={{
                    cookies: JSON.parse(activeAccount!.loginCookie!),
                  }}
                />
              ) : (
                <Empty description="无法加载内容" />
              )}
            </div>
          </div>
        </div>
      )}

      <ReplyWorks ref={Ref_ReplyWorks} />
      <ReplyComment ref={Ref_ReplyComment} />
      <AddAutoRun ref={Ref_AddAutoRun} />
    </div>
  );
}
