import {
  AutoRun,
  AutoRunStatus,
  AutoRunType,
  ipcGetAutoRunList,
  ipcRunNowAutoRun,
  ipcUpdateAutoRunStatus,
} from '@/icp/autoRun';
import { Button, Popconfirm, Space, Table } from 'antd';
import React from 'react';
import AutoRunRecord, { AutoRunRecordRef } from './components/autoRunRecord';
import { ParseCronSchedule } from '@/components/CronSchedule';
import { WorkData } from '@/icp/reply';

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

  async function changeAutoRunStatus(id: number, status: AutoRunStatus) {
    await ipcUpdateAutoRunStatus(id, status);
    getAutoRunList();
  }

  // 打开Ref_AutoRunRecord
  function openAutoRunRecord(record: AutoRun) {
    Ref_AutoRunRecord.current?.init(record);
  }

  React.useEffect(() => {
    getAutoRunList();
  }, [pagination.page, pagination.pageSize]);

  // 添加刷新功能的函数
  function refreshAutoRunList() {
    getAutoRunList();
  }

  function runNowAutoRun(data: AutoRun) {
    ipcRunNowAutoRun(data.id);
  }

  // 添加状态映射
  const statusMap: { [key in AutoRunStatus]: string } = {
    [AutoRunStatus.DOING]: '活跃',
    [AutoRunStatus.PAUSE]: '暂停',
    [AutoRunStatus.DELETE]: '删除',
    // 可以根据需要添加更多状态
  };

  // 添加类型映射
  const typeMap: { [key in AutoRunType]: string } = {
    [AutoRunType.ReplyComment]: '回复评论',
    // 可以根据需要添加更多类型
  };

  function domDataInfo(data: string) {
    const info: WorkData = JSON.parse(data);
    return (
      <div>
        <img className="w-[50px] h-[100px]" src={info.coverUrl} alt="封面" />
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* 添加刷新按钮 */}
      <Button onClick={refreshAutoRunList} style={{ marginBottom: 16 }}>
        刷新
      </Button>
      <Table
        rowKey="id"
        dataSource={autoRunList}
        style={{ width: '100%' }}
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
        <Column title="账户ID" dataIndex="accountId" key="accountId" />
        <Column title="运行次数" dataIndex="runCount" key="runCount" />
        <Column
          title="状态"
          dataIndex="status"
          key="status"
          render={(status: AutoRunStatus) => statusMap[status]}
        />
        <Column
          title="类型"
          dataIndex="type"
          key="type"
          render={(type: AutoRunType) => typeMap[type]}
        />
        <Column
          title="触发周期"
          dataIndex="cycleType"
          key="cycleType"
          render={(cycleType: string) => (
            <ParseCronSchedule cronExpression={cycleType} />
          )}
        />

        <Column
          title="数据"
          dataIndex="data"
          key="data"
          render={(data: any) => domDataInfo(data)}
        />

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
                title="确认删除该任务"
                onConfirm={(e?: React.MouseEvent<HTMLElement>) => {
                  changeAutoRunStatus(record.id, AutoRunStatus.DELETE);
                }}
                okText="是"
                cancelText="否"
              >
                <a>删除</a>
              </Popconfirm>
              <a onClick={() => runNowAutoRun(record)}>立即执行</a>
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
