import React, {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useState,
} from 'react';
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/videoPubSetModal.type';
import { Input, Radio, Select, Spin } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { DouyinDeclareEnum, VisibleTypeEnum } from '@@/publish/PublishEnum';
import TopicSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/TopicSelect';
import LocationSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/LocationSelect';
import { AccountType } from '@@/AccountEnum';
import useDebounceFetcher from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/useDebounceFetcher';
import { icpGetDoytinHot, icpGetDoytinHotAll } from '@/icp/publish';
import { VideoPubRestartLogin } from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon';
import { DouyinHotSentence } from '../../../../../../../../electron/plat/douyin/douyin.type';
import styles from '../components/videoPubSetModalCommon.module.scss';
import { describeNumber } from '@/utils';

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
            maxCount={5}
            currChooseAccount={currChooseAccount}
            tips="最多可添加5个话题（包含活动奖励）"
          />

          <LocationSelect currChooseAccount={currChooseAccount} />

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

          <HotspotSelect {...props} />

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
        </>
      );
    },
  ),
);
VideoPubSetModal_KWAI.displayName = 'VideoPubSetModal_KWAI';

export default VideoPubSetModal_KWAI;
