import { ForwardedRef, forwardRef, memo, useMemo } from "react";
import styles from "../platParamsSetting.module.scss";
import { Input } from "antd";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import { PubItem } from "@/components/PublishDialog/publishDialog.type";
import { usePublishDialog } from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";
import { useTransClient } from "@/app/i18n/client";

export interface ICommonTitleInputRef {}

export interface ICommonTitleInputProps {
  pubItem: PubItem;
}

const CommonTitleInput = memo(
  forwardRef(
    (
      { pubItem }: ICommonTitleInputProps,
      ref: ForwardedRef<ICommonTitleInputRef>,
    ) => {
      const { t } = useTransClient("publish");
      const platConfig = useMemo(() => {
        return AccountPlatInfoMap.get(pubItem.account.type)!;
      }, [pubItem]);

      const { setOnePubParams, pubList } = usePublishDialog(
        useShallow((state) => ({
          setOnePubParams: state.setOnePubParams,
          pubList: state.pubList,
        })),
      );

      // 判断是否需要显示必填标识
      const isRequired = pubItem.account.type === PlatType.Pinterest;

      return (
        <div className={styles.commonTitleInput}>
          <div className="platParamsSetting-label">
            {t("form.title")}
            {isRequired && <span style={{ color: "#ff4d4f", marginLeft: "4px" }}>*</span>}
          </div>
          <Input
            value={pubItem.params.title}
            maxLength={platConfig.commonPubParamsConfig.titleMax || 20}
            placeholder={t("form.titlePlaceholder") }
            showCount
            onChange={(e) => {
              setOnePubParams(
                {
                  title: e.target.value,
                },
                pubItem.account.id,
              );
            }}
          />
        </div>
      );
    },
  ),
);

export default CommonTitleInput;
