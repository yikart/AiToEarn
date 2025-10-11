import {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./AccountSidebar.module.scss";
import {
  Avatar,
  Button,
  Collapse,
  Popover,
  Skeleton,
  Tooltip,
  Modal,
  Input,
  message,
} from "antd";
// import { accountLogin, acpAccountLoginCheck } from "@/icp/account";
import {
  CheckCircleOutlined,
  PlusOutlined,
  UserOutlined,
  WarningOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useShallow } from "zustand/react/shallow";
import { useAccountStore } from "@/store/account";
import UserManageModal, { IUserManageModalRef } from "./UserManageModal";
import MCPManagerModal, { IMCPManagerModalRef } from "./MCPManagerModal";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import { AccountStatus } from "@/app/config/accountConfig";
import { SocialAccount } from "@/api/types/account.type";
import { getOssUrl } from "@/utils/oss";
import { useTransClient } from "@/app/i18n/client";
import {
  getIpLocation,
  IpLocationInfo,
  formatLocationInfo,
  extractCountry,
} from "@/utils/ipLocation";
import { createAccountGroupApi, updateAccountApi } from "@/api/account";
import AddAccountModal from "../AddAccountModal";
import DeleteUserConfirmModal from "./DeleteUserConfirmModal";
// 导入各平台授权函数
import { kwaiSkip } from "@/app/[lng]/accounts/plat/kwaiLogin";
import { bilibiliSkip } from "@/app/[lng]/accounts/plat/BilibiliLogin";
import { youtubeSkip } from "@/app/[lng]/accounts/plat/YoutubeLogin";
import { twitterSkip } from "@/app/[lng]/accounts/plat/TwtterLogin";
import { tiktokSkip } from "@/app/[lng]/accounts/plat/TiktokLogin";
import { facebookSkip, FacebookPagesModal } from "@/app/[lng]/accounts/plat/FacebookLogin";
import { instagramSkip } from "@/app/[lng]/accounts/plat/InstagramLogin";
import { threadsSkip } from "@/app/[lng]/accounts/plat/ThreadsLogin";
import { wxGzhSkip } from "@/app/[lng]/accounts/plat/WxGzh";
import { pinterestSkip } from "@/app/[lng]/accounts/plat/PinterestLogin";
import { linkedinSkip } from "@/app/[lng]/accounts/plat/LinkedinLogin";

export interface IAccountSidebarRef {}

export interface IAccountSidebarProps {
  // 选择的账户id
  activeAccountId: string;
  // 切换选择的账户
  onAccountChange: (info: SocialAccount) => void;
  // 排除的平台类型
  excludePlatforms?: PlatType[];
  // 侧边栏内容顶部扩展内容
  sidebarTopExtra?: React.ReactNode;
}

const AccountStatusView = ({ account }: { account: SocialAccount }) => {
  const { t } = useTransClient("account");
  if (account.status === AccountStatus.USABLE) {
    return (
      <>
        <CheckCircleOutlined style={{ color: "var(--successColor)" }} />
        {t("online")}
      </>
    );
  }

  return (
    <>
      <WarningOutlined style={{ color: "var(--warningColor)" }} />
      {t("offline")}
    </>
  );
};

const AccountPopoverInfo = ({
  accountInfo,
  onDeleteClick,
}: {
  accountInfo: SocialAccount;
  onDeleteClick?: (account: SocialAccount) => void;
}) => {
  const { t } = useTransClient("account");
  const platInfo = AccountPlatInfoMap.get(accountInfo.type)!;
  const [detLoading, setDetLoading] = useState(false);

  return (
    <div
      className={styles.accountPopoverInfo}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="accountPopoverInfo_top">
        <Avatar src={getOssUrl(accountInfo.avatar)} size="large" />
        <div className="accountPopoverInfo_top-right">
          <div className="accountPopoverInfo-item">
            <p>{t("nickname")}：</p>
            <p>{accountInfo.nickname}</p>
          </div>
          {/* <div className="accountPopoverInfo-item">
            <p>{t("platform")}：</p>
            <p>
              <img src={platInfo?.icon} />
              {platInfo.name}
            </p>
          </div> */}
          <div className="accountPopoverInfo-item">
            <p>{t("fansCount")}：</p>
            <p>{accountInfo.fansCount ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="accountPopoverInfo-item">
        <p>{t("loginStatus")}：</p>
        <p>
          <AccountStatusView account={accountInfo} />

          <Button
            type="primary"
            danger
            ghost
            size="small"
            icon={<DeleteOutlined />}
            style={{ marginLeft: 18, border: "none" }}
            onClick={() => onDeleteClick?.(accountInfo)}
          >
            {t("deleteAccount" as any)}
          </Button>
        </p>
      </div>
    </div>
  );
};

const AccountSidebar = memo(
  forwardRef(
    (
      {
        activeAccountId,
        onAccountChange,
        excludePlatforms = [],
        sidebarTopExtra,
      }: IAccountSidebarProps,
      ref: ForwardedRef<IAccountSidebarRef>,
    ) => {
      const { t } = useTransClient("account");
      const pubAccountDetModuleRef = useRef<any>(null);
      const {
        accountList: fullAccountList,
        getAccountList,
        getAccountGroup,
        accountGroupList,
        accountLoading,
      } = useAccountStore(
        useShallow((state) => ({
          accountList: state.accountList,
          getAccountList: state.getAccountList,
          getAccountGroup: state.getAccountGroup,
          accountGroupList: state.accountGroupList,
          accountLoading: state.accountLoading,
        })),
      );
      const [userManageModalOpen, setUserManageModalOpen] = useState(false);
      const userManageModalRef = useRef<IUserManageModalRef>(null);
      const [mcpManagerModalOpen, setMcpManagerModalOpen] = useState(false);
      const mcpManagerModalRef = useRef<IMCPManagerModalRef>(null);
      const [deleteHitOpen, setDeleteHitOpen] = useState(false);
      const [deleteLoading, setDeleteLoading] = useState(false);
      const [deleteTarget, setDeleteTarget] = useState<SocialAccount | null>(
        null,
      );

      // IP地理位置信息状态
      const [ipLocationInfo, setIpLocationInfo] =
        useState<IpLocationInfo | null>(null);
      const [ipLocationLoading, setIpLocationLoading] = useState(false);

      // 新建空间状态
      const [openCreateGroup, setOpenCreateGroup] = useState(false);
      const [groupName, setGroupName] = useState("");
      const [createGroupLoading, setCreateGroupLoading] = useState(false);

      // 新建空间相关函数
      const createGroupCancel = () => {
        setOpenCreateGroup(false);
        setGroupName("");
      };

      // 添加账号相关状态
      const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
      const preAccountIds = useRef<Set<string>>(new Set());
      const pendingGroupIdRef = useRef<string | null>(null);
      const isAssigningRef = useRef(false);
      const snapshotReadyRef = useRef(false);
      const allUser = useRef("-1");

      // Facebook页面选择弹窗状态
      const [showFacebookPagesModal, setShowFacebookPagesModal] = useState(false);

      // 在组件内部过滤账号列表，而不是在 useAccountStore 中过滤
      const accountList = useMemo(() => {
        return fullAccountList.filter(
          (account) => !excludePlatforms.includes(account.type),
        );
      }, [fullAccountList, excludePlatforms]);

      const defaultActiveKey = useMemo(() => {
        return accountGroupList.find((v) => v.isDefault)?.id;
      }, [accountGroupList]);

      // 获取IP地理位置信息
      useEffect(() => {
        const fetchIpLocation = async () => {
          try {
            setIpLocationLoading(true);
            const info = await getIpLocation();
            setIpLocationInfo(info);
          } catch (error) {
            console.error(t("messages.ipLocationError" as any), error);
          } finally {
            setIpLocationLoading(false);
          }
        };

        // 只在组件挂载时获取一次IP信息
        fetchIpLocation();
      }, []);

      // 处理离线账户点击，直接跳转到对应平台授权页面
      const handleOfflineAccountClick = useCallback(async (account: SocialAccount) => {
        const platform = account.type;
        const targetSpaceId = account.groupId; // 使用账户原本的空间ID
        
        try {
          // 根据平台类型调用对应的授权函数，传递目标空间ID
          switch (platform) {
            case PlatType.KWAI:
              await kwaiSkip(platform, targetSpaceId);
              break;
            case PlatType.BILIBILI:
              await bilibiliSkip(platform, targetSpaceId);
              break;
            case PlatType.YouTube:
              await youtubeSkip(platform, targetSpaceId);
              break;
            case PlatType.Twitter:
              await twitterSkip(platform, targetSpaceId);
              break;
            case PlatType.Tiktok:
              await tiktokSkip(platform, targetSpaceId);
              break;
            case PlatType.Facebook:
              try {
                await facebookSkip(platform, targetSpaceId);
                // Facebook授权成功后显示页面选择弹窗
                setShowFacebookPagesModal(true);
              } catch (error) {
                console.error(t('messages.facebookAuthFailed' as any), error);
              }
              break;
            case PlatType.Instagram:
              await instagramSkip(platform, targetSpaceId);
              break;
            case PlatType.Threads:
              await threadsSkip(platform, targetSpaceId);
              break;
            case PlatType.WxGzh:
              await wxGzhSkip(platform, targetSpaceId);
              break;
            case PlatType.Pinterest:
              await pinterestSkip(platform, targetSpaceId);
              break;
            case PlatType.LinkedIn:
              await linkedinSkip(platform, targetSpaceId);
              break;
            default:
              console.warn(`${t('messages.unsupportedPlatform' as any)}: ${platform}`);
              message.warning(t('messages.platformNotSupported' as any, { platform }));
              return;
          }

          // 授权完成后刷新账号列表
          setTimeout(async () => {
            try {
              await getAccountList();
              console.log(t('messages.accountListRefreshed' as any));
            } catch (error) {
              console.error(t('messages.refreshAccountListFailed' as any), error);
            }
          }, 3000); // 等待3秒让授权完成
        } catch (error) {
          console.error(t('messages.authFailed' as any), error);
          message.error(t('messages.authFailed' as any) + '，' + t('messages.pleaseRetry' as any));
        }
      }, [getAccountList]);

      // 处理Facebook页面选择成功
      const handleFacebookPagesSuccess = () => {
        setShowFacebookPagesModal(false);
        // 可以在这里添加成功提示或其他逻辑
      };

      // 添加账号流程
      const openAddAccountFlow = async () => {
        if (accountGroupList.length === 0) {
          message.error(t("messages.createSpaceFirst" as any));
          return;
        }

        // 直接打开AddAccountModal，让用户选择空间
        if ((useAccountStore.getState().accountList || []).length === 0) {
          await getAccountList();
        }
        preAccountIds.current = new Set(
          (useAccountStore.getState().accountList || []).map((v) => v.id),
        );
        snapshotReadyRef.current = true;
        setIsAddAccountOpen(true);
      };

      // 监听账号列表变化，自动分配新账号到当前空间
      useEffect(() => {
        const maybeAssign = async () => {
          if (!pendingGroupIdRef.current) return;
          if (isAssigningRef.current) return;
          if (!snapshotReadyRef.current) return;
          const currList = fullAccountList || [];
          const newAccounts = currList.filter(
            (a) => !preAccountIds.current.has(a.id),
          );
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
            message.success(t("accountAddedToSpace"));
          } finally {
            pendingGroupIdRef.current = null;
            preAccountIds.current = new Set();
            isAssigningRef.current = false;
            snapshotReadyRef.current = false;
          }
        };
        maybeAssign();
      }, [fullAccountList]);

      return (
        <>
          <UserManageModal
            ref={userManageModalRef}
            open={userManageModalOpen}
            onCancel={() => setUserManageModalOpen(false)}
          />
          <MCPManagerModal
            ref={mcpManagerModalRef}
            open={mcpManagerModalOpen}
            onClose={setMcpManagerModalOpen}
          />

          <AddAccountModal
            open={isAddAccountOpen}
            onClose={async () => {
              setIsAddAccountOpen(false);
            }}
            onAddSuccess={async (acc) => {
              try {
                if (pendingGroupIdRef.current) {
                  await updateAccountApi({
                    id: acc.id,
                    groupId: pendingGroupIdRef.current,
                  });
                  message.success(t("accountAddedToSpace"));
                }
              } finally {
                pendingGroupIdRef.current = null;
                await getAccountList();
              }
            }}
            showSpaceSelector={true}
          />

          {/* 新建空间Modal */}
          <Modal
            open={openCreateGroup}
            title={t("createSpace.title")}
            onCancel={createGroupCancel}
            footer={
              <>
                <Button onClick={createGroupCancel}>
                  {t("createSpace.cancel")}
                </Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    if (!groupName.trim()) {
                      message.error(t("createSpace.nameRequired"));
                      return;
                    }
                    setCreateGroupLoading(true);
                    try {
                      await createAccountGroupApi({
                        name: groupName.trim(),
                      });
                      await getAccountGroup();
                      // message.success(t("createSpace.success"));
                      createGroupCancel();
                    } catch (error) {
                      message.error(t("createSpace.failed"));
                    } finally {
                      setCreateGroupLoading(false);
                    }
                  }}
                  loading={createGroupLoading}
                >
                  {t("createSpace.save")}
                </Button>
              </>
            }
          >
            <div className={styles.createGroup}>
              <label>{t("createSpace.name")}</label>
              <Input
                value={groupName}
                placeholder={t("createSpace.namePlaceholder")}
                onChange={(e) => setGroupName(e.target.value)}
                onPressEnter={async () => {
                  if (!groupName.trim()) {
                    message.error(t("createSpace.nameRequired"));
                    return;
                  }
                  setCreateGroupLoading(true);
                  try {
                    await createAccountGroupApi({
                      name: groupName.trim(),
                    });
                    await getAccountGroup();
                    message.success(t("createSpace.success"));
                    createGroupCancel();
                  } catch (error) {
                    message.error(t("createSpace.failed"));
                  } finally {
                    setCreateGroupLoading(false);
                  }
                }}
              />
            </div>
          </Modal>

          <div className={styles.accountSidebar}>
            <div className="accountSidebar-top">
              <div className="accountSidebar-top-box">
                <Button
                  onClick={() => {
                    setUserManageModalOpen(true);
                  }}
                >
                  <UserOutlined />
                  {t("accountManager")}
                </Button>
              </div>
              {/* mcp 按钮 */}
              <div className="accountSidebar-top-box">
                {/* 按钮蓝紫色渐变 */}
                <Button
                  type="primary"
                  style={{
                    background:
                      "linear-gradient(90deg, #625BF2 0%, #925BF2 100%)",
                  }}
                  onClick={() => setMcpManagerModalOpen(true)}
                >
                  {t("mcpManager")}
                </Button>
              </div>
            </div>

            {accountLoading ? (
              <>
                <Skeleton avatar paragraph={{ rows: 1 }} active />
                <Skeleton avatar paragraph={{ rows: 1 }} active />
                <Skeleton avatar paragraph={{ rows: 1 }} active />
              </>
            ) : (
              <div className="accountSidebar-content">
                {sidebarTopExtra}
                <Collapse
                  key={defaultActiveKey}
                  defaultActiveKey={defaultActiveKey}
                  items={accountGroupList.map((v) => {
                    // 为默认分组添加IP和地址信息
                    const isDefaultGroup = v.isDefault;
                    const showIpInfo = isDefaultGroup && ipLocationInfo;
                    return {
                      key: v.id,
                      label: (
                        <>
                          <div className="accountSidebar-groupLabel">
                            <span className="accountSidebar-groupName">
                              {v.name}
                            </span>
                            <span className="accountSidebar-userCount">
                              {v.children?.length}/
                              {
                                v.children?.map(
                                  (v) => v.status === AccountStatus.USABLE,
                                ).length
                              }
                            </span>
                            {/* 根据proxyIp判断显示IP信息 */}
                            {!v.proxyIp || v.proxyIp === "" ? (
                              // 本地IP显示
                              <div className="accountSidebar-ipInfo">
                                {ipLocationLoading ? (
                                  <span className="accountSidebar-ipLoading">
                                    {t("ipInfo.loading")}
                                  </span>
                                ) : ipLocationInfo ? (
                                  <Tooltip
                                    title={t("ipInfo.tooltip", {
                                      asn: ipLocationInfo.asn,
                                      org: ipLocationInfo.org,
                                    })}
                                  >
                                    <span className="accountSidebar-ipText">
                                      {formatLocationInfo(ipLocationInfo)}
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <span className="accountSidebar-ipError">
                                    {t("ipInfo.error")}
                                  </span>
                                )}
                              </div>
                            ) : (
                              // 数据中的IP显示
                              v.ip &&
                              v.location && (
                                <div className="accountSidebar-ipInfo">
                                  <Tooltip
                                    title={`IP: ${v.ip}\n位置: ${v.location}`}
                                  >
                                    <span className="accountSidebar-ipText">
                                      {extractCountry(v.location)} | {v.ip}
                                    </span>
                                  </Tooltip>
                                </div>
                              )
                            )}
                          </div>
                        </>
                      ),
                      children: (
                        <ul key={v.id} className="accountList">
                          {v.children?.map((account) => {
                            if (excludePlatforms.includes(account.type))
                              return "";
                            const platInfo = AccountPlatInfoMap.get(
                              account.type,
                            )!;
                            return (
                              <li
                                className={[
                                  "accountList-item",
                                  `${activeAccountId === account.id ? "accountList-item--active" : ""}`,
                                  // 失效状态
                                  account.status === AccountStatus.DISABLE &&
                                    "accountList-item--disable",
                                ].join(" ")}
                                key={account.id}
                                onClick={async () => {
                                  if (
                                    account.status === AccountStatus.DISABLE
                                  ) {
                                    // 掉线账户直接触发重新授权
                                    await handleOfflineAccountClick(account);
                                    return;
                                  }
                                  onAccountChange(account);
                                }}
                              >
                                <Avatar
                                  style={{backgroundColor: 'aliceblue'}}
                                  src={getOssUrl(account.avatar)}
                                  size="large"
                                />
                                <div className="accountList-item-right">
                                  <div
                                    className="accountList-item-right-name"
                                    title={account.nickname}
                                  >
                                    <Tooltip title={undefined}>
                                      {account.nickname}
                                    </Tooltip>
                                  </div>
                                  <div className="accountList-item-right-footer">
                                    <p className="accountList-item-right-plat">
                                      <img src={platInfo?.icon} />
                                      <span>{platInfo?.name}</span>
                                    </p>
                                    <Popover
                                      content={
                                        <AccountPopoverInfo
                                          accountInfo={account}
                                          onDeleteClick={(acc) => {
                                            setDeleteTarget(acc);
                                            setDeleteHitOpen(true);
                                          }}
                                        />
                                      }
                                      placement="right"
                                    >
                                      ...
                                    </Popover>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ),
                    };
                  })}
                />
              </div>
            )}

            <div className="accountSidebar-footer">
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={openAddAccountFlow}
                style={{ width: "100%", marginBottom: "10px" }}
              >
                {t("addAccount")}
              </Button>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setOpenCreateGroup(true);
                }}
                style={{ width: "100%" }}
              >
                {t("createSpace.button")}
              </Button>
            </div>
            {/* 删除账户确认弹窗（复用组件） */}
            <DeleteUserConfirmModal
              open={deleteHitOpen}
              deleteUsers={deleteTarget ? [deleteTarget] : []}
              onClose={() => {
                setDeleteHitOpen(false);
              }}
              onDeleteSuccess={async () => {
                await getAccountList();
                setDeleteTarget(null);
                message.success(t("messages.deleteSuccess" as any));
              }}
            />

            {/* Facebook页面选择弹窗 */}
            <FacebookPagesModal
              open={showFacebookPagesModal}
              onClose={() => setShowFacebookPagesModal(false)}
              onSuccess={handleFacebookPagesSuccess}
            />
          </div>
        </>
      );
    },
  ),
);
AccountSidebar.displayName = "AccountSidebar";

export default AccountSidebar;
