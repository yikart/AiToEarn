import React, { ForwardedRef, forwardRef, memo } from 'react';
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/videoPubSetModal.type';
import { Radio } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { VisibleTypeEnum } from '@@/publish/PublishEnum';
import TopicSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/TopicSelect';
import LocationSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/LocationSelect';
import {
  DescTextArea,
  ScheduledTimeSelect,
  TitleInput,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon';
import UserSelect from '../components/UserSelect';

const VideoPubSetModal_WxSph = memo(
  forwardRef(
    (
      { currChooseAccount }: IVideoPubSetModalChildProps,
      ref: ForwardedRef<IVideoPubSetModalChildRef>,
    ) => {
      const { setOnePubParams } = useVideoPageStore(
        useShallow((state) => ({
          setOnePubParams: state.setOnePubParams,
          videoListChoose: state.videoListChoose,
        })),
      );

      return (
        <>
          <TitleInput
            title="标题"
            placeholder="填写标题，可能会有更多赞哦"
            currChooseAccount={currChooseAccount}
          />

          <DescTextArea
            placeholder="填写更全面的描述信息，让更多人看到你吧！"
            currChooseAccount={currChooseAccount}
            maxLength={1000}
          />

          <TopicSelect
            maxCount={20}
            currChooseAccount={currChooseAccount}
            tips="您可以添加20个话题"
          />

          <UserSelect currChooseAccount={currChooseAccount} title="@用户" />

          <LocationSelect currChooseAccount={currChooseAccount} />

          <h1>权限设置</h1>
          <Radio.Group
            options={[
              {
                label: '公开（所有人可见）',
                value: VisibleTypeEnum.Public,
              },
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
          <ScheduledTimeSelect currChooseAccount={currChooseAccount} />
        </>
      );
    },
  ),
);
VideoPubSetModal_WxSph.displayName = 'VideoPubSetModal_WxSph';

export default VideoPubSetModal_WxSph;
