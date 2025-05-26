"use client";

import { useEffect, useState } from 'react';
import { Table, message, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getDraftsListApi } from '@/api/publish';
import { PubType, PubStatus } from '@/types/publish';

interface DraftItem {
  id: number;
  title: string;
  type: string;
  status: number;
  createTime: string;
  updateTime: string;
}

export default function DraftList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DraftItem[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const getStatusTag = (status: number) => {
    switch (status) {
      case PubStatus.UNPUBLISH:
        return <Tag color="default">未发布</Tag>;
      case PubStatus.RELEASED:
        return <Tag color="success">已发布</Tag>;
      case PubStatus.FAIL:
        return <Tag color="error">发布失败</Tag>;
      case PubStatus.PART_SUCCESS:
        return <Tag color="warning">部分成功</Tag>;
      default:
        return <Tag>未知状态</Tag>;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case PubType.VIDEO:
        return '视频';
      case PubType.ARTICLE:
        return '文章';
      case PubType.IMAGE_TEXT:
        return '图文';
      default:
        return type;
    }
  };

  const columns: ColumnsType<DraftItem> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => getTypeText(type),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
  ];

  const fetchData = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response: any = await getDraftsListApi(page, pageSize);
      if (response?.code === 0) {
        setData(response.data.list);
        setPagination({
          ...pagination,
          current: page,
          total: response.data.total,
        });
      } else {
        message.error(response?.msg || '获取草稿列表失败');
      }
    } catch (error) {
      message.error('获取草稿列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchData(newPagination.current, newPagination.pageSize);
  };

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={pagination}
      loading={loading}
      onChange={handleTableChange}
    />
  );
} 