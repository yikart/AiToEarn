import React, { ForwardedRef, forwardRef, memo } from 'react';
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/videoPubSetModal.type';
import TopicSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/TopicSelect';
import LocationSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/LocationSelect';
import {
  DescTextArea,
  ScheduledTimeSelect,
  TitleInput,
  VideoPubPermission,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon';
import UserSelect from '../components/UserSelect';
import useVideoPubSetModal from './hooks/useVideoPubSetModal';

const VideoPubSetModal_WxSph = memo(
  forwardRef(
    (
      { currChooseAccount }: IVideoPubSetModalChildProps,
      ref: ForwardedRef<IVideoPubSetModalChildRef>,
    ) => {
      const { setOnePubParams, platInfo } =
        useVideoPubSetModal(currChooseAccount);
      const { topicMax } = platInfo.commonPubParamsConfig;

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

          <TopicSelect currChooseAccount={currChooseAccount} />

          <UserSelect currChooseAccount={currChooseAccount} title="@用户" />

          <LocationSelect currChooseAccount={currChooseAccount} />

          <VideoPubPermission
            currChooseAccount={currChooseAccount}
            title="谁可以看"
          />
          <ScheduledTimeSelect currChooseAccount={currChooseAccount} />
        </>
      );
    },
  ),
);
VideoPubSetModal_WxSph.displayName = 'VideoPubSetModal_WxSph';

export default VideoPubSetModal_WxSph;
