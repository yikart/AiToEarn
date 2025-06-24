import { ForwardedRef, forwardRef, memo } from "react";
import styles from "../publishDialog.module.scss";
import { Empty } from "antd";

export interface IPublishDialogPreviewRef {}

export interface IPublishDialogPreviewProps {}

const PublishDialogPreview = memo(
  forwardRef(
    (
      {}: IPublishDialogPreviewProps,
      ref: ForwardedRef<IPublishDialogPreviewRef>,
    ) => {
      return (
        <div className={styles.publishDialogPreview}>
          <div className="publishDialogPreview-wrapper">
            <div className="publishDialogPreview-title">预览</div>
            <div className="publishDialogPreview-empty">
              <Empty description="在这里看到你的作品预览" />
            </div>
          </div>
        </div>
      );
    },
  ),
);

export default PublishDialogPreview;
