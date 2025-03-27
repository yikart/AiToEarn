import { AutoRun, AutoRunRecord, ipcGetAutoRunRecordList } from '@/icp/autoRun';
import { Modal, Table } from 'antd';
import React from 'react';

const { Column } = Table;
export interface AutoRunRecordRef {
  init: (inAutoRun: AutoRun) => Promise<void>;
}

const Com = React.forwardRef<AutoRunRecordRef>((props: any, ref) => {
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
    getAutoRunRecordList(inAutoRun);
    setIsModalOpen(true);
  }

  React.useImperativeHandle(ref, () => ({
    init: init,
  }));

  /**
   * 获取自动运行的列表
   */
  async function getAutoRunRecordList(inAutoRun: AutoRun) {
    if (!inAutoRun) return;

    const res = await ipcGetAutoRunRecordList(
      {
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
      {
        autoRunId: inAutoRun.id,
      },
    );

    setAutoRunRecordList(res.list);
    setPagination({
      ...pagination,
      total: res.count,
    });
  }

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
          <Column title="任务DI" dataIndex="autoRunId" key="autoRunId" />
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
});

export default Com;
