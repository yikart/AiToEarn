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
import useVideoPubSetModal from './hooks/useVideoPubSetModal';

const VideoPubSetModal_KWAI = memo(
  forwardRef(
    (
      { currChooseAccount }: IVideoPubSetModalChildProps,
      ref: ForwardedRef<IVideoPubSetModalChildRef>,
    ) => {
      const { setOnePubParams } = useVideoPubSetModal(currChooseAccount);

      return (
        <>
          <DescTextArea
            placeholder="填写合适的话题和描述，作品能获得更多推荐~"
            currChooseAccount={currChooseAccount}
            maxLength={500}
          />

          <TopicSelect currChooseAccount={currChooseAccount} />

          <UserSelect
            currChooseAccount={currChooseAccount}
            maxCount={3}
            title="@好友"
            tips="您可以添加3个好友"
            showSearch={false}
          />

          <LocationSelect currChooseAccount={currChooseAccount} />

          <VideoPubPermission currChooseAccount={currChooseAccount} />

          <ScheduledTimeSelect currChooseAccount={currChooseAccount} />
        </>
      );
    },
  ),
);
VideoPubSetModal_KWAI.displayName = 'VideoPubSetModal_KWAI';

export default VideoPubSetModal_KWAI;
