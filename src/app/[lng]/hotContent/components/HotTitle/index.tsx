import {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./hotTitle.module.scss";
import { useHotContent } from "@/app/[lng]/hotContent/useHotContent";
import { useShallow } from "zustand/react/shallow";
import { platformApi, PlatformRanking } from "@/api/hot";
import HotContentLabel from "@/app/[lng]/hotContent/components/HotContentLabel";
import { Spin } from "antd";
import { ViralTitle } from "@/api/types/viralTitles";
import { HotTitleItem } from "@/app/[lng]/hotContent/components/HotTitle/components/HotTitleCommons";

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
    const [loading, setLoading] = useState(false);
    // 所有爆款标题前五条数据
    const [allHotTitleData, setAllHotTitleData] = useState<
      {
        category: string;
        titles: ViralTitle[];
      }[]
    >();

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
        platId,
      };
    }, [labelData, rankingData, twoMenuKey, currentRankCategory]);

    // 获取所有爆款数据
    const getAllData = useCallback(async () => {
      const res = await platformApi.findTopByPlatformAndCategories(
        selectedLabelInfo.platId,
        currDate,
      );
      console.log(res);
      setAllHotTitleData(res?.data);
    }, [currDate, selectedLabelInfo.platId]);

    useEffect(() => {
      getAllData();
    }, [twoMenuKey]);

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
          style={{ marginBottom: "15px" }}
          labels={allDates.current}
          value={currDate}
          onChange={(value) => {
            setCurrDate(value);
          }}
        />

        <Spin wrapperClassName="hotTitle-content" spinning={loading}>
          <div className="hotTitle-content-wrapper">
            {allHotTitleData?.map((v) => {
              return (
                <HotTitleItem
                  data={v}
                  key={v.category}
                  style={{ width: "calc(50% - 15px)", marginBottom: "30px" }}
                />
              );
            })}
          </div>
        </Spin>
      </div>
    );
  }),
);

export default HotTitle;
