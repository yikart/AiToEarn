import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./AddAccountModal.module.scss";
import { Button, Modal, Tooltip } from "antd";
import { AccountPlatInfoArr, PlatType } from "@/app/config/platConfig";
import { SocialAccount } from "@/api/types/account.type";
import { kwaiSkip } from "@/app/[lng]/accounts/plat/kwaiLogin";
import { bilibiliSkip } from "../../plat/BilibiliLogin";
import { youtubeSkip } from "../../plat/YoutubeLogin";
import { twitterSkip } from "../../plat/TwtterLogin";
import { tiktokSkip } from "../../plat/TiktokLogin";
import { facebookSkip } from "../../plat/FacebookLogin";


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
      const handleOk = () => {
        onClose();
      };

      const handleCancel = () => {
        onClose();
      };

      return (
        <>
          <Modal
            title="账号添加"
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            footer={null}
            width={650}
          >
            <div className={styles.addAccountModal}>
              <h1>选择平台添加账号</h1>
              <div className="addAccountModal_plats">
                {AccountPlatInfoArr.map(([key, value]) => {
                  return (
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
                              await facebookSkip(key);  
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
        </>
      );
    },
  ),
);
AddAccountModal.displayName = "AddAccountModal";

export default AddAccountModal;
