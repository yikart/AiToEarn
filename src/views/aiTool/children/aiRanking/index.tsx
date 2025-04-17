import styles from './aiRanking.module.scss';
import RankingTags from '../../components/RankingTags';
import Cycleselects, { CycleTypeEnum } from '../../components/CycleSelects';
import { useEffect, useMemo, useRef, useState } from 'react';
import { platformApi } from '../../../../api/platform';
import {
  AiToolsRankingItemType,
  GetAiToolsRankingApiParams,
} from '../../../../api/types/platform.type';
import { Avatar, Popover, Table, TableProps, Tag, Tooltip } from 'antd';
import {
  CaretDownOutlined,
  CaretUpOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import initWeepPie from './echarts-weekPie';

const optionsTags = [
  {
    label: '总榜',
    value: '1',
  },
  {
    label: '国内榜',
    value: '2',
  },
  {
    label: '国外榜',
    value: '3',
  },
];

function parseChineseNumber(input: string): number {
  if (!input) return 0;
  const units: { [key: string]: number } = {
    千: 1000,
    万: 10000,
    亿: 100000000,
  };

  let result = 0;
  let currentNumber = 0;
  let decimalPart = 0;
  let isDecimal = false;
  let decimalScale = 0.1;

  for (const char of input) {
    if (char === '.') {
      isDecimal = true; // 标记进入小数部分
      continue;
    }

    if (char in units) {
      if (isDecimal) {
        result += (currentNumber + decimalPart) * units[char];
      } else {
        result += currentNumber * units[char];
      }
      currentNumber = 0;
      decimalPart = 0;
      isDecimal = false;
      decimalScale = 0.1;
    } else {
      const num = parseInt(char, 10);
      if (!isNaN(num)) {
        if (isDecimal) {
          decimalPart += num * decimalScale;
          decimalScale *= 0.1;
        } else {
          currentNumber = currentNumber * 10 + num;
        }
      }
    }
  }

  // 如果最后还有剩余的数字或小数部分，直接加到结果里
  result += currentNumber + decimalPart;

  return result;
}

export default function Page() {
  const [params, setParams] = useState<GetAiToolsRankingApiParams>({
    dateType: '',
    startDate: '',
    area: '1',
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AiToolsRankingItemType[]>([]);
  const aiRankingContentRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState(200);

  useEffect(() => {
    setTableHeight(aiRankingContentRef.current!.offsetHeight - 55);
  }, []);

  useEffect(() => {
    if (params.dateType === '' || params.startDate === '') return;
    if (loading) return;
    setLoading(true);
    platformApi
      .getAiToolsRankingApi(params)
      .then((res) => {
        setLoading(false);
        setData(res.items);
        document.querySelector('.ant-table-body')!.scrollTo(0, 0);
      })
      .catch(() => setLoading(false));
  }, [params]);

  const columns = useMemo(() => {
    const columns: TableProps<AiToolsRankingItemType>['columns'] = [
      {
        title: () => <p style={{ textAlign: 'center' }}>#</p>,
        render: (text, prm, ind) => {
          return (
            <div className="aiRanking-rank">
              {ind <= 2 ? (
                <div className="aiRanking-topthree">{ind + 1}</div>
              ) : (
                <span>{ind + 1}</span>
              )}
              {prm.rankChange > 0 && (
                <Tag className="aiRanking-rank-up" color="error">
                  <CaretUpOutlined />
                  {prm.rankChange}
                </Tag>
              )}
              {prm.rankChange < 0 && (
                <Tag className="aiRanking-rank-down" color="success">
                  <CaretDownOutlined />
                  {Math.abs(prm.rankChange)}
                </Tag>
              )}
            </div>
          );
        },
        width: 40,
        key: '序号',
      },
      {
        title: '产品名',
        render: (text, prm) => {
          return (
            <div className="aiRanking-productName">
              <Avatar src={prm.cover} size="large" />
              <div className="aiRanking-productName-con">
                <label style={{ marginBottom: '4px', display: 'inline-block' }}>
                  {prm.title}
                </label>
                <div
                  className="aiRanking-productName-con-des"
                  title={prm.description}
                >
                  {prm.description}
                </div>
              </div>
            </div>
          );
        },
        width: 250,
        key: 'title',
      },
      {
        title: '标签',
        render: (text, prm) => {
          return (
            <div className="aiRanking-productName">
              <div className="aiRanking-productName-con" title={prm.intro}>
                {prm.intro}
              </div>
            </div>
          );
        },
        width: 200,
        key: 'title',
      },
      {
        title: '月访问量',
        render: (text, prm) => {
          return prm.stats.viewCount;
        },
        sorter: (a, b) =>
          parseChineseNumber(b.stats.viewCount) -
          parseChineseNumber(a.stats.viewCount),
        width: 80,
        key: 'title',
      },
      {
        title: '月下载量',
        render: (text, prm) => {
          return prm.downCount;
        },
        sorter: (a, b) =>
          parseChineseNumber(b.downCount) - parseChineseNumber(a.downCount),
        width: 80,
        key: '月下载量',
      },
      {
        title: () => {
          return (
            <>
              <Tooltip title="统计AI工具排行榜的周提及作品数">
                <QuestionCircleOutlined />
              </Tooltip>
              周提及量
            </>
          );
        },
        sorter: (a, b) => b.referCount - a.referCount,
        render: (text, prm, ind) => {
          return (
            <>
              {prm.referCount}
              <Popover
                content={() => {
                  return (
                    <>
                      <div
                        className={`weekChat${ind}`}
                        style={{ width: '350px', height: '200px' }}
                      />
                    </>
                  );
                }}
                onOpenChange={() => {
                  setTimeout(() => {
                    initWeepPie(
                      document.querySelector(`.weekChat${ind}`)!,
                      Object.keys(prm.detail).map((key) => {
                        return {
                          name: key,
                          value: prm.detail[key as '抖音'],
                        };
                      }),
                    );
                  }, 10);
                }}
              >
                <SearchOutlined />
              </Popover>
            </>
          );
        },
        width: 90,
        key: 'referCount',
      },
      {
        title: () => {
          return (
            <>
              <Tooltip title="统计AI工具排行榜的提及作品、传播范围等多维度数据分析做出的综合评分">
                <QuestionCircleOutlined />
              </Tooltip>
              声望值
            </>
          );
        },
        sorter: (a, b) => b.volumeCount - a.volumeCount,
        render: (text, prm) => {
          return prm.volumeCount;
        },
        width: 80,
        key: 'volumeCount',
      },
      {
        title: () => {
          return (
            <>
              <Tooltip title="统计AI工具排行榜的用户使用情况等多维度数据分析做出的综合评分">
                <QuestionCircleOutlined />
              </Tooltip>
              综合评分
            </>
          );
        },
        sorter: (a, b) => b.exponentCount - a.exponentCount,
        render: (text, prm) => {
          return (
            <span style={{ color: 'var(--colorPrimary6)' }}>
              {prm.exponentCount}
            </span>
          );
        },
        width: 90,
        key: 'exponentCount',
      },
    ];
    return columns;
  }, []);

  return (
    <div className={styles.aiRanking}>
      <div className="aiRanking-title">
        AI工具排行榜 · {optionsTags.find((v) => v.value === params.area)?.label}{' '}
        ·{params.dateType === CycleTypeEnum.Week ? '周榜' : '月榜'}
      </div>
      <div className="aiRanking-head">
        <div className="aiRanking-head-item">
          <div className="aiRanking-head-title">类型</div>
          <RankingTags
            options={optionsTags}
            defaultValue={optionsTags[0].value}
            onChange={(val) => {
              setParams((prevState) => {
                const newState = { ...prevState };
                newState.area = val;
                return newState;
              });
            }}
          />
        </div>
        <div className="aiRanking-head-item">
          <div className="aiRanking-head-title">周期</div>
          <div className="aiRanking-head-cycleselects">
            <Cycleselects
              defaultType={CycleTypeEnum.Week}
              onChange={(v) => {
                setParams((prevState) => {
                  const newState = { ...prevState };
                  newState.dateType = v.type;
                  newState.startDate = v.value;
                  return newState;
                });
              }}
            />
          </div>
        </div>
      </div>

      <div className="aiRanking-content" ref={aiRankingContentRef}>
        <Table<AiToolsRankingItemType>
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{
            y: tableHeight,
          }}
        />
      </div>
    </div>
  );
}
