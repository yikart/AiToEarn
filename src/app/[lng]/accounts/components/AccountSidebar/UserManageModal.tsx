import {
  ForwardedRef,
  forwardRef,
  memo,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  Button,
  Drawer,
  message,
  Modal,
  Select,
  Spin,
  Table,
  TableProps,
  Tooltip,
  Card,
  Space,
} from "antd";
import styles from "./AccountSidebar.module.scss";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  WarningOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import UserManageSidebar from "./UserManageSidebar";
import { SocialAccount } from "@/api/types/account.type";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import { AccountStatus } from "@/app/config/accountConfig";
import AvatarPlat from "@/components/AvatarPlat";
import { deleteAccountsApi, updateAccountApi } from "@/api/account";
import { useTransClient } from "@/app/i18n/client";
import AddAccountModal from "../AddAccountModal";
import { getIpLocation, IpLocationInfo, formatLocationInfo } from "@/utils/ipLocation";

export interface IUserManageModalRef {
  setActiveGroup: (groupId: string) => void;
}

export interface IUserManageModalProps {
  open: boolean;
  onCancel: () => void;
}

const UserGroupSelect = ({
  account,
  onChange,
}: {
  account: SocialAccount;
  onChange: (groupId: string) => void;
}) => {
  const { accountGroupList } = useAccountStore(
    useShallow((state) => ({
      accountGroupList: state.accountGroupList,
    })),
  );

  return (
    <Select
      // @ts-ignore
      value={account.groupId}
      style={{ width: "160px" }}
      fieldNames={{
        value: "id",
        label: "name",
      }}
      options={accountGroupList}
      onChange={onChange}
    />
  );
};

// 空间信息展示组件
const SpaceInfoCard = ({ 
  activeGroup, 
  accountGroupList, 
  allUser 
}: { 
  activeGroup: string; 
  accountGroupList: any[]; 
  allUser: string;
}) => {
  const { t } = useTransClient("account");
  const [ipLocationInfo, setIpLocationInfo] = useState<IpLocationInfo | null>(null);
  const [ipLocationLoading, setIpLocationLoading] = useState(false);

  // 获取IP地理位置信息
  useEffect(() => {
    const fetchIpLocation = async () => {
      try {
        setIpLocationLoading(true);
        const info = await getIpLocation();
        setIpLocationInfo(info);
      } catch (error) {
        console.error('获取IP地理位置信息失败:', error);
      } finally {
        setIpLocationLoading(false);
      }
    };

    // 只在组件挂载时获取一次IP信息
    fetchIpLocation();
  }, []);

  // 如果是全部账号，不显示信息卡片
  if (activeGroup === allUser) {
    return null;
  }

  // 获取当前选中的空间信息
  const currentSpace = accountGroupList.find(group => group.id === activeGroup);
  if (!currentSpace) return null;

  return (
    <Card 
      size="small" 
      style={{ 
        marginBottom: '16px',
        backgroundColor: 'var(--grayColor1)',
        border: '1px solid var(--grayColor3)'
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ 
            fontSize: 'var(--fs-xs)', 
            color: 'var(--grayColor6)',
            backgroundColor: 'var(--grayColor2)',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {currentSpace.children?.length || 0} 个账号
          </span>
        </div> */}
        
        {/* 默认空间显示IP和属地信息 */}
        {currentSpace.isDefault && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px',
            backgroundColor: 'var(--grayColor2)',
            borderRadius: '6px'
          }}>
            <GlobalOutlined style={{ color: 'var(--colorPrimary5)' }} />
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--grayColor7)' }}>
              {t("ipInfo.loading")}
            </span>
            {ipLocationLoading ? (
              <span style={{ color: 'var(--colorPrimary5)', fontStyle: 'italic' }}>
                {t("ipInfo.loading")}
              </span>
            ) : ipLocationInfo ? (
              <Tooltip title={t("ipInfo.tooltip", { asn: ipLocationInfo.asn, org: ipLocationInfo.org })}>
                <span style={{ 
                  color: 'var(--grayColor7)',
                  cursor: 'help',
                  fontWeight: '500'
                }}>
                  {formatLocationInfo(ipLocationInfo)}
                </span>
              </Tooltip>
            ) : (
              <span style={{ color: 'var(--errorColor)', fontStyle: 'italic' }}>
                {t("ipInfo.error")}
              </span>
            )}
          </div>
        )}
        
        {/* 空间创建时间等信息 */}
        <div style={{ 
          fontSize: 'var(--fs-xs)', 
          color: 'var(--grayColor6)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <EnvironmentOutlined />
          <span>空间ID: {currentSpace.id}</span>
          {currentSpace.isDefault && (
            <span style={{ 
              color: 'var(--colorPrimary5)',
              backgroundColor: 'var(--colorPrimary1)',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: 'var(--fs-xs)'
            }}>
              defaultSpace
            </span>
          )}
        </div>
      </Space>
    </Card>
  );
};

