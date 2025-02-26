import { ForwardedRef, forwardRef, memo } from 'react';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import { Alert, Avatar, Button, Tooltip } from 'antd';
import { AccountPlatInfoMap } from '@/views/account/comment';
import {
  CaretRightOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  VideoCameraFilled,
} from '@ant-design/icons';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import VideoChoose from '@/components/Choose/VideoChoose';
import { formatSeconds } from '@/utils';
import { AccountStatus } from '../../../../../../commont/AccountEnum';

export interface IVideoChooseItemRef {}

export interface IVideoChooseItemProps {
  videoChooseItem: IVideoChooseItem;
  // 用户单选触发
  onAccountOneChoose: (id: string) => void;
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

      return (
        <div className="videoChooseItem">
          <div className="videoChooseItem-core">
            <div
              className="videoChooseItem-left"
              key={videoChooseItem.video?.videoPath}
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
                    <p className="videoChooseItem-left-title">
                      {videoChooseItem.video?.filename}
                    </p>
                    <div className="videoChooseItem-left-bottom">
                      <div className="videoChooseItem-left-bottom-item">
                        <label>时长</label>
                        <span>
                          {formatSeconds(videoChooseItem.video.duration)}
                        </span>
                      </div>
                      <div className="videoChooseItem-left-bottom-item">
                        <label>分辨率</label>
                        <span>
                          {videoChooseItem.video.width}*
                          {videoChooseItem.video.height}
                        </span>
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
                    onAccountOneChoose(videoChooseItem.id);
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
VideoChooseItem.displayName = 'VideoChooseItem';

export default VideoChooseItem;
