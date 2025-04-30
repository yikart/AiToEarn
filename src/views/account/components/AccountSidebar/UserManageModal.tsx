import {
  ForwardedRef,
  forwardRef,
  memo,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Avatar,
  Drawer,
  message,
  Modal,
  Select,
  Table,
  TableProps,
  Tooltip,
} from 'antd';
import styles from './AccountSidebar.module.scss';
import { useAccountStore } from '@/store/account';
import { useShallow } from 'zustand/react/shallow';
import { AccountModel } from '../../../../../electron/db/models/account';
import { AccountPlatInfoMap } from '../../comment';
import { AccountStatus } from '../../../../../commont/AccountEnum';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { AvatarPlat } from '@/views/publish/components/PubProgressModule/PubProgressModule';
import {
  icpAccountEditGroup,
  icpDeleteAccounts,
  icpEditDeleteAccountGroup,
} from '@/icp/account';
import UserManageSidebar from './UserManageSidebar';

export interface IUserManageModalRef {
  setActiveGroup: (groupId: number) => void;
}

export interface IUserManageModalProps {
  open: boolean;
  onCancel: () => void;
}

const UserGroupSelect = ({
  account,
  onChange,
}: {
  account: AccountModel;
  onChange: (groupId: number) => void;
}) => {
  const { accountGroupList } = useAccountStore(
    useShallow((state) => ({
      accountGroupList: state.accountGroupList,
    })),
  );

  return (
    <Select
      value={account.groupId}
      style={{ width: '160px' }}
      fieldNames={{
        value: 'id',
        label: 'name',
      }}
      options={accountGroupList}
      onChange={onChange}
    />
  );
};

