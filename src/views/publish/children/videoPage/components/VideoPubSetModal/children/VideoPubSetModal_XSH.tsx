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

const VideoPubSetModal_WxSph = memo(
  forwardRef(
    (
      {}: IVideoPubSetModalChildProps,
      ref: ForwardedRef<IVideoPubSetModalChildRef>,
    ) => {
      return (
        <>
          <TitleInput title="标题" placeholder="填写标题，可能会有更多赞哦" />

          <DescTextArea
            placeholder="填写更全面的描述信息，让更多人看到你吧！"
            maxLength={1000}
          />

          <TopicSelect />

          <UserSelect title="@用户" />

          <LocationSelect />

          <VideoPubPermission title="谁可以看" />
          <ScheduledTimeSelect />
        </>
      );
    },
  ),
);
VideoPubSetModal_WxSph.displayName = 'VideoPubSetModal_WxSph';

export default VideoPubSetModal_WxSph;
