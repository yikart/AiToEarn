import React, { useEffect, useState, useMemo } from 'react';
import { List, Card, Avatar, Typography, Space, Tag, Button, Skeleton, Empty } from 'antd';
import { EyeOutlined, LikeOutlined, MessageOutlined, ShareAltOutlined, HeartOutlined, BarChartOutlined, AimOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useTransClient } from '@/app/i18n/client';
import { getSentPosts } from '@/api/sent';
import { SentPost } from '@/api/types/sent.types';
import styles from './listMode.module.scss';
import { PublishStatus } from '@/api/plat/types/publish.types';
import dayjs from 'dayjs';
import { useAccountStore } from '@/store/account';
import { useShallow } from 'zustand/react/shallow';
import { getOssUrl } from '@/utils/oss';
import { AccountPlatInfoMap } from '@/app/config/platConfig';

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

  // 获取账户列表用于映射
  const { accountList } = useAccountStore(
    useShallow((state) => ({
      accountList: state.accountList,
    })),
  );

  // 创建 accountId 到账户信息的映射
  const accountMap = useMemo(() => {
    const map = new Map();
    accountList.forEach(account => {
      map.set(account.id, account);
    });
    return map;
  }, [accountList]);

  const loadPosts = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      // 构建请求参数，如果没有 platform 和 uid 就不传
      const params: any = {
        // page: pageNum,
        // pageSize: 20

        status: PublishStatus.RELEASED,
        // 开始时间：一个月前；结束时间：现在
        time: [dayjs().subtract(1, 'month').utc().format(), dayjs().utc().format()],
      };
      
      if (platform) {
        params.accountType = platform;
      }
      
      if (uid) {
        params.uid = uid;
      }
      
      const response = await getSentPosts(params);
      
      // 处理新的API响应格式
      const responseData = (response as any)?.data || response;
      
      console.log('SentList API Response:', {
        code: (response as any)?.code,
        message: (response as any)?.message,
        data: responseData,
        params
      });
      
      // 处理响应数据，直接使用responseData作为数组
      const postsData = Array.isArray(responseData) ? responseData : (responseData?.posts || responseData?.list || []);
      
      if (append) {
        setPosts(prev => [...prev, ...postsData]);
      } else {
        setPosts(postsData);
      }
      setHasMore(responseData?.hasMore || false);
      
      // 通知父组件数据变化
      if (onDataChange) {
        onDataChange(responseData?.total || postsData.length);
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
    // 进入页面就调用，不管有没有 platform 和 uid
    loadPosts(1, false);
  }, [platform, uid]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, true);
  };

  const formatTime = (timestamp: string | number) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
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
    // 根据 accountId 获取账户信息
    const account = accountMap.get(post.accountId);
    const platInfo = AccountPlatInfoMap.get(post.accountType as any);
    
    const timeInfo = formatTime(post.publishTime);
    const postTime = typeof post.publishTime === 'string' ? new Date(post.publishTime).getTime() : post.publishTime;
    const daysAgo = Math.floor((Date.now() - postTime) / (1000 * 60 * 60 * 24));

    return (
      <div key={post.id} className={styles.sentPostItem}>
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
                src={getOssUrl(account?.avatar || '')} 
                className={styles.userAvatar}
              >
                {account?.nickname?.charAt(0) || account?.account?.charAt(0) || post.title?.charAt(0) || '?'}
              </Avatar>
              <div className={styles.userDetails}>
                <div className={styles.username}>
                  {account?.nickname || account?.account || post.title || '未知账户'}
                </div>
                <div className={styles.userSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {platInfo && (
                    <img src={platInfo.icon} alt={platInfo.name} style={{ width: '16px', height: '16px', borderRadius: '2px' }} />
                  )}
                  <span>{platInfo?.name || post.accountType}</span>
                </div>
              </div>
              {/* <div className={styles.chatIcon}>💬</div> */}
            </div>

            {/* 帖子文本 */}
            <div className={styles.postText}>
              {post.desc}
            </div>

           

            {/* 媒体内容 */}
            {post.coverUrl && (
              <div className={styles.mediaContainer}>
                <div className={styles.mediaWrapper}>
                  <img 
                    src={post.coverUrl} 
                    alt={post.title || post.desc}
                    className={styles.mediaImage}
                  />
                  {(post.type === 'video' || post.type?.includes('video')) && (
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
                  <div className={styles.metricValue}>{post.engagement?.likeCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><ShareAltOutlined /></div>
                  <div className={styles.metricLabel}>Shares</div>
                  <div className={styles.metricValue}>{post.engagement?.shareCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><EyeOutlined /></div>
                  <div className={styles.metricLabel}>Views</div>
                  <div className={styles.metricValue}>{post.engagement?.viewCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><MessageOutlined /></div>
                  <div className={styles.metricLabel}>Comments</div>
                  <div className={styles.metricValue}>{post.engagement?.commentCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><HeartOutlined /></div>
                  <div className={styles.metricLabel}>Favorites</div>
                  <div className={styles.metricValue}>{post.engagement?.favoriteCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><AimOutlined /></div>
                  <div className={styles.metricLabel}>Click</div>
                  <div className={styles.metricValue}>{post.engagement?.clickCount || 0}</div>
                </div>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}><EyeInvisibleOutlined /></div>
                  <div className={styles.metricLabel}>Impression</div>
                  <div className={styles.metricValue}>{post.engagement?.impressionCount || 0}</div>
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
                  onClick={() => window.open(post.workLink, '_blank')}
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

  // 过滤掉无法在账户列表中匹配到的数据
  const validPosts = useMemo(() => {
    return posts.filter(post => accountMap.has(post.accountId));
  }, [posts, accountMap]);

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
      {validPosts.length > 0 ? (
        <>
          <div className={styles.postsContainer}>
            {validPosts.map(renderPostItem)}
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
