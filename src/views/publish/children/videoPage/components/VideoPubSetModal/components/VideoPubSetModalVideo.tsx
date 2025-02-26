import {
  ForwardedRef,
  forwardRef,
  memo,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import { Avatar, Segmented } from 'antd';
import { HeartFilled } from '@ant-design/icons';

export interface IVideoPubSetModalVideoRef {
  play: () => void;
  pause: () => void;
}

export interface IVideoPubSetModalVideoProps {
  chooseAccountItem: IVideoChooseItem;
}

const VideoPubSetModalVideo = memo(
  forwardRef(
    (
      { chooseAccountItem }: IVideoPubSetModalVideoProps,
      ref: ForwardedRef<IVideoPubSetModalVideoRef>,
    ) => {
      const videoRef = useRef<HTMLVideoElement>(null);
      const [active, setActive] = useState(1);

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
            <div className="videoPubSetModalVideo-video-wrapper">
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
                      <div className="videoPubSetModalVideo-coverPreview-box">
                        <div className="videoPubSetModalVideo-coverPreview-box-img"></div>
                        <div className="videoPubSetModalVideo-coverPreview-box-bottom">
                          <p>***********</p>
                          <ul className="videoPubSetModalVideo-coverPreview-box-info">
                            <li>
                              <Avatar
                                src={chooseAccountItem.account.avatar}
                                size="small"
                              />
                              <span>{chooseAccountItem.account.nickname}</span>
                            </li>
                            <li>
                              <span>0</span>
                              <HeartFilled />
                            </li>
                          </ul>
                        </div>
                      </div>
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
