import { ForwardedRef, forwardRef, memo, useMemo } from "react";
import styles from "../platParamsSetting.module.scss";
import { Input } from "antd";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import { PubItem } from "@/components/PublishDialog/publishDialog.type";
import { usePublishDialog } from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";

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
      const platConfig = useMemo(() => {
        return AccountPlatInfoMap.get(pubItem.account.type)!;
      }, [pubItem]);

      const { setOnePubParams, pubList } = usePublishDialog(
        useShallow((state) => ({
          setOnePubParams: state.setOnePubParams,
          pubList: state.pubList,
        })),
      );

      return (
        <div className={styles.commonTitleInput}>
          <div className="platParamsSetting-label">标题</div>
          <Input
            value={pubItem.params.title}
            maxLength={platConfig.commonPubParamsConfig.titleMax || 20}
            placeholder="请输入标题"
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
