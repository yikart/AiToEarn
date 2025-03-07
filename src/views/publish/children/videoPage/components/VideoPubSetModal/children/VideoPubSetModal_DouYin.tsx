import React, {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/videoPubSetModal.type';
import { Button, Input, Modal, Radio, Select, Spin } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { DouyinDeclareEnum, VisibleTypeEnum } from '@@/publish/PublishEnum';
import TopicSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/TopicSelect';
import LocationSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/LocationSelect';
import { AccountType } from '@@/AccountEnum';
import useDebounceFetcher from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/useDebounceFetcher';
import {
  getDouyinActivityDetails,
  icpGetActivityTags,
  icpGetDouyinActivity,
  icpGetDoytinHot,
  icpGetDoytinHotAll,
} from '@/icp/publish';
import {
  ScheduledTimeSelect,
  VideoPubRestartLogin,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon';
import {
  DouyinActivity,
  DouyinActivityDetailResponse,
  DouyinHotSentence,
  DouyinQueryTags,
} from '../../../../../../../../electron/plat/douyin/douyin.type';
import styles from '../components/videoPubSetModalCommon.module.scss';
import { describeNumber } from '@/utils';
import { onAccountLoginFinish } from '@/icp/receiveMsg';
import UserSelect from '../components/UserSelect';

const { TextArea } = Input;

const HotspotSelect = ({ currChooseAccount }: IVideoPubSetModalChildProps) => {
  const { setOnePubParams } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );
  const [doytinHotAll, setDoytinHotAll] = useState<DouyinHotSentence[]>([]);
  const [keywords, setKeywords] = useState('');

  const { fetching, options, debounceFetcher } =
    useDebounceFetcher<DouyinHotSentence>(async (keywords) => {
      setKeywords(keywords);
      const res = await icpGetDoytinHot(
        currChooseAccount.account!,
        keywords || '',
      );
      return res.sentences;
    });

  useEffect(() => {
    icpGetDoytinHotAll().then((res) => {
      setDoytinHotAll(res.all_sentences);
    });
  }, []);

  return (
    <>
      <h1>申请关联热点</h1>
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
                <img src={data.word_cover.url_list[0]} />
                <span>{data.word}</span>
              </div>
              <div className="hotspotSelect-right">
                {describeNumber(data.hot_value)}在看
              </div>
            </div>
          );
        }}
        value={
          currChooseAccount.pubParams!.diffParams![AccountType.Douyin]!.hotPoint
        }
        onChange={(newValue) => {
          const newDiffParams = currChooseAccount.pubParams.diffParams!;
          newDiffParams[AccountType.Douyin]!.hotPoint = newValue;
          setOnePubParams(
            {
              diffParams: newDiffParams,
            },
            currChooseAccount.id,
          );
        }}
      />
      <VideoPubRestartLogin currChooseAccount={currChooseAccount} />
    </>
  );
};

