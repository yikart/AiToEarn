import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./AccountSidebar.module.scss";
import { Avatar, Button, Collapse, Popover, Skeleton, Tooltip } from "antd";
// import { accountLogin, acpAccountLoginCheck } from "@/icp/account";
import {
  CheckCircleOutlined,
  PlusOutlined,
  UserOutlined,
  WarningOutlined,
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
import { getIpLocation, IpLocationInfo, formatLocationInfo } from "@/utils/ipLocation";

export interface IAccountSidebarRef {}

export interface IAccountSidebarProps {
  // 选择的账户id
  activeAccountId: string;
  // 切换选择的账户
  onAccountChange: (info: SocialAccount) => void;
  // 排除的平台类型
  excludePlatforms?: PlatType[];
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
}: {
  accountInfo: SocialAccount;
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
          <div className="accountPopoverInfo-item">
            <p>{t("platform")}：</p>
            <p>
              <img src={platInfo?.icon} />
              {platInfo.name }
            </p>
          </div>
        </div>
      </div>

      <div className="accountPopoverInfo-item">
        <p>{t("loginStatus")}：</p>
        <p>
          <AccountStatusView account={accountInfo} />
          {/*<Button*/}
          {/*  type="link"*/}
          {/*  style={{ padding: "0 0 0 5px" }}*/}
          {/*  loading={detLoading}*/}
          {/*  onClick={async () => {*/}
          {/*    // TODO 登录状态检测*/}
          {/*    // setDetLoading(true);*/}
          {/*    // const res = await acpAccountLoginCheck(*/}
          {/*    //   accountInfo!.type,*/}
          {/*    //   accountInfo!.uid,*/}
          {/*    // );*/}
          {/*    // message.success(*/}
          {/*    //   `登录状态检测完成：${res.status === AccountStatus.USABLE ? "在线" : "离线，请重新登录"}`,*/}
          {/*    // );*/}
          {/*    // setTimeout(async () => {*/}
          {/*    //   setDetLoading(false);*/}
          {/*    //   if (res.status === AccountStatus.DISABLE) {*/}
          {/*    //     const res = await accountLogin(accountInfo.type);*/}
          {/*    //     if (!res) return;*/}
          {/*    //     message.success("账号更新成功！");*/}
          {/*    //   }*/}
          {/*    // }, 500);*/}
          {/*  }}*/}
          {/*>*/}
          {/*  {t("checkLoginStatus")}*/}
          {/*</Button>*/}
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
      }: IAccountSidebarProps,
      ref: ForwardedRef<IAccountSidebarRef>,
    ) => {
      const { t } = useTransClient("account");
      const pubAccountDetModuleRef = useRef<any>(null);
      const {
        accountList: fullAccountList,
        getAccountList,
        accountGroupList,
        accountLoading,
      } = useAccountStore(
        useShallow((state) => ({
          accountList: state.accountList,
          getAccountList: state.getAccountList,
          accountGroupList: state.accountGroupList,
          accountLoading: state.accountLoading,
        })),
      );
      const [userManageModalOpen, setUserManageModalOpen] = useState(false);
      const userManageModalRef = useRef<IUserManageModalRef>(null);
      const [mcpManagerModalOpen, setMcpManagerModalOpen] = useState(false);
      const mcpManagerModalRef = useRef<IMCPManagerModalRef>(null);
      
      // IP地理位置信息状态
      const [ipLocationInfo, setIpLocationInfo] = useState<IpLocationInfo | null>(null);
      const [ipLocationLoading, setIpLocationLoading] = useState(false);

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
            console.error('获取IP地理位置信息失败:', error);
          } finally {
            setIpLocationLoading(false);
          }
        };

        // 只在组件挂载时获取一次IP信息
        fetchIpLocation();
      }, []);

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
          {/*TODO 在线状态检测 */}
          {/*<PubAccountDetModule*/}
          {/*  title="账号检测"*/}
          {/*  tips="所有平台在线"*/}
          {/*  ref={pubAccountDetModuleRef}*/}
          {/*  accounts={accountList}*/}
          {/*  isFooter={false}*/}
          {/*/>*/}
          
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
                          <span className="accountSidebar-groupName">{v.name}</span>
                          <span className="accountSidebar-userCount">
                            {v.children?.length}/
                            {
                              v.children?.map(
                                (v) => v.status === AccountStatus.USABLE,
                              ).length
                            }
                          </span>
                          {/* 在默认分组中显示IP和地址信息 */}
                          {isDefaultGroup && (
                            <div className="accountSidebar-ipInfo">
                              {ipLocationLoading ? (
                                <span className="accountSidebar-ipLoading">{t("ipInfo.loading")}</span>
                              ) : showIpInfo ? (
                                <Tooltip title={t("ipInfo.tooltip", { asn: ipLocationInfo.asn, org: ipLocationInfo.org })}>
                                  <span className="accountSidebar-ipText">
                                    {formatLocationInfo(ipLocationInfo)}
                                  </span>
                                </Tooltip>
                              ) : (
                                <span className="accountSidebar-ipError">{t("ipInfo.error")}</span>
                              )}
                            </div>
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
                                if (account.status === AccountStatus.DISABLE) {
                                  // TODO 账户登录
                                  // const res = await accountLogin(account.type);
                                  // if (!res) return;
                                  // message.success("账号登录成功！");
                                  // return;
                                }
                                onAccountChange(account);
                              }}
                            >
                              <Avatar
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
            )}

            {/*<div className="accountSidebar-footer">*/}
            {/*  <Button*/}
            {/*    type="link"*/}
            {/*    onClick={() => {*/}
            {/*      pubAccountDetModuleRef.current?.startDet();*/}
            {/*    }}*/}
            {/*  >*/}
            {/*    {t("checkAllLoginStatus")}*/}
            {/*  </Button>*/}
            {/*</div>*/}
          </div>
        </>
      );
    },
  ),
);
AccountSidebar.displayName = "AccountSidebar";

export default AccountSidebar;
