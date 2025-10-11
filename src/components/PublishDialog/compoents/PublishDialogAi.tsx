import { ForwardedRef, forwardRef, memo } from "react";
import styles from "../publishDialog.module.scss";
import Chat from "@/components/Chat";

export interface IPublishDialogAiRef {}

export interface IPublishDialogAiProps {}

// AI写作
const PublishDialogAi = memo(
  forwardRef(
    ({}: IPublishDialogAiProps, ref: ForwardedRef<IPublishDialogAiRef>) => {
      return (
        <div className={styles.publishDialogAi}>
          <h1>写作助手</h1>
          <div className="publishDialogAi-wrapper">
            <Chat />
          </div>
        </div>
      );
    },
  ),
);

export default PublishDialogAi;
