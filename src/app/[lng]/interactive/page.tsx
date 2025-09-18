"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Button, message, Tag, Space, Select, Modal, Input, List, Avatar } from "antd";
import { DollarOutlined, HistoryOutlined, WalletOutlined } from "@ant-design/icons";
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
import { NoSSR } from "@kwooshung/react-no-ssr";

const { Option } = Select;

export default function InteractivePage() {
  const router = useRouter();
  const { lng } = useParams();
  const { userInfo, token } = useUserStore();
  const { t } = useTransClient('interactive' as any);
  const tt = t as any;

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
  const [platform, setPlatform] = useState<EngagementPlatform | undefined>(undefined);
  // 评论状态
  const [commentVisible, setCommentVisible] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentPost, setCommentPost] = useState<EngagementPostItem | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsCursor, setCommentsCursor] = useState<{ before?: string; after?: string } | undefined>();
  const [commentsTotal, setCommentsTotal] = useState<number | undefined>(undefined);
  const [replyText, setReplyText] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const replyInputRef = useRef<any>(null);

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
        setPosts(res.data.posts || []);
        setPagination({ current: page, pageSize, total: res.data.total || 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  // 账户或平台变化时刷新
  useEffect(() => {
    if (accountActive?.uid && platform) {
      fetchEngagementPosts(1, pagination.pageSize);
    } else {
      setPosts([]);
      setPagination((prev) => ({ ...prev, total: 0, current: 1 }));
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
  }, [accountActive?.account]);

  const PostCard = ({ item }: { item: EngagementPostItem }) => {
    return (
      <div className={styles.postCard}>
        <a href={item.permaLink} target="_blank" className={styles.thumb}>
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.title} />
          ) : (
            <div className={styles.thumbPlaceholder}>No Image</div>
          )}
          <span className={styles.mediaType}>
            <Tag color={item.mediaType==='video'?'blue':item.mediaType==='image'?'green':'purple'}>{item.mediaType}</Tag>
          </span>
        </a>
        <div className={styles.postMeta}>
          <div className={styles.postTitle} title={item.title}>{item.title || '-'}</div>
          <div className={styles.statsRow}>
            <span>👍 {item.likeCount}</span>
            <span>💬 {item.commentCount}</span>
            <span>👁️ {item.viewCount}</span>
          </div>
          <div className={styles.actionsRow}>
            <Space size={8}>
              <Button size="small" onClick={() => openComments(item)}>评论</Button>
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
    if (!accountActive?.account || !platform) return;
    setCommentLoading(true);
    try {
      const res = await apiGetPostComments({
        accountId: accountActive.account,
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

  const submitPostComment = async () => {
    if (!commentPost || !replyText.trim() || !accountActive?.account || !platform) return;
    const res = await apiPublishPostComment({ accountId: accountActive.account, platform: platform as any, postId: commentPost.postId, message: replyText.trim() });
    if (res) {
      setReplyText('');
      setReplyTarget(null);
      await loadCommentsV2(commentPost.postId);
      message.success('已评论');
    }
  };

  const submitReply = async (parentId?: string) => {
    if (!commentPost || !replyText.trim() || !accountActive?.account || !platform) return;
    const res = await apiPublishCommentReply({ accountId: accountActive.account, platform: platform as any, commentId: parentId || '', message: replyText.trim() });
    if (res) {
      setReplyText('');
      setReplyTarget(null);
      await loadCommentsV2(commentPost.postId);
      message.success('已回复');
    }
  };

  // 删除与收入/提现相关方法（本页不需要）

  // 删除收入/提现相关列定义（本页不需要）

  useEffect(() => {
    if (!token) {
      message.error(tt('messages.pleaseLoginFirst'));
      router.push('/login');
      return;
    }
    
    // 初始化账户
    accountInit();
  }, [token, router]);

  return (
    <NoSSR>
    <div className={styles.container} style={{ display: 'flex', gap: 16 }}>
      {/* 左侧账户选择栏 */}
      <div >
        <AccountSidebar
          activeAccountId={accountActive?.account || ''}
          onAccountChange={(account) => {
            if (account.id === accountActive?.account) {
              setAccountActive(undefined);
            } else {
              setAccountActive(account);
            }
          }}
        />
      </div>

      {/* 右侧内容 */}
      <div style={{ flex: 1, minWidth: 0 }}>

      {/* 主要内容：互动帖子卡片瀑布流 */}
      <div className={styles.content}>
        <div className={styles.grid}>
          {posts.map((item) => (
            <PostCard key={`${item.platform}-${item.postId}`} item={item} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Button loading={loading} onClick={() => fetchEngagementPosts(pagination.current + 1, pagination.pageSize)} disabled={loading || posts.length >= pagination.total}>加载更多</Button>
        </div>
      </div>

      {/* 评论弹窗 */}
      <Modal
        open={commentVisible}
        onCancel={() => setCommentVisible(false)}
        title={commentPost?.title || '评论'}
        footer={null}
        width={600}
      >
        <List
          loading={commentLoading}
          dataSource={comments}
          renderItem={(c: any) => {
            const canExpand = !!c.hasReplies;
            return (
              <List.Item
                actions={[
                  canExpand ? (
                    <a
                      key="expand"
                      onClick={async () => {
                        if (!accountActive?.account || !platform) return;
                        const res = await apiGetCommentReplies({
                          accountId: accountActive.account,
                          platform: platform as any,
                          commentId: c.id,
                          pagination: { limit: 20 },
                        });
                        if (res?.data?.comments?.length) {
                          // 展开后简单 alert 展示; 可改为内嵌子列表
                          message.info(`展开回复 ${res.data.comments.length} 条`);
                        } else {
                          message.info('暂无更多回复');
                        }
                      }}
                    >
                      展开回复
                    </a>
                  ) : null,
                  <a
                    key="reply"
                    onClick={() => {
                      const name = c.author?.username || c.author?.name || c.author?.id || '';
                      setReplyTarget({ id: c.id, name });
                      setTimeout(() => replyInputRef.current?.focus?.(), 0);
                    }}
                  >
                    回复
                  </a>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<Avatar src={c.author?.avatar} />}
                  title={<span>{c.author?.username || c.author?.name} · {new Date(c.createdAt).toLocaleString()}</span>}
                  description={c.message}
                />
              </List.Item>
            );
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Input.TextArea
            ref={replyInputRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            placeholder={replyTarget ? `回复@${replyTarget.name}` : '输入评论...'}
          />
          <Button
            type="primary"
            onClick={() => (replyTarget ? submitReply(replyTarget.id) : submitPostComment())}
          >
            发送
          </Button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <Button onClick={() => loadCommentsV2(commentPost!.postId, undefined, commentsCursor?.after)} loading={commentLoading} disabled={!commentsCursor?.after}>加载更多评论</Button>
        </div>
      </Modal>
      </div>
    </div>
    </NoSSR>
  );
}
