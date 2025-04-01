/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-20 21:28:52
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import {
  icpCreatorList,
  icpGetCommentListByOther,
  icpGetSecondCommentListByOther,
  WorkData,
  CommentData,
  icpCreateCommentList,
  getCommentSearchNotes,
  
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
} from 'antd';
import { useCallback, useRef, useState, useEffect } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import styles from './reply.module.scss';
import ReplyWorks, { ReplyWorksRef } from './components/replyWorks';
import ReplyComment, { ReplyCommentRef } from './components/replyComment';
import AddAutoRun, { AddAutoRunRef } from './components/addAutoRun';
import { icpDianzanDyOther, icpShoucangDyOther } from '@/icp/replyother';
import { commentApi } from '@/api/comment';
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
} from '@ant-design/icons';
import Masonry from 'react-masonry-css';
import { AccountModel } from '../../../electron/db/models/account';
import WebView from '../../components/WebView';
import { useInView } from 'react-intersection-observer';

export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [commentList, setCommentList] = useState<CommentData[]>([]);
  const [secondCommentList, setSecondCommentList] = useState<any[]>([]);
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
    hasMore: false,
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

  // 添加任务表单相关状态
  const [taskForm] = Form.useForm();
  const [commentType, setCommentType] = useState<'ai' | 'custom'>('ai');
  const [replyCommentType, setReplyCommentType] = useState<'ai' | 'custom'>(
    'ai',
  );
  const [customComments, setCustomComments] = useState<string[]>([
    '很棒！',
    '喜欢这个',
    '支持一下',
    '不错哦',
  ]);
  const [customReplyComments, setCustomReplyComments] = useState<string[]>([
    '回复一下',
    '谢谢分享',
    '同意你的观点',
    '学习了',
  ]);

  // 添加任务弹窗状态
  const [taskModalVisible, setTaskModalVisible] = useState(false);

  // 添加加载状态
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // 使用 react-intersection-observer 创建一个观察器
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5, // 当元素50%可见时触发
    triggerOnce: false // 允许多次触发
  });
  
  // 监听 inView 变化，当元素可见时加载更多
  useEffect(() => {
    if (inView && pageInfo.hasMore && !isLoadingMore) {
      loadMorePosts();
    }
  }, [inView, pageInfo.hasMore, isLoadingMore]);
  
  // 加载更多帖子
  const loadMorePosts = async () => {
    if (!pageInfo.hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      await getSearchListFunc(activeAccountId, undefined);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 提交任务
  const submitTask = (values: any) => {
    console.log('任务参数:', values);
    message.success('任务已下发');
    setTaskModalVisible(false); // 关闭弹窗
    // 这里可以调用相应的API来执行任务
  };

  // 添加自定义评论
  const addCustomComment = (value: string, type: 'comment' | 'reply') => {
    if (!value.trim()) return;

    if (type === 'comment') {
      setCustomComments([...customComments, value.trim()]);
    } else {
      setCustomReplyComments([...customReplyComments, value.trim()]);
    }

    // 清空输入框
    if (type === 'comment') {
      taskForm.setFieldValue('newComment', '');
    } else {
      taskForm.setFieldValue('newReplyComment', '');
    }
  };

  // 删除自定义评论
  const removeCustomComment = (index: number, type: 'comment' | 'reply') => {
    if (type === 'comment') {
      const newComments = [...customComments];
      newComments.splice(index, 1);
      setCustomComments(newComments);
    } else {
      const newReplyComments = [...customReplyComments];
      newReplyComments.splice(index, 1);
      setCustomReplyComments(newReplyComments);
    }
  };

  // 修改状态结构，使用Map存储二级评论
  const [secondCommentsMap, setSecondCommentsMap] = useState<
    Record<string, any[]>
  >({});

  async function getCreatorList(thisid: any) {
    setWordList([]);
    if (activeAccountId === -1) {
      return;
    }
    const thisida = thisid ? thisid : activeAccountId;
    console.log('------ getCreatorList thisida', thisida);
    const res = await icpCreatorList(thisida);
    console.log('------ icpCreatorList', res);
    setWordList(res.list);
  }


// 搜索列表 - 平台自己搜索
  async function getSearchListFunc(thisid:any, qe?:any,) {
    const res = await getCommentSearchNotes(thisid, qe, pageInfo);
    
    if (res.list?.length) {
      // 如果是加载更多，则追加到现有列表
      setPostList(prev => pageInfo ? [...prev, ...res.list] : res.list);
      
      // 更新分页信息
      setPageInfo({
        count: res.pageInfo.count || 0,
        hasMore: res.pageInfo.hasMore || false,
        pcursor: res.pageInfo.pcursor || ''
      });
    }
  }

  async function getFwqCreatorList() {
    setWordList([]);
    const res = await commentApi.runCommentSearchNotesTask(
      'xhs_comments',
      '美妆',
    );
    console.log('------ getFwqCreatorList', res);

    const list = await commentApi.getCommentSearchNotes(
      'xhs_comments',
      '414381229d04c46cb39f97a5a0b7f9eb',
    );
    console.log('------ getCommentSearchNotes', list);
    const newlist = list.slice(0, 20);

    newlist[0].dataId = '67de8bc2000000001c00fdce';
    newlist[0].xsec_token = 'AB-q1Xl6YS66mGgN8y_DMoskX40j7FsSv2DoSQTYE6DYU=';

    newlist[1].dataId = '678ce103000000001803c791';
    newlist[1].xsec_token = 'AB-ktiN49qUSB2KL_4EN5bIQSRgCJR_AB1qIv8wAQvj94=';

    newlist[2].dataId = '67e3f5bb000000001c003a1c';
    newlist[2].xsec_token = 'CBbspa7hsvsencXRmokLj0bOnzo_IHlX0-qWD3Y3GPpcM=';

    setPostList(newlist || []);
  }

  /**
   * 获取评论列表
   */
  async function getCommentList(dataId: string) {
    // 7483006686274374962  7478960244136086784
    const res = await icpGetCommentListByOther(
      activeAccountId,
      // '7480598266392972596',
      {
        dataId: '678ce103000000001803c791',
        option: {
          xsec_token: 'AB-ktiN49qUSB2KL_4EN5bIQSRgCJR_AB1qIv8wAQvj94=',
        },
      },
    );
    console.log('------ icpGetCommentList', res);

    setCommentList(res.list);
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
   * 一键AI评论
   */
  async function createCommentList(data: WorkData) {
    const res = await icpCreateCommentList(activeAccountId, data.dataId);
    console.log('------ res', res);
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
    };
    Ref_ReplyWorks.current?.init(activeAccountId, workData);
  }

  /**
   * 打开评论回复
   * @param data
   */
  function openReplyComment(data: CommentData) {
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
   * 显示评论弹窗
   */
  const showCommentModal = async (post: any) => {
    setCurrentPost(post);
    setCommentModalVisible(true);

    try {
      // 获取评论列表
      const res = await icpGetCommentListByOther(activeAccountId, {
        dataId: post.dataId,
        option: {
          xsec_token:
            post.option.xsec_token || post.xsec_token,
        },
      });

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

      const res = await icpDianzanDyOther(activeAccountId, post.dataId);
      if (res.status_code == 0 || res.data?.code == 0) {
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
      url = post.url || `https://www.douyin.com/video/${post.dataId}`;
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

  return (
    <div className={styles.reply} style={{ alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
        {/* <Col span={3}> */}
        <AccountSidebar
          activeAccountId={activeAccountId}
          onAccountChange={useCallback(
            (info) => {
              console.log('------ onAccountChange', info);
              setActiveAccount(info);
              setActiveAccountType(info.type);
              if (info.type == 'xhs') {
                setPostList([])
                setPageInfo({
                  count: 0,
                  hasMore: false,
                  pcursor: 1,
                })
                setActiveAccountId(info.id);
                setTimeout(() => {
                  getSearchListFunc(info.id);
                }, 0);
              } else if(info.type == 'KWAI'){
                setActiveAccountId(info.id);
                getSearchListFunc(info.id);
              }else{
                setActiveAccountId(info.id);
                getCreatorList(info.id);
              }
            },
            [getCreatorList],
          )}
        />
        {/* </Col> */}

        {/* <Col span={21} > */}
        <div className={styles.postList} style={{ flex: 1, padding: '20px' }}>
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
            <Col>
              <Button
                type="primary"
                icon={<DownOutlined />}
                onClick={() => setTaskModalVisible(true)}
                size="large"
              >
                下发任务
              </Button>
            </Col>
          </Row>

          <Masonry
            breakpointCols={breakpointColumnsObj}
            className={styles.myMasonryGrid}
            columnClassName={styles.myMasonryGridColumn}
          >
            {postList.map((item: any) => (
              <div key={item.dataId || item.coverUrl} className={styles.masonryItem}>
                <Card
                  hoverable
                  cover={
                    <div
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleImageClick(item)}
                    >
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
                    <Space key="like" onClick={() => likePost(item)}>
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
                    <Space key="comment-list" onClick={() => showCommentModal(item)}>
                      <UnorderedListOutlined />
                      <span>{item.commentCount || 0}</span>
                    </Space>,
                    <Space key="reply" onClick={() => openReplyWorks(item)}>
                      <CommentOutlined />
                      <span>评论</span>
                    </Space>,
                    <Space key="collect" onClick={() => collectPost(item)}>
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
                      <span>{item.collectCount || 0}</span>
                    </Space>,
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar
                        src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${item.author?.name}`}
                      />
                    }
                    title={item.author?.name}
                    description={
                      <div>
                        <Text strong ellipsis style={{ display: 'block' }}>
                          {item.title}
                        </Text>
                        <Text type="secondary" ellipsis={{}}>
                          {item.content}
                        </Text>
                      </div>
                    }
                  />
                </Card>
              </div>
            ))}
          </Masonry>

          {/* 替换原来的加载更多按钮为自动加载区域 */}
          <div 
            ref={loadMoreRef} 
            className={styles.loadMoreArea}
          >
            {isLoadingMore && (
              <div className={styles.loadingMore}>
                <Spin size="small" />
                <span style={{ marginLeft: 8 }}>加载中...</span>
              </div>
            )}
            
            {!pageInfo.hasMore && postList.length > 0 && (
              <div className={styles.noMoreData}>
                <Divider plain>没有更多内容了</Divider>
              </div>
            )}
          </div>
        </div>
        {/* </Col> */}
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
      >
        <Form
          form={taskForm}
          layout="vertical"
          onFinish={submitTask}
          initialValues={{
            keyword: '美妆',
            limit: 20,
            likeProb: 70,
            commentProb: 50,
            commentType: 'ai',
            commentCount: 3,
            collectProb: 30,
            replyCommentType: 'ai',
            replyCommentCount: 2,
          }}
        >
          {/* 第一行：关键词和筛选条数 */}
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="视频关键词"
                name="keyword"
                rules={[{ required: true, message: '请输入关键词' }]}
              >
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="输入搜索关键词"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="筛选条数"
                name="limit"
                rules={[{ required: true, message: '请输入筛选条数' }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {/* 第二行：点赞概率 */}
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

          {/* 第三行：评论概率 */}
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

          {/* 第四行：评论类型和条数 */}
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="评论类型" name="commentType">
                <Radio.Group onChange={(e) => setCommentType(e.target.value)}>
                  <Tooltip title="使用AI生成评论">
                    <Radio.Button value="ai">
                      <RobotOutlined /> AI评论
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

            <Col span={12}>
              <Form.Item label="评论条数" name="commentCount">
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
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

          {/* 第五行：收藏概率 */}
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

          <Divider orientation="left">一级评论回复设置</Divider>

          {/* 第六行：回复类型和条数 */}
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="回复类型" name="replyCommentType">
                <Radio.Group
                  onChange={(e) => setReplyCommentType(e.target.value)}
                >
                  <Tooltip title="使用AI生成回复">
                    <Radio.Button value="ai">
                      <RobotOutlined /> AI回复
                    </Radio.Button>
                  </Tooltip>
                  <Tooltip title="使用自定义回复">
                    <Radio.Button value="custom">
                      <UserOutlined /> 自定义回复
                    </Radio.Button>
                  </Tooltip>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="回复条数" name="replyCommentCount">
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {/* 自定义回复列表 */}
          {replyCommentType === 'custom' && (
            <div className={styles.customCommentsSection}>
              <div className={styles.commentsList}>
                {customReplyComments.map((comment, index) => (
                  <div key={index} className={styles.commentItem}>
                    <span>{comment}</span>
                    <Button
                      type="text"
                      danger
                      size="small"
                      onClick={() => removeCustomComment(index, 'reply')}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>

              <Row gutter={8}>
                <Col flex="auto">
                  <Form.Item name="newReplyComment">
                    <Input placeholder="添加自定义回复" />
                  </Form.Item>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    onClick={() =>
                      addCustomComment(
                        taskForm.getFieldValue('newReplyComment'),
                        'reply',
                      )
                    }
                  >
                    添加
                  </Button>
                </Col>
              </Row>
            </div>
          )}

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
              <Avatar
                src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${currentPost?.author?.name}`}
              />
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
