import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useHotContent } from "@/app/[lng]/hotContent/useHotContent";
import { useShallow } from "zustand/react/shallow";
import HotContentLabel from "@/app/[lng]/hotContent/components/HotContentLabel";
import styles from "./hotContent.module.scss";
import { Select } from "antd";

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
    // 当前选中的标签
    const [labelValue, setLabelValue] = useState("全部");
    // 当前选中的日期
    const [dateValue, setDateValue] = useState("");

    // 获取当前选中的标签、日期、榜单
    const selectedLabelInfo = useMemo(() => {
      const platId = twoMenuKey.split("_")[1];
      return {
        ranking: rankingData[platId] ?? {},
        labelData: labelData[platId] || [],
        datesData: datesData[platId] || [],
      };
    }, [labelData, rankingData, datesData, twoMenuKey]);

    useEffect(() => {
      setLabelValue("全部");
    }, [twoMenuKey]);

    // 当平台切换时，重置日期为第一个
    useEffect(() => {
      if (selectedLabelInfo.datesData.length > 0) {
        setDateValue(selectedLabelInfo.datesData[0].value);
      }
    }, [selectedLabelInfo]);

    // 请求列表数据
    useEffect(() => {
      if (dateValue === "") return;
      console.log("请求列表数据", { labelValue, dateValue });
    }, [labelValue, dateValue]);

    return (
      <div className={styles.hotContent}>
        <HotContentLabel
          labels={["全部", ...(selectedLabelInfo.labelData ?? [])]}
          value={labelValue}
          onChange={(value) => setLabelValue(value)}
        />

        <div className="hotContent-options">
          <div className="hotContent-options-select">
            <div className="hotContent-options-select-label">日榜</div>
            <Select
              options={selectedLabelInfo.datesData.map((v) => ({
                label: v.showDate,
                value: v.value,
              }))}
              value={dateValue}
              onChange={(e) => setDateValue(e)}
            ></Select>
          </div>
        </div>
      </div>
    );
  }),
);

export default HotContent;
