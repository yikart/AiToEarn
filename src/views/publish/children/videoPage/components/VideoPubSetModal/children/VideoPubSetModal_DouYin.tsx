import React, { ForwardedRef, forwardRef, memo } from 'react';
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/videoPubSetModal.type';
import { Radio, Select } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { VisibleTypeEnum } from '@@/publish/PublishEnum';
import TopicSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/TopicSelect';
import LocationSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/LocationSelect';
import { AccountType } from '@@/AccountEnum';
import {
  DescTextArea,
  ScheduledTimeSelect,
  TitleInput,
  VideoPubRestartLogin,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon';
import UserSelect from '../components/UserSelect';
import { DeclarationDouyin } from '../../../../../../../../electron/plat/douyin/common.douyin';
import {
  CommonActivitySelect,
  CommonHotspotSelect,
} from '../../../../../components/CommonComponents/DouyinCommonComponents';
import { ILableValue } from '../../../../../../../../electron/db/models/workData';

const HotspotSelect = ({ currChooseAccount }: IVideoPubSetModalChildProps) => {
  const { setOnePubParams } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );

  return (
    <CommonHotspotSelect
      value={
        currChooseAccount.pubParams!.diffParams![AccountType.Douyin]!.hotPoint
      }
      onChange={(newValue) => {
        const newDiffParams = currChooseAccount.pubParams.diffParams!;
        newDiffParams[AccountType.Douyin]!.hotPoint = newValue as ILableValue;
        setOnePubParams(
          {
            diffParams: newDiffParams,
          },
          currChooseAccount.id,
        );
      }}
    />
  );
};

const ActivitySelect = ({ currChooseAccount }: IVideoPubSetModalChildProps) => {
  const { setOnePubParams } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );

  return (
    <CommonActivitySelect
      account={currChooseAccount.account}
      maxCount={5 - currChooseAccount.pubParams!.topics!.length}
      value={
        currChooseAccount.pubParams!.diffParams![AccountType.Douyin]!.activitys
      }
      onChange={(newValue) => {
        const newDiffParams = currChooseAccount.pubParams.diffParams!;
        newDiffParams[AccountType.Douyin]!.activitys =
          newValue as ILableValue[];
        console.log(newValue);
        setOnePubParams(
          {
            diffParams: newDiffParams,
          },
          currChooseAccount.id,
        );
      }}
    >
      <VideoPubRestartLogin currChooseAccount={currChooseAccount} />
    </CommonActivitySelect>
  );
};

const VideoPubSetModal_DouYin = memo(
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
          <TitleInput
            placeholder="好的标题可以获得更多浏览"
            currChooseAccount={currChooseAccount}
          />

          <DescTextArea
            placeholder="添加作品简介"
            currChooseAccount={currChooseAccount}
            maxLength={1000}
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
          <ActivitySelect currChooseAccount={currChooseAccount} />

          <UserSelect
            currChooseAccount={currChooseAccount}
            maxCount={10}
            tips="您可以添加100个好友"
            title="@好友"
          />

          <LocationSelect currChooseAccount={currChooseAccount} />

          <HotspotSelect {...props} />

          <ScheduledTimeSelect currChooseAccount={currChooseAccount} />

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
VideoPubSetModal_DouYin.displayName = 'VideoPubSetModal_DouYin';

export default VideoPubSetModal_DouYin;
