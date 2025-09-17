import { ForwardedRef, forwardRef, memo, useRef, useState } from "react";
import styles from "./hotFeatures.module.scss";
import HotContentLabel from "@/app/[lng]/hotContent/components/HotContentLabel";

export interface IHotFeaturesRef {}

export interface IHotFeaturesProps {}

const HotFeatures = memo(
  forwardRef(({}: IHotFeaturesProps, ref: ForwardedRef<IHotFeaturesRef>) => {
    const allDates = useRef(["近3天", "近7天", "近15天", "近30天"]);
    // 当前选择的日期范围
    const [currDate, setCurrDate] = useState("");
    // 当前选择的平台
    const [currPlat, setCurrPlat] = useState("");
    // 当前选择的分类
    const [labelValue, setLabelValue] = useState("");

    return (
      <div className={styles.hotFeatures}>
        <HotContentLabel
          labels={[
            "AI教程",
            "AI绘画",
            "AI热点",
            "AI创作",
            "AI大模型",
            "Prompt",
          ]}
          value={labelValue}
          onChange={(value) => {
            if (value === labelValue) {
              setLabelValue("");
            } else {
              setLabelValue(value);
            }
          }}
        />

        <HotContentLabel
          labels={allDates.current}
          value={currDate}
          onChange={(value) => {
            setCurrDate(value);
          }}
        />
      </div>
    );
  }),
);

export default HotFeatures;
