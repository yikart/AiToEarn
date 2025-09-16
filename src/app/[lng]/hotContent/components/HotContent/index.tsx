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
import { useHotContent } from "@/app/[lng]/hotContent/useHotContent";
import { useShallow } from "zustand/react/shallow";
import HotContentLabel from "@/app/[lng]/hotContent/components/HotContentLabel";
import styles from "./hotContent.module.scss";
import { Avatar, Popover, Select, Skeleton, Spin, Table } from "antd";
import Icon, { QuestionCircleOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { platformApi, RankingContent } from "@/api/hot";
import InfiniteScroll from "react-infinite-scroll-component";
import { describeNumber } from "@/utils";
import Uparrow from "../../svgs/uparrow.svg";

export interface IHotContentRef {}

export interface IHotContentProps {}

const AnaAddCall = ({
  add,
  total,
  highlight = false,
}: {
  add: number;
  total: number;
  highlight?: boolean;
}) => {
  return (
    <div
      className={`${styles.anaAddCall} ${highlight ? styles["anaAddCall-highlight"] : ""}`}
    >
      <div className="anaAddCall-add">
        <Icon component={Uparrow} />
        {describeNumber(add)}
      </div>
      <div className="anaAddCall-total">总{describeNumber(total)}</div>
    </div>
  );
};

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
    // 总数
    const [total, setTotal] = useState(0);
    const page = useRef(0);
    const [isReset, setIsReset] = useState(false);

    // 获取当前选中的标签、日期、榜单
    const selectedLabelInfo = useMemo(() => {
      const platId = twoMenuKey.split("_")[1];
      return {
        ranking: rankingData[platId] ?? {},
        labelData: labelData[platId] || [],
        datesData: datesData[platId] || [],
      };
    }, [labelData, rankingData, datesData, twoMenuKey]);

    const columns = useMemo(() => {
      const callParamsColumnsCommon = (title: string) => {
        return {
          width: 90,
          title: () => {
            return <p style={{ textAlign: "center" }}>{title}</p>;
          },
        };
      };
      const plat = selectedLabelInfo?.ranking?.platform?.type;

      const anaAddColumns: TableProps<RankingContent>["columns"] = [
        ...(dataSource[1]?.anaAdd?.addCollectCount
          ? [
              {
                ...callParamsColumnsCommon("新增收藏"),
                render: (text: string, data: RankingContent) => (
                  <AnaAddCall
                    add={data.anaAdd.addCollectCount!}
                    total={data.anaAdd.useCollectCount!}
                  />
                ),
              },
            ]
          : []),
        {
          ...callParamsColumnsCommon("新增分享"),
          render: (text, data) => (
            <AnaAddCall
              add={data.anaAdd.addShareCount}
              total={data.anaAdd.useShareCount}
            />
          ),
        },
        {
          ...callParamsColumnsCommon("新增评论"),
          render: (text, data) => (
            <AnaAddCall
              add={data.anaAdd.addCommentCount}
              total={data.anaAdd.useCommentCount}
            />
          ),
        },
        ...(dataSource[0]?.anaAdd?.addViewCount
          ? [
              {
                ...callParamsColumnsCommon("新增播放"),
                render: (text: string, data: RankingContent) => (
                  <AnaAddCall
                    add={data.anaAdd.addViewCount!}
                    total={data.anaAdd.useViewCount!}
                  />
                ),
              },
            ]
          : []),
        {
          ...callParamsColumnsCommon("新增获赞"),
          render: (text, data) => (
            <AnaAddCall
              highlight={plat !== "xiaohongshu"}
              add={data.anaAdd.addLikeCount}
              total={data.anaAdd.useLikeCount}
            />
          ),
        },
        ...(plat === "xiaohongshu"
          ? [
              {
                ...callParamsColumnsCommon("互动增量"),
                render: (text: string, data: RankingContent) => (
                  <AnaAddCall
                    highlight={true}
                    add={data.anaAdd.addInteractiveCount!}
                    total={data.anaAdd.interactiveCount!}
                  />
                ),
              },
            ]
          : []),
      ];
      // 视频号
      const wxSphColumns: TableProps<RankingContent>["columns"] = [
        {
          ...callParamsColumnsCommon("评论增量"),
          render: (text, data) => (
            <AnaAddCall
              add={data.anaAdd.addShareCount}
              total={data.anaAdd.useShareCount}
            />
          ),
        },
      ];
      const otherColumns: TableProps<RankingContent>["columns"] = [];

      console.log(plat);

      const columns: TableProps<RankingContent>["columns"] = [
        {
          title: "排名",
          dataIndex: "rankingPosition",
          key: "rankingPosition",
          width: 60,
          render: (text, data, ind) => (
            <>
              {ind <= 2 ? (
                <div className={styles.rankingTopthree}>{ind + 1}</div>
              ) : (
                <p style={{ width: "30px", textAlign: "center" }}>{ind + 1}</p>
              )}
            </>
          ),
        },
        {
          title: "基本信息",
          dataIndex: "baseInfo",
          render: (text, data) => {
            return (
              <div className={styles.baseInfo}>
                <img className="baseInfo-cover" src={data.cover} />
                <div className="baseInfo-right">
                  {data.title ? (
                    <div className="baseInfo-right-title" title={data.title}>
                      {data.title}
                    </div>
                  ) : (
                    <div className="baseInfo-right-noTitle">暂无标题</div>
                  )}

                  <div className="baseInfo-right-author">
                    <Avatar
                      className="baseInfo-right-author-avatar"
                      src={data.author.avatar}
                      size="small"
                    />
                    <p className="baseInfo-right-author-name">
                      {data.author.name}
                    </p>
                    <p className="baseInfo-right-author-fans">
                      粉丝数 {describeNumber(data.author.fansCount)}
                    </p>
                    <p className="baseInfo-right-author-pubTime">
                      发布于{data.publishTime}
                    </p>
                  </div>
                </div>
              </div>
            );
          },
        },
        {
          title: () => <p style={{ textAlign: "center" }}>作品分类</p>,
          dataIndex: "category",
          key: "category",
          width: 120,
          render: (text, data) => (
            <div style={{ textAlign: "center" }}>
              <p>
                <b>{text}</b>
              </p>
              <p>{data.subCategory}</p>
            </div>
          ),
        },

        ...(plat === "shipinhao" ? wxSphColumns : anaAddColumns),
      ];
      return columns;
    }, [selectedLabelInfo, dataSource]);

    const getTableData = useCallback(async () => {
      if (loading) return;

      const res = await platformApi.getRankingContents(
        selectedLabelInfo.ranking.id,
        page.current,
        20,
        labelValue,
        dateValue,
      );
      page.current += 1;
      setDataSource((prevState) => {
        return [...prevState, ...(res?.data.items || [])];
      });
      setTotal(res?.data.meta.totalItems || 0);
    }, [selectedLabelInfo.ranking, labelValue, dateValue]);

    // 当平台切换时，重置数据
    useEffect(() => {
      if (selectedLabelInfo.datesData.length > 0) {
        setDateValue(selectedLabelInfo.datesData[0].value);
        setLabelValue("全部");
        setIsReset(true);
      }
    }, [selectedLabelInfo.datesData, twoMenuKey]);

    // 请求列表数据
    useEffect(() => {
      if (isReset && selectedLabelInfo.ranking?.id) {
        page.current = 1;
        setDataSource([]);
        setLoading(true);
        getTableData().then(() => setLoading(false));
        setIsReset(false);
      }
    }, [
      labelValue,
      dateValue,
      selectedLabelInfo.datesData,
      selectedLabelInfo.ranking?.id,
      isReset,
    ]);

    return (
      <div className={`${styles.hotContent}`}>
        <HotContentLabel
          labels={["全部", ...(selectedLabelInfo.labelData ?? [])]}
          value={labelValue}
          onChange={(value) => {
            setLabelValue(value);
            setIsReset(true);
          }}
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
              onChange={(e) => {
                setDateValue(e);
                setIsReset(true);
              }}
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

        <Spin spinning={loading}>
          <div
            className={`hotContent-table hotContent--${selectedLabelInfo?.ranking?.platform?.type}`}
            id="hotContent-table"
          >
            <InfiniteScroll
              dataLength={dataSource.length}
              next={getTableData}
              hasMore={dataSource.length < total}
              loader={
                !loading ? <Skeleton active paragraph={{ rows: 1 }} /> : <></>
              }
              endMessage={<></>}
              scrollableTarget="hotContent-table"
            >
              <Table
                dataSource={dataSource}
                rowKey={(record) => record.id}
                columns={columns}
                pagination={false}
                onRow={(record) => {
                  return {
                    onClick: () => {
                      if (!record.url) return;
                      window.open(record.url, "_blank");
                    },
                  };
                }}
              />
            </InfiniteScroll>
          </div>
        </Spin>
      </div>
    );
  }),
);

export default HotContent;
