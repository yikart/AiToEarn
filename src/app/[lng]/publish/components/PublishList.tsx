"use client";

import { useEffect, useState } from 'react';
import { Table, message, Tag, Space, Button, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getPublishListApi, updatePublishStatusApi, deletePublishApi } from '@/api/publish';
import { PubType, PubStatus } from '@/types/publish';

interface PublishItem {
  id: number;
  title: string;
  type: string;
  status: number;
  createTime: string;
  publishTime: string;
}

export default function PublishList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PublishItem[]>([]);
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

  const handleUpdateStatus = async (id: number, status: number) => {
    try {
      const response = await updatePublishStatusApi(id, status);
      if (response?.code === 0) {
        message.success('状态更新成功');
        fetchData(pagination.current, pagination.pageSize);
      } else {
        message.error(response?.msg || '状态更新失败');
      }
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await deletePublishApi(id);
      if (response?.code === 0) {
        message.success('删除成功');
        fetchData(pagination.current, pagination.pageSize);
      } else {
        message.error(response?.msg || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns: ColumnsType<PublishItem> = [
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
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => handleUpdateStatus(record.id, PubStatus.RELEASED)}
            disabled={record.status === PubStatus.RELEASED}
          >
            发布
          </Button>
          <Button 
            type="link" 
            onClick={() => handleUpdateStatus(record.id, PubStatus.UNPUBLISH)}
            disabled={record.status === PubStatus.UNPUBLISH}
          >
            取消发布
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fetchData = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response: any = await getPublishListApi(page, pageSize);
      if (response?.code === 0) {
        setData(response.data.list);
        setPagination({
          ...pagination,
          current: page,
          total: response.data.total,
        });
      } else {
        message.error(response?.msg || '获取列表失败');
      }
    } catch (error) {
      message.error('获取列表失败');
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