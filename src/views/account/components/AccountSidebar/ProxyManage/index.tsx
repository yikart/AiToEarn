import {
  ForwardedRef,
  forwardRef,
  memo,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './proxyManage.module.scss';
import { Button, Input, message, Modal, Table, TableProps } from 'antd';
import { AccountGroupItem, useAccountStore } from '@/store/account';
import { useShallow } from 'zustand/react/shallow';
import { SearchOutlined } from '@ant-design/icons';
import accountStyles from '../AccountSidebar.module.scss';
import { icpEditDeleteAccountGroup, icpProxyCheck } from '@/icp/account';

export interface IProxyManageRef {}

export interface IProxyManageProps {
  open: boolean;
  onCancel: () => void;
  onExamineAccountClick: (groupId: number) => void;
}

const ProxyManage = memo(
  forwardRef(
    (
      { open, onCancel, onExamineAccountClick }: IProxyManageProps,
      ref: ForwardedRef<IProxyManageRef>,
    ) => {
      const { accountGroupList, getAccountGroup } = useAccountStore(
        useShallow((state) => ({
          accountGroupList: state.accountGroupList,
          getAccountGroup: state.getAccountGroup,
        })),
      );
      const [proxyOpen, setProxyOpen] = useState(false);
      const [proxyName, setProxyName] = useState('');
      const [proxyLoading, setProxyLoading] = useState(false);
      const [submitLoading, setSubmitLoading] = useState(false);
      const proxyGroupData = useRef<AccountGroupItem>(undefined);

      const columns = useMemo(() => {
        const columns: TableProps<AccountGroupItem>['columns'] = [
          {
            title: '分组名称',
            key: 'name',
            dataIndex: 'name',
          },
          {
            title: '代理地址',
            key: 'proxy',
            dataIndex: 'proxyIp',
          },
          {
            title: '账号数量',
            key: 'accountCount',
            width: 110,
            sorter: (a, b) => b.children?.length - a.children?.length,
            render: (_, gri) => {
              return (
                <>
                  <div className={styles.accountCount}>
                    <span className="accountCount-count">
                      {gri.children?.length}
                    </span>
                    {(gri.children?.length || 0) > 0 && (
                      <SearchOutlined
                        title="查看账号"
                        onClick={() => {
                          onExamineAccountClick(gri.id);
                        }}
                      />
                    )}
                  </div>
                </>
              );
            },
          },
          {
            title: '操作',
            width: 100,
            render: (_, gri) => {
              return (
                <>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      proxyGroupData.current = gri;
                      setProxyName(gri.proxyIp || '');
                      setProxyOpen(true);
                    }}
                  >
                    设置代理
                  </Button>
                </>
              );
            },
          },
        ];
        return columns;
      }, []);

      return (
        <>
          <Modal
            title="设置代理"
            open={proxyOpen}
            onCancel={() => setProxyOpen(false)}
            footer={
              <>
                <Button onClick={() => setProxyOpen(false)}>取消</Button>
                <Button
                  type="primary"
                  loading={submitLoading}
                  onClick={async () => {
                    setSubmitLoading(true);
                    const proxyCheckRes = await icpProxyCheck(proxyName);
                    if (!proxyCheckRes) {
                      setSubmitLoading(false);
                      return message.error('代理地址不可用');
                    }
                    await icpEditDeleteAccountGroup({
                      id: proxyGroupData.current!.id,
                      proxyIp: proxyName,
                    });
                    await getAccountGroup();
                    setProxyOpen(false);
                    setSubmitLoading(false);
                    message.success('代理地址添加成功！');
                  }}
                >
                  确认
                </Button>
              </>
            }
          >
            <div
              className={`${accountStyles.createGroup} ${styles.proxyInput}`}
            >
              <label>代理地址</label>
              <Input
                value={proxyName}
                placeholder="请输入代理地址"
                onChange={(e) => setProxyName(e.target.value)}
              />
              <Button
                disabled={proxyName.length === 0}
                loading={proxyLoading}
                onClick={async () => {
                  setProxyLoading(true);
                  const res = await icpProxyCheck(proxyName);
                  setProxyLoading(false);
                  if (res) {
                    message.success('代理地址可用');
                  } else {
                    message.error('代理地址不可用');
                  }
                }}
              >
                验证连接
              </Button>
            </div>
          </Modal>
          <Modal open={open} title="代理管理器" onCancel={onCancel} width={700}>
            <div className={styles.proxyManage}>
              <Table<AccountGroupItem>
                columns={columns}
                dataSource={accountGroupList}
                rowKey="id"
                childrenColumnName="1"
                scroll={{ y: 500 }}
              />
            </div>
          </Modal>
        </>
      );
    },
  ),
);
ProxyManage.displayName = 'ProxyManage';

export default ProxyManage;
