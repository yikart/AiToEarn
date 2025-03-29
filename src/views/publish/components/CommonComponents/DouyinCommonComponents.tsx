import React, { useEffect, useRef, useState } from 'react';
import {
  DouyinActivity,
  DouyinActivityDetailResponse,
  DouyinHotSentence,
  DouyinQueryTags,
} from '../../../../../electron/plat/douyin/douyin.type';
import useDebounceFetcher from '../../children/videoPage/components/VideoPubSetModal/components/useDebounceFetcher';
import {
  getDouyinActivityDetails,
  icpGetActivityTags,
  icpGetDouyinActivity,
  icpGetDoytinHot,
  icpGetDoytinHotAll,
} from '../../../../icp/publish';
import {
  Button,
  Checkbox,
  message,
  Modal,
  Select,
  SelectProps,
  Spin,
  Tabs,
  Tooltip,
} from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import styles from './commonComponents.module.scss';
import { describeNumber } from '../../../../utils';
import { onAccountLoginFinish } from '../../../../icp/receiveMsg';
import { AccountInfo, AccountPlatInfoMap } from '../../../account/comment';
import { ILableValue } from '../../../../../electron/db/models/video';
import { AccountType } from '../../../../../commont/AccountEnum';

interface DouyinCommonComponentsProps
  extends Omit<SelectProps<ILableValue[]>, 'options' | 'children'> {
  account?: AccountInfo;
  children?: React.ReactNode;
}

interface DouyinCommonComponentsHotProps
  extends Omit<SelectProps<ILableValue>, 'options' | 'children'> {
  account?: AccountInfo;
  children?: React.ReactNode;
}

// 抖音热点
export const CommonHotspotSelect = ({
  account,
  children,
  ...props
}: DouyinCommonComponentsHotProps) => {
  if (!account) return '';

  const [doytinHotAll, setDoytinHotAll] = useState<DouyinHotSentence[]>([]);
  const [keywords, setKeywords] = useState('');

  const { fetching, options, debounceFetcher } =
    useDebounceFetcher<DouyinHotSentence>(async (keywords) => {
      setKeywords(keywords);
      const res = await icpGetDoytinHot(account, keywords || '');
      return res.sentences;
    });

  useEffect(() => {
    icpGetDoytinHotAll().then((res) => {
      setDoytinHotAll(res.all_sentences);
    });
  }, []);

  return (
    <>
      <h1>
        申请关联热点
        <Tooltip title="你可以申请和一个热点做关联，如果视频确实和热点非常相关，将会进入抖音热点榜，若不相关则不会生效。">
          <QuestionCircleOutlined style={{ marginLeft: '2px' }} />
        </Tooltip>
      </h1>
      <Select
        showSearch
        allowClear
        style={{ width: '100%' }}
        placeholder="输入热点词搜索"
        labelInValue
        filterOption={false}
        onSearch={debounceFetcher}
        notFoundContent={fetching ? <Spin size="small" /> : null}
        options={(!keywords ? doytinHotAll : options).map((v) => {
          return {
            ...v,
            label: v.word,
            value: v.sentence_id,
          };
        })}
        optionRender={({ data }) => {
          return (
            <div className={styles.hotspotSelect}>
              <div className="hotspotSelect-left">
                <img src={data.word_cover?.url_list[0]} />
                <span>{data.word}</span>
              </div>
              <div className="hotspotSelect-right">
                {describeNumber(data.hot_value)}在看
              </div>
            </div>
          );
        }}
        {...props}
      />
      {children}
    </>
  );
};

