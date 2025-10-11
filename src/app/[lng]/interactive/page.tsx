"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Button, message, Tag, Space, Select, Modal, Input, List, Avatar } from "antd";
import { DollarOutlined, HistoryOutlined, WalletOutlined, CommentOutlined, LikeOutlined, EyeOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { apiGetEngagementPosts, apiGetEngagementComments, apiReplyEngagementComment, apiGetPostComments, apiPublishPostComment, apiPublishCommentReply, apiGetCommentReplies } from "@/api/engagement";
import { EngagementPostItem, EngagementPlatform } from "@/api/types/engagement";
import { useTransClient } from "@/app/i18n/client";
import styles from "./interactive.module.css";
import WalletAccountSelect from "@/components/WalletAccountSelect";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import AccountSidebar from "@/app/[lng]/accounts/components/AccountSidebar/AccountSidebar";
// import { NoSSR } from "@kwooshung/react-no-ssr";

const { Option } = Select;

export default function InteractivePage() {
  const router = useRouter();
  const { lng } = useParams();
  const { userInfo, token } = useUserStore();
  const { t } = useTransClient('interactive' as any);

  // 账户侧边栏相关
  const { accountInit, accountActive, setAccountActive } = useAccountStore(
    useShallow((state) => ({
      accountInit: state.accountInit,
      accountActive: state.accountActive,
      setAccountActive: state.setAccountActive,
    })),
  );
  
  // 互动帖子列表状态
  const [posts, setPosts] = useState<EngagementPostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [hasMore, setHasMore] = useState(true);
  const [platform, setPlatform] = useState<EngagementPlatform | undefined>(undefined);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  // 评论状态
  const [commentVisible, setCommentVisible] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentPost, setCommentPost] = useState<EngagementPostItem | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsCursor, setCommentsCursor] = useState<{ before?: string; after?: string } | undefined>();
  const [commentsTotal, setCommentsTotal] = useState<number | undefined>(undefined);
  const [replyText, setReplyText] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);
  const replyInputRef = useRef<any>(null);
  // 二级回复：按评论ID存储
  const [repliesByComment, setRepliesByComment] = useState<Record<string, { list: any[]; cursor?: { before?: string; after?: string }; loading: boolean; expanded: boolean }>>({});

  // 获取互动帖子
  const fetchEngagementPosts = async (page: number = 1, pageSize: number = 20) => {
    if (!accountActive?.uid || !platform) return;
    setLoading(true);
    try {
      const res = await apiGetEngagementPosts({
        platform,
        uid: accountActive.uid,
        page,
        pageSize
      });
      if (res?.data) {
        const list = res.data.posts || [];
        setPosts(prev => page === 1 ? list : [...prev, ...list]);
        const total = res.data.total || 0;
        setPagination({ current: page, pageSize, total });
        const nextHasMore = typeof (res.data as any).hasMore === 'boolean' ? (res.data as any).hasMore : (page * pageSize) < total;
        setHasMore(nextHasMore);
      }
    } finally {
      setLoading(false);
    }
  };

  // 账户或平台变化时刷新
  useEffect(() => {
    if (accountActive?.uid && platform) {
      setPosts([]);
      setHasMore(true);
      fetchEngagementPosts(1, pagination.pageSize);
    } else {
      setPosts([]);
      setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
      setHasMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountActive?.uid, platform]);

  // 当切换账户时，自动根据账户平台设置 platform 并触发刷新
  useEffect(() => {
    if (!accountActive) return;
    const type = String((accountActive as any).type || '').toLowerCase();
    const map: Record<string, EngagementPlatform> = {
      bilibili: 'bilibili',
      douyin: 'douyin',
      facebook: 'facebook',
      wxgzh: 'wxGzh',
      wxsph: 'wxGzh',
      instagram: 'instagram',
      kwai: 'KWAI',
      kuaishou: 'KWAI',
      pinterest: 'pinterest',
      threads: 'threads',
      tiktok: 'tiktok',
      twitter: 'twitter',
      xhs: 'xhs',
      redbook: 'xhs',
      youtube: 'youtube',
    };
    const mapped = map[type];
    if (mapped && mapped !== platform) {
      setPlatform(mapped);
    }
    // 如果已有 platform 则不覆盖用户手动选择
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountActive?.id]);

  const PostCard = ({ item }: { item: EngagementPostItem }) => {
    return (
      <div className={styles.postCard}>
        <a href={item.permaLink} target="_blank" className={styles.thumb}>
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.title} />
          ) : (
            <div className={styles.thumbPlaceholder}>{t('ui.noImage')}</div>
          )}
          {/* {item.mediaType === 'video' && (
            <span className={styles.playIcon}>
              <PlayCircleOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.95)' }} />
            </span>
          )} */}
          <span className={styles.mediaType}>
            <Tag color={item.mediaType==='video'?'blue':item.mediaType==='image'?'green':'purple'}>{t(`mediaTypes.${item.mediaType}` as any)}</Tag>
          </span>
        </a>
        <div className={styles.postMeta}>
          <div className={styles.postTitle} title={item.title}>{item.title || '-'}</div>
          {item.content && (
            <div className={styles.postContent} title={item.content}>
              {item.content}
            </div>
          )}
          <div className={styles.postFooter}>
            <div className={styles.statsRow}>
              <span><LikeOutlined style={{ marginRight: 6 }} />{item.likeCount}</span>
              <span><CommentOutlined style={{ marginRight: 6 }} />{item.commentCount}</span>
              <span><EyeOutlined style={{ marginRight: 6 }} />{item.viewCount}</span>
            </div>
            <Space size={8}>
              <Button className={styles.commentBtn} type="text" onClick={() => openComments(item)}>
                <CommentOutlined style={{ fontSize: 22 }} />
              </Button>
            </Space>
          </div>
        </div>
      </div>
    );
  };

  const openComments = async (item: EngagementPostItem) => {
    setCommentPost(item);
    setComments([]);
    setCommentVisible(true);
    setReplyTarget(null);
    await loadCommentsV2(item.postId, undefined, undefined);
  };

  const loadCommentsV2 = async (postId: string, before?: string, after?: string) => {
    if (!accountActive?.id || !platform) return;
    setCommentLoading(true);
    try {
      const res = await apiGetPostComments({
        accountId: accountActive.id,
        platform: platform as any,
        postId,
        pagination: { before, after, limit: 20 }
      });
      if (res?.data) {
        const list = res.data.comments || [];
        setComments((prev) => after || before ? [...prev, ...list] : list);
        setCommentsTotal(res.data.total);
        setCommentsCursor(res.data.cursor);
      }
    } finally {
      setCommentLoading(false);
    }
  };

  const expandReplies = async (commentId: string) => {
    if (!accountActive?.id || !platform) return;
    setRepliesByComment((prev) => ({
      ...prev,
      [commentId]: { ...(prev[commentId] || { list: [], cursor: {}, expanded: true }), loading: true, expanded: true },
    }));
    const res = await apiGetCommentReplies({
      accountId: accountActive.id,
      platform: platform as any,
      commentId,
      pagination: { limit: 20 },
    });
    setRepliesByComment((prev) => ({
      ...prev,
      [commentId]: {
        list: res?.data?.comments || [],
        cursor: res?.data?.cursor,
        loading: false,
        expanded: true,
      },
    }));
  };

  const collapseReplies = (commentId: string) => {
    setRepliesByComment((prev) => ({
      ...prev,
      [commentId]: { ...(prev[commentId] || { list: [], cursor: {} }), expanded: false, loading: false },
    }));
  };

  const loadMoreReplies = async (commentId: string) => {
    const state = repliesByComment[commentId];
    if (!state?.cursor?.after || !accountActive?.id || !platform) return;
    setRepliesByComment((prev) => ({ ...prev, [commentId]: { ...(prev[commentId] as any), loading: true } }));
    const res = await apiGetCommentReplies({
      accountId: accountActive.id,
      platform: platform as any,
      commentId,
      pagination: { after: state.cursor.after, limit: 20 },
    });
    setRepliesByComment((prev) => ({
      ...prev,
      [commentId]: {
        list: [ ...(prev[commentId]?.list || []), ...(res?.data?.comments || []) ],
        cursor: res?.data?.cursor,
        loading: false,
        expanded: true,
      },
    }));
  };

  /**
   * 提交帖子评论
   */
  const submitPostComment = async () => {
    if (!commentPost || !replyText.trim() || !accountActive?.id || !platform || sending) return;
    setSending(true);
    try {
      const res = await apiPublishPostComment({ accountId: accountActive.id, platform: platform as any, postId: commentPost.postId, message: replyText.trim() });
      if (res) {
        setReplyText('');
        setReplyTarget(null);
        await loadCommentsV2(commentPost.postId);
        message.success(t('messages.commentSuccess'));
      }
    } catch (error) {
      message.error(t('messages.commentFailed'));
    } finally {
      setSending(false);
    }
  };

  /**
   * 提交评论回复
   */
  const submitReply = async (parentId?: string) => {
    if (!commentPost || !replyText.trim() || !accountActive?.id || !platform || sending) return;
    setSending(true);
    try {
      const res = await apiPublishCommentReply({ accountId: accountActive.id, platform: platform as any, commentId: parentId || '', message: replyText.trim() });
      if (res) {
        setReplyText('');
        setReplyTarget(null);
        await loadCommentsV2(commentPost.postId);
        message.success(t('messages.replySuccess'));
      }
    } catch (error) {
      message.error(t('messages.replyFailed'));
    } finally {
      setSending(false);
    }
  };

  // 删除与收入/提现相关方法（本页不需要）

  // 删除收入/提现相关列定义（本页不需要）

  useEffect(() => {
    if (!token) {
      message.error(t('messages.pleaseLoginFirst'));
      router.push('/login');
      return;
    }
    
    // 初始化账户
    accountInit();
  }, [token, router]);

  // 底部自动加载更多（IntersectionObserver）
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const el = loadMoreRef.current;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loading) {
        fetchEngagementPosts(pagination.current + 1, pagination.pageSize);
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMoreRef.current, hasMore, loading, pagination.current, pagination.pageSize]);

  return (
    <>
    <div className={styles.container} style={{ display: 'flex', gap: 16 }}>
      {/* 左侧账户选择栏 */}
      <div >
        <AccountSidebar
          activeAccountId={accountActive?.id || ''}
          onAccountChange={(account) => {
            if (account.id === accountActive?.id) {
              setAccountActive(undefined);
            } else {
              setAccountActive(account);
            }
          }}
        />
      </div>

      {/* 右侧内容 */}
      <div style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'auto' }}>
      {!accountActive?.uid ? (
        <Card style={{ height: '100%', minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 520 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16, border: '1px solid #e5e7eb',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
            }}>
              <CommentOutlined style={{ fontSize: 36, color: '#9ca3af' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{t('ui.selectChannel')}</div>
            <div style={{ color: '#6b7280' }}>{t('ui.selectChannelDesc')}</div>
          </div>
        </Card>
      ) : (
      /* 主要内容：互动帖子卡片瀑布流 */
      <div className={styles.content}>
        <div className={styles.grid}>
          {posts.map((item) => (
            <PostCard key={`${item.platform}-${item.postId}`} item={item} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          {hasMore ? (
            <Button 
              loading={loading} 
              onClick={() => fetchEngagementPosts(pagination.current + 1, pagination.pageSize)} 
              disabled={loading}
            >
              {t('ui.loadMore')}
            </Button>
          ) : (
            <span style={{ color: '#999' }}>{t('ui.noMorePosts')}</span>
          )}
        </div>
        <div ref={loadMoreRef} style={{ height: 1 }} />
      </div>
      )}
      </div>

            {/* 评论弹窗 */}
            <Modal
        open={commentVisible}
        onCancel={() => setCommentVisible(false)}
        title={commentPost?.title || t('ui.reply')}
        footer={null}
        width={600}
      >
        <List
          itemLayout="vertical"
          loading={commentLoading}
          dataSource={comments}
          renderItem={(c: any) => {
            const canExpand = !!c.hasReplies;
            const replyState = repliesByComment[c.id];
            const expanded = !!replyState?.expanded;
            return (
              <List.Item
                style={{ alignItems: 'flex-start' }}
                actions={[
                  canExpand && !expanded ? (
                    <a key="expand" onClick={() => expandReplies(c.id)}>{t('ui.expandReplies')}</a>
                  ) : canExpand && expanded ? (
                    <a key="collapse" onClick={() => collapseReplies(c.id)}>{t('ui.collapseReplies')}</a>
                  ) : null,
                  <a
                    key="reply"
                    onClick={() => {
                      const name = c.author?.username || c.author?.name || c.author?.id || '';
                      setReplyTarget({ id: c.id, name });
                      setTimeout(() => replyInputRef.current?.focus?.(), 0);
                    }}
                  >
                    {t('ui.reply')}
                  </a>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<Avatar src={c.author?.avatar} />}
                  title={<span>{c.author?.username || c.author?.name} · {new Date(c.createdAt).toLocaleString()}</span>}
                  description={c.message}
                />
                {expanded && (
                  <div className={styles.replyBlock}>
                    <List
                      size="small"
                      itemLayout="vertical"
                      dataSource={replyState?.list || []}
                      loading={replyState?.loading}
                      renderItem={(r: any) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar src={r.author?.avatar} />}
                            title={<span>{r.author?.username || r.author?.name} · {new Date(r.createdAt).toLocaleString()}</span>}
                            description={r.message}
                          />
                        </List.Item>
                      )}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 40 }}>
                      <Button size="small" type="link" onClick={() => loadMoreReplies(c.id)} disabled={!replyState?.cursor?.after} loading={replyState?.loading}>
                        {t('ui.loadMoreReplies')}
                      </Button>
                    </div>
                  </div>
                )}
              </List.Item>
            );
          }}
        />
        {commentsCursor?.after && (
          <div
            style={{ textAlign: 'center', marginTop: 10, color: '#1677ff', cursor: 'pointer' }}
            onClick={() => !commentLoading && loadCommentsV2(commentPost!.postId, undefined, commentsCursor?.after)}
          >
            {commentLoading ? t('ui.loading') : t('ui.loadMoreComments')}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingBottom: 20 }}>
          <Input.TextArea
            ref={replyInputRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={1}
            placeholder={replyTarget ? t('ui.replyPlaceholder', { name: replyTarget.name }) : t('ui.commentPlaceholder')}
          />
          <Button
            type="primary"
            loading={sending}
            disabled={sending || !replyText.trim()}
            onClick={() => (replyTarget ? submitReply(replyTarget.id) : submitPostComment())}
            style={{ width: 88, minWidth: 88 }}
          >
            {sending ? t('ui.sending') : t('ui.send')}
          </Button>
        </div>
      </Modal>
    </div>
    </>
  );
}
