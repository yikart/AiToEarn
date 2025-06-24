import { ForwardedRef, forwardRef, memo, useCallback, useState } from "react";
import styles from "./publishDialog.module.scss";
import { Button, Modal } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";
import PublishDialogAi from "@/components/PublishDialog/compoents/PublishDialogAi";
import PublishDialogPreview from "@/components/PublishDialog/compoents/PublishDialogPreview";
import { CSSTransition } from "react-transition-group";

export interface IPublishDialogRef {}

export interface IPublishDialogProps {
  open: boolean;
  onClose: () => void;
}

const { confirm } = Modal;

// 发布作品弹框
const PublishDialog = memo(
  forwardRef(
    (
      { open, onClose }: IPublishDialogProps,
      ref: ForwardedRef<IPublishDialogRef>,
    ) => {
      const [openLeft, setOpenLeft] = useState(false);
      const [openRight, setOpenRight] = useState(false);
      const [showB, setShowB] = useState(true);

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

            <div className="publishDialog-con">
              <div className="publishDialogFooter-footer">
                time
                <div className="publishDialogFooter-footer-btns">
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