const UserManageModal = memo(
  forwardRef(
    (
      { open, onCancel }: IUserManageModalProps,
      ref: ForwardedRef<IUserManageModalRef>,
    ) => {
      const { t } = useTransClient("account");
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
      const [selectedRows, setSelectedRows] = useState<SocialAccount[]>([]);
      // 全部账号
      const allUser = useRef("-1");
      // -1=全部账号，不然为对应分组 ID
      const [activeGroup, setActiveGroup] = useState(allUser.current);
      // 是否改变了顺序
      const isUpdateRank = useRef(false);
      const [deleteLoading, setDeleteLoading] = useState(false);
      const [cutLoading, setCutLoading] = useState(false);
      const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
      const [chooseGroupOpen, setChooseGroupOpen] = useState(false);
      const [chosenGroupId, setChosenGroupId] = useState<string | undefined>(undefined);
      const preAccountIds = useRef<Set<string>>(new Set());
      const pendingGroupIdRef = useRef<string | null>(null);
      const isAssigningRef = useRef(false);
      const snapshotReadyRef = useRef(false);

      const columns = useMemo(() => {
        const columns: TableProps<SocialAccount>["columns"] = [
          {
            title: "账号",
            render: (text, am) => {
              return (
                <div
                  className={`userManage-content-user ${am.status === AccountStatus.DISABLE ? "userManage-content-user--disable" : ""}`}
                >
                  {/*<Avatar src={am.avatar} />*/}
                  <AvatarPlat account={am} size="large" />
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
            key: "nickname",
          },
          {
            title: "平台",
            render: (text, am) => {
              const platInfo = AccountPlatInfoMap.get(am.type)!;
              return (
                <div className="userManage-content-plat">
                  <Tooltip title={platInfo?.name}>
                    <img src={platInfo?.icon} style={{
                      width: "20px",
                      height: "20px",
                    }} />
                  </Tooltip>
                </div>
              );
            },
            width: 80,
            key: "nickname",
          },
          {
            title: t("accountStatus"),
            render: (text, am) => {
              return (
                <>
                  {am.status === AccountStatus.USABLE ? (
                    <>
                      <CheckCircleOutlined
                        style={{
                          color: "var(--successColor)",
                          marginRight: "3px",
                        }}
                      />
                      {t("online")}
                    </>
                  ) : (
                    <>
                      <WarningOutlined
                        style={{
                          color: "var(--warningColor)",
                          marginRight: "3px",
                        }}
                      />
                      {t("offline")}
                    </>
                  )}
                </>
              );
            },
            width: 100,
            key: "nickname",
          },
          {
            title: "所属列表",
            render: (text, am) => {
              return (
                <UserGroupSelect
                  account={am}
                  onChange={async (groupId) => {
                    setCutLoading(true);
                    await updateAccountGroupRank();
                    await updateAccountApi({
                      id: am.id,
                      groupId,
                    });
                    await getAccountList();
                    setCutLoading(false);
                  }}
                />
              );
            },
            width: 200,
            key: "groupId",
          },
        ];
        return columns;
      }, []);

      const rowSelection: TableProps<SocialAccount>["rowSelection"] = {
        onChange: (
          selectedRowKeys: React.Key[],
          selectedRows: SocialAccount[],
        ) => {
          setSelectedRows(selectedRows);
        },
        getCheckboxProps: (record: SocialAccount) => ({
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
            // TODO 排序更新
            // await icpEditDeleteAccountGroup({
            //   id: v.id,
            //   rank: i,
            // });
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

      const openAddAccountFlow = async () => {
        const currentGroupId = activeGroup;
        close();
        if (currentGroupId === allUser.current) {
          setChosenGroupId(accountGroupList[0]?.id);
          setChooseGroupOpen(true);
        } else {
          pendingGroupIdRef.current = currentGroupId;
          if ((useAccountStore.getState().accountList || []).length === 0) {
            await getAccountList();
          }
          preAccountIds.current = new Set(
            (useAccountStore.getState().accountList || []).map((v) => v.id),
          );
          snapshotReadyRef.current = true;
          setIsAddAccountOpen(true);
        }
      };

      useEffect(() => {
        const maybeAssign = async () => {
          if (!pendingGroupIdRef.current) return;
          if (isAssigningRef.current) return;
          if (!snapshotReadyRef.current) return;
          const currList = accountList || [];
          const newAccounts = currList.filter((a) => !preAccountIds.current.has(a.id));
          if (newAccounts.length === 0) return;
          isAssigningRef.current = true;
          try {
            const targetGroupId = pendingGroupIdRef.current!;
            for (const acc of newAccounts) {
              try {
                await updateAccountApi({ id: acc.id, groupId: targetGroupId });
              } catch {}
            }
            await getAccountList();
            message.success(t("accountAddedToSpace" as any));
          } finally {
            pendingGroupIdRef.current = null;
            preAccountIds.current = new Set();
            isAssigningRef.current = false;
            snapshotReadyRef.current = false;
          }
        };
        maybeAssign();
      }, [accountList]);

      return (
        <>
          <Modal
            open={deleteHitOpen}
            title="删除提示"
            width={500}
            zIndex={1002}
            rootClassName={styles.userManageDeleteHitModal}
            footer={
              <>
                <Button onClick={() => setDeleteHitOpen(false)}>取消</Button>
                <Button
                  type="primary"
                  loading={deleteLoading}
                  onClick={async () => {
                    setDeleteLoading(true);
                    const res = await deleteAccountsApi(
                      selectedRows.map((v) => v.id),
                    );
                    if (!res) return setDeleteLoading(false);
                    await getAccountList();
                    setDeleteHitOpen(false);
                    setSelectedRows([]);
                    message.success("删除成功");
                    setDeleteLoading(false);
                  }}
                >
                  确认
                </Button>
              </>
            }
          >
            <p>
              是否删除以下
              <span style={{ color: "var(--errerColor)" }}>
                {selectedRows.length}
              </span>
              个账号？
            </p>
            <div className={styles["userManageDeleteHitModal-users"]}>
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
            title={t("accountManager")}
            zIndex={1001}
            footer={null}
            width={1000}
            onCancel={close}
            rootClassName={styles.userManageModal}
          >
            <Spin spinning={cutLoading}>
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
                  {/* 空间信息卡片 - 显示在右侧上方 */}
                  <SpaceInfoCard 
                    activeGroup={activeGroup}
                    accountGroupList={accountGroupList}
                    allUser={allUser.current}
                  />
                  
                  <div className="userManage-content-head" style={{ marginBottom: "8px", display: "flex", justifyContent: "flex-end" }}>
                    <Button type="primary" onClick={openAddAccountFlow}>{t("addAccount")}</Button>
                  </div>
                  <Table<SocialAccount>
                    columns={columns}
                    dataSource={accountListLast}
                    rowKey="id"
                    scroll={{ y: "100%" }}
                    rowSelection={{ type: "checkbox", ...rowSelection }}
                  />

                  <Drawer
                    title={
                      <>
                        已选择
                        <span style={{ color: "var(--successColor)" }}>
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
            </Spin>
          </Modal>
          <Modal
            open={chooseGroupOpen}
            title={t("chooseSpace" as any)}
            onCancel={() => setChooseGroupOpen(false)}
            onOk={async () => {
              if (!chosenGroupId) return message.warning(t("pleaseChooseSpace" as any));
              pendingGroupIdRef.current = chosenGroupId;
              if ((useAccountStore.getState().accountList || []).length === 0) {
                await getAccountList();
              }
              preAccountIds.current = new Set(
                (useAccountStore.getState().accountList || []).map((v) => v.id),
              );
              snapshotReadyRef.current = true;
              setChooseGroupOpen(false);
              setIsAddAccountOpen(true);
            }}
            width={420}
          >
            <Select
              style={{ width: "100%" }}
              placeholder={t("pleaseChooseSpace" as any)}
              value={chosenGroupId}
              onChange={setChosenGroupId}
              options={accountGroupList.map((g) => ({ value: g.id, label: g.name }))}
            />
          </Modal>

          <AddAccountModal
            open={isAddAccountOpen}
            onClose={async () => {
              setIsAddAccountOpen(false);
            }}
            onAddSuccess={async (acc) => {
              try {
                if (pendingGroupIdRef.current) {
                  await updateAccountApi({ id: acc.id, groupId: pendingGroupIdRef.current });
                  message.success(t("accountAddedToSpace" as any));
                }
              } finally {
                pendingGroupIdRef.current = null;
                await getAccountList();
              }
            }}
          />
        </>
      );
    },
  ),
);
UserManageModal.displayName = "UserManageModal";

export default UserManageModal;
