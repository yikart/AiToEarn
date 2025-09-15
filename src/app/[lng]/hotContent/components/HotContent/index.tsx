import {
  ForwardedRef,
  forwardRef,
  memo,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHotContent } from "@/app/[lng]/hotContent/useHotContent";
import { useShallow } from "zustand/react/shallow";
import HotContentLabel from "@/app/[lng]/hotContent/components/HotContentLabel";
import { PlatformRanking } from "@/api/hot";

export interface IHotContentRef {}

export interface IHotContentProps {}

const HotContent = memo(
  forwardRef(({}: IHotContentProps, ref: ForwardedRef<IHotContentRef>) => {
    const { labelData, rankingData, datesData, twoMenuKey } = useHotContent(
      useShallow((state) => ({
        labelData: state.labelData,
        rankingData: state.rankingData,
        datesData: state.datesData,
        twoMenuKey: state.twoMenuKey,
      })),
    );
    const lastSelectedLabelInfo = useRef<{
      ranking?: PlatformRanking;
      labelData?: string[];
      datesData?: string[];
    }>();
    // 当前选中的标签
    const [labelValue, setLabelValue] = useState("全部");

    // 获取当前选中的标签、日期、榜单
    const selectedLabelInfo = useMemo(() => {
      const platId = twoMenuKey.split("_")[1];
      const ranking = rankingData[platId] ?? {};

      // 判断 ranking 是否为空对象
      const isEmptyRanking = !ranking || Object.keys(ranking).length === 0;

      if (isEmptyRanking && lastSelectedLabelInfo.current) {
        return lastSelectedLabelInfo.current;
      }

      const value = {
        ranking,
        labelData: labelData[ranking?.type] || [],
        datesData: datesData[platId] || [],
      };

      lastSelectedLabelInfo.current = value;
      return value;
    }, [labelData, rankingData, datesData, twoMenuKey]);

    return (
      <div>
        <HotContentLabel
          labels={["全部", ...(selectedLabelInfo.labelData ?? [])]}
          value={labelValue}
          onChange={(value) => setLabelValue(value)}
        />
      </div>
    );
  }),
);

export default HotContent;
