import {
  ForwardedRef,
  forwardRef,
  memo,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Avatar,
  Button,
  Drawer,
  message,
  Modal,
  Select,
  Spin,
  Table,
  TableProps,
  Tooltip,
} from "antd";
import styles from "./AccountSidebar.module.scss";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import UserManageSidebar from "./UserManageSidebar";
import { SocialAccount } from "@/api/types/account.type";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import { AccountStatus } from "@/app/config/accountConfig";
import AvatarPlat from "@/components/AvatarPlat";
import { deleteAccountsApi, updateAccountApi } from "@/api/account";

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
      const [selectedRows, setSelectedRows] = useState<SocialAccount[]>([]);
      // 全部账号
      const allUser = useRef("-1");
      // -1=全部账号，不然为对应分组 ID
      const [activeGroup, setActiveGroup] = useState(allUser.current);
      // 是否改变了顺序
      const isUpdateRank = useRef(false);
      const [deleteLoading, setDeleteLoading] = useState(false);
      const [cutLoading, setCutLoading] = useState(false);

      const columns = useMemo(() => {
        const columns: TableProps<SocialAccount>["columns"] = [
          {
            title: "账号",
            render: (text, am) => {
              return (
                <div
                  className={`userManage-content-user ${am.status === AccountStatus.DISABLE ? "userManage-content-user--disable" : ""}`}
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
            key: "nickname",
          },
          {
            title: "平台",
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
            key: "nickname",
          },
          {
            title: "账号状态",
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
                      在线
                    </>
                  ) : (
                    <>
                      <WarningOutlined
                        style={{
                          color: "var(--warningColor)",
                          marginRight: "3px",
                        }}
                      />
                      离线
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
            title="账号管理器"
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
                  {/*<div className="userManage-content-head">*/}
                  {/*  <div></div>*/}
                  {/*</div>*/}
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
        </>
      );
    },
  ),
);
UserManageModal.displayName = "UserManageModal";

export default UserManageModal;
