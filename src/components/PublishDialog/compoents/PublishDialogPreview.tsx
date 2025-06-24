import { ForwardedRef, forwardRef, memo } from "react";
import styles from "../publishDialog.module.scss";

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
          <div className="publishDialogPreview-wrapper">预览</div>
        </div>
      );
    },
  ),
);

export default PublishDialogPreview;
