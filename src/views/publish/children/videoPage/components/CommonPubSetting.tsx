import { ForwardedRef, forwardRef, memo, useState } from 'react';
import VideoCoverSeting from '@/views/publish/children/videoPage/components/VideoCoverSeting';
import { Input, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { IImgFile } from '@/components/Choose/ImgChoose';

const { TextArea } = Input;

export interface ICommonPubSettingRef {}

export interface ICommonPubSettingProps {}

// 通用参数设置组件
const CommonPubSetting = memo(
  forwardRef(
    ({}: ICommonPubSettingProps, ref: ForwardedRef<ICommonPubSettingRef>) => {
      const { setPubParams, videoListChoose, setVideoCoverFirst } =
        useVideoPageStore(
          useShallow((state) => ({
            setPubParams: state.setPubParams,
            videoListChoose: state.videoListChoose,
            setVideoCoverFirst: state.setVideoCoverFirst,
          })),
        );
      // 当前选择的通用封面
      const [cover, setCover] = useState<IImgFile>();

      return (
        <div className="commonPubSetting">
          <h1>通用发布设置</h1>
          <p className="commonPubSetting-tip">
            通用设置中的参数将会应用于所有账号
          </p>
          <h2>通用封面</h2>
          <VideoCoverSeting
            videoFile={videoListChoose.find((v) => v.video)?.video}
            value={cover}
            saveImgId="common"
            onClose={() => {
              setCover(undefined);
              setPubParams({
                cover: undefined,
              });
              setVideoCoverFirst(true);
            }}
            onChoosed={(imgFile) => {
              setCover(imgFile);
              setPubParams({
                cover: imgFile,
              });
            }}
          />
          <p className="commonPubSetting-tip">
            支持常用图片格式上传，暂不支持 GIF，上传后图片将按平台要求自动裁剪
          </p>
          <h2>
            标题
            <Tooltip title="更多详情中单独设置的话题和描述中带的话题都是有效的，发布时将合并去重处理">
              <ExclamationCircleOutlined />
            </Tooltip>
          </h2>
          <Input
            showCount
            maxLength={30}
            placeholder="请输入视频标题"
            variant="filled"
            onChange={(e) => {
              setPubParams({
                title: e.target.value,
              });
            }}
          />
          <h2>描述</h2>
          <TextArea
            placeholder="请输入视频描述"
            variant="filled"
            showCount
            maxLength={500}
            style={{ height: 200, resize: 'none' }}
            onChange={(e) => {
              setPubParams({
                describe: e.target.value,
              });
            }}
          />
          <p className="commonPubSetting-tip">
            描述中可带话题，以‘#’开头、‘空格’结尾，
            <Tooltip title="更多详情中单独设置的话题和描述中带的话题都是有效的，发布时将合并去重处理">
              <span style={{ color: 'rgb(250, 173, 20)' }}>
                <ExclamationCircleOutlined style={{ marginRight: '3px' }} />
                发布时
              </span>
            </Tooltip>
            将根据平台自动处理 如：这是一段文字描述#最美中国 #夏日穿搭
          </p>
        </div>
      );
    },
  ),
);
CommonPubSetting.displayName = 'CommonPubSetting';

export default CommonPubSetting;
