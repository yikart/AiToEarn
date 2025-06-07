import React, { ForwardedRef, forwardRef, memo } from "react";
import { DescTextArea } from "../components/VideoPubSetModalCommon";
import TopicSelect from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/components/TopicSelect";
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/videoPubSetModal.type";

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

          {/*<UserSelect*/}
          {/*  maxCount={3}*/}
          {/*  title="@好友"*/}
          {/*  tips="您可以添加3个好友"*/}
          {/*  showSearch={false}*/}
          {/*/>*/}

          {/*<LocationSelect />*/}

          {/*<VideoPubPermission />*/}

          {/*<ScheduledTimeSelect />*/}
        </>
      );
    },
  ),
);
VideoPubSetModal_KWAI.displayName = "VideoPubSetModal_KWAI";

export default VideoPubSetModal_KWAI;