// 抖音活动
export const CommonActivitySelect = ({
  account,
  children,
  ...props
}: DouyinCommonComponentsProps) => {
  if (!account) return '';
  const [loading, setLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [options, setOptions] = useState<DouyinActivity[]>([]);
  const activityTagsMap = useRef<Map<number, DouyinQueryTags>>(new Map());
  // 活动标签数据
  const [activityTagList, setActivityTagList] = useState<DouyinQueryTags[]>([]);
  const [activityDetails, setActivityDetails] =
    useState<DouyinActivityDetailResponse>();
  const [activityTag, setActivityTag] = useState<string>('');
  const [value, setValue] = useState<ILableValue[]>([]);

  const init = () => {
    icpGetDouyinActivity(account).then((res) => {
      setOptions(res.activity_list || []);
    });
    icpGetActivityTags(account).then((res) => {
      if (!res.data.query_tags) return;
      res.data?.query_tags?.map((v) => {
        activityTagsMap.current.set(v.id, v);
      });
      setActivityTagList(res.data.query_tags || []);
      setActivityTag(`${res.data.query_tags[0]?.id}`);
    });
  };

  useEffect(() => {
    init();

    return onAccountLoginFinish(() => {
      init();
    });
  }, []);

  const selection = (data: DouyinActivity) => {
    if (value?.some((v) => v.value === data.activity_id)) {
      setValue(value?.filter((v) => v.value !== data.activity_id));
    } else {
      setValue([
        ...(value || []),
        {
          label: data.activity_name,
          value: data.activity_id,
        },
      ]);
    }
  };

  useEffect(() => {
    setValue(props.value || []);
  }, [props.value]);

  const closeSelectActivity = () => {
    setActivityOpen(false);
    setValue(props.value || []);
  };

  return (
    <>
      <Modal
        open={detailsOpen}
        title="活动详情"
        footer={null}
        onCancel={() => setDetailsOpen(false)}
      >
        <Spin spinning={loading}>
          <div className={styles.activityDetails}>
            <div className="activityDetails-top">
              <div className="activityDetails-top-left">
                <div className="activityDetails-top-left-img">
                  <img src={activityDetails?.activity_info.cover_image} />
                </div>
                <ul>
                  <li className="activityDetails-top-left-title">
                    {activityDetails?.activity_info.activity_name}
                  </li>
                  <li className="activityDetails-top-left-hot">
                    活动热度：{activityDetails?.activity_info.hot_score}
                  </li>
                </ul>
              </div>

              <div className="activityDetails-top-tag">
                {
                  activityTagsMap.current.get(
                    activityDetails?.activity_info.query_tag || 0,
                  )?.name
                }
              </div>
            </div>

            <div className="activityDetails-bottom">
              <h2>活动时间</h2>
              <div className="activityDetails-bottom-text">
                活动时间：{activityDetails?.publish_start_time}-
                {activityDetails?.publish_end_time}
              </div>
              <h2>活动玩法</h2>
              <div className="activityDetails-bottom-text">
                {activityDetails?.activity_description}
              </div>
              <h2>关联话题</h2>
              <ul className="activityDetails-bottom-text">
                {activityDetails?.topics?.map((v) => {
                  return <li key={v}>#{v}</li>;
                })}
              </ul>
              <h2>流量奖励</h2>
              <div className="activityDetails-bottom-text">
                {activityDetails?.reward_rules
                  ? JSON.parse(activityDetails?.reward_rules).text
                  : ''}
              </div>
            </div>
          </div>
        </Spin>
      </Modal>

      <Modal
        title="选择活动"
        width={700}
        open={activityOpen}
        onCancel={closeSelectActivity}
        onOk={() => {
          if (value.length > props.maxCount!) {
            message.warning(
              `话题和活动最多可添加 ${AccountPlatInfoMap.get(AccountType.Douyin)?.commonPubParamsConfig.topicMax} 个`,
            );
          } else {
            setActivityOpen(false);
            if (props.onChange) props.onChange(value);
          }
        }}
      >
        <Tabs
          activeKey={activityTag}
          onChange={setActivityTag}
          type="card"
          items={activityTagList?.map((v) => {
            return {
              key: `${v.id}`,
              label: v.name,
            };
          })}
        />
        {options
          ?.filter((v) => v.query_tag === +activityTag)
          .map((data) => {
            return (
              <div
                className={styles.activitySelect}
                onClick={() => {
                  selection(data);
                }}
                key={data.activity_id}
              >
                <div className="activitySelect-left">
                  <Checkbox
                    checked={value?.some((v) => v.value === data.activity_id)}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onChange={(e) => {
                      selection(data);
                    }}
                  />
                  <div className="activitySelect-left-img">
                    <img src={data.cover_image} />
                  </div>
                  <ul>
                    <li>{data.activity_name}</li>
                    <li>热度：{data.hot_score}</li>
                  </ul>
                </div>
                <div className="activitySelect-right">
                  <div className="activitySelect-right-top">
                    {activityTagsMap.current?.get(data.query_tag)?.name}
                  </div>
                  <div className="activitySelect-right-bottom">
                    <span>时间：02.27~03.31</span>
                    <Button
                      type="link"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setDetailsOpen(true);
                        setLoading(true);
                        setActivityDetails(undefined);
                        const res = await getDouyinActivityDetails(
                          account,
                          data.activity_id,
                        );
                        setLoading(false);
                        setActivityDetails(res);
                      }}
                    >
                      活动详情
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
      </Modal>

      <h1>
        活动奖励
        <Tooltip title="添加活动将有机会获得流量奖励">
          <QuestionCircleOutlined style={{ marginLeft: '2px' }} />
        </Tooltip>
      </h1>
      <Select
        showSearch={false}
        allowClear
        style={{ width: '100%' }}
        placeholder="点击选择活动奖励"
        labelInValue
        mode="multiple"
        filterOption={false}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setActivityOpen(true);
        }}
        dropdownRender={() => {
          const customDropdownRef = useRef<HTMLDivElement>(null);
          if (customDropdownRef.current) {
            (
              customDropdownRef.current.parentNode!.parentNode as HTMLDivElement
            ).style.display = 'none';
          }
          return <div ref={customDropdownRef} />;
        }}
        options={options?.map((v) => {
          return {
            ...v,
            label: v.activity_name,
            value: v.activity_id,
          };
        })}
        onDropdownVisibleChange={() => {
          if (options?.length === 0 && account?.status === 0) {
            init();
          }
        }}
        {...props}
      />
      <p className={styles.tips}>活动奖励 + 话题 最多不能超过五个。</p>
      {children}
    </>
  );
};
