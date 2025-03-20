import { ForwardedRef, forwardRef, memo } from 'react';
import VideoChoose from '@/components/Choose/VideoChoose';
import SupportPlat from '../../../components/SupportPlat/SupportPlat';
import { PubType } from '../../../../../../commont/publish/PublishEnum';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import localUpload from '../images/localUpload.png';
import importRecord from '../images/importRecord.png';
import { Button } from 'antd';

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
            <img src={localUpload} />
            <Button type="primary" size="large">
              本地上传
            </Button>
          </VideoChoose>

          <div
            className="videoChoose"
            onClick={() => {
              console.log('click');
            }}
          >
            <img src={importRecord} />
            <Button type="primary" size="large">
              导入发布记录
            </Button>
          </div>
        </div>

        <SupportPlat pubType={PubType.VIDEO} type={1} />
      </div>
    );
  }),
);
NoChoosePage.displayName = 'NoChoosePage';

export default NoChoosePage;
