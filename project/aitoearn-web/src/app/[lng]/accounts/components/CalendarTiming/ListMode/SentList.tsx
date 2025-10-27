import React, { useEffect, useState } from 'react';
import { List, Card, Avatar, Typography, Space, Tag, Button, Skeleton, Empty } from 'antd';
import { EyeOutlined, LikeOutlined, MessageOutlined, ShareAltOutlined, HeartOutlined, BarChartOutlined, AimOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useTransClient } from '@/app/i18n/client';
import { getSentPosts } from '@/api/sent';
import { SentPost } from '@/api/types/sent.types';
import styles from './listMode.module.scss';

const { Text, Title } = Typography;

interface SentListProps {
  platform: string;
  uid: string;
  onDataChange?: (count: number) => void;
  accountInfo?: {
    avatar: string;
    nickname: string;
    account: string;
  };
}

const SentList: React.FC<SentListProps> = ({ platform, uid, onDataChange, accountInfo }) => {
  const { t } = useTransClient("account");
  const [posts, setPosts] = useState<SentPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadPosts = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const response = await getSentPosts({
        platform,
        uid,
        page: pageNum,
        pageSize: 20
      });
      
      // 处理新的API响应格式
      const responseData = (response as any)?.data || response;
      
      console.log('SentList API Response:', {
        code: (response as any)?.code,
        message: (response as any)?.message,
        data: responseData
      });
      
      if (append) {
        setPosts(prev => [...prev, ...(responseData?.posts || [])]);
      } else {
        setPosts(responseData?.posts || []);
      }
      setHasMore(responseData?.hasMore || false);
      
      // 通知父组件数据变化
      if (onDataChange) {
        onDataChange(responseData?.total || 0);
      }
    } catch (error) {
      console.error('Failed to load sent posts:', error);
      // 发生错误时重置数据
      if (!append) {
        setPosts([]);
        setHasMore(false);
        if (onDataChange) {
          onDataChange(0);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (platform && uid) {
      loadPosts(1, false);
    }
  }, [platform, uid]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, true);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  const getMediaTypeTag = (mediaType: string) => {
    const typeMap = {
      video: { color: 'red', text: '视频' },
      image: { color: 'blue', text: '图片' },
      article: { color: 'green', text: '文章' }
    };
    return typeMap[mediaType as keyof typeof typeMap] || { color: 'default', text: mediaType };
  };

  const renderPostItem = (post: SentPost) => {
    const timeInfo = formatTime(post.publishTime);
    const daysAgo = Math.floor((Date.now() - post.publishTime) / (1000 * 60 * 60 * 24));

    return (
      <div key={post.postId} className={styles.sentPostItem}>
        <div className={styles.postCard}>
          {/* 日期时间头部 */}
          <div className={styles.postDateHeader}>
            <div className={styles.dateTime}>
              <span className={styles.dateText}>{timeInfo.date}</span>
              <span className={styles.timeText}>{timeInfo.time}</span>
            </div>
          </div>

          {/* 帖子内容 */}
          <div className={styles.postContent}>
            {/* 用户信息 */}
            <div className={styles.userInfo}>
              <Avatar 
                size={40} 
                src={accountInfo?.avatar} 
                className={styles.userAvatar}
              >
                {accountInfo?.nickname?.charAt(0) || post.title.charAt(0)}
              </Avatar>
              <div className={styles.userDetails}>
                <div className={styles.username}>{accountInfo?.nickname || post.title}</div>
                <div className={styles.userSubtitle}>{accountInfo?.account || post.content}</div>
              </div>
              {/* <div className={styles.chatIcon}>💬</div> */}
            </div>

            {/* 帖子文本 */}
            <div className={styles.postText}>
              {post.content}
            </div>

           

            {/* 媒体内容 */}
            {post.thumbnail && (
              <div className={styles.mediaContainer}>
                <div className={styles.mediaWrapper}>
                  <img 
                    src={post.thumbnail} 
                    alt={post.title || post.content}
                    className={styles.mediaImage}
                  />
                  {post.mediaType === 'video' && (
                    <div className={styles.playButton}>
                      <div className={styles.playIcon}>▶</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 互动数据 */}
            <div className={styles.engagementMetrics}>
              <div className={styles.metricsRow}>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><LikeOutlined /></div>
                  <div className={styles.metricLabel}>Likes</div>
                  <div className={styles.metricValue}>{post.likeCount}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><ShareAltOutlined /></div>
                  <div className={styles.metricLabel}>Shares</div>
                  <div className={styles.metricValue}>{post.shareCount}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><EyeOutlined /></div>
                  <div className={styles.metricLabel}>Views</div>
                  <div className={styles.metricValue}>{post.viewCount }</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><MessageOutlined /></div>
                  <div className={styles.metricLabel}>Comments</div>
                  <div className={styles.metricValue}>{post.commentCount }</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><HeartOutlined /></div>
                  <div className={styles.metricLabel}>Favorites</div>
                  <div className={styles.metricValue}>{post.favoriteCount}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><AimOutlined /></div>
                  <div className={styles.metricLabel}>Click</div>
                  <div className={styles.metricValue}>{post.clickCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><EyeInvisibleOutlined /></div>
                  <div className={styles.metricLabel}>Impression</div>
                  <div className={styles.metricValue}>{post.impressionCount || 0}</div>
                </div>
                <div className={styles.chartIcon}><BarChartOutlined /></div>
              </div>
            </div>

            {/* 底部信息 */}
            <div className={styles.postFooter}>
              <div className={styles.creationInfo}>
                {t('listMode.createdDaysAgo' as any, { days: daysAgo })}
              </div>
              <div className={styles.actionButtons}>
                <Button 
                  type="link" 
                  size="small"
                  className={styles.viewPostBtn}
                  onClick={() => window.open(post.permaLink, '_blank')}
                >
                  {t('listMode.viewPost' as any)} ↗️
                </Button>
                <Button 
                  type="text" 
                  size="small"
                  className={styles.moreBtn}
                >
                  ⋮
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <div className={styles.sentList}>
        <div className={styles.loadingContainer}>
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sentList}>
      {posts.length > 0 ? (
        <>
          <div className={styles.postsContainer}>
            {posts.map(renderPostItem)}
          </div>
          {hasMore && (
            <div className={styles.loadMoreContainer}>
              <Button 
                loading={loading}
                onClick={loadMore}
                className={styles.loadMoreButton}
              >
                加载更多
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyState}>
          <Empty
            description={t('listMode.noSentPosts' as any)}
          />
        </div>
      )}
    </div>
  );
};

export default SentList;
