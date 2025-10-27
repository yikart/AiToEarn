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
import { Popover, Select, Skeleton, Spin, Table } from "antd";
import Icon, { QuestionCircleOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import {
  platformApi,
  PlatformRanking,
  RankingContent,
  RankingContentsResponse,
} from "@/api/hot";
import InfiniteScroll from "react-infinite-scroll-component";
import HotSvg from "../../svgs/hotContent.svg";
import ReadSvg from "./svgs/read.svg";
import {
  AnaAddCall,
  HotContentBaseInfo,
  SingleNumberCall,
} from "@/app/[lng]/hotContent/components/HotContent/hotContentCommonWidget";
import { useTransClient } from "@/app/i18n/client";
import CryptoJS from "crypto-js";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";

export interface IHotContentRef {}

export interface IHotContentProps {
  defaultHotContentData?: RankingContentsResponse;
}

const icons = {
  wechat: [ReadSvg, HotSvg],
};

const HotContent = memo(
  forwardRef(
    (
      { defaultHotContentData }: IHotContentProps,
      ref: ForwardedRef<IHotContentRef>,
    ) => {
      const {
        labelData,
        rankingData,
        currentRankCategory,
        datesData,
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
      const all = useRef<string>(t("all"));
      // 当前选中的标签
      const [labelValue, setLabelValue] = useState(all.current);
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
          // 所有榜单
          allRanking: rankingData[platId] || [],
          // 当前选择榜单
          ranking: (rankingData[platId]?.find(
            (v) => v.id === currentRankCategory,
          ) ?? {}) as PlatformRanking,
          labelData: labelData[platId] || [],
          datesData: datesData[platId] || [],
        };
      }, [labelData, rankingData, datesData, twoMenuKey, currentRankCategory]);

      // 跳转到作者主页
      const goAuthorPage = useCallback(
        (data: RankingContent) => {
          let authorUrl = "";
          switch (selectedLabelInfo.ranking.platform.type) {
            case "douyin":
              authorUrl = `https://www.douyin.com/user/${data.secUid}`;
              break;
            case "xiaohongshu":
              authorUrl = `https://www.xiaohongshu.com/user/profile/${data.author.id}`;
              break;
            case "kuaishou":
              authorUrl = `https://kuaishou.cn/profile/${data.secUid}`;
              break;
            case "bilibili":
              authorUrl = `https://space.bilibili.com/${data.mid}`;
              break;
            case "shipinhao":
              break;
          }
          if (authorUrl) window.open(authorUrl, "_blank");
        },
        [selectedLabelInfo],
      );

      // 热门内容的平台类型转换到本地枚举
      const getPlatEnum = (type: string) => {
        switch (type) {
          case "douyin":
            return {
              plat: PlatType.Douyin,
            };
          case "xiaohongshu":
            return {
              plat: PlatType.Xhs,
            };
          case "kuaishou":
            return {
              plat: PlatType.KWAI,
            };
          case "bilibili":
            return {
              plat: PlatType.BILIBILI,
            };
          case "shipinhao":
            return {
              plat: PlatType.WxSph,
            };
          case "wechat":
            return {
              plat: PlatType.WxGzh,
            };
        }
      };

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
                  ...callParamsColumnsCommon(t("collections")),
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
            ...callParamsColumnsCommon(t("shares")),
            render: (text, data) => (
              <AnaAddCall
                add={data.anaAdd.addShareCount}
                total={data.anaAdd.useShareCount}
              />
            ),
          },
          {
            ...callParamsColumnsCommon(t("comments")),
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
                  ...callParamsColumnsCommon(t("views")),
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
            ...callParamsColumnsCommon(t("likes")),
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
                  ...callParamsColumnsCommon(t("engagement")),
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
            ...callParamsColumnsCommon(t("comments")),
            render: (text, data) => (
              <SingleNumberCall total={data.stats.commentCount} />
            ),
          },
          {
            ...callParamsColumnsCommon(t("shares")),
            render: (text, data) => (
              <SingleNumberCall total={data.shareCount!} />
            ),
          },
          {
            ...callParamsColumnsCommon(t("likes")),
            render: (text, data) => (
              <SingleNumberCall total={data.stats.likeCount} />
            ),
          },
          {
            ...callParamsColumnsCommon(t("recommend")),
            render: (text, data) => (
              <SingleNumberCall total={data.stats.likeCount} />
            ),
          },
        ];
        // 微信公众号
        const wxGzhColumns: TableProps<RankingContent>["columns"] = [
          ...(dataSource[1]?.stats.watchCount
            ? [
                {
                  ...callParamsColumnsCommon(t("watch")),
                  render: (text: string, data: RankingContent) => (
                    <SingleNumberCall total={data.stats.watchCount} />
                  ),
                },
              ]
            : []),
          ...(dataSource[1]?.stats.likeCount
            ? [
                {
                  ...callParamsColumnsCommon(t("likes")),
                  render: (text: string, data: RankingContent) => (
                    <SingleNumberCall total={data.stats.likeCount} />
                  ),
                },
              ]
            : []),
          ...(dataSource[1]?.shareCount
            ? [
                {
                  ...callParamsColumnsCommon(t("shares")),
                  render: (text: string, data: RankingContent) => (
                    <SingleNumberCall total={data.shareCount!} />
                  ),
                },
              ]
            : []),
          ...(dataSource[1]?.stats.viewCount
            ? [
                {
                  ...callParamsColumnsCommon(t("views")),
                  render: (text: string, data: RankingContent) => (
                    <SingleNumberCall
                      total={data.stats.viewCount}
                      highlight={true}
                    />
                  ),
                },
              ]
            : []),
        ];

        const columns: TableProps<RankingContent>["columns"] = [
          {
            title: t("rank"),
            dataIndex: "rankingPosition",
            key: "rankingPosition",
            width: 60,
            render: (text, data, ind) => (
              <>
                {ind <= 2 ? (
                  <div className={styles.rankingTopthree}>{ind + 1}</div>
                ) : (
                  <p style={{ width: "30px", textAlign: "center" }}>
                    {ind + 1}
                  </p>
                )}
              </>
            ),
          },
          {
            title: t("baseInfo"),
            dataIndex: "baseInfo",
            render: (text, data) => {
              const platInfo = getPlatEnum(
                selectedLabelInfo.ranking?.platform?.type,
              );
              const platConfig = AccountPlatInfoMap.get(
                platInfo?.plat ?? PlatType.Xhs,
              )!;

              return (
                <HotContentBaseInfo
                  // coverPopoverContent={
                  //   <div className={styles.baseInfoPopver}>
                  //     <div className="baseInfoPopver-head"></div>
                  //     <div className="baseInfoPopver-content"></div>
                  //     <div className="baseInfoPopver-footer"></div>
                  //   </div>
                  // }
                  title={data.title}
                  avatar={data.author.avatar}
                  publishTime={data.publishTime}
                  fansCount={data.author.fansCount}
                  nickname={data.author.name}
                  cover={data.cover}
                  onClick={() => {
                    goAuthorPage(data);
                  }}
                />
              );
            },
          },
          {
            title: () => <p style={{ textAlign: "center" }}>{t("category")}</p>,
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

          ...(plat === "shipinhao"
            ? wxSphColumns
            : plat === "wechat"
              ? wxGzhColumns
              : anaAddColumns),
        ];
        return columns;
      }, [selectedLabelInfo, dataSource, t]);

      const getTableData = useCallback(async () => {
        if (loading) return;

        const res = await platformApi.getRankingContents(
          selectedLabelInfo.ranking.id,
          page.current,
          20,
          labelValue === all.current ? "全部" : labelValue,
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
          setLabelValue(all.current);
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
        currentRankCategory,
      ]);

      return (
        <div className={`${styles.hotContent}`}>
          {selectedLabelInfo.allRanking.length > 1 && (
            <div className="hotContent-rankLabel">
              {selectedLabelInfo.allRanking.map((v, i) => {
                const icon = (icons[v.platform.type as "wechat"] ?? [])[i];

                return (
                  <div
                    className={`hotContent-rankLabel-item ${v.id === currentRankCategory ? "hotContent-rankLabel-item--active" : ""}`}
                    key={v.id}
                    onClick={() => {
                      setCurrentRankCategory(v.id);
                      setIsReset(true);
                    }}
                  >
                    <Icon component={icon} />
                    {v.name}
                  </div>
                );
              })}
            </div>
          )}

          <HotContentLabel
            labels={[all.current, ...(selectedLabelInfo.labelData ?? [])]}
            value={labelValue}
            onChange={(value) => {
              setLabelValue(value);
              setIsReset(true);
            }}
          />

          <div className="hotContent-options">
            <div className="hotContent-options-select">
              <div className="hotContent-options-select-label">
                {t("dailyRank")}
              </div>
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
                  <p>
                    {t("updateFrequency")}：
                    {selectedLabelInfo.ranking.updateFrequency}
                  </p>
                  <p>
                    {t("statEndTime")}：{selectedLabelInfo.ranking.updateTime}
                  </p>
                  <p>
                    {t("updateFrequency")}：{t("daily")}
                  </p>
                  <p>
                    {t("sortRule")}：{t("sortRuleDesc")}
                  </p>
                </>
              }
              placement="bottomLeft"
            >
              <div className="hotContent-options-explain">
                {t("dataDescription")}
                <QuestionCircleOutlined />
              </div>
            </Popover>
          </div>

          <Spin spinning={loading}>
            <div
              className={`${styles["hotContent-table"]} hotContent--${selectedLabelInfo?.ranking?.platform?.type}`}
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
                  dataSource={defaultHotContentData?.items ?? dataSource}
                  rowKey={(record) => record.id}
                  columns={columns}
                  pagination={false}
                  onRow={(record) => {
                    return {
                      onClick: async () => {
                        if (
                          selectedLabelInfo.ranking.platform.type === "wechat"
                        ) {
                          setLoading(true);
                          const res = await platformApi.getDetailUrl(
                            record.photoId,
                          );
                          setLoading(false);

                          const key =
                            CryptoJS.enc.Utf8.parse("cdxbxhs147258369");
                          const encrypted = res?.data ?? "";

                          const decrypted = CryptoJS.AES.decrypt(
                            encrypted,
                            key,
                            {
                              mode: CryptoJS.mode.ECB,
                              padding: CryptoJS.pad.Pkcs7,
                            },
                          );
                          const result = CryptoJS.enc.Utf8.stringify(decrypted);
                          window.open(result, "_blank");
                          return;
                        }

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
    },
  ),
);

export default HotContent;
