import { ForwardedRef, forwardRef, memo, useEffect, useMemo, useState } from "react";
import styles from "./AddAccountModal.module.scss";
import { Button, Modal, Tooltip } from "antd";
import { AccountPlatInfoArr, PlatType } from "@/app/config/platConfig";
import { SocialAccount } from "@/api/types/account.type";
import { useTransClient } from "@/app/i18n/client";
import { kwaiSkip } from "@/app/[lng]/accounts/plat/kwaiLogin";
import { bilibiliSkip } from "../../plat/BilibiliLogin";
import { youtubeSkip } from "../../plat/YoutubeLogin";
import { twitterSkip } from "../../plat/TwtterLogin";
import { tiktokSkip } from "../../plat/TiktokLogin";
import { facebookSkip, FacebookPagesModal } from "../../plat/FacebookLogin";
import { instagramSkip } from "../../plat/InstagramLogin";
import { threadsSkip } from "../../plat/ThreadsLogin";
import { wxGzhSkip } from "../../plat/WxGzh";
import { pinterestSkip } from "../../plat/PinterestLogin";
import { useAccountStore } from "@/store/account";
import { getIpLocation, IpLocationInfo } from "@/utils/ipLocation";
import DownloadAppModal from "@/components/common/DownloadAppModal";

export interface IAddAccountModalRef {}

export interface IAddAccountModalProps {
  open: boolean;
  onClose: () => void;
  onAddSuccess: (accountInfo: SocialAccount) => void;
  // 目标空间ID，用于根据空间属地(CN)过滤可添加平台
  targetGroupId?: string;
}

