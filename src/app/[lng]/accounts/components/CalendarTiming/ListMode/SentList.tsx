import React, { useEffect, useState } from 'react';
import { List, Card, Avatar, Typography, Space, Tag, Button, Skeleton, Empty } from 'antd';
import { EyeOutlined, LikeOutlined, MessageOutlined, ShareAltOutlined, HeartOutlined } from '@ant-design/icons';
import { useTransClient } from '@/app/i18n/client';
import { getSentPosts } from '@/api/sent';
import { SentPost } from '@/api/types/sent.types';
import styles from './listMode.module.scss';

const { Text, Title } = Typography;

interface SentListProps {
  platform: string;
  uid: string;
  onDataChange?: (count: number) => void;
}

const SentList: React.FC<SentListProps> = ({ platform, uid, onDataChange }) => {
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
      const responseData = response.data || response;
      
      console.log('SentList API Response:', {
        code: response.code,
        message: response.message,
        data: responseData
      });
      
      if (append) {
        setPosts(prev => [...prev, ...(responseData.posts || [])]);
      } else {
        setPosts(responseData.posts || []);
      }
      setHasMore(responseData.hasMore || false);
      
      // 通知父组件数据变化
      if (onDataChange) {
        onDataChange(responseData.total || 0);
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
    const mediaTypeInfo = getMediaTypeTag(post.mediaType);

    return (
      <List.Item key={post.postId} className={styles.sentListItem}>
        <Card className={styles.sentPostCard}>
          <div className={styles.postHeader}>
            <div className={styles.postTime}>
              <Text className={styles.postDate}>{timeInfo.date}</Text>
              <Text className={styles.postTimeText}>{timeInfo.time}</Text>
            </div>
            <Tag color={mediaTypeInfo.color} className={styles.mediaTypeTag}>
              {mediaTypeInfo.text}
            </Tag>
          </div>

          <div className={styles.postContent}>
            <div className={styles.postInfo}>
              <div className={styles.postTitle}>
                <Title level={5} className={styles.titleText}>{post.title}</Title>
              </div>
              
              <div className={styles.postMeta}>
                <Space size="small" className={styles.metaItem}>
                  <EyeOutlined />
                  <Text>{post.viewCount}</Text>
                </Space>
                <Space size="small" className={styles.metaItem}>
                  <LikeOutlined />
                  <Text>{post.likeCount}</Text>
                </Space>
                <Space size="small" className={styles.metaItem}>
                  <MessageOutlined />
                  <Text>{post.commentCount}</Text>
                </Space>
                <Space size="small" className={styles.metaItem}>
                  <ShareAltOutlined />
                  <Text>{post.shareCount}</Text>
                </Space>
                <Space size="small" className={styles.metaItem}>
                  <HeartOutlined />
                  <Text>{post.favoriteCount}</Text>
                </Space>
              </div>
            </div>

            <div className={styles.postThumbnail}>
              {post.thumbnail && (
                <div className={styles.thumbnailContainer}>
                  <img 
                    src={post.thumbnail} 
                    alt={post.title}
                    className={styles.thumbnailImage}
                  />
                  {post.mediaType === 'video' && (
                    <div className={styles.playButton}>
                      <div className={styles.playIcon}>▶</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.postActions}>
            <Button 
              type="link" 
              size="small"
              onClick={() => window.open(post.permaLink, '_blank')}
            >
              查看帖子
            </Button>
          </div>
        </Card>
      </List.Item>
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
          <List
            dataSource={posts}
            renderItem={renderPostItem}
            className={styles.sentPostList}
          />
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
            description="暂无已发布的帖子"
          />
        </div>
      )}
    </div>
  );
};

export default SentList;
