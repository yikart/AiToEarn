import {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";
import styles from "./publishDialog.module.scss";
import { Button, Modal } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";
import PublishDialogAi from "@/components/PublishDialog/compoents/PublishDialogAi";
import PublishDialogPreview from "@/components/PublishDialog/compoents/PublishDialogPreview";
import { CSSTransition } from "react-transition-group";
import { SocialAccount } from "@/api/types/account.type";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import AvatarPlat from "@/components/AvatarPlat";
import { usePublishDialog } from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";

export interface IPublishDialogRef {}

export interface IPublishDialogProps {
  open: boolean;
  onClose: () => void;
  accounts: SocialAccount[];
}

const { confirm } = Modal;

// 发布作品弹框
const PublishDialog = memo(
  forwardRef(
    (
      { open, onClose, accounts }: IPublishDialogProps,
      ref: ForwardedRef<IPublishDialogRef>,
    ) => {
      const [openLeft, setOpenLeft] = useState(false);
      const { setAccountChoosed, accountChoosed } = usePublishDialog(
        useShallow((state) => ({
          accountChoosed: state.accountChoosed,
          setAccountChoosed: state.setAccountChoosed,
        })),
      );

      // 关闭弹框并确认关闭
      const closeDialog = useCallback(() => {
        confirm({
          title: "放弃更改？",
          icon: <ExclamationCircleFilled />,
          content: "您所做的任何更改都将永久丢失",
          okType: "danger",
          okButtonProps: {
            type: "primary",
          },
          cancelButtonProps: {
            type: "text",
          },
          centered: true,
          onOk() {
            onClose();
          },
        });
      }, [onClose]);

      // 是否打开右侧预览
      const openRight = useMemo(() => {
        return accountChoosed.length !== 0;
      }, [accountChoosed]);

      return (
        <>
          <Modal
            className={styles.publishDialog}
            closeIcon={false}
            open={open}
            onCancel={closeDialog}
            footer={null}
          >
            <CSSTransition
              in={openLeft}
              timeout={300}
              classNames="left"
              unmountOnExit
            >
              <PublishDialogAi />
            </CSSTransition>

            <div className="publishDialog-wrapper">
              <div className="publishDialog-con">
                <div className="publishDialog-con-head">
                  <span className="publishDialog-con-head-title">发布作品</span>
                </div>
                <div className="publishDialog-con-acconts">
                  {accounts.map((account) => {
                    const platConfig = AccountPlatInfoMap.get(account.type)!;
                    const isChoosed = accountChoosed.find(
                      (v) => v.id === account.id,
                    );

                    return (
                      <div
                        className={[
                          "publishDialog-con-acconts-item",
                          isChoosed
                            ? "publishDialog-con-acconts-item--active"
                            : "",
                        ].join(" ")}
                        style={{
                          borderColor: isChoosed
                            ? platConfig.themeColor
                            : "transparent",
                        }}
                        key={account.id}
                        onClick={() => {
                          const newAccountChoosed = [...accountChoosed];
                          // 查找当前账户是否已被选择
                          const index = newAccountChoosed.findIndex(
                            (v) => v.id === account.id,
                          );
                          if (index !== -1) {
                            newAccountChoosed.splice(index, 1);
                          } else {
                            newAccountChoosed.push(account);
                          }
                          setAccountChoosed(newAccountChoosed);
                        }}
                      >
                        <AvatarPlat
                          className="publishDialog-con-acconts-item-avatar"
                          account={account}
                          size="large"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="publishDialog-footer">
                time
                <div className="publishDialog-footer-btns">
                  <Button size="large" onClick={closeDialog}>
                    取消
                  </Button>
                  <Button size="large" type="primary">
                    确认
                  </Button>
                </div>
              </div>
            </div>

            <CSSTransition
              in={openRight}
              timeout={300}
              classNames="right"
              unmountOnExit
            >
              <PublishDialogPreview />
            </CSSTransition>
          </Modal>
        </>
      );
    },
  ),
);

export default PublishDialog;
