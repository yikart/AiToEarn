import {
  AutoRun,
  AutoRunStatus,
  AutoRunType,
  ipcGetAutoRunList,
  ipcUpdateAutoRunStatus,
} from '@/icp/autoRun';
import { Popconfirm, Space, Table } from 'antd';
import React from 'react';
import AutoRunRecord, { AutoRunRecordRef } from './components/autoRunRecord';

const { Column } = Table;

const Page: React.FC = () => {
  const Ref_AutoRunRecord = React.useRef<AutoRunRecordRef>(null);

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

  function changeAutoRunStatus(id: number, status: AutoRunStatus) {
    ipcUpdateAutoRunStatus(id, status);
  }

  // 打开Ref_AutoRunRecord
  function openAutoRunRecord(record: AutoRun) {
    Ref_AutoRunRecord.current?.init(record);
  }

  React.useEffect(() => {
    getAutoRunList();
  }, [pagination.page, pagination.pageSize]);

  return (
    <div style={{ width: '100%' }} className="bg-slate-500">
      <Table
        rowKey="id"
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
              <Popconfirm
                title="确认暂停该任务"
                onConfirm={(e?: React.MouseEvent<HTMLElement>) => {
                  changeAutoRunStatus(record.id, AutoRunStatus.PAUSE);
                }}
                okText="是"
                cancelText="否"
              >
                <a>暂停</a>
              </Popconfirm>

              <Popconfirm
                title="确认停止该任务"
                onConfirm={(e?: React.MouseEvent<HTMLElement>) => {
                  changeAutoRunStatus(record.id, AutoRunStatus.DELETE);
                }}
                okText="是"
                cancelText="否"
              >
                <a>删除</a>
              </Popconfirm>

              <a onClick={() => openAutoRunRecord(record)}>打开记录</a>
            </Space>
          )}
        />
      </Table>

      <AutoRunRecord ref={Ref_AutoRunRecord} />
    </div>
  );
};

export default Page;
