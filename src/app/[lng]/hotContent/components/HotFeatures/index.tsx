import { ForwardedRef, forwardRef, memo, useEffect, useRef, useState } from "react";
import styles from "./hotFeatures.module.scss";
import HotContentLabel from "@/app/[lng]/hotContent/components/HotContentLabel";
import { useHotContent } from "@/app/[lng]/hotContent/useHotContent";
import { useShallow } from "zustand/react/shallow";

export interface IHotFeaturesRef {}

export interface IHotFeaturesProps {}

const NEXT_PUBLIC_YIKA_OSS_HOST = process.env.NEXT_PUBLIC_YIKA_OSS_HOST;

const HotFeatures = memo(
  forwardRef(({}: IHotFeaturesProps, ref: ForwardedRef<IHotFeaturesRef>) => {
    const { hotContentPlatformList } = useHotContent(
      useShallow((state) => ({
        hotContentPlatformList: state.hotContentPlatformList,
      })),
    );
    const allDates = useRef(["近3天", "近7天", "近15天", "近30天"]);
    // 当前选择的日期范围
    const [currDate, setCurrDate] = useState(allDates.current[2]);
    // 当前选择的平台
    const [currPlat, setCurrPlat] = useState("");
    // 当前选择的分类
    const [labelValue, setLabelValue] = useState("");

    useEffect(() => {
      setCurrPlat(hotContentPlatformList[0]?.name || "");
    }, [hotContentPlatformList]);

    return (
      <div className={styles.hotFeatures}>
        <HotContentLabel
          style={{ marginBottom: "15px" }}
          labels={hotContentPlatformList.map((v) => v.name)}
          icons={hotContentPlatformList.map(
            (v) => `${NEXT_PUBLIC_YIKA_OSS_HOST}/${v.icon}`,
          )}
          value={currPlat}
          onChange={(value) => {
            setCurrDate(value);
          }}
        />
        <HotContentLabel
          style={{ marginBottom: "15px" }}
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
