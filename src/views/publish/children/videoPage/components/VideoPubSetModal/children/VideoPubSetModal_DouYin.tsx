import React, { ForwardedRef, forwardRef, memo } from 'react';
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/videoPubSetModal.type';
import { Select } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import TopicSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/TopicSelect';
import LocationSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/LocationSelect';
import { PlatType } from '@@/AccountEnum';
import {
  DescTextArea,
  ScheduledTimeSelect,
  TitleInput,
  VideoPubMixSelect,
  VideoPubPermission,
  VideoPubRestartLogin,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon';
import UserSelect from '../components/UserSelect';
import {
  CommonActivitySelect,
  CommonHotspotSelect,
} from '../../../../../components/CommonComponents/DouyinCommonComponents';
import { ILableValue } from '../../../../../../../../electron/db/models/workData';
import useVideoPubSetModal from './hooks/useVideoPubSetModal';
import { DeclarationDouyin } from '../../../../../../../../commont/plat/douyin/common.douyin';

const HotspotSelect = ({}: IVideoPubSetModalChildProps) => {
  const { setOnePubParams, currChooseAccount } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      currChooseAccount: state.currChooseAccount!,
    })),
  );

  return (
    <CommonHotspotSelect
      account={currChooseAccount.account}
      value={
        currChooseAccount.pubParams!.diffParams![PlatType.Douyin]!.hotPoint
      }
      onChange={(newValue) => {
        const newDiffParams = currChooseAccount.pubParams.diffParams!;
        newDiffParams[PlatType.Douyin]!.hotPoint = newValue as ILableValue;
        setOnePubParams({
          diffParams: newDiffParams,
        });
      }}
    />
  );
};

const ActivitySelect = ({}: IVideoPubSetModalChildProps) => {
  const { setOnePubParams, platInfo, currChooseAccount } =
    useVideoPubSetModal();
  const { topicMax } = platInfo.commonPubParamsConfig;

  return (
    <CommonActivitySelect
      account={currChooseAccount.account}
      maxCount={topicMax - currChooseAccount.pubParams!.topics!.length}
      value={
        currChooseAccount.pubParams!.diffParams![PlatType.Douyin]!.activitys
      }
      onChange={(newValue) => {
        const newDiffParams = currChooseAccount.pubParams.diffParams!;
        newDiffParams[PlatType.Douyin]!.activitys =
          newValue as ILableValue[];
        setOnePubParams({
          diffParams: newDiffParams,
        });
      }}
    >
      <VideoPubRestartLogin />
    </CommonActivitySelect>
  );
};

const VideoPubSetModal_DouYin = memo(
  forwardRef(
    (
      props: IVideoPubSetModalChildProps,
      ref: ForwardedRef<IVideoPubSetModalChildRef>,
    ) => {
      const { setOnePubParams, platInfo, currChooseAccount } =
        useVideoPubSetModal();
      const { topicMax } = platInfo.commonPubParamsConfig;

      return (
        <>
          <TitleInput placeholder="好的标题可以获得更多浏览" />

          <DescTextArea placeholder="添加作品简介" maxLength={1000} />

          <TopicSelect
            maxCount={
              topicMax -
              currChooseAccount.pubParams!.diffParams![PlatType.Douyin]!
                .activitys!.length
            }
            tips={`最多可添加${topicMax}个话题（包含活动奖励）`}
          />
          <ActivitySelect />

          <UserSelect maxCount={100} tips="您可以添加100个好友" title="@好友" />

          <HotspotSelect {...props} />

          <LocationSelect />

          <ScheduledTimeSelect />

          <VideoPubMixSelect />

          <h1>自主声明</h1>
          <Select
            allowClear
            value={
              currChooseAccount?.pubParams.diffParams![PlatType.Douyin]!
                .selfDeclare
            }
            style={{ width: '100%' }}
            placeholder="选择声明"
            labelInValue
            filterOption={false}
            options={[
              {
                label: '内容自行拍摄',
                value: DeclarationDouyin.SelfShoot,
              },
              {
                label: '内容取材网络',
                value: DeclarationDouyin.FromNetV3,
              },
              {
                label: '内容由AI生成',
                value: DeclarationDouyin.AIGC,
              },
              {
                label: '可能引人不适',
                value: DeclarationDouyin.MaybeUnsuitable,
              },
              {
                label: '虚构演绎，仅供娱乐',
                value: DeclarationDouyin.OnlyFunNew,
              },
              {
                label: '危险行为，请勿模仿',
                value: DeclarationDouyin.DangerousBehavior,
              },
            ]}
            onChange={(newValue: any) => {
              const newDiffParams = currChooseAccount.pubParams.diffParams!;
              newDiffParams[PlatType.Douyin]!.selfDeclare = newValue?.value;
              setOnePubParams({
                diffParams: newDiffParams,
              });
            }}
          />

          <VideoPubPermission title="谁可以看" />
        </>
      );
    },
  ),
);
VideoPubSetModal_DouYin.displayName = 'VideoPubSetModal_DouYin';

export default VideoPubSetModal_DouYin;
