import {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import styles from "./hotEvent.module.scss";
import { Platform, platformApi } from "@/api/hot";
import { HotTopic, HotValueHistory } from "@/api/types/hotTopic";
import KwaiSvg from "./svgs/kwai.svg";
import XhsSvg from "./svgs/xhs.svg";
import BaiduSvg from "./svgs/baidu.svg";
import DouyinSvg from "./svgs/douyin.svg";
import TaotiaoSvg from "./svgs/totiao.svg";
import WeiboSvg from "./svgs/weibo.svg";
import ZhihuSvg from "./svgs/zhihu.svg";
import BiblSvg from "./svgs/bibl.svg";
import Icon from "@ant-design/icons";
import { Spin, Table, type TableProps } from "antd";
import { describeNumber } from "@/utils";
import hotContentStyles from "../HotContent/hotContent.module.scss";
import drawHotEventEchartLine from "@/app/[lng]/hotContent/components/HotEvent/echart/drawHotEventEchartLine";

const material = [
  {
    icon: XhsSvg,
    back: "linear-gradient(127deg, rgba(255, 38, 82, 0.1) 0%, rgba(255, 126, 140, 0.1) 100%)",
  },
  {
    icon: DouyinSvg,
    back: "linear-gradient(127deg, rgba(90, 246, 242, 0.1) 0%, rgba(254, 44, 85, 0.1) 100%)",
  },
  {
    icon: KwaiSvg,
    back: "linear-gradient(127deg, rgba(255, 121, 2, 0.1) 0%, rgba(255, 216, 181, 0.1) 100%)",
  },
  {
    icon: BiblSvg,
    back: "linear-gradient(127deg, rgba(90, 246, 242, 0.1) 0%, rgba(254, 44, 85, 0.1) 100%)",
  },
  {
    icon: WeiboSvg,
    back: "linear-gradient(127deg, rgba(90, 246, 242, 0.1) 0%, rgba(254, 44, 85, 0.1) 100%)",
  },
  {
    icon: BaiduSvg,
    back: "linear-gradient(127deg, rgba(255, 121, 35, 0.1) 0%, rgba(255, 72, 20, 0.1) 100%)",
  },
  {
    icon: TaotiaoSvg,
    back: "linear-gradient(127deg, rgba(90, 246, 242, 0.1) 0%, rgba(254, 44, 85, 0.1) 100%)",
  },

  {
    icon: ZhihuSvg,
    back: "linear-gradient(127deg, rgba(90, 246, 242, 0.1) 0%, rgba(254, 44, 85, 0.1) 100%)",
  },
];

export interface IHotEventRef {}

export interface IHotEventProps {}

const HotTrendLine: React.FC<{ id: string; data: HotValueHistory[] }> = ({
  id,
  data,
}) => {
  useEffect(() => {
    drawHotEventEchartLine(id, data);
  }, [id, data]);

  return <div id={id} style={{ width: "180px", height: "50px" }}></div>;
};

const HotEvent = memo(
  forwardRef(({}: IHotEventProps, ref: ForwardedRef<IHotEventRef>) => {
    const [data, setData] = useState<
      {
        platform: Platform;
        topics: HotTopic[];
      }[]
    >([]);
    const [loading, setLoading] = useState(false);

    const getData = useCallback(async () => {
      setLoading(true);
      const res = await platformApi.getAllHotTopics();
      setLoading(false);
      setData(res?.data ?? []);
    }, []);

    useEffect(() => {
      getData();
    }, []);

    const getColumns = useCallback((hotTopic: HotTopic[]) => {
      const columns: TableProps<HotTopic>["columns"] = [
        {
          title: "排名",
          width: 60,
          render: (text, data, ind) => (
            <>
              {ind <= 2 ? (
                <div
                  className={hotContentStyles.rankingTopthree}
                  style={{ width: "20px", height: "20px", lineHeight: "20px" }}
                >
                  {ind + 1}
                </div>
              ) : (
                <p style={{ width: "20px", textAlign: "center" }}>{ind + 1}</p>
              )}
            </>
          ),
        },
        {
          title: "热点事件",
          render: (text, record) => {
            return (
              <span
                className={styles.hotEventTitle}
                title={record.title}
                onClick={() => {
                  if (!record.url) return;
                  window.open(record.url, "_blank");
                }}
              >
                {record.title}
              </span>
            );
          },
        },
        {
          width: 120,
          title: "热度值",
          align: "center",
          render: (text, record) => {
            return <span>{describeNumber(record.hotValue)}</span>;
          },
        },

        ...(hotTopic[0]?.hotValueHistory?.length >= 1
          ? [
              {
                width: 200,
                title: "热度趋势",
                render: (text: string, record: HotTopic) => (
                  <HotTrendLine id={record._id} data={record.hotValueHistory} />
                ),
              },
            ]
          : []),
      ];
      return columns;
    }, []);

    return (
      <Spin spinning={loading} style={{ minHeight: "60vh" }}>
        <div className={styles.hotEvent}>
          {data.map(({ platform, topics }, i) => {
            return (
              <div className="hotEvent-item" key={platform.id}>
                <div
                  className="hotEvent-item-head"
                  style={{ background: material[i].back }}
                >
                  <Icon component={material[i].icon} /> {platform.name} · 热点
                </div>
                <div className="hotEvent-item-content">
                  <Table
                    dataSource={topics}
                    columns={getColumns(topics)}
                    rowKey={(record) => record._id}
                    pagination={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Spin>
    );
  }),
);

export default HotEvent;
