import { AutoRun, AutoRunRecord, ipcGetAutoRunRecordList } from '@/icp/autoRun';
import { Modal, Table } from 'antd';
import React from 'react';

const { Column } = Table;

const Page: React.FC = (props: any, ref) => {
  const [autoRunRecordList, setAutoRunRecordList] = React.useState<
    AutoRunRecord[]
  >([]);
  const [autoRun, setAutoRun] = React.useState<AutoRun | null>(null);
  const [pagination, setPagination] = React.useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  async function init(inAutoRun: AutoRun) {
    setAutoRun(inAutoRun);
    setIsModalOpen(true);
  }

  React.useImperativeHandle(ref, () => ({
    init: init,
  }));

  /**
   * 获取自动运行的列表
   */
  async function getAutoRunList() {
    if (!autoRun) return;

    const res = await ipcGetAutoRunRecordList(
      {
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
      {
        autoRunId: autoRun.id,
      },
    );

    setAutoRunRecordList(res.list);
    setPagination({
      ...pagination,
      total: res.count,
    });
  }

  React.useEffect(() => {
    getAutoRunList();
  }, [pagination.page, pagination.pageSize]);

  return (
    <Modal
      title="任务记录"
      open={isModalOpen}
      onCancel={() => {
        setIsModalOpen(false);
      }}
      footer={null}
      width={600}
    >
      <div style={{ width: '100%' }} className="bg-slate-500">
        <Table
          dataSource={autoRunRecordList}
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
        </Table>
      </div>
    </Modal>
  );
};

export default Page;
