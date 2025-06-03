import React, { ForwardedRef, forwardRef, memo } from "react";
import UserSelect from "../components/UserSelect";
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/videoPubSetModal.type";
import {
  DescTextArea,
  ScheduledTimeSelect,
  TitleInput,
  VideoPubPermission,
} from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon";
import LocationSelect from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/components/LocationSelect";
import TopicSelect from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/components/TopicSelect";

const VideoPubSetModal_XSH = memo(
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
VideoPubSetModal_XSH.displayName = "VideoPubSetModal_XSH";

export default VideoPubSetModal_XSH;