const UserManageModal = memo(
  forwardRef(
    (
      { open, onCancel }: IUserManageModalProps,
      ref: ForwardedRef<IUserManageModalRef>,
    ) => {
      const { accountList, getAccountList, accountGroupList, accountMap } =
        useAccountStore(
          useShallow((state) => ({
            accountList: state.accountList,
            getAccountList: state.getAccountList,
            accountGroupList: state.accountGroupList,
            accountMap: state.accountMap,
          })),
        );
      const [deleteHitOpen, setDeleteHitOpen] = useState(false);
      const [selectedRows, setSelectedRows] = useState<AccountModel[]>([]);
      // 全部账号
      const allUser = useRef(-1);
      // -1=全部账号，不然为对应分组 ID
      const [activeGroup, setActiveGroup] = useState(allUser.current);
      // 是否改变了顺序
      const isUpdateRank = useRef(false);

      const columns = useMemo(() => {
        const columns: TableProps<AccountModel>['columns'] = [
          {
            title: '账号',
            render: (text, am) => {
              return (
                <div
                  className={`userManage-content-user ${am.status === AccountStatus.DISABLE ? 'userManage-content-user--disable' : ''}`}
                >
                  <Avatar src={am.avatar} />
                  <span
                    className="userManage-content-user-name"
                    title={am.nickname}
                  >
                    {am.nickname}
                  </span>
                </div>
              );
            },
            width: 200,
            key: 'nickname',
          },
          {
            title: '平台',
            render: (text, am) => {
              const platInfo = AccountPlatInfoMap.get(am.type)!;
              return (
                <div className="userManage-content-plat">
                  <Tooltip title={platInfo.name}>
                    <img src={platInfo.icon} />
                  </Tooltip>
                </div>
              );
            },
            width: 80,
            key: 'nickname',
          },
          {
            title: '账号状态',
            render: (text, am) => {
              return (
                <>
                  {am.status === AccountStatus.USABLE ? (
                    <>
                      <CheckCircleOutlined
                        style={{
                          color: 'var(--successColor)',
                          marginRight: '3px',
                        }}
                      />
                      在线
                    </>
                  ) : (
                    <>
                      <WarningOutlined
                        style={{
                          color: 'var(--warningColor)',
                          marginRight: '3px',
                        }}
                      />
                      离线
                    </>
                  )}
                </>
              );
            },
            width: 100,
            key: 'nickname',
          },
          {
            title: '所属列表',
            render: (text, am) => {
              return (
                <UserGroupSelect
                  account={am}
                  onChange={async (groupId) => {
                    await updateAccountGroupRank();
                    await icpAccountEditGroup(am.id, groupId);
                    await getAccountList();
                  }}
                />
              );
            },
            width: 200,
            key: 'groupId',
          },
        ];
        return columns;
      }, []);

      const rowSelection: TableProps<AccountModel>['rowSelection'] = {
        onChange: (
          selectedRowKeys: React.Key[],
          selectedRows: AccountModel[],
        ) => {
          setSelectedRows(selectedRows);
        },
        getCheckboxProps: (record: AccountModel) => ({
          name: record.nickname,
        }),
        selectedRowKeys: selectedRows.map((v) => v.id),
      };

      const close = () => {
        onCancel();
        setSelectedRows([]);
        updateAccountGroupRank();
      };

      // 更新账户组顺序
      const updateAccountGroupRank = async () => {
        if (isUpdateRank.current) {
          const accountGroupList = useAccountStore.getState().accountGroupList;
          for (let i = 0; i < accountGroupList.length; i++) {
            const v = accountGroupList[i];
            // 这里不需要更新数据，因为在排序完成后已经更新了全局的sotre，引用sotre的所有位置都会发生更改
            await icpEditDeleteAccountGroup({
              id: v.id,
              rank: i,
            });
          }
          isUpdateRank.current = false;
        }
      };

      const accountListLast = useMemo(() => {
        if (activeGroup === allUser.current) {
          return accountList;
        }
        return accountGroupList.find((v) => v.id === activeGroup)?.children;
      }, [accountMap, activeGroup, accountGroupList]);

      const imperativeHandle: IUserManageModalRef = {
        setActiveGroup,
      };
      useImperativeHandle(ref, () => imperativeHandle);

      return (
        <>
          <Modal
            centered
            open={deleteHitOpen}
            title="删除提示"
            width={500}
            onCancel={() => setDeleteHitOpen(false)}
            rootClassName={styles.userManageDeleteHitModal}
            onOk={async () => {
              await icpDeleteAccounts(selectedRows.map((v) => v.id));
              await getAccountList();
              setDeleteHitOpen(false);
              setSelectedRows([]);
              message.success('删除成功');
            }}
          >
            <p>
              是否删除以下
              <span style={{ color: 'var(--errerColor)' }}>
                {selectedRows.length}
              </span>
              个账号？
            </p>
            <div className={styles['userManageDeleteHitModal-users']}>
              {selectedRows.map((v) => {
                return (
                  <li key={v.id}>
                    <AvatarPlat account={v} size="large" />
                    <span>{v.nickname}</span>
                  </li>
                );
              })}
            </div>
          </Modal>

          <Modal
            open={open}
            title="账号管理器"
            zIndex={1001}
            footer={null}
            width={1000}
            onCancel={close}
            rootClassName={styles.userManageModal}
          >
            <div className={styles.userManage}>
              <UserManageSidebar
                allUser={allUser.current}
                activeGroup={activeGroup}
                onChange={setActiveGroup}
                onSortEnd={() => {
                  isUpdateRank.current = true;
                }}
              />

              <div className="userManage-content">
                {/*<div className="userManage-content-head">*/}
                {/*  <div></div>*/}
                {/*</div>*/}
                <Table<AccountModel>
                  columns={columns}
                  dataSource={accountListLast}
                  rowKey="id"
                  rowSelection={{ type: 'checkbox', ...rowSelection }}
                />

                <Drawer
                  title={
                    <>
                      已选择
                      <span style={{ color: 'var(--successColor)' }}>
                        {selectedRows.length}
                      </span>
                      个账号
                    </>
                  }
                  placement="bottom"
                  mask={false}
                  height={150}
                  closable={true}
                  onClose={() => {
                    setSelectedRows([]);
                  }}
                  open={selectedRows.length !== 0}
                  getContainer={false}
                >
                  <div className="userManage-content-multiple">
                    <div
                      className="userManage-content-multiple-item"
                      onClick={() => {
                        setDeleteHitOpen(true);
                      }}
                    >
                      <div className="userManage-content-multiple-item-icon">
                        <DeleteOutlined />
                      </div>
                      <span>删除账号</span>
                    </div>
                  </div>
                </Drawer>
              </div>
            </div>
          </Modal>
        </>
      );
    },
  ),
);
UserManageModal.displayName = 'UserManageModal';

export default UserManageModal;
