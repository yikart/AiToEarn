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
import { useUserStore } from "@/store/user";
import Image from "next/image";
import VipContentModal from "@/components/modals/VipContentModal";

import rightArrow from "@/assets/images/jiantou.png";

interface AccountPageCoreProps {
  searchParams?: {
    platform?: string;
    spaceId?: string;
    showVip?: string;
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
  const userStore = useUserStore();

  // 移动端下载提示弹窗开关
  const [showMobileDownload, setShowMobileDownload] = useState(false);
  // 微信浏览器提示弹窗开关
  const [showWechatBrowserTip, setShowWechatBrowserTip] = useState(false);
  // VIP弹窗状态
  const [vipModalOpen, setVipModalOpen] = useState(false);

  useEffect(() => {
    accountInit();
  }, []);

  // 处理URL参数
  useEffect(() => {
    // 处理显示VIP弹窗的参数
    if (searchParams?.showVip === 'true') {
      setVipModalOpen(true);
      // 清除URL参数
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("showVip");
        window.history.replaceState({}, "", url.toString());
      }
    }

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

  /**
   * 检测是否为微信浏览器
   */
  const isWechatBrowser = () => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.includes('micromessenger');
  };

  /**
   * 在移动端首次进入 accounts 页面时，展示下载提示弹窗
   * - 条件：屏幕宽度 <= 768
   * - 只在当前会话展示一次（使用 sessionStorage 标记）
   * - 如果是微信浏览器，先显示微信浏览器提示
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth <= 768;
    const hasShown = sessionStorage.getItem("accountsMobileDownloadShown");
    const hasShownWechatTip = sessionStorage.getItem("accountsWechatTipShown");
    
    if (isMobile) {
      // 如果是微信浏览器且未显示过微信提示，先显示微信提示
      if (isWechatBrowser() && !hasShownWechatTip) {
        setShowWechatBrowserTip(true);
        sessionStorage.setItem("accountsWechatTipShown", "1");
      } else if (!hasShown) {
        // 非微信浏览器或已显示过微信提示，显示下载提示
        setShowMobileDownload(true);
        sessionStorage.setItem("accountsMobileDownloadShown", "1");
      }

    
    }
  }, []);

  /**
   * 关闭下载提示弹窗
   */
  const closeMobileDownload = () => setShowMobileDownload(false);

  /**
   * 关闭微信浏览器提示弹窗
   */
  const closeWechatBrowserTip = () => {
    setShowWechatBrowserTip(false);
    // 关闭微信提示后，显示下载提示
    const hasShown = sessionStorage.getItem("accountsMobileDownloadShown");
    if (!hasShown) {
      setShowMobileDownload(true);
      sessionStorage.setItem("accountsMobileDownloadShown", "1");
    }
  };

  /**
   * 生成下载链接（根据语言）
   */
  const getDownloadHref = () => {
    const lang = userStore.lang;
    return lang === "en"
      ? "https://docs.aitoearn.ai/en/downloads"
      : "https://docs.aitoearn.ai/zh/downloads";
  };

  const downloadTexts = (() => {
    const lang = userStore.lang;
    if (lang === "zh-CN") {
      return {
        title: "欢迎使用 AitoEarn",
        desc: "为了获得完整体验，请在设备上下载 App",
        cta: "下载 App",
      };
    }
    return {
      title: "Welcome to AitoEarn",
      desc: "To enjoy the full experience, please download the app on your device",
      cta: "Download App",
    };
  })();

  const wechatBrowserTexts = (() => {
    const lang = userStore.lang;
    if (lang === "zh-CN") {
      return {
        title: "请在浏览器中打开",
        desc: "请点击右上角，通过浏览器打开",
        cta: "我知道了",
      };
    }
    return {
      title: "Please open in browser",
      desc: "Please click the top-right corner to open via browser",
      cta: "I understand",
    };
  })();

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

        {/* 微信浏览器提示（遮罩 + 箭头指向右上角） */}
        {showWechatBrowserTip && (
          <>
            <div className={styles.mobileDownloadOverlay} onClick={closeWechatBrowserTip} />
            <Image src={rightArrow} alt="rightArrow" width={120} height={120} className={styles.rightArrow} />
            <div className={styles.wechatTipContainer}>
              <div className={styles.wechatTipContent}>
                <div className={styles.wechatTipTitle}>{wechatBrowserTexts.title}</div>
                <div className={styles.wechatTipSteps}>
                  <div className={styles.wechatTipStep}>
                    <span className={styles.stepNumber}>1</span>
                    <span className={styles.stepText}>
                      {userStore.lang === "zh-CN" ? "点击右上角的" : "Click the top-right corner's"}
                      <span className={styles.dotsButton}>⋯</span>
                      {userStore.lang === "zh-CN" ? "按钮" : "button"}
                    </span>
                  </div>
                  <div className={styles.wechatTipStep}>
                    <span className={styles.stepNumber}>2</span>
                    <span className={styles.stepText}>
                      {userStore.lang === "zh-CN" ? "选择" : "Select"}
                      <span className={styles.browserButton}>🌐</span>
                      {userStore.lang === "zh-CN" ? "在浏览器中打开" : "Open in browser"}
                    </span>
                  </div>
                </div>
                <button className={styles.wechatTipClose} onClick={closeWechatBrowserTip}>
                  {wechatBrowserTexts.cta}
                </button>
              </div>
              
            </div>
          </>
        )}

        {/* 移动端下载提示（遮罩 + 底部弹窗） */}
        {showMobileDownload && (
          <>
            <div className={styles.mobileDownloadOverlay}  />
            <div className={styles.mobileDownloadSheet} role="dialog" aria-modal="true">
              <div className={styles.sheetHeader}>
                <div className={styles.sheetTitle}>{downloadTexts.title} 👋</div>
                <button className={styles.sheetClose} aria-label="Close" onClick={closeMobileDownload}>
                  ×
                </button>
              </div>
              <div className={styles.sheetBody}>
                <p className={styles.sheetDesc}>{downloadTexts.desc}</p>
              </div>
              <div className={styles.sheetFooter}>
                <a
                  className={styles.sheetCta}
                  href={getDownloadHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMobileDownload}
                >
                  {downloadTexts.cta}
                </a>
              </div>
            </div>
          </>
        )}

        {/* VIP弹窗 */}
        <VipContentModal 
          open={vipModalOpen} 
          onClose={() => setVipModalOpen(false)} 
        />
      </div>
    </NoSSR>
  );
}
