'use client'

import type { EngagementPlatform, EngagementPostItem } from '@/api/types/engagement'
import { CommentOutlined, DollarOutlined, EyeOutlined, HistoryOutlined, LikeOutlined, PlayCircleOutlined, RobotOutlined, WalletOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Input, List, message, Modal, Select, Space, Tag } from 'antd'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { createAiReplyTask, getChatModels } from '@/api/ai'
import { apiGetCommentReplies, apiGetEngagementComments, apiGetEngagementnew, apiGetEngagementPosts, apiGetPostComments, apiPublishCommentReply, apiPublishPostComment, apiReplyEngagementComment } from '@/api/engagement'
import AccountSidebar from '@/app/[lng]/accounts/components/AccountSidebar/AccountSidebar'
import { useTransClient } from '@/app/i18n/client'
import WalletAccountSelect from '@/components/WalletAccountSelect'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'
import { request } from '@/utils/request'
import styles from './interactive.module.css'
// import { NoSSR } from "@kwooshung/react-no-ssr";

const { Option } = Select

export default function InteractivePage() {
  const router = useRouter()
  const { lng } = useParams()
  const { userInfo, token } = useUserStore()
  const { t } = useTransClient('interactive' as any)

  // 账户侧边栏相关
  const { accountInit, accountActive, setAccountActive } = useAccountStore(
    useShallow(state => ({
      accountInit: state.accountInit,
      accountActive: state.accountActive,
      setAccountActive: state.setAccountActive,
    })),
  )

  // 互动帖子列表状态
  const [posts, setPosts] = useState<EngagementPostItem[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [hasMore, setHasMore] = useState(true)
  const [platform, setPlatform] = useState<EngagementPlatform | undefined>(undefined)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [postsCursor, setPostsCursor] = useState<{ before?: string, after?: string }>({})
  const prevAccountIdRef = useRef<string | undefined>()
  // 评论状态
  const [commentVisible, setCommentVisible] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentPost, setCommentPost] = useState<EngagementPostItem | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentsCursor, setCommentsCursor] = useState<{ before?: string, after?: string } | undefined>()
  const [commentsTotal, setCommentsTotal] = useState<number | undefined>(undefined)
  const [replyText, setReplyText] = useState('')
  const [replyTarget, setReplyTarget] = useState<any>(null)
  const [sending, setSending] = useState(false)
  const replyInputRef = useRef<any>(null)
  // 二级回复：按评论ID存储
  const [repliesByComment, setRepliesByComment] = useState<Record<string, { list: any[], cursor?: { before?: string, after?: string }, loading: boolean, expanded: boolean }>>({})

  // AI回复相关状态
  const [aiModalVisible, setAiModalVisible] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiModel, setAiModel] = useState('')
  const [aiModels, setAiModels] = useState<any[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiReplyTarget, setAiReplyTarget] = useState<{ postId: string, commentId?: string } | null>(null)
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false)

  // 获取AI模型列表
  const fetchAiModels = async () => {
    try {
      const res = await getChatModels()
      if (res?.data && Array.isArray(res.data)) {
        setAiModels(res.data)
        if (res.data.length > 0 && !aiModel) {
          setAiModel(res.data[0].name)
        }
      }
    }
    catch (error) {
      console.error('获取AI模型列表失败:', error)
    }
  }

  // 获取互动帖子
  const fetchEngagementPosts = async (direction?: 'next' | 'prev', customCursor?: string) => {
    if (!accountActive?.uid || !platform)
      return
    setLoading(true)
    try {
      const params: any = {
        platform,
        accountId: accountActive.id,

      }

      // 根据方向添加 cursor 参数
      if (direction === 'next' && customCursor) {
        params.pagination.after = customCursor
      }
      else if (direction === 'prev' && postsCursor.before) {
        params.pagination.before = postsCursor.before
      }

      const res = await apiGetEngagementnew(params)
      if (res?.data) {
        const list = res.data.posts || []
        // 首次加载或切换方向时替换，加载更多时追加
        if (direction === 'next') {
          setPosts(prev => [...prev, ...list])
        }
        else if (direction === 'prev') {
          setPosts(prev => [...list, ...prev])
        }
        else {
          setPosts(list)
        }

        // 更新 cursor
        if (res.data.cursor) {
          setPostsCursor(res.data.cursor)
          // 判断是否还有更多内容
          setHasMore(!!res.data.cursor.after)
        }
        else {
          setHasMore(false)
        }
      }
    }
    finally {
      setLoading(false)
    }
  }

  // 当切换账户或平台时加载数据
  useEffect(() => {
    // 如果没有选中账户，清空数据
    if (!accountActive) {
      setPlatform(undefined)
      setPosts([])
      setPostsCursor({})
      setPagination(prev => ({ ...prev, total: 0, current: 1 }))
      setHasMore(false)
      prevAccountIdRef.current = undefined
      return
    }

    const currentAccountId = accountActive.id
    const accountChanged = prevAccountIdRef.current !== currentAccountId

    // 如果账户切换了，需要设置新的platform
    if (accountChanged) {
      prevAccountIdRef.current = currentAccountId

      const type = String((accountActive as any).type || '').toLowerCase()
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
      }
      const mapped = map[type]

      // 重置数据
      setPosts([])
      setPostsCursor({})
      setPagination(prev => ({ ...prev, total: 0, current: 1 }))

      // 设置platform（会触发下面的加载逻辑）
      if (mapped) {
        setHasMore(true)
        setPlatform(mapped)
      }
      else {
        setHasMore(false)
        setPlatform(undefined)
      }
      return // 等platform更新后再加载数据
    }

    // 如果账户没变，但platform或uid变了，重新加载数据
    if (accountActive?.uid && platform) {
      setPosts([])
      setPostsCursor({})
      setHasMore(true)
      fetchEngagementPosts()
    }
  }, [accountActive?.id, accountActive?.uid, platform])

  const PostCard = ({ item }: { item: EngagementPostItem }) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
    const medias = (item as any).medias || []
    const currentMedia = medias[currentMediaIndex]

    // 处理媒体点击
    const handleMediaClick = (e: React.MouseEvent) => {
      if (medias.length > 1) {
        e.preventDefault()
        setCurrentMediaIndex(prev => (prev + 1) % medias.length)
      }
    }

    // 显示视频预览模态框
    const [videoModalVisible, setVideoModalVisible] = useState(false)
    const [videoUrl, setVideoUrl] = useState('')

    const handleVideoPlay = (e: React.MouseEvent) => {
      e.preventDefault()
      if (currentMedia?.type === 'video' && currentMedia?.url) {
        setVideoUrl(currentMedia.url)
        setVideoModalVisible(true)
      }
    }

    return (
      <>
        <div className={styles.postCard}>
          <div className={styles.thumb} onClick={handleMediaClick} style={{ cursor: medias.length > 1 ? 'pointer' : 'default' }}>
            {currentMedia?.thumbnail || currentMedia?.url
              ? (
                  <>
                    <img src={currentMedia.thumbnail || currentMedia.url} alt={item.title} />
                    {currentMedia.type === 'video' && (
                      <span className={styles.playIcon} onClick={handleVideoPlay}>
                        <PlayCircleOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.95)' }} />
                      </span>
                    )}
                  </>
                )
              : (
                  <div className={styles.thumbPlaceholder}>{t('ui.noImage')}</div>
                )}
            {medias.length > 0 && (
              <span className={styles.mediaType}>
                <Tag color={currentMedia?.type === 'video' ? 'blue' : currentMedia?.type === 'image' ? 'green' : 'purple'}>
                  {currentMedia?.type || 'unknown'}
                  {medias.length > 1 && ` (${currentMediaIndex + 1}/${medias.length})`}
                </Tag>
              </span>
            )}
          </div>
          <div className={styles.postMeta}>
            <div className={styles.postTitle} title={item.title}>{item.title || '-'}</div>
            {item.content && (
              <div className={styles.postContent} title={item.content}>
                {item.content}
              </div>
            )}
            <div className={styles.postFooter}>
              <div className={styles.statsRow}>
                <span>
                  <LikeOutlined style={{ marginRight: 6 }} />
                  {item.likeCount}
                </span>
                <span>
                  <CommentOutlined style={{ marginRight: 6 }} />
                  {item.commentCount}
                </span>
                <span>
                  <EyeOutlined style={{ marginRight: 6 }} />
                  {item.viewCount}
                </span>
              </div>
              <Space size={8}>
                <Button className={styles.commentBtn} type="text" onClick={() => openAiModal(item.id)}>
                  <RobotOutlined style={{ fontSize: 18 }} />
                </Button>
                <Button className={styles.commentBtn} type="text" onClick={() => openComments(item)}>
                  <CommentOutlined style={{ fontSize: 20 }} />
                </Button>
              </Space>
            </div>
          </div>
        </div>

        {/* 视频播放模态框 */}
        <Modal
          title={t('ui.videoPreview' as any)}
          open={videoModalVisible}
          onCancel={() => setVideoModalVisible(false)}
          footer={null}
          width={800}
          centered
        >
          {videoUrl && (
            <video
              src={videoUrl}
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '70vh' }}
            />
          )}
        </Modal>
      </>
    )
  }

  const openComments = async (item: EngagementPostItem) => {
    setCommentPost(item)
    setComments([])
    setCommentVisible(true)
    setReplyTarget(null)
    await loadCommentsV2(item.id, undefined, undefined)
  }

  const loadCommentsV2 = async (postId: string, before?: string, after?: string) => {
    if (!accountActive?.id || !platform)
      return
    setCommentLoading(true)
    try {
      const res = await apiGetPostComments({
        accountId: accountActive.id,
        platform: platform as any,
        postId,
        pagination: { before, after, limit: 20 },
      })
      if (res?.data) {
        const list = res.data.comments || []
        setComments(prev => after || before ? [...prev, ...list] : list)
        setCommentsTotal(res.data.total)
        setCommentsCursor(res.data.cursor)
      }
    }
    finally {
      setCommentLoading(false)
    }
  }

  const expandReplies = async (commentId: string) => {
    if (!accountActive?.id || !platform)
      return
    setRepliesByComment(prev => ({
      ...prev,
      [commentId]: { ...(prev[commentId] || { list: [], cursor: {}, expanded: true }), loading: true, expanded: true },
    }))
    const res = await apiGetCommentReplies({
      accountId: accountActive.id,
      platform: platform as any,
      commentId,
      pagination: { limit: 20 },
    })
    setRepliesByComment(prev => ({
      ...prev,
      [commentId]: {
        list: res?.data?.comments || [],
        cursor: res?.data?.cursor,
        loading: false,
        expanded: true,
      },
    }))
  }

  const collapseReplies = (commentId: string) => {
    setRepliesByComment(prev => ({
      ...prev,
      [commentId]: { ...(prev[commentId] || { list: [], cursor: {} }), expanded: false, loading: false },
    }))
  }

  const loadMoreReplies = async (commentId: string) => {
    const state = repliesByComment[commentId]
    if (!state?.cursor?.after || !accountActive?.id || !platform)
      return
    setRepliesByComment(prev => ({ ...prev, [commentId]: { ...(prev[commentId] as any), loading: true } }))
    const res = await apiGetCommentReplies({
      accountId: accountActive.id,
      platform: platform as any,
      commentId,
      pagination: { after: state.cursor.after, limit: 20 },
    })
    setRepliesByComment(prev => ({
      ...prev,
      [commentId]: {
        list: [...(prev[commentId]?.list || []), ...(res?.data?.comments || [])],
        cursor: res?.data?.cursor,
        loading: false,
        expanded: true,
      },
    }))
  }

  /**
   * 提交帖子评论
   */
  const submitPostComment = async () => {
    if (!commentPost || !replyText.trim() || !accountActive?.id || !platform || sending)
      return
    setSending(true)
    try {
      const res = await apiPublishPostComment({ accountId: accountActive.id, platform: platform as any, postId: commentPost.id, message: replyText.trim() })
      if (res) {
        setReplyText('')
        setReplyTarget(null)
        await loadCommentsV2(commentPost.id)
        message.success(t('messages.commentSuccess'))
      }
    }
    catch (error) {
      message.error(t('messages.commentFailed'))
    }
    finally {
      setSending(false)
    }
  }

  /**
   * 提交评论回复
   */
  const submitReply = async (parentId?: string) => {
    if (!commentPost || !replyText.trim() || !accountActive?.id || !platform || sending)
      return
    setSending(true)
    try {
      const res = await apiPublishCommentReply({ accountId: accountActive.id, platform: platform as any, commentId: parentId || '', message: replyText.trim() })
      if (res) {
        setReplyText('')
        setReplyTarget(null)
        await loadCommentsV2(commentPost.id)
        message.success(t('messages.replySuccess'))
      }
    }
    catch (error) {
      message.error(t('messages.replyFailed'))
    }
    finally {
      setSending(false)
    }
  }

  /**
   * 打开AI回复弹窗
   */
  const openAiModal = (postId: string, commentId?: string) => {
    setAiReplyTarget({ postId, commentId })
    setAiModalVisible(true)
    setAiPrompt('')
    if (aiModels.length === 0) {
      fetchAiModels()
    }
  }

  /**
   * 提交AI回复
   */
  const submitAiReply = async () => {
    if (!aiReplyTarget || !aiPrompt.trim() || !aiModel || !accountActive?.id || !platform || aiLoading)
      return
    setAiLoading(true)
    try {
      const res = await createAiReplyTask({
        accountId: accountActive.id,
        postId: aiReplyTarget.postId,
        prompt: aiPrompt.trim(),
        platform: platform as string,
        model: aiModel,
      })
      if (res) {
        setAiModalVisible(false)
        setAiPrompt('')
        setAiReplyTarget(null)
        message.success(t('messages.aiReplyTaskCreated'))
        // 刷新评论列表
        if (commentPost) {
          await loadCommentsV2(commentPost.id)
        }
      }
    }
    catch (error) {
      message.error(t('messages.aiReplyTaskFailed'))
    }
    finally {
      setAiLoading(false)
    }
  }

  // 获取AI评论建议，并填充到输入框
  const fetchAiSuggestion = async () => {
    if (!replyTarget || !replyTarget.id || !replyTarget.text) {
      message.warning(t('ui.reply') as any)
      return
    }
    try {
      setAiSuggestLoading(true)
      // 选择模型：优先取用户配置的 aiInfo.agent.defaultModel；否则取聊天模型列表第一个
      let modelName: string | undefined = (userInfo as any)?.aiInfo?.agent?.defaultModel
      if (!modelName) {
        try {
          if (aiModels.length > 0) {
            modelName = aiModels[0]?.name
          }
          else {
            const listRes = await getChatModels()
            const list = (listRes?.data as any[]) || []
            modelName = list[0]?.name
          }
        }
        catch {}
      }
      const res: any = await request({
        url: 'channel/engagement/comment/ai/replies',
        method: 'POST',
        data: {
          model: modelName || 'gpt-5',
          prompt: '',
          comments: [{
            id: replyTarget.id,
            comment: replyTarget.text,
          }],
        },
      })
      const objjs = res?.data || {}
      const content = objjs?.[replyTarget.id] || objjs?.text
      if (content) {
        setReplyText(content)
        setTimeout(() => replyInputRef.current?.focus?.(), 0)
      }
      else {
        message.warning(t('ui.noContent' as any) || '暂无AI建议')
      }
    }
    catch (e) {
      message.error(t('ui.requestFailed' as any) || '请求失败')
    }
    finally {
      setAiSuggestLoading(false)
    }
  }

  // 删除收入/提现相关列定义（本页不需要）

  useEffect(() => {
    if (!token) {
      message.error(t('messages.pleaseLoginFirst'))
      router.push('/login')
      return
    }

    // 初始化账户
    accountInit()
  }, [token, router])

  // 底部自动加载更多（IntersectionObserver）
  useEffect(() => {
    if (!loadMoreRef.current)
      return
    const el = loadMoreRef.current
    const io = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting && hasMore && !loading && postsCursor.after) {
        fetchEngagementPosts('next', postsCursor.after)
      }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [loadMoreRef.current, hasMore, loading, postsCursor.after])

  return (
    <>
      <div className={styles.container} style={{ display: 'flex', gap: 16 }}>
        {/* 左侧账户选择栏 */}
        <div>
          <AccountSidebar
            activeAccountId={accountActive?.id || ''}
            onAccountChange={(account) => {
              if (account.id === accountActive?.id) {
                setAccountActive(undefined)
              }
              else {
                setAccountActive(account)
              }
            }}
            isInteractivePage={true}
          />
        </div>

        {/* 右侧内容 */}
        <div style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'auto' }}>
          {!accountActive?.uid ? (
            <Card style={{ height: '100%', minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', maxWidth: 520 }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  border: '1px solid #e5e7eb',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
                >
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
                {posts.map(item => (
                  <PostCard key={`${item.id}`} item={item} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                {hasMore && postsCursor.after
                  ? (
                      <Button
                        loading={loading}
                        onClick={() => fetchEngagementPosts('next', postsCursor.after)}
                        disabled={loading}
                      >
                        {t('ui.loadMore')}
                      </Button>
                    )
                  : posts.length > 0
                    ? (
                        <span style={{ color: '#999' }}>{t('ui.noMorePosts')}</span>
                      )
                    : null}
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
        // height={600}
        // style={{ maxHeight: '80vh' }}
        >
          <List
            itemLayout="vertical"
            loading={commentLoading}
            dataSource={comments}
            style={{ maxHeight: '600px', overflow: 'auto' }}
            renderItem={(c: any) => {
              const canExpand = !!c.hasReplies
              const replyState = repliesByComment[c.id]
              const expanded = !!replyState?.expanded
              return (
                <List.Item
                  style={{ alignItems: 'flex-start' }}
                  actions={[
                    canExpand && !expanded
                      ? (
                          <a key="expand" onClick={() => expandReplies(c.id)}>{t('ui.expandReplies')}</a>
                        )
                      : canExpand && expanded
                        ? (
                            <a key="collapse" onClick={() => collapseReplies(c.id)}>{t('ui.collapseReplies')}</a>
                          )
                        : null,
                  // <a
                  //   key="ai-reply"
                  //   onClick={() => openAiModal(commentPost!.id, c.id)}
                  // >
                  //   AI回复
                  // </a>,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      c.author?.avatar && (
                        <Avatar src={c.author.avatar} />
                      )
                    }
                    title={<span style={{ fontSize: '15px', fontWeight: 500 }}>{c.author?.username || c.author?.name}</span>}
                    description={(
                      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '14px', color: '#333' }}>{c.message}</span>
                          <a
                            style={{ marginLeft: '12px', fontSize: '12px', color: '#a66ae4', cursor: 'pointer' }}
                            onClick={() => {
                              const name = c.author?.username || c.author?.name || c.author?.id || ''
                              setReplyTarget({ id: c.id, name, text: c.message })
                              setTimeout(() => replyInputRef.current?.focus?.(), 0)
                            }}
                          >
                            {t('ui.reply')}
                          </a>
                        </div>
                        <span style={{ fontSize: '12px', color: '#999', marginTop: '4px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  />
                  {expanded && (
                    <div className={styles.replyBlock}>
                      <List
                        size="small"
                        itemLayout="vertical"
                        dataSource={replyState?.list || []}
                        loading={replyState?.loading}
                        renderItem={(r: any) => (
                          <List.Item style={{ padding: '4px 0' }}>
                            <List.Item.Meta
                              avatar={
                                r.author?.avatar && (
                                  <Avatar src={r.author.avatar} />
                                )
                              }
                              title={<span style={{ fontSize: '14px', fontWeight: 500 }}>{r.author?.username || r.author?.name}</span>}
                              description={(
                                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <span style={{ fontSize: '14px', color: '#333' }}>{r.message}</span>
                                  <span style={{ fontSize: '12px', color: '#999', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                                    {new Date(r.createdAt).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            />
                          </List.Item>
                        )}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 0 }}>
                        <Button style={{ paddingLeft: 0 }} size="small" type="link" onClick={() => loadMoreReplies(c.id)} disabled={!replyState?.cursor?.after} loading={replyState?.loading}>
                          {t('ui.loadMoreReplies')}
                        </Button>
                      </div>
                    </div>
                  )}
                </List.Item>
              )
            }}
          />
          {commentsCursor?.after && (
            <div
              style={{ textAlign: 'center', marginTop: 10, color: '#1677ff', cursor: 'pointer' }}
              onClick={() => !commentLoading && loadCommentsV2(commentPost!.id, undefined, commentsCursor?.after)}
            >
              {commentLoading ? t('ui.loading') : t('ui.loadMoreComments')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingBottom: 20 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Input
                style={{ paddingRight: 30 }}
                ref={replyInputRef}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={replyTarget ? `${t('ui.replyPlaceholder')}${replyTarget.name} - ${replyTarget.text.substring(0, 50)}${replyTarget.text.length > 50 ? '...' : ''}` : t('ui.commentPlaceholder')}
              />
              <Button
                type="text"
                onClick={fetchAiSuggestion}
                loading={aiSuggestLoading}
                style={{ position: 'absolute', right: 6, top: 1, padding: 4 }}
                title={t('ui.aiSuggest' as any) || 'AI建议'}
                disabled={!replyTarget}
              >
                <RobotOutlined style={{ fontSize: 18 }} />
              </Button>
            </div>

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

        {/* AI回复弹窗 */}
        <Modal
          open={aiModalVisible}
          onCancel={() => setAiModalVisible(false)}
          title={t('ui.aiReplyModalTitle')}
          footer={null}
          width={500}
        >
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>{t('ui.selectAiModel')}</label>
            <Select
              value={aiModel}
              onChange={setAiModel}
              style={{ width: '100%' }}
              placeholder={t('ui.aiModelPlaceholder')}
              loading={aiModels.length === 0}
            >
              {aiModels.map(model => (
                <Option key={model.name} value={model.name}>
                  {model.description}
                </Option>
              ))}
            </Select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>{t('ui.replyPrompt')}</label>
            <Input.TextArea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={4}
              placeholder={t('ui.promptPlaceholder')}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setAiModalVisible(false)}>
              {t('ui.cancel')}
            </Button>
            <Button
              type="primary"
              loading={aiLoading}
              disabled={!aiPrompt.trim() || !aiModel || aiLoading}
              onClick={submitAiReply}
            >
              {aiLoading ? t('ui.creating') : t('ui.createAiReplyTask')}
            </Button>
          </div>
        </Modal>
      </div>
    </>
  )
}
