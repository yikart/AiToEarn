import { ForwardedRef, forwardRef, memo, useEffect, useMemo, useState } from "react";
import styles from "./AddAccountModal.module.scss";
import { Button, Modal, Tooltip, Select, Space, Typography } from "antd";
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
import { useShallow } from "zustand/react/shallow";
import { getIpLocation, IpLocationInfo } from "@/utils/ipLocation";
import DownloadAppModal from "@/components/common/DownloadAppModal";
import { updateAccountApi } from "@/api/account";

const { Text } = Typography;

export interface IAddAccountModalRef {}

export interface IAddAccountModalProps {
  open: boolean;
  onClose: () => void;
  onAddSuccess: (accountInfo: SocialAccount) => void;
  // 目标空间ID，用于根据空间属地(CN)过滤可添加平台
  targetGroupId?: string;
  // 是否显示空间选择器（当从AccountSidebar的"添加账号"按钮打开时显示）
  showSpaceSelector?: boolean;
  // 自动触发平台，用于在打开时直接尝试跳转授权
  autoTriggerPlatform?: PlatType;
}

const AddAccountModal = memo(
  forwardRef(
          (
        { open, onClose, onAddSuccess, targetGroupId, showSpaceSelector = false, autoTriggerPlatform }: IAddAccountModalProps,
      ref: ForwardedRef<IAddAccountModalRef>,
    ) => {
      const { t } = useTransClient('account');
      const [showFacebookPagesModal, setShowFacebookPagesModal] = useState(false);
      const { accountGroupList, getAccountList } = useAccountStore(
        useShallow((state) => ({
          accountGroupList: state.accountGroupList,
          getAccountList: state.getAccountList,
        }))
      );
      const [downloadVisible, setDownloadVisible] = useState(false);
      const [downloadPlatform, setDownloadPlatform] = useState<string>("");
      const aitoearnDownloadUrl = process.env.NEXT_PUBLIC_AITOEARN_APP_DOWNLOAD_URL || "";

      // 空间选择相关状态
      const [selectedSpaceId, setSelectedSpaceId] = useState<string | undefined>(targetGroupId);
      const [spaceSelectionRequired, setSpaceSelectionRequired] = useState(false);

      // 判断location是否属于中国（CN）
      const isLocationCN = (location?: string | null): boolean => {
        if (!location) return false;
        const upper = location.toUpperCase();
        return upper.startsWith('CN') || upper.includes('CHINA') || location.includes('中国');
      };

      // 当前目标空间是否视为中国属地
      const [isCnSpace, setIsCnSpace] = useState<boolean | null>(null);
      const [isLocLoading, setIsLocLoading] = useState(false);

      // 初始化空间选择 - 简化版本
      useEffect(() => {
        if (!open) {
          setSpaceSelectionRequired(false);
          setSelectedSpaceId(undefined);
          return;
        }
        
        if (showSpaceSelector) {
          setSpaceSelectionRequired(true);
          // 默认选择第一个默认空间
          const defaultSpace = accountGroupList.find(group => group.isDefault);
          if (defaultSpace && !selectedSpaceId) {
            setSelectedSpaceId(defaultSpace.id);
          }
        } else {
          setSpaceSelectionRequired(false);
          if (targetGroupId) {
            setSelectedSpaceId(targetGroupId);
          }
        }
      }, [open, showSpaceSelector, targetGroupId, accountGroupList, selectedSpaceId]);



      useEffect(() => {
        if (!open || !selectedSpaceId) {
          setIsCnSpace(null);
          setIsLocLoading(false);
          return;
        }

        const currentSpace = (accountGroupList || []).find((g: any) => g.id === selectedSpaceId);
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
      }, [open, selectedSpaceId]);

      // 自动触发平台授权
      useEffect(() => {
        if (open && autoTriggerPlatform && selectedSpaceId) {
          // 延迟一下确保弹窗完全打开
          const timer = setTimeout(() => {
            const platformInfo = AccountPlatInfoArr.find(([key]) => key === autoTriggerPlatform);
            if (platformInfo) {
              handlePlatformClick(autoTriggerPlatform, platformInfo[1]);
            }
          }, 500);
          
          return () => clearTimeout(timer);
        }
      }, [open, autoTriggerPlatform, selectedSpaceId]);

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

      // 处理平台点击
      const handlePlatformClick = async (key: PlatType, value: any) => {
        // 如果需要选择空间但未选择，提示用户
        if (spaceSelectionRequired && !selectedSpaceId) {
          return;
        }

        // 如果平台在当前属地不可用，则提示
        if (!isPlatformAvailable(key)) {
          return;
        }

        // 如果该平台在PC端不可用，则提示下载Aitoearn App
        if (value.pcNoThis) {
          setDownloadPlatform(value.name);
          setDownloadVisible(true);
          return;
        }

        // 记录授权前的账号数量，用于后续识别新账号
        const beforeAuthCount = accountGroupList.reduce((total, group) => total + group.children.length, 0);

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

        // 如果指定了目标空间，等待授权完成后移动新账号
        if (selectedSpaceId) {
          // 检查选中的空间是否是默认空间
          const targetGroup = accountGroupList.find(group => group.id === selectedSpaceId);
          const isDefaultSpace = targetGroup?.isDefault;
          
          // console.log('移动空间调试信息:', {
          //   selectedSpaceId,
          //   targetGroupName: targetGroup?.name,
          //   isDefaultSpace,
          //   showSpaceSelector,
          //   spaceSelectionRequired
          // });
          
          // 只有当选择了非默认空间时才移动账号
          if (!isDefaultSpace) {
            console.log('准备移动账号到空间:', targetGroup?.name);
            setTimeout(async () => {
              try {
                // 刷新账号列表
                await getAccountList();
                
                // 获取最新的账号组列表
                const currentState = useAccountStore.getState();
                const defaultGroup = currentState.accountGroupList.find(group => group.isDefault);
                
                                 if (defaultGroup) {
                   // 找到相同平台类型的最后一个账号（最新添加的）
                   const sameTypeAccounts = defaultGroup.children.filter(account => account.type === key);
                   const latestAccount = sameTypeAccounts[sameTypeAccounts.length - 1];
                   
                   if (latestAccount) {
                     console.log('找到最新账号:', latestAccount.account, '平台:', key);
                     
                     // 将新账号移动到指定空间
                     console.log('移动账号:', latestAccount.account, '到空间:', targetGroup?.name);
                     await updateAccountApi({
                       id: latestAccount.id,
                       groupId: selectedSpaceId
                     });
                   } else {
                     console.log('未找到相同平台类型的账号');
                   }
                  
                  // 再次刷新账号列表以更新UI
                  await getAccountList();
                  console.log('账号移动完成');
                }
              } catch (error) {
                console.error('移动账号到指定空间失败:', error);
              }
            }, 3000); // 等待3秒让授权完成
          } else {
            console.log('选择的是默认空间，无需移动账号');
          }
        } else {
          console.log('未选择空间，不移动账号');
        }
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
              
              {/* 空间选择器 */}
              {spaceSelectionRequired && (
                <div style={{ 
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--grayColor3)'
                }}>
                  <Space align="center" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: '14px', minWidth: '80px' }}>{t('addAccountModal.addTo')}</Text>
                    <Select
                      style={{ width: '200px' }}
                      placeholder={t('pleaseChooseSpace')}
                      value={selectedSpaceId}
                      onChange={setSelectedSpaceId}
                      options={accountGroupList.map((g) => ({ value: g.id, label: g.name }))}
                    />
                  </Space>
                </div>
              )}

              {/* 当前选择的空间信息 */}
              {selectedSpaceId && !spaceSelectionRequired && (
                <div style={{ 
                  marginBottom: '20px',
                  padding: '12px',
                  backgroundColor: 'var(--grayColor1)',
                  borderRadius: '6px',
                  border: '1px solid var(--grayColor3)',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--grayColor6)'
                }}>
                  <Text>{t('addAccountModal.currentSpace')}: {accountGroupList.find(g => g.id === selectedSpaceId)?.name}</Text>
                </div>
              )}

              <div className="addAccountModal_plats">
                {AccountPlatInfoArr.map(([key, value]) => {
                  const isAvailable = isPlatformAvailable(key as PlatType);
                  return (
                    <Tooltip title={value.tips?.account} key={key}>
                      <Button
                        type="text"
                        style={{ width: '84px', }}
                        className={`addAccountModal_plats-item ${!isAvailable ? 'disabled' : ''}`}
                        disabled={!isAvailable || (spaceSelectionRequired && !selectedSpaceId)}
                        onClick={() => handlePlatformClick(key as PlatType, value)}

                      >
                        <div className="addAccountModal_plats-item-con">
                          <img 
                            src={value.icon} 
                            style={{ opacity: isAvailable ? 1 : 0.5 }} 
                          />
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

              {/* 空间选择提示 */}
              {spaceSelectionRequired && !selectedSpaceId && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: 'var(--warningColor1)', 
                  borderRadius: '6px',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--warningColor)',
                  textAlign: 'center'
                }}>
                  {t('addAccountModal.pleaseChooseSpaceFirst')}
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
