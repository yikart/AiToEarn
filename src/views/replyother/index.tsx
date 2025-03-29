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
} from '@/icp/replyother';
import { Avatar, Button, Card, Col, Row, message, Modal, List, Space, Typography, Divider, Spin, Empty } from 'antd';
import { useCallback, useRef, useState, useEffect } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import styles from './reply.module.scss';
import Meta from 'antd/es/card/Meta';
import ReplyWorks, { ReplyWorksRef } from './components/replyWorks';
import ReplyComment, { ReplyCommentRef } from './components/replyComment';
import AddAutoRun, { AddAutoRunRef } from './components/addAutoRun';
import { icpDianzanDyOther, icpShoucangDyOther } from '@/icp/replyother';
import { commentApi } from '@/api/comment';
import { 
  LikeOutlined, 
  MessageOutlined, 
  StarOutlined,
  MoreOutlined,
  CloseOutlined,
  CommentOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import webview from 'electron';
import Masonry from 'react-masonry-css';

export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [commentList, setCommentList] = useState<CommentData[]>([]);
  const [secondCommentList, setSecondCommentList] = useState<any[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);
  const [activeAccountType, setActiveAccountType] = useState<string>('');
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
  const [collectedPosts, setCollectedPosts] = useState<Record<string, boolean>>({});

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
    let newlist = list.slice(0, 20);

    newlist[0].noteId = '67de8bc2000000001c00fdce';
    newlist[0].xsec_token = 'AB-q1Xl6YS66mGgN8y_DMoskX40j7FsSv2DoSQTYE6DYU=';

    newlist[1].noteId = '678ce103000000001803c791';
    newlist[1].xsec_token = 'AB-ktiN49qUSB2KL_4EN5bIQSRgCJR_AB1qIv8wAQvj94=';

    newlist[2].noteId = '67e3f5bb000000001c003a1c';
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
    const res = await icpGetSecondCommentListByOther(
      activeAccountId,
      // '7480598266392972596',
      item,
      item.data.id,
      item.data.sub_comment_cursor,
    );
    console.log('------ icpGetCommentList', res);

    setSecondCommentList(res.list);
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
      dataId: data.noteId || data.dataId,
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
    // 这里可以调用获取评论的API，暂时使用模拟数据
    const mockComments = await icpGetCommentListByOther(
      activeAccountId,
      {
        dataId: post.noteId,
        option: {
          xsec_token: post.xsec_token||'AB-ktiN49qUSB2KL_4EN5bIQSRgCJR_AB1qIv8wAQvj94=',
        },
      },
    );
    setCurrentComments(mockComments?.list || []);
    setCommentModalVisible(true);
  };

  /**
   * 点赞帖子
   */
  const likePost = async (post: any) => {
    try {
      // 如果已经点赞，则不重复操作
      if (likedPosts[post.noteId]) {
        message.info('已经点赞过了');
        return;
      }
      
      const res = await icpDianzanDyOther(activeAccountId, post.noteId);
      if (res.status_code == 0 || res.data?.code == 0) {
        message.success('点赞成功');
        // 更新点赞状态
        setLikedPosts(prev => ({
          ...prev,
          [post.noteId]: true
        }));
        
        // 更新点赞数量
        setPostList(prevList => 
          prevList.map(item => 
            item.noteId === post.noteId 
              ? { 
                  ...item, 
                  stats: { 
                    ...item.stats, 
                    likeCount: (item.stats?.likeCount || 0) + 1 
                  } 
                } 
              : item
          )
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
      if (collectedPosts[post.noteId]) {
        message.info('已经收藏过了');
        return;
      }
      
      const res = await icpShoucangDyOther(activeAccountId, post.noteId);
      if (res.status_code == 0 || res.data?.code == 0) {
        message.success('收藏成功');
        // 更新收藏状态
        setCollectedPosts(prev => ({
          ...prev,
          [post.noteId]: true
        }));
        
        // 更新收藏数量
        setPostList(prevList => 
          prevList.map(item => 
            item.noteId === post.noteId 
              ? { 
                  ...item, 
                  stats: { 
                    ...item.stats, 
                    collectCount: (item.stats?.collectCount || 0) + 1 
                  } 
                } 
              : item
          )
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
    if (!post || !post.noteId) return;
    
    let url = '';
    // 判断平台类型
    if (activeAccountType === 'xhs' || post.url?.includes('xiaohongshu.com')) {
      // 小红书链接格式
      url = `https://www.xiaohongshu.com/explore/${post.noteId}?xsec_token=${post.xsec_token || ''}&xsec_source=pc_search&source=web_explore_feed`;
    } else if (activeAccountType === 'douyin' || post.url?.includes('douyin.com')) {
      // 抖音链接格式
      url = post.url || `https://www.douyin.com/video/${post.noteId}`;
    } else {
      // 默认使用已有的url或者根据noteId构建通用链接
      url = post.url || `https://www.xiaohongshu.com/explore/${post.noteId}`;
    }
    
    setCurrentUrl(url);
    setIsWebviewLoading(true);
    setWebviewModalVisible(true);
  };

  // 计算断点值，用于响应式布局
  const breakpointColumnsObj = {
    default: 5, // 默认显示5列
    1600: 4,    // 宽度小于1600px时显示4列
    1200: 3,    // 宽度小于1200px时显示3列
    900: 2,     // 宽度小于900px时显示2列
    600: 1      // 宽度小于600px时显示1列
  };

  return (
    <div className={styles.reply}>
      <Row>
        <Col span={4}>
          <AccountSidebar
            activeAccountId={activeAccountId}
            onAccountChange={useCallback(
              (info) => {
                console.log('------ onAccountChange', info);
                setActiveAccountType(info.type);
                if (info.type == 'xhs') {
                  setActiveAccountId(info.id);
                  getFwqCreatorList();
                } else {
                  setActiveAccountId(info.id);
                  getCreatorList(info.id);
                }
              },
              [getCreatorList],
            )}
          />
        </Col>
        
        <Col span={20}>
          <div className={styles.postList}>
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className={styles.myMasonryGrid}
              columnClassName={styles.myMasonryGridColumn}
            >
              {postList.map((item: any) => (
                <div key={item.noteId || item._id} className={styles.masonryItem}>
                  <Card
                    hoverable
                    cover={
                      <div 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleImageClick(item)}
                      >
                        <img 
                          alt={item.title} 
                          src={item.cover} 
                          style={{ width: '100%', borderRadius: '10px 10px 0 0', objectFit: 'cover' }}
                        />
                      </div>
                    }
                    actions={[
                      <Space onClick={() => likePost(item)}>
                        <LikeOutlined style={{ 
                          color: likedPosts[item.noteId] ? '#ff4d4f' : undefined,
                          fontSize: likedPosts[item.noteId] ? '18px' : undefined
                        }} />
                        <span>{item.stats?.likeCount || 0}</span>
                      </Space>,
                      <Space onClick={() => showCommentModal(item)}>
                        <UnorderedListOutlined />
                        <span>列表</span>
                      </Space>,
                      <Space onClick={() => openReplyWorks(item)}>
                        <CommentOutlined />
                        <span>评论</span>
                      </Space>,
                      <Space onClick={() => collectPost(item)}>
                        <StarOutlined style={{ 
                          color: collectedPosts[item.noteId] ? '#faad14' : undefined,
                          fontSize: collectedPosts[item.noteId] ? '18px' : undefined
                        }} />
                        <span>{item.stats?.collectCount || 0}</span>
                      </Space>,
                    ]}
                  >
                    <Card.Meta
                      avatar={<Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${item.author?.name}`} />}
                      title={item.author?.name}
                      description={
                        <div>
                          <Text strong ellipsis style={{ display: 'block' }}>
                            {item.title}
                          </Text>
                          <Text type="secondary" ellipsis={{ rows: 2 }}>
                            {item.content}
                          </Text>
                        </div>
                      }
                    />
                  </Card>
                </div>
              ))}
            </Masonry>
          </div>
        </Col>
      </Row>

      {/* 评论弹窗 */}
      <Modal
        title={
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${currentPost?.author?.name}`} />
              <Text strong style={{ marginLeft: 10 }}>{currentPost?.author?.name}</Text>
            </div>
            <Text>{currentPost?.title}</Text>
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
                  comment.data?.sub_comment_has_more && (
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={() => getSecondCommentList(comment)}
                    >
                      查看更多回复
                    </Button>
                  )
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={comment.headUrl} />}
                  title={comment.nikeName}
                  description={comment.content}
                />
                
                {comment.subCommentList && comment.subCommentList.length > 0 && (
                  <div style={{ marginLeft: 40, marginTop: 10 }}>
                    <List
                      itemLayout="vertical"
                      dataSource={comment.subCommentList}
                      renderItem={(subComment: any) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar src={subComment.headUrl} size="small" />}
                            title={subComment.nikeName}
                            description={subComment.content}
                          />
                        </List.Item>
                      )}
                    />
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
          <div className={styles.modalOverlay} onClick={() => setWebviewModalVisible(false)}></div>
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
              {isWebviewLoading && (
                <div className={styles.loadingContainer}>
                  <Spin size="large" tip="加载中..." />
                </div>
              )}
              {currentUrl ? (
                <webview
                  ref={webviewRef}
                  src={currentUrl}
                  style={{ 
                    width: '100%', 
                    height: '100%'
                  }}
                  webpreferences="contextIsolation=yes, nodeIntegration=no"
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
