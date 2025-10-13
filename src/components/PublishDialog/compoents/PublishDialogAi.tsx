import { ForwardedRef, forwardRef, memo } from "react";
import styles from "../publishDialog.module.scss";
import Chat from "@/components/Chat";
import { useTransClient } from "@/app/i18n/client";

export interface IPublishDialogAiRef {}

export interface IPublishDialogAiProps {}

// AI写作
const PublishDialogAi = memo(
  forwardRef(
    ({}: IPublishDialogAiProps, ref: ForwardedRef<IPublishDialogAiRef>) => {
      const { t } = useTransClient("publish");

      return (
        <div className={styles.publishDialogAi}>
          <h1>{t("writingAssistant")}</h1>
          <div className="publishDialogAi-wrapper">
            <Chat />
          </div>
        </div>
      );
    },
  ),
);

export default PublishDialogAi;