const ActivitySelect = ({ currChooseAccount }: IVideoPubSetModalChildProps) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<DouyinActivity[]>([]);
  const { setOnePubParams } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );
  // 活动标签数据
  const activityTagsMap = useRef<Map<number, DouyinQueryTags>>(new Map());
  const [activityDetails, setActivityDetails] =
    useState<DouyinActivityDetailResponse>();

  const init = () => {
    icpGetDouyinActivity(currChooseAccount.account!).then((res) => {
      setOptions(res.activity_list);
    });
    icpGetActivityTags(currChooseAccount.account!).then((res) => {
      res.data?.query_tags?.map((v) => {
        activityTagsMap.current.set(v.id, v);
      });
    });
  };

  useEffect(() => {
    init();

    return onAccountLoginFinish(() => {
      init();
    });
  }, []);

  return (
    <>
      <Modal
        open={open}
        title="活动详情"
        footer={null}
        onCancel={() => setOpen(false)}
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
                {activityDetails?.topics.map((v) => {
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

      <h1>活动奖励</h1>
      <Select
        showSearch={false}
        allowClear
        style={{ width: '100%' }}
        placeholder="点击选择活动奖励"
        labelInValue
        mode="multiple"
        filterOption={false}
        maxCount={5 - currChooseAccount.pubParams!.topics!.length}
        optionRender={({ data }) => {
          return (
            <div className={styles.activitySelect}>
              <div className="activitySelect-left">
                <div className="activitySelect-left-img">
                  <img src={data.cover_image} />
                </div>
                <ul>
                  <li>{data.label}</li>
                  <li>热度：{data.hot_score}</li>
                </ul>
              </div>
              <div className="activitySelect-right">
                <div className="activitySelect-right-top">
                  {activityTagsMap.current.get(data.query_tag)?.name}
                </div>
                <div className="activitySelect-right-bottom">
                  <span>时间：02.27~03.31</span>
                  <Button
                    type="link"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setOpen(true);
                      setLoading(true);
                      setActivityDetails(undefined);
                      const res = await getDouyinActivityDetails(
                        currChooseAccount.account!,
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
        }}
        options={options?.map((v) => {
          return {
            ...v,
            label: v.activity_name,
            value: v.activity_id,
          };
        })}
        value={
          currChooseAccount.pubParams!.diffParams![AccountType.Douyin]!
            .activitys
        }
        onChange={(newValue) => {
          const newDiffParams = currChooseAccount.pubParams.diffParams!;
          newDiffParams[AccountType.Douyin]!.activitys = newValue;
          setOnePubParams(
            {
              diffParams: newDiffParams,
            },
            currChooseAccount.id,
          );
        }}
      />
      <VideoPubRestartLogin currChooseAccount={currChooseAccount} />
    </>
  );
};

const VideoPubSetModal_KWAI = memo(
  forwardRef(
    (
      props: IVideoPubSetModalChildProps,
      ref: ForwardedRef<IVideoPubSetModalChildRef>,
    ) => {
      const { setOnePubParams } = useVideoPageStore(
        useShallow((state) => ({
          setOnePubParams: state.setOnePubParams,
          videoListChoose: state.videoListChoose,
        })),
      );
      const { currChooseAccount } = props;

      return (
        <>
          <h1>标题</h1>
          <Input
            value={currChooseAccount.pubParams.title}
            showCount
            maxLength={30}
            placeholder="好的标题可以获得更多浏览"
            variant="filled"
            onChange={(e) => {
              setOnePubParams(
                {
                  title: e.target.value,
                },
                currChooseAccount.id,
              );
            }}
          />

          <h1>描述</h1>
          <TextArea
            value={currChooseAccount?.pubParams.describe}
            placeholder="添加作品简介"
            variant="filled"
            showCount
            maxLength={1000}
            onChange={(e) => {
              setOnePubParams(
                {
                  describe: e.target.value,
                },
                currChooseAccount!.id,
              );
            }}
          />

          <TopicSelect
            maxCount={
              5 -
              currChooseAccount.pubParams!.diffParams![AccountType.Douyin]!
                .activitys!.length
            }
            currChooseAccount={currChooseAccount}
            tips="最多可添加5个话题（包含活动奖励）"
          />

          <UserSelect
            currChooseAccount={currChooseAccount}
            maxCount={10}
            tips="您可以添加100个好友"
            title="@好友"
          />

          <ActivitySelect currChooseAccount={currChooseAccount} />

          <LocationSelect currChooseAccount={currChooseAccount} />

          <HotspotSelect {...props} />

          <ScheduledTimeSelect
            currChooseAccount={currChooseAccount}
            tips="支持2小时后及14天内的定时发布"
            timeOffset={120}
          />

          <h1>自主声明</h1>
          <Select
            allowClear
            value={
              currChooseAccount?.pubParams.diffParams![AccountType.Douyin]!
                .selfDeclare
            }
            style={{ width: '100%' }}
            placeholder="选择声明"
            labelInValue
            filterOption={false}
            options={[
              {
                label: '内容自行拍摄',
                value: DouyinDeclareEnum.Self,
              },
              {
                label: '内容取材网络',
                value: DouyinDeclareEnum.Network,
              },
              {
                label: '内容由AI生成',
                value: DouyinDeclareEnum.AI,
              },
              {
                label: '可能引人不适',
                value: DouyinDeclareEnum.Uncomfortable,
              },
              {
                label: '虚构演绎，仅供娱乐',
                value: DouyinDeclareEnum.Fiction,
              },
              {
                label: '危险行为，请勿模仿',
                value: DouyinDeclareEnum.Danger,
              },
            ]}
            onChange={(newValue: any) => {
              const newDiffParams = currChooseAccount.pubParams.diffParams!;
              newDiffParams[AccountType.Douyin]!.selfDeclare = newValue?.value;
              setOnePubParams(
                {
                  diffParams: newDiffParams,
                },
                currChooseAccount.id,
              );
            }}
          />

          <h1>谁可以看</h1>
          <Radio.Group
            options={[
              {
                label: '公开（所有人可见）',
                value: VisibleTypeEnum.Public,
              },
              { label: '好友可见', value: VisibleTypeEnum.Friend },
              {
                label: '私密（仅自己可见）',
                value: VisibleTypeEnum.Private,
              },
            ]}
            onChange={(e) => {
              setOnePubParams(
                {
                  visibleType: e.target.value,
                },
                currChooseAccount!.id,
              );
            }}
            value={currChooseAccount?.pubParams.visibleType}
          />
        </>
      );
    },
  ),
);
VideoPubSetModal_KWAI.displayName = 'VideoPubSetModal_KWAI';

export default VideoPubSetModal_KWAI;
