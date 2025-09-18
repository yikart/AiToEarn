import {
  ForwardedRef,
  forwardRef,
  memo,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./hotTitle.module.scss";
import { useHotContent } from "@/app/[lng]/hotContent/useHotContent";
import { useShallow } from "zustand/react/shallow";
import { PlatformRanking } from "@/api/hot";
import HotContentLabel from "@/app/[lng]/hotContent/components/HotContentLabel";

export interface IHotTitleRef {}

export interface IHotTitleProps {}

const HotTitle = memo(
  forwardRef(({}: IHotTitleProps, ref: ForwardedRef<IHotTitleRef>) => {
    const {
      labelData,
      rankingData,
      currentRankCategory,
      twoMenuKey,
      setCurrentRankCategory,
    } = useHotContent(
      useShallow((state) => ({
        labelData: state.labelData,
        rankingData: state.rankingData,
        datesData: state.datesData,
        twoMenuKey: state.twoMenuKey,
        currentRankCategory: state.currentRankCategory,
        setCurrentRankCategory: state.setCurrentRankCategory,
      })),
    );
    // 当前选中的标签
    const [labelValue, setLabelValue] = useState("全部");
    const allDates = useRef(["近7天", "近30天", "近90天"]);
    // 当前选择的日期范围
    const [currDate, setCurrDate] = useState(allDates.current[0]);

    // 获取当前选中的标签、日期、榜单
    const selectedLabelInfo = useMemo(() => {
      const platId = twoMenuKey.split("_")[1];
      return {
        // 所有榜单
        allRanking: rankingData[platId] || [],
        // 当前选择榜单
        ranking: (rankingData[platId]?.find(
          (v) => v.id === currentRankCategory,
        ) ?? {}) as PlatformRanking,
        labelData: labelData[platId] || [],
      };
    }, [labelData, rankingData, twoMenuKey, currentRankCategory]);

    return (
      <div className={styles.hotTitle}>
        <HotContentLabel
          style={{ marginBottom: "15px" }}
          labels={["全部", ...(selectedLabelInfo.labelData ?? [])]}
          value={labelValue}
          onChange={(value) => {
            setLabelValue(value);
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

export default HotTitle;
