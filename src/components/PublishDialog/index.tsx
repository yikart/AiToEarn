import { ForwardedRef, forwardRef, memo, useCallback } from "react";
import styles from "./publishDialog.module.scss";
import { Button, Modal } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";

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
      // 关闭弹框并确认关闭
      const closeDialog = useCallback(() => {
        confirm({
          title: "放弃更改？",
          icon: <ExclamationCircleFilled />,
          content: "您所做的任何更改都将永久丢失 ",
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
            width={710}
            open={open}
            onCancel={closeDialog}
            footer={
              <div className={styles.publishDialogFooter}>
                time
                <div className="publishDialogFooter-btns">
                  <Button size="large" onClick={closeDialog}>
                    取消
                  </Button>
                  <Button size="large" type="primary">
                    确认
                  </Button>
                </div>
              </div>
            }
          >
            <div className="publishDialog-con"></div>
          </Modal>
        </>
      );
    },
  ),
);

export default PublishDialog;
