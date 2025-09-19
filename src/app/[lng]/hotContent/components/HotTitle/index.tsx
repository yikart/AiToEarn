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
import { useTransClient } from "@/app/i18n/client";

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
    const { t } = useTransClient("hot-content");
    const labelAll = useRef<string>(t("all"));
    // 当前选中的标签
    const [labelValue, setLabelValue] = useState(labelAll.current);
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
    // 爆款标题数据详情
    const [hotTitleData, setHotTitleData] = useState<ViralTitle[]>([]);

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
      setLoading(true);
      const res = await platformApi.findTopByPlatformAndCategories(
        selectedLabelInfo.platId,
        currDate,
      );
      setLoading(false);
      setAllHotTitleData(res?.data);
    }, [currDate, selectedLabelInfo.platId]);

    // 获取爆款数据详情
    const getDetailData = useCallback(async () => {
      if (labelValue === labelAll.current) return;
      setLoading(true);
      const res = await platformApi.findByPlatformAndCategory(
        selectedLabelInfo.platId,
        {
          category: labelValue === labelAll.current ? "全部" : labelValue,
          page: 1,
          timeType: currDate,
          pageSize: 50,
        },
      );
      setHotTitleData(res?.data.items || []);
      setLoading(false);
    }, [labelValue, currDate, selectedLabelInfo.ranking.id]);

    useEffect(() => {
      getAllData();
    }, [twoMenuKey]);

    useEffect(() => {
      getDetailData();
    }, [labelValue, currDate]);

    return (
      <div className={styles.hotTitle}>
        <HotContentLabel
          style={{ marginBottom: "15px" }}
          labels={[labelAll.current, ...(selectedLabelInfo.labelData ?? [])]}
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
          <div
            className="hotTitle-content-wrapper"
            style={{
              display: labelValue === labelAll.current ? "flex" : "none",
            }}
          >
            {allHotTitleData?.map((v) => {
              return (
                <HotTitleItem
                  data={v}
                  key={v.category}
                  style={{ width: "calc(50% - 15px)", marginBottom: "30px" }}
                  onBottomLinkClick={() => {
                    setLabelValue(v.category);
                  }}
                  bottomLinkText="查看更多"
                />
              );
            })}
          </div>

          <div
            className="hotTitle-content-wrapper-details"
            style={{
              display: labelValue !== labelAll.current ? "flex" : "none",
            }}
          >
            <HotTitleItem
              headRightElement={
                <>
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      setLabelValue(labelAll.current);
                    }}
                  >
                    返回全部
                  </a>
                </>
              }
              data={{
                category: labelValue,
                titles: hotTitleData,
              }}
              key={labelValue}
              style={{ width: "100%", marginBottom: "30px" }}
              onBottomLinkClick={() => {
                setLabelValue(labelAll.current);
              }}
              bottomLinkText="收起"
            />
          </div>
        </Spin>
      </div>
    );
  }),
);

export default HotTitle;
