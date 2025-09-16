import {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useHotContent } from "@/app/[lng]/hotContent/useHotContent";
import { useShallow } from "zustand/react/shallow";
import HotContentLabel from "@/app/[lng]/hotContent/components/HotContentLabel";
import styles from "./hotContent.module.scss";
import { Popover, Select, Table } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { platformApi, RankingContent } from "@/api/hot";

export interface IHotContentRef {}

export interface IHotContentProps {}

const columns: TableProps<RankingContent>["columns"] = [
  {
    title: "排名",
    dataIndex: "rankingPosition",
    key: "rankingPosition",
    render: (text, data, index) => <span>{index + 1}</span>,
  },
];

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
    // 数据loading
    const [loading, setLoading] = useState(false);
    // 表格数据
    const [dataSource, setDataSource] = useState<RankingContent[]>([]);

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
      getTableData();
    }, [labelValue, dateValue]);

    const getTableData = useCallback(async () => {
      const res = await platformApi.getRankingContents(
        selectedLabelInfo.ranking.id,
        1,
        20,
        labelValue,
        dateValue,
      );
      setDataSource(res?.data.items || []);
    }, [selectedLabelInfo, labelValue, dateValue]);

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

          <Popover
            content={
              <>
                <p>更新时间：{selectedLabelInfo.ranking.updateFrequency}</p>
                <p>统计数据截止：{selectedLabelInfo.ranking.updateTime}</p>
                <p>更新时间：按日</p>
                <p>排序规则：统计当日点赞量前500名的作品推荐</p>
              </>
            }
            placement="bottomLeft"
          >
            <div className="hotContent-options-explain">
              数据说明
              <QuestionCircleOutlined />
            </div>
          </Popover>
        </div>

        <div className="hotContent-table">
          <Table dataSource={dataSource} columns={columns} pagination={false} />
        </div>
      </div>
    );
  }),
);

export default HotContent;
