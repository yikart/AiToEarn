import { ForwardedRef, forwardRef, memo, useMemo } from "react";
import styles from "./platParamsSetting.module.scss";
import {
  PubItem,
  usePublishDialog,
} from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import BilibParams from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/BilibParams";
import KwaiParams from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/KwaiParams";

export interface IPlatParamsSettingRef {}

export interface IPlatParamsSettingProps {
  pubItem: PubItem;
}

const PlatParamsSetting = memo(
  forwardRef(
    (
      { pubItem }: IPlatParamsSettingProps,
      ref: ForwardedRef<IPlatParamsSettingRef>,
    ) => {
      const platConfig = useMemo(() => {
        return AccountPlatInfoMap.get(pubItem.account.type)!;
      }, [pubItem]);

      const PlatItemComp = useMemo(() => {
        switch (pubItem.account.type) {
          case PlatType.KWAI:
            return <KwaiParams pubItem={pubItem} />;
          case PlatType.BILIBILI:
            return <BilibParams pubItem={pubItem} />;
        }
      }, [pubItem]);

      return (
        <div className={styles.platParamsSetting}>
          <div className="platParamsSetting-icon">
            <img src={platConfig.icon} style={{ borderRadius: "50%" }} />
          </div>
          {PlatItemComp}
        </div>
      );
    },
  ),
);

export default PlatParamsSetting;
