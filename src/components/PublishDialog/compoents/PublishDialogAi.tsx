import { ForwardedRef, forwardRef, memo } from "react";
import styles from "../publishDialog.module.scss";
import Chat from "@/components/Chat";
import { useTransClient } from "@/app/i18n/client";
import { CloseCircleFilled } from "@ant-design/icons";

export interface IPublishDialogAiRef {}

export interface IPublishDialogAiProps {
  onClose: () => void;
}

// AI写作
const PublishDialogAi = memo(
  forwardRef(
    (
      { onClose }: IPublishDialogAiProps,
      ref: ForwardedRef<IPublishDialogAiRef>,
    ) => {
      const { t } = useTransClient("publish");

      return (
        <div className={styles.publishDialogAi} id="publishDialogAi">
          <h1>
            <span>{t("writingAssistant")}</span>
            <CloseCircleFilled onClick={onClose} />
          </h1>
          <div className="publishDialogAi-wrapper">
            <Chat />
          </div>
        </div>
      );
    },
  ),
);

export default PublishDialogAi;
