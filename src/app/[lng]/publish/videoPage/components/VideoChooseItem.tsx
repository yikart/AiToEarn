import React, { ForwardedRef, forwardRef, memo, useMemo } from "react";
import { Alert, Avatar, Button, Tooltip } from "antd";
import {
  CaretRightOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  VideoCameraFilled,
  SwapOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useVideoPageStore } from "@/app/[lng]/publish/videoPage/useVideoPageStore";
import { useShallow } from "zustand/react/shallow";
import { formatSeconds } from "@/utils";
import { AccountChooseType } from "../page";
import { IVideoChooseItem } from "@/app/[lng]/publish/videoPage/videoPage.type";
import { AccountStatus } from "@/app/config/accountConfig";
import VideoChoose from "@/app/[lng]/publish/components/Choose/VideoChoose";
import { AccountPlatInfoMap } from "@/app/config/platConfig";

export interface IVideoChooseItemRef {}

export interface IVideoChooseItemProps {
  videoChooseItem: IVideoChooseItem;
  // 用户单选触发
  onAccountOneChoose: (id: string, type: AccountChooseType) => void;
}

// 选择视频完成后渲染的列表 item
const VideoChooseItem = memo(
  forwardRef(
    (
      { videoChooseItem, onAccountOneChoose }: IVideoChooseItemProps,
      ref: ForwardedRef<IVideoChooseItemRef>,
    ) => {
      // 数据是否准备完毕
      const prepareEnd = !!(videoChooseItem.video && videoChooseItem.account);
      const {
        deleteAloneVideo,
        aloneAdd,
        deleteData,
        setCurrChooseAccountId,
        setVideoPubSetModalOpen,
        setLoadingPageLoading,
        accountRestart,
      } = useVideoPageStore(
        useShallow((state) => ({
          deleteAloneVideo: state.deleteAloneVideo,
          aloneAdd: state.aloneAdd,
          deleteData: state.deleteData,
          setCurrChooseAccountId: state.setCurrChooseAccountId,
          setVideoPubSetModalOpen: state.setVideoPubSetModalOpen,
          setLoadingPageLoading: state.setLoadingPageLoading,
          accountRestart: state.accountRestart,
        })),
      );

      // 分辨率是否合规
      const isDpiCompliance = useMemo(() => {
        if (!videoChooseItem.video) return true;
        return (
          videoChooseItem.video.height < 640 ||
          videoChooseItem.video.width < 480
        );
      }, []);

      return (
        <div className="videoChooseItem">
          <div className="videoChooseItem-core">
            <div
              className="videoChooseItem-left"
              key={videoChooseItem.video?.videoUrl}
            >
              {videoChooseItem.video ? (
                <>
                  <div className="videoChooseItem-video">
                    <div
                      className="videoChooseItem-video-close"
                      onClick={() => deleteAloneVideo(videoChooseItem.id)}
                    >
                      x
                    </div>
                    <div className="videoChooseItem-video-play">
                      <img src={videoChooseItem.video.cover.imgUrl} />
                      {prepareEnd && (
                        <div
                          className="videoChooseItem-video-play-click"
                          onClick={() => {
                            setVideoPubSetModalOpen(true);
                            setCurrChooseAccountId(videoChooseItem.id);
                          }}
                        >
                          <CaretRightOutlined />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="videoChooseItem-left-info">
                    <p
                      className="videoChooseItem-left-title"
                      title={videoChooseItem.video?.filename}
                    >
                      {videoChooseItem.video?.filename}
                    </p>
                    <div className="videoChooseItem-left-bottom">
                      <div className="videoChooseItem-left-bottom-item">
                        <label>时长</label>
                        <span>
                          {formatSeconds(videoChooseItem.video.duration)}
                        </span>
                      </div>
                      <div
                        className={[
                          "videoChooseItem-left-bottom-item",
                          isDpiCompliance &&
                            "videoChooseItem-left-bottom-item--warning",
                        ].join(" ")}
                      >
                        <label>分辨率</label>
                        <span>
                          {videoChooseItem.video.width}*
                          {videoChooseItem.video.height}
                        </span>
                        {isDpiCompliance && (
                          <Tooltip title="视频清晰度过低，有概率被平台限流或不能发布，推荐您上传 460*640 分辨率以上的视频">
                            <ExclamationCircleOutlined />
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="videoChooseItem-left-chooseVideo">
                  <VideoChoose
                    onChoose={(videoFile) => {
                      setLoadingPageLoading(false);
                      aloneAdd({
                        video: videoFile,
                        id: videoChooseItem.id,
                      });
                    }}
                    onStartShoose={() => {
                      setLoadingPageLoading(true);
                    }}
                  >
                    <VideoCameraFilled />
                    <span className="videoChooseItem-left-chooseVideo-name">
                      添加视频
                    </span>
                  </VideoChoose>
                </div>
              )}
            </div>

            <div className="videoChooseItem-right">
              {videoChooseItem.account ? (
                <div className="videoChooseItem-account">
                  <div className="videoChooseItem-account-avatar">
                    <Avatar src={videoChooseItem.account.avatar} size="large" />
                    <div
                      className="videoChooseItem-account-avatar-replace"
                      onClick={() => {
                        onAccountOneChoose(
                          videoChooseItem.id,
                          AccountChooseType.Replace,
                        );
                      }}
                    >
                      <SwapOutlined />
                    </div>
                  </div>
                  <div className="videoChooseItem-account-con">
                    <div className="videoChooseItem-account-top">
                      <Tooltip title={videoChooseItem.account.nickname}>
                        <span className="videoChooseItem-account-top-name">
                          {videoChooseItem.account.nickname}
                        </span>
                      </Tooltip>
                      <img
                        src={
                          AccountPlatInfoMap.get(videoChooseItem.account.type)
                            ?.icon
                        }
                      />
                    </div>
                    {videoChooseItem.account.status ===
                      AccountStatus.DISABLE && (
                      <Alert
                        message="登录失效"
                        type="error"
                        showIcon
                        onClick={() => {
                          accountRestart(videoChooseItem.account!.type);
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="videoChooseItem-noAccount"
                  onClick={() => {
                    onAccountOneChoose(
                      videoChooseItem.id,
                      AccountChooseType.Radio,
                    );
                  }}
                >
                  <div className="videoChooseItem-noAccount-icon">
                    <PlusOutlined />
                  </div>
                  <span>添加账号</span>
                </div>
              )}
            </div>
          </div>

          <div className="videoChooseItem-options">
            <Button
              color="primary"
              type="text"
              size="small"
              icon={<EditOutlined />}
              disabled={!prepareEnd}
              onClick={() => {
                setVideoPubSetModalOpen(true);
                setCurrChooseAccountId(videoChooseItem.id);
              }}
            >
              发布设置
            </Button>
            <Button
              onClick={() => {
                deleteData(videoChooseItem.id);
              }}
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </div>
        </div>
      );
    },
  ),
);
VideoChooseItem.displayName = "VideoChooseItem";

export default VideoChooseItem;
