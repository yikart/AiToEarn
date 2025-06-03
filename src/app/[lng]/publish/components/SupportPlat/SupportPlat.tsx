import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./supportPlat.module.scss";
import { PubType } from "@/app/config/publishConfig";
import { AccountPlatInfoMap } from "@/app/config/platConfig";

export interface ISupportPlatRef {}

export interface ISupportPlatProps {
  pubType: PubType;
  style?: React.CSSProperties;
}

const SupportPlat = memo(
  forwardRef(
    (
      { pubType, style }: ISupportPlatProps,
      ref: ForwardedRef<ISupportPlatRef>,
    ) => {
      return (
        <div
          className={`${styles.supportPlat} ${pubType !== PubType.VIDEO && styles.supportPlatBg}`}
          style={style}
        >
          <div className="supportPlatBg-title">支持平台</div>
          <div className="supportPlat-tip">
            <p className="supportPlat-tip--line" />
            <p className="supportPlat-tip-text">支持以下平台</p>
            <p className="supportPlat-tip--line" />
          </div>
          <ul className="supportPlat-con">
            {Array.from(AccountPlatInfoMap).map(([k, v]) => {
              if (!v.pubTypes.has(pubType)) return null;
              return (
                <li key={v.name}>
                  <img src={v.icon} />
                </li>
              );
            })}
          </ul>
        </div>
      );
    },
  ),
);
SupportPlat.displayName = "SupportPlat";

export default SupportPlat;
