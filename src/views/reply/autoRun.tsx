import { AutoRun, AutoRunType, ipcGetAutoRunList } from '@/icp/autoRun';
import { Space, Table } from 'antd';
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
    <div style={{ width: '100%' }} className="bg-slate-500">
      <Table
        dataSource={autoRunList}
        style={{ width: '100%' }}
        className="bg-slate-500"
        pagination={pagination}
        onChange={(newPagination) => {
          setPagination({
            ...pagination,
            page: newPagination.current!,
            pageSize: newPagination.pageSize!,
          });
        }}
      >
        <Column title="ID" dataIndex="id" key="id" />
        <Column title="用户DI" dataIndex="userId" key="userId" />
        <Column title="账户ID" dataIndex="accountId" key="accountId" />
        <Column title="运行次数" dataIndex="runCount" key="runCount" />
        <Column title="状态" dataIndex="status" key="status" />
        <Column title="类型" dataIndex="type" key="type" />
        <Column title="触发周期" dataIndex="cycleType" key="cycleType" />
        <Column
          title="创建时间"
          key="createTime"
          render={(_: any, record: AutoRun) => (
            <p>{new Date(record.createTime).toLocaleString()}</p>
          )}
        />

        <Column
          title="操作"
          key="action"
          render={(_: any, record: AutoRun) => (
            <Space size="middle">
              <a>暂停</a>
              <a>删除</a>
            </Space>
          )}
        />
      </Table>
    </div>
  );
};

export default Page;
