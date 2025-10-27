/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-25 16:01:56
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import { icpCreatorList, WorkData } from '@/icp/reply';
import {
  Popconfirm,
  Tabs,
  Tooltip,
  Card,
  Typography,
  Divider,
  Spin,
} from 'antd';
import { useCallback, useRef, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import ReplyWorks, { ReplyWorksRef } from './components/replyWorks';
import AddAutoRun, { AddAutoRunRef } from './components/addAutoRun';
import CommentList, { CommentListRef } from './components/commentList';
import { QuestionCircleOutlined } from '@ant-design/icons';
import styles from './reply.module.scss';
import AutoRun from './autoRun';
import OneKeyReply, { OneKeyReplyRef } from './components/oneKeyReply';
import Masonry from 'react-masonry-css';
import { useInView } from 'react-intersection-observer';

export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);
  const [pageInfo, setPageInfo] = useState<{
    count: number;
    hasMore: boolean;
    pcursor?: string;
  }>({
    count: 0,
    hasMore: false,
  });
  const Ref_ReplyWorks = useRef<ReplyWorksRef>(null);
  const Ref_AddAutoRun = useRef<AddAutoRunRef>(null);
  const Ref_CommentList = useRef<CommentListRef>(null);
  const Ref_OneKeyReply = useRef<OneKeyReplyRef>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { Text } = Typography;

  // 使用 react-intersection-observer 创建一个观察器
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  // 监听 inView 变化，当元素可见时加载更多
  const loadMorePosts = useCallback(async () => {
    if (!pageInfo.hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await getCreatorList(activeAccountId);
    } finally {
      setIsLoadingMore(false);
    }
  }, [pageInfo.hasMore, isLoadingMore, activeAccountId]);

  // 监听 inView 变化
  if (inView && pageInfo.hasMore && !isLoadingMore) {
    loadMorePosts();
  }

  async function getCreatorList(accountId: number) {
    if (accountId === -1) return;
    const res = await icpCreatorList(accountId, pageInfo.pcursor);
    setPageInfo(res.pageInfo);
    setWordList([...wordList, ...res.list]);
  }

  /**
   * 打开作品评论
   * @param data
   */
  function openReplyWorks(data: WorkData) {
    Ref_ReplyWorks.current?.init(activeAccountId, data);
  }

  /**
   * 打开评论列表
   * @param data
   */
  function openCommentList(data: WorkData) {
    Ref_CommentList.current?.init(activeAccountId, data);
  }

  /**
   * 打开创建自动任务
   * @param data
   */
  function openAddAutoRun(data: WorkData) {
    Ref_AddAutoRun.current?.init(activeAccountId, data);
  }

  // 计算断点值，用于响应式布局
  const breakpointColumnsObj = {
    default: 6,
    2270: 5,
    1939: 4,
    1600: 3,
    1200: 2,
    900: 2,
    600: 1,
  };

  return (
    <div className={styles.account}>
      <AccountSidebar
        activeAccountId={activeAccountId}
        onAccountChange={useCallback((info) => {
          setWordList([]);
          setActiveAccountId(info.id);
          getCreatorList(info.id);
        }, [])}
      />

      <div className="w-full p-4 text-gray-500">
        <Tabs defaultActiveKey="1" className="w-full">
          <Tabs.TabPane tab="作品列表" key="1">
            {activeAccountId === -1 ? (
              <div className="flex items-center justify-center h-[300px]">
                <Tooltip title="请先在左侧侧边栏选择账户">
                  <QuestionCircleOutlined className="mr-2 text-3xl" />
                </Tooltip>
                点击左侧账户
              </div>
            ) : (
              <div className="p-4">
                <Masonry
                  breakpointCols={breakpointColumnsObj}
                  className={styles.myMasonryGrid}
                  columnClassName={styles.myMasonryGridColumn}
                >
                  {wordList.map((item) => (
                    <div key={item.dataId} className={styles.masonryItem}>
                      <Card
                        hoverable
                        className={styles.cardContainer}
                        cover={<img alt="example" src={item.coverUrl} />}
                        actions={[
                          <Tooltip key="comment-list" title="评论列表">
                            <span
                              className=" cursor-pointer"
                              onClick={() => openCommentList(item)}
                            >
                              评论列表
                            </span>
                          </Tooltip>,
                          <Tooltip key="reply" title="评论作品">
                            <span
                              className=" cursor-pointer"
                              onClick={() => openReplyWorks(item)}
                            >
                              评论作品
                            </span>
                          </Tooltip>,
                          <Tooltip key="onekey" title="一键评论">
                            <Popconfirm
                              title="确认进行一键评论"
                              onConfirm={() => {
                                Ref_OneKeyReply.current?.init(
                                  activeAccountId,
                                  item,
                                );
                              }}
                              okText="是"
                              cancelText="否"
                            >
                              <span className=" cursor-pointer">一键评论</span>
                            </Popconfirm>
                          </Tooltip>,
                          <Tooltip key="auto" title="自动评论">
                            <span
                              className="cursor-pointer"
                              onClick={() => openAddAutoRun(item)}
                            >
                              自动评论
                            </span>
                          </Tooltip>,
                        ]}
                      >
                        <Card.Meta
                          title={item.title || '无标题'}
                          description={
                            <Text type="secondary">
                              {item.desc || '暂无描述'}
                            </Text>
                          }
                        />
                      </Card>
                    </div>
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

                  {!pageInfo.hasMore && wordList.length > 0 && (
                    <div className={styles.noMoreData}>
                      <Divider plain>没有更多数据了</Divider>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Tabs.TabPane>
          <Tabs.TabPane tab="自动任务" key="2">
            <div style={{ width: '100%' }}>
              <AutoRun />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>

      <ReplyWorks ref={Ref_ReplyWorks} />
      <AddAutoRun ref={Ref_AddAutoRun} />
      <CommentList ref={Ref_CommentList} />
      <OneKeyReply ref={Ref_OneKeyReply} />
    </div>
  );
}
