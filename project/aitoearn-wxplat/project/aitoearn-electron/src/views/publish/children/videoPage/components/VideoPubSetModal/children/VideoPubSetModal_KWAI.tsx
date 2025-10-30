import React, { ForwardedRef, forwardRef, memo } from 'react';
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/videoPubSetModal.type';
import TopicSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/TopicSelect';
import LocationSelect from '../components/LocationSelect';
import UserSelect from '../components/UserSelect';
import {
  DescTextArea,
  ScheduledTimeSelect,
  VideoPubPermission,
} from '../components/VideoPubSetModalCommon';

const VideoPubSetModal_KWAI = memo(
  forwardRef(
    (
      {}: IVideoPubSetModalChildProps,
      ref: ForwardedRef<IVideoPubSetModalChildRef>,
    ) => {
      return (
        <>
          <DescTextArea
            placeholder="填写合适的话题和描述，作品能获得更多推荐~"
            maxLength={500}
          />

          <TopicSelect />

          <UserSelect
            maxCount={3}
            title="@好友"
            tips="您可以添加3个好友"
            showSearch={false}
          />

          <LocationSelect />

          <VideoPubPermission />

          <ScheduledTimeSelect />
        </>
      );
    },
  ),
);
VideoPubSetModal_KWAI.displayName = 'VideoPubSetModal_KWAI';

export default VideoPubSetModal_KWAI;
