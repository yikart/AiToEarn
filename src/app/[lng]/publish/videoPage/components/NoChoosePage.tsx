import { ForwardedRef, forwardRef, memo } from "react";
import { useVideoPageStore } from "@/app/[lng]/publish/videoPage/useVideoPageStore";
import { useShallow } from "zustand/react/shallow";
import localUpload from "../images/localUpload.png";
import VideoChoose from "@/app/[lng]/publish/components/Choose/VideoChoose";
import { ChooseChunk } from "@/app/[lng]/publish/components/CommonComponents/CommonComponents";
import { PubType } from "@/app/config/publishConfig";
import SupportPlat from "@/app/[lng]/publish/components/SupportPlat/SupportPlat";

export interface INoChoosePageRef {}

export interface INoChoosePageProps {}

// 未选择视频时暂时的组件
const NoChoosePage = memo(
  forwardRef(({}: INoChoosePageProps, ref: ForwardedRef<INoChoosePageRef>) => {
    const { addVideos, setLoadingPageLoading, setOperateId } =
      useVideoPageStore(
        useShallow((state) => ({
          addVideos: state.addVideos,
          setLoadingPageLoading: state.setLoadingPageLoading,
          setOperateId: state.setOperateId,
        })),
      );

    return (
      <div className="video-pubBefore">
        <h1>视频发布</h1>
        <p className="video-pubBefore-tip">
          支持多视频、多平台、多账号同时发布
        </p>

        <div className="video-pubBefore-con">
          <VideoChoose
            onMultipleChoose={(videoFiles) => {
              setOperateId();
              addVideos(videoFiles);
            }}
            onStartShoose={() => {
              setLoadingPageLoading(true);
            }}
            onChooseFail={() => {
              setLoadingPageLoading(false);
            }}
          >
            <ChooseChunk
              text="本地上传"
              imgUrl={localUpload.src}
              color="linear-gradient(to right, rgb(255, 142, 28), rgb(255, 124, 24))"
              hoverColor="rgb(255, 142, 28)"
              style={{ marginRight: "15px" }}
            />
          </VideoChoose>
        </div>

        <SupportPlat pubType={PubType.VIDEO} style={{ marginTop: "15px" }} />
      </div>
    );
  }),
);
NoChoosePage.displayName = "NoChoosePage";

export default NoChoosePage;
