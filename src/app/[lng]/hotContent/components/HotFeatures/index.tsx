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
import styles from "./hotFeatures.module.scss";
import HotContentLabel from "@/app/[lng]/hotContent/components/HotContentLabel";
import { useHotContent } from "@/app/[lng]/hotContent/useHotContent";
import { useShallow } from "zustand/react/shallow";
import { Skeleton, Spin, Table, type TableProps } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { Topic } from "@/api/types/topic";
import { platformApi } from "@/api/hot";
import hotContentStyles from "../HotContent/hotContent.module.scss";
import {
  HotContentBaseInfo,
  SingleNumberCall,
} from "@/app/[lng]/hotContent/components/HotContent/hotContentCommonWidget";

export interface IHotFeaturesRef {}

export interface IHotFeaturesProps {}

const NEXT_PUBLIC_YIKA_OSS_HOST = process.env.NEXT_PUBLIC_YIKA_OSS_HOST;

const HotFeatures = memo(
  forwardRef(({}: IHotFeaturesProps, ref: ForwardedRef<IHotFeaturesRef>) => {
    const { hotContentPlatformList, twoMenuKey } = useHotContent(
      useShallow((state) => ({
        hotContentPlatformList: state.hotContentPlatformList,
        twoMenuKey: state.twoMenuKey,
      })),
    );
    const allDates = useRef(["近3天", "近7天", "近15天", "近30天"]);
    // 当前选择的日期范围
    const [currDate, setCurrDate] = useState(allDates.current[1]);
    // 当前选择的平台
    const [currPlat, setCurrPlat] = useState("");
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const page = useRef(1);
    const [isReset, setIsReset] = useState(true);
    const [dataSource, setDataSource] = useState<Topic[]>([]);

    useEffect(() => {
      setCurrPlat(hotContentPlatformList[0]?.name || "");
    }, [hotContentPlatformList]);

    const columns = useMemo(() => {
      const callParamsColumnsCommon = (title: string) => {
        return {
          width: 90,
          title: () => {
            return <p style={{ textAlign: "center" }}>{title}</p>;
          },
        };
      };

      const columns: TableProps<Topic>["columns"] = [
        {
          title: "排名",
          width: 60,
          render: (text, data, ind) => (
            <>
              {ind <= 2 ? (
                <div className={hotContentStyles.rankingTopthree}>
                  {ind + 1}
                </div>
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
              <HotContentBaseInfo
                title={data.title}
                avatar={data.avatar!}
                publishTime={data.publishTime!}
                fansCount={data.fans}
                nickname={data.author!}
                cover={data.cover}
                onClick={() => {
                  window.open(data.authorUrl, "_blank");
                }}
              />
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

        ...(dataSource[1]?.shareCount
          ? [
              {
                ...callParamsColumnsCommon("分享数"),
                render: (text: any, data: Topic) => (
                  <SingleNumberCall total={data.shareCount} />
                ),
              },
            ]
          : []),
        ...(dataSource[1]?.likeCount
          ? [
              {
                ...callParamsColumnsCommon("点赞数"),
                render: (text: any, data: Topic) => (
                  <SingleNumberCall total={data.likeCount} />
                ),
              },
            ]
          : []),
        ...(dataSource[1]?.commentCount
          ? [
              {
                ...callParamsColumnsCommon("评论数"),
                render: (text: any, data: Topic) => (
                  <SingleNumberCall total={data.commentCount} />
                ),
              },
            ]
          : []),
        ...(dataSource[1]?.collectCount
          ? [
              {
                ...callParamsColumnsCommon("收藏数"),
                render: (text: any, data: Topic) => (
                  <SingleNumberCall
                    total={data.collectCount}
                    highlight={true}
                  />
                ),
              },
            ]
          : []),
        ...(dataSource[1]?.readCount
          ? [
              {
                ...callParamsColumnsCommon("阅读数"),
                render: (text: any, data: Topic) => (
                  <SingleNumberCall total={data.readCount} highlight={true} />
                ),
              },
            ]
          : []),
      ];

      return columns;
    }, [dataSource]);

    // 获取数据
    const getTableData = useCallback(async () => {
      if (loading) return;

      const res = await platformApi.getAllTopics({
        page: page.current,
        pageSize: 20,
        platformId: hotContentPlatformList.find((v) => v.name === currPlat)?.id,
        timeType: currDate,
        msgType: twoMenuKey,
      });
      page.current = page.current + 1;
      setTotal(res?.data.meta.totalItems || 0);
      setDataSource((prevState) => {
        return [...prevState, ...(res?.data.items || [])];
      });
    }, [currDate, currPlat, hotContentPlatformList, loading, twoMenuKey]);

    useEffect(() => {
      setIsReset(true);
    }, [twoMenuKey]);

    // 重置数据
    useEffect(() => {
      if (currPlat && isReset) {
        page.current = 1;
        setDataSource([]);
        setLoading(true);
        getTableData().then(() => setLoading(false));
        setIsReset(false);
      }
    }, [isReset, currPlat, currDate, twoMenuKey]);

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
            setIsReset(true);
            setCurrPlat(value);
          }}
        />
        <HotContentLabel
          labels={allDates.current}
          value={currDate}
          onChange={(value) => {
            setIsReset(true);
            setCurrDate(value);
          }}
        />

        <Spin spinning={loading}>
          <div
            className={`${hotContentStyles["hotContent-table"]}`}
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
                rowKey={(record) => record._id}
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

export default HotFeatures;
