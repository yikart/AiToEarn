import { ForwardedRef, forwardRef, memo, useState } from "react";
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

export interface IAddAccountModalRef {}

export interface IAddAccountModalProps {
  open: boolean;
  onClose: () => void;
  onAddSuccess: (accountInfo: SocialAccount) => void;
}

const AddAccountModal = memo(
  forwardRef(
    (
      { open, onClose, onAddSuccess }: IAddAccountModalProps,
      ref: ForwardedRef<IAddAccountModalRef>,
    ) => {
      const { t } = useTransClient('account');
      const [showFacebookPagesModal, setShowFacebookPagesModal] = useState(false);

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
                  return (
                     !value.pcNoThis &&
                    <Tooltip title={value.tips?.account} key={key}>
                     
                      <Button
                        type="text"
                        className="addAccountModal_plats-item"
                        onClick={async () => {
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
                          <img src={value.icon} />
                          <span>{value.name}</span>
                        </div>
                        
                        
                      </Button>
                
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </Modal>

          {/* Facebook页面选择弹窗 */}
          <FacebookPagesModal
            open={showFacebookPagesModal}
            onClose={() => setShowFacebookPagesModal(false)}
            onSuccess={handleFacebookPagesSuccess}
          />
        </>
      );
    },
  ),
);
AddAccountModal.displayName = "AddAccountModal";

export default AddAccountModal;
