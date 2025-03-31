import {
  ForwardedRef,
  forwardRef,
  memo,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Avatar, Segmented } from 'antd';
import { HeartFilled } from '@ant-design/icons';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';

export interface IVideoPubSetModalVideoRef {
  play: () => void;
  pause: () => void;
}

export interface IVideoPubSetModalVideoProps {}

const CoverPreview = ({
  avatar,
  nickname,
  height,
  coverUrl,
}: {
  avatar?: string;
  nickname?: string;
  height?: number;
  coverUrl?: string;
}) => {
  return (
    <div className="videoPubSetModalVideo-coverPreview-box">
      <div
        className="videoPubSetModalVideo-coverPreview-box-img"
        style={{ height: `${height || 100}px` }}
      >
        {coverUrl && <img src={coverUrl} />}
      </div>
      <div className="videoPubSetModalVideo-coverPreview-box-bottom">
        <p>***********</p>
        <ul className="videoPubSetModalVideo-coverPreview-box-info">
          <li>
            <Avatar size="small" src={avatar} />
            <span>{nickname}</span>
          </li>
          <li>
            <HeartFilled />
            <span>1</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

const VideoPubSetModalVideo = memo(
  forwardRef(
    (
      {}: IVideoPubSetModalVideoProps,
      ref: ForwardedRef<IVideoPubSetModalVideoRef>,
    ) => {
      const videoRef = useRef<HTMLVideoElement>(null);
      const [active, setActive] = useState(1);
      const { chooseAccountItem } = useVideoPageStore(
        useShallow((state) => ({
          chooseAccountItem: state.currChooseAccount!,
        })),
      );
      const imperativeMethods: IVideoPubSetModalVideoRef = {
        play: () => {
          videoRef.current?.play();
        },
        pause: () => {
          videoRef.current?.pause();
        },
      };
      useImperativeHandle(ref, () => imperativeMethods, []);

      return (
        <div className="videoPubSetModalVideo">
          <Segmented
            value={active}
            options={[
              { label: '预览视频', value: 1 },
              { label: '预览封面/标题', value: 2 },
            ]}
            defaultValue={1}
            onChange={setActive}
          />

          <div className="videoPubSetModalVideo-video">
            <div
              className="videoPubSetModalVideo-video-wrapper"
              style={
                active !== 1
                  ? {
                      justifyContent: 'left',
                    }
                  : {}
              }
            >
              {active === 1 ? (
                <>
                  <div className="videoPubSetModalVideo-video-top" />
                  <video
                    ref={videoRef}
                    src={chooseAccountItem?.video?.videoUrl}
                    controls
                  />
                </>
              ) : (
                chooseAccountItem.account && (
                  <div className="videoPubSetModalVideo-coverPreview">
                    <div className="videoPubSetModalVideo-coverPreview-con">
                      <CoverPreview height={150} />
                      <CoverPreview
                        height={150}
                        avatar={chooseAccountItem.account.avatar}
                        nickname={chooseAccountItem.account.nickname}
                        coverUrl={chooseAccountItem.pubParams.cover?.imgUrl}
                      />
                      <CoverPreview />
                    </div>
                    <div className="videoPubSetModalVideo-coverPreview-con">
                      <CoverPreview height={120} />
                      <CoverPreview height={110} />
                      <CoverPreview height={120} />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      );
    },
  ),
);
VideoPubSetModalVideo.displayName = 'VideoPubSetModalVideo';

export default VideoPubSetModalVideo;
