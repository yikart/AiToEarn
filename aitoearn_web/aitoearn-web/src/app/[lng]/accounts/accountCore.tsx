"use client";

import styles from "./accounts.module.scss";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useState } from "react";
import { NoSSR } from "@kwooshung/react-no-ssr";
import AccountSidebar from "@/app/[lng]/accounts/components/AccountSidebar/AccountSidebar";
import CalendarTiming from "@/app/[lng]/accounts/components/CalendarTiming";
import AddAccountModal from "@/app/[lng]/accounts/components/AddAccountModal";
import { PlatType } from "@/app/config/platConfig";
import { SocialAccount } from "@/api/types/account.type";
import AllPlatIcon from "@/app/[lng]/accounts/components/CalendarTiming/AllPlatIcon";
import { useTransClient } from "@/app/i18n/client";

interface AccountPageCoreProps {
  searchParams?: {
    platform?: string;
    spaceId?: string;
  };
}

export default function AccountPageCore({
  searchParams,
}: AccountPageCoreProps) {
  const { accountInit, accountActive, setAccountActive, accountGroupList } =
    useAccountStore(
      useShallow((state) => ({
        accountInit: state.accountInit,
        setAccountActive: state.setAccountActive,
        accountActive: state.accountActive,
        accountGroupList: state.accountGroupList,
      })),
    );

  // 添加账号弹窗状态
  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState<PlatType | undefined>();
  const [targetSpaceId, setTargetSpaceId] = useState<string | undefined>();
  const { t } = useTransClient("account");

  useEffect(() => {
    accountInit();
  }, []);

  // 处理URL参数
  useEffect(() => {
    if (searchParams?.platform || searchParams?.spaceId) {
      // 验证平台类型是否有效
      const platform = searchParams.platform as PlatType;
      const validPlatforms = Object.values(PlatType);

      if (searchParams.platform && validPlatforms.includes(platform)) {
        setTargetPlatform(platform);
      }

      if (searchParams.spaceId) {
        setTargetSpaceId(searchParams.spaceId);
      }

      // 打开添加账号弹窗
      setAddAccountModalOpen(true);
    }
  }, [searchParams]);

  const handleAddAccountSuccess = (accountInfo: SocialAccount) => {
    setAddAccountModalOpen(false);
    // 可以在这里添加成功提示或其他逻辑
  };

  const handleAddAccountClose = () => {
    setAddAccountModalOpen(false);
    // 清除URL参数（可选）
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("platform");
      url.searchParams.delete("spaceId");
      window.history.replaceState({}, "", url.toString());
    }
  };

  return (
    <NoSSR>
      <div className={styles.accounts}>
        <AccountSidebar
          activeAccountId={accountActive?.id || ""}
          onAccountChange={(account) => {
            setAccountActive(account);
          }}
          sidebarTopExtra={
            <>
              <div
                className={[
                  "accountList-item",
                  `${!accountActive?.id ? "accountList-item--active" : ""}`,
                ].join(" ")}
                style={{
                  border: "1px solid #d9d9d9",
                  borderRight: "none",
                  borderLeft: "none",
                }}
                onClick={async () => {
                  setAccountActive(undefined);
                }}
              >
                <AllPlatIcon size={38} />
                <div className="accountList-item-right">
                  <div className="accountList-item-right-name">
                    {t("allPlatforms")}
                  </div>
                </div>
              </div>
            </>
          }
        />
        <CalendarTiming />

        {/* 添加账号弹窗 */}
        <AddAccountModal
          open={addAccountModalOpen}
          onClose={handleAddAccountClose}
          onAddSuccess={handleAddAccountSuccess}
          targetGroupId={targetSpaceId}
          showSpaceSelector={!targetSpaceId}
          autoTriggerPlatform={targetPlatform}
        />
      </div>
    </NoSSR>
  );
}
