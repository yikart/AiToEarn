"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Table, Select, Input, DatePicker, Space, Button, Tag } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useTransClient } from "@/app/i18n/client";
import { apiGetEngagementPosts } from "@/api/engagement";
import { EngagementPlatform, EngagementPostItem } from "@/api/types/engagement";

const { Option } = Select;

export default function EngagementPage() {
  const { t } = useTransClient('engagement');
  const { lng } = useParams();

  const [platform, setPlatform] = useState<EngagementPlatform>('bilibili');
  const [uid, setUid] = useState<string>('');
  const [posts, setPosts] = useState<EngagementPostItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  async function fetchPosts(p: number = page, s: number = pageSize) {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await apiGetEngagementPosts({ platform, uid, page: p, pageSize: s });
      if (res?.data) {
        setPosts(res.data.posts || []);
        setTotal(res.data.total || 0);
        setHasMore(!!res.data.hasMore);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 初次加载不自动拉取，等待用户输入 uid 后点击查询
  }, []);

  const columns = useMemo(() => [
    { title: t('columns.postId' as any), dataIndex: 'postId', key: 'postId', width: 180, ellipsis: true },
    { title: t('columns.platform' as any), dataIndex: 'platform', key: 'platform', width: 100, render: (v: string) => <Tag>{v}</Tag> },
    { title: t('columns.title' as any), dataIndex: 'title', key: 'title', width: 240, ellipsis: true },
    { title: t('columns.mediaType' as any), dataIndex: 'mediaType', key: 'mediaType', width: 100, render: (v: string) => <Tag color={v==='video'?'blue':v==='image'?'green':'purple'}>{v}</Tag> },
    { title: t('columns.publishTime' as any), dataIndex: 'publishTime', key: 'publishTime', width: 180, render: (ts: number) => new Date(ts).toLocaleString() },
    { title: t('columns.viewCount' as any), dataIndex: 'viewCount', key: 'viewCount', width: 120 },
    { title: t('columns.likeCount' as any), dataIndex: 'likeCount', key: 'likeCount', width: 120 },
    { title: t('columns.commentCount' as any), dataIndex: 'commentCount', key: 'commentCount', width: 120 },
    { title: t('columns.shareCount' as any), dataIndex: 'shareCount', key: 'shareCount', width: 120 },
    { title: t('columns.clickCount' as any), dataIndex: 'clickCount', key: 'clickCount', width: 120 },
    { title: t('columns.impressionCount' as any), dataIndex: 'impressionCount', key: 'impressionCount', width: 140 },
    { title: t('columns.favoriteCount' as any), dataIndex: 'favoriteCount', key: 'favoriteCount', width: 120 },
    { title: t('columns.permaLink' as any), dataIndex: 'permaLink', key: 'permaLink', width: 200, render: (url: string) => url ? <a href={url} target="_blank">{t('columns.open' as any)}</a> : '-' },
  ], [t]);

  return (
    <div style={{ padding: 16 }}>
      <Card 
        title={t('title' as any)}
        extra={
          <Space wrap>
            <Select value={platform} onChange={setPlatform} style={{ width: 140 }}>
              {['bilibili','douyin','facebook','wxGzh','instagram','KWAI','pinterest','threads','tiktok','twitter','xhs','youtube'].map(p => (
                <Option key={p} value={p}>{p}</Option>
              ))}
            </Select>
            <Input value={uid} placeholder={t('placeholders.uid' as any)} onChange={(e) => setUid(e.target.value)} style={{ width: 220 }} />
            <Button type="primary" onClick={() => { setPage(1); fetchPosts(1, pageSize); }}>{t('actions.search' as any)}</Button>
            <Button onClick={() => { setUid(''); setPosts([]); setTotal(0); }}>{t('actions.reset' as any)}</Button>
          </Space>
        }
      >
        <Table
          rowKey={(r) => `${r.platform}-${r.postId}`}
          columns={columns as any}
          dataSource={posts}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, s) => { setPage(p); setPageSize(s || 20); fetchPosts(p, s || 20); },
            showTotal: (t) => t ? `${t}` : '0'
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  );
}


