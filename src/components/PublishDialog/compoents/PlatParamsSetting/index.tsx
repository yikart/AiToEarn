import { CSSProperties, ForwardedRef, forwardRef, memo, useMemo } from "react";
import styles from "./platParamsSetting.module.scss";
import { usePublishDialog } from "@/components/PublishDialog/usePublishDialog";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import BilibParams from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/BilibParams";
import KwaiParams from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/KwaiParams";
import FacebookParams from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/FacebookParams";
import YouTubeParams from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/YouTubeParams";
import { useShallow } from "zustand/react/shallow";
import { PubItem } from "@/components/PublishDialog/publishDialog.type";

export interface IPlatParamsSettingRef {}

export interface IPlatParamsSettingProps {
  pubItem: PubItem;
  style?: CSSProperties;
}

const PlatParamsSetting = memo(
  forwardRef(
    (
      { pubItem, style }: IPlatParamsSettingProps,
      ref: ForwardedRef<IPlatParamsSettingRef>,
    ) => {
      const { expandedPubItem, step, setExpandedPubItem } = usePublishDialog(
        useShallow((state) => ({
          expandedPubItem: state.expandedPubItem,
          step: state.step,
          setExpandedPubItem: state.setExpandedPubItem,
        })),
      );

      const platConfig = useMemo(() => {
        return AccountPlatInfoMap.get(pubItem.account.type)!;
      }, [pubItem]);

      const PlatItemComp = useMemo(() => {
        switch (pubItem.account.type) {
          case PlatType.KWAI:
            return <KwaiParams pubItem={pubItem} />;
          case PlatType.BILIBILI:
            return <BilibParams pubItem={pubItem} />;
          case PlatType.Facebook:
            return <FacebookParams pubItem={pubItem} />;
          case PlatType.YouTube:
            return <YouTubeParams pubItem={pubItem} />;
          default:
            return <KwaiParams pubItem={pubItem} />;
        }
      }, [pubItem]);

      // true=展开当前账号的参数设置 false=不展开
      const isExpand = useMemo(() => {
        if (step === 0) return true;
        return expandedPubItem?.account.id === pubItem.account.id;
      }, [expandedPubItem, pubItem]);

      return (
        <div
          className={[
            styles.platParamsSetting,
            !isExpand ? styles.platParamsSetting_expand : "",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
          style={style}
        >
          <div className="platParamsSetting-wrapper">
            <div className="platParamsSetting-icon">
              <img src={platConfig.icon} style={{ borderRadius: "50%" }} />
            </div>
            {isExpand ? (
              PlatItemComp
            ) : (
              <div
                className="platParamsSetting-des"
                onClick={() => {
                  setExpandedPubItem(pubItem);
                }}
              >
                {pubItem.params.des}
              </div>
            )}
          </div>
        </div>
      );
    },
  ),
);

export default PlatParamsSetting;
