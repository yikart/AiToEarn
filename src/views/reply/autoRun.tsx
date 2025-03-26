import { AutoRun, AutoRunType, ipcGetAutoRunList } from '@/icp/autoRun';
import { Space, Table, Tag } from 'antd';
import React from 'react';

const { Column } = Table;

const Page: React.FC = () => {
  const [autoRunList, setAutoRunList] = React.useState<AutoRun[]>([]);
  // 分页组件的数据
  const [pagination, setPagination] = React.useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  /**
   * 获取自动运行的列表
   */
  async function getAutoRunList() {
    const res = await ipcGetAutoRunList(
      {
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
      {
        type: AutoRunType.ReplyComment,
      },
    );

    setAutoRunList(res.list);
    setPagination({
      ...pagination,
      total: res.count,
    });
  }

  React.useEffect(() => {
    getAutoRunList();
  }, [pagination.page, pagination.pageSize]);

  return (
    <Table dataSource={autoRunList}>
      <Column title="Age" dataIndex="age" key="age" />
      <Column title="Age" dataIndex="age" key="age" />
      <Column title="Address" dataIndex="address" key="address" />
      <Column
        title="Tags"
        dataIndex="tags"
        key="tags"
        render={(tags: string[]) => (
          <>
            {tags.map((tag) => (
              <Tag color="blue" key={tag}>
                {tag}
              </Tag>
            ))}
          </>
        )}
      />
      <Column
        title="Action"
        key="action"
        render={(_: any, record: AutoRun) => (
          <Space size="middle">
            <a>Delete</a>
          </Space>
        )}
      />
    </Table>
  );
};

export default Page;
