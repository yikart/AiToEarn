import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./platParamsSetting.module.scss";
import PubParmasTextarea from "@/components/PublishDialog/compoents/PubParmasTextarea";

export interface IPlatParamsSettingRef {}

export interface IPlatParamsSettingProps {}

const PlatParamsSetting = memo(
  forwardRef(
    ({}: IPlatParamsSettingProps, ref: ForwardedRef<IPlatParamsSettingRef>) => {
      return (
        <div className={styles.platParamsSetting}>
          <PubParmasTextarea
            onChange={(v) => {
              console.log(v);
            }}
            onUpload={(files) => {
              console.log(files);
            }}
          />
        </div>
      );
    },
  ),
);

export default PlatParamsSetting;
