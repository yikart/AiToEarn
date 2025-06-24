import { ForwardedRef, forwardRef, memo } from "react";
import styles from "../publishDialog.module.scss";

export interface IPublishDialogAiRef {}

export interface IPublishDialogAiProps {}

const PublishDialogAi = memo(
  forwardRef(
    ({}: IPublishDialogAiProps, ref: ForwardedRef<IPublishDialogAiRef>) => {
      return (
        <div className={styles.publishDialogAi}>
          <div className="publishDialogAi-wrapper">AI写作</div>
        </div>
      );
    },
  ),
);

export default PublishDialogAi;