const AddAccountModal = memo(
  forwardRef(
    (
      { open, onClose, onAddSuccess, targetGroupId }: IAddAccountModalProps,
      ref: ForwardedRef<IAddAccountModalRef>,
    ) => {
      const { t } = useTransClient('account');
      const [showFacebookPagesModal, setShowFacebookPagesModal] = useState(false);
      const accountGroupList = useAccountStore((state) => state.accountGroupList);
      const [downloadVisible, setDownloadVisible] = useState(false);
      const [downloadPlatform, setDownloadPlatform] = useState<string>("");
      const aitoearnDownloadUrl = process.env.NEXT_PUBLIC_AITOEARN_APP_DOWNLOAD_URL || "";

      // 判断location是否属于中国（CN）
      const isLocationCN = (location?: string | null): boolean => {
        if (!location) return false;
        const upper = location.toUpperCase();
        return upper.startsWith('CN') || upper.includes('CHINA') || location.includes('中国');
      };

      // 当前目标空间是否视为中国属地
      const [isCnSpace, setIsCnSpace] = useState<boolean | null>(null);
      const [isLocLoading, setIsLocLoading] = useState(false);

      useEffect(() => {

        
        if (!open || !targetGroupId) {
          setIsCnSpace(null);
          setIsLocLoading(false);
          return;
        }

        const currentSpace = (accountGroupList || []).find((g: any) => g.id === targetGroupId);
        if (!currentSpace) {
          setIsCnSpace(null);
          return;
        }

        const shouldUseLocal = !currentSpace.proxyIp || currentSpace.proxyIp === '';
        if (!shouldUseLocal && currentSpace.ip && currentSpace.location) {
          setIsCnSpace(isLocationCN(currentSpace.location));
          return;
        }

        let cancelled = false;
        const fetchLocal = async () => {
          try {
            setIsLocLoading(true);
            const info: IpLocationInfo = await getIpLocation();
            if (!cancelled) setIsCnSpace(isLocationCN(info.location));
          } catch {
            if (!cancelled) setIsCnSpace(null);
          } finally {
            if (!cancelled) setIsLocLoading(false);
          }
        };
        fetchLocal();

        return () => {
          cancelled = true;
        };
      }, [open, targetGroupId, accountGroupList]);

             // 判断平台是否在当前属地可用
       const isPlatformAvailable = (platType: PlatType): boolean => {
         // TODO: 暂时屏蔽国内平台 @@.@@
         // return true;
         if (isCnSpace === null) return true; // 未确定属地时显示所有平台
         
         const cnOnlyPlatforms = new Set<PlatType>([
           PlatType.Douyin,
           PlatType.KWAI,
           PlatType.WxGzh,
           PlatType.WxSph,
           PlatType.BILIBILI,
         ]);
         
         // 小红书是全球平台，不受IP限制
         if (platType === PlatType.Xhs) {
           return true;
         }
         
         if (isCnSpace === true) {
           // 中国属地：仅国内平台可用
           return cnOnlyPlatforms.has(platType);
         } else {
           // 非中国属地：国内平台不可用
           return !cnOnlyPlatforms.has(platType);
         }
       };



      const handleOk = () => {
        onClose();
      };

      const handleCancel = () => {
        onClose();
      };

      // 处理Facebook授权成功后的页面选择
      const handleFacebookAuthSuccess = () => {
        setShowFacebookPagesModal(true);
      };

      // 处理Facebook页面选择成功
      const handleFacebookPagesSuccess = () => {
        setShowFacebookPagesModal(false);
        onClose();
        // 可以在这里添加成功提示或其他逻辑
      };

      return (
        <>
          <Modal
            title={t('addAccountModal.title')}
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            footer={null}
            width={650}
          >
            <div className={styles.addAccountModal}>
              <h1>{t('addAccountModal.subtitle')}</h1>
              <div className="addAccountModal_plats">
                {AccountPlatInfoArr.map(([key, value]) => {
                  const isAvailable = isPlatformAvailable(key as PlatType);
                  return (
                    //  !value.pcNoThis &&
                    <Tooltip title={value.tips?.account} key={key}>
                      
                      <Button
                        type="text"
                        className={`addAccountModal_plats-item ${!isAvailable ? 'disabled' : ''}`}
                        disabled={!isAvailable}
                        onClick={async () => {
                          // 如果平台在当前属地不可用，则提示
                          if (!isAvailable) {
                            return;
                          }
                          // 如果该平台在PC端不可用，则提示下载Aitoearn App
                          if (value.pcNoThis) {
                            setDownloadPlatform(value.name);
                            setDownloadVisible(true);
                            return;
                          }
                          switch (key) {
                            case PlatType.KWAI:
                              await kwaiSkip(key);
                              break;
                            case PlatType.BILIBILI:
                              await bilibiliSkip(key);
                              break;
                            case PlatType.YouTube:
                              await youtubeSkip(key);
                              break;
                            case PlatType.Twitter:
                              await twitterSkip(key);
                              break;
                            case PlatType.Tiktok:
                              await tiktokSkip(key);
                              break;
                            case PlatType.Facebook:
                              try {
                                await facebookSkip(key);
                                // Facebook授权成功后显示页面选择弹窗
                                handleFacebookAuthSuccess();
                              } catch (error) {
                                console.error('Facebook授权失败:', error);
                              }
                              break;
                            case PlatType.Instagram:
                              await instagramSkip(key);
                              break;
                            case PlatType.Threads:
                              await threadsSkip(key);
                              break;
                            case PlatType.WxGzh:
                              await wxGzhSkip(key);
                              break;
                            case PlatType.Pinterest:
                              await pinterestSkip(key);
                              break;
                          }
                        }}
                      >
                       
                        <div className="addAccountModal_plats-item-con">
                          {/*<LoadingOutlined style={{ fontSize: '20px' }} />*/}
                          <img src={value.icon} style={{ opacity: isAvailable ? 1 : 0.5 }} />
                          <span style={{ opacity: isAvailable ? 1 : 0.5 }}>{value.name}</span>
                        </div>
                        
                        
                      </Button>
                
                    </Tooltip>
                  );
                })}
              </div>
              {/* 属地限制提示 */}
              {isCnSpace !== null && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: 'var(--grayColor1)', 
                  borderRadius: '6px',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--grayColor6)',
                  textAlign: 'center'
                }}>
                  {isCnSpace ? 
                    t('locationRestriction.cnSpace') : 
                    t('locationRestriction.nonCnSpace')
                  }
                </div>
              )}
            </div>
          </Modal>

          {/* Facebook页面选择弹窗 */}
          <FacebookPagesModal
            open={showFacebookPagesModal}
            onClose={() => setShowFacebookPagesModal(false)}
            onSuccess={handleFacebookPagesSuccess}
          />

          {/* 下载Aitoearn App提示弹窗 */}
          <DownloadAppModal
            visible={downloadVisible}
            onClose={() => setDownloadVisible(false)}
            platform={downloadPlatform}
            appName={"Aitoearn App"}
            downloadUrl={aitoearnDownloadUrl}
          />
        </>
      );
    },
  ),
);
AddAccountModal.displayName = "AddAccountModal";

export default AddAccountModal;
