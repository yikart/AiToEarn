import React, { ForwardedRef, forwardRef, memo, useState } from 'react';
import styles from './aICreateTitle.module.scss';
import { Button, message, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { IVideoFile } from '../../../../components/Choose/VideoChoose';
import { useShallow } from 'zustand/react/shallow';
import { useAICreateTitleStore } from './useAICreateTitle';
import { toolsApi } from '../../../../api/tools';
import { AiCreateType } from '../../../../api/types/tools';

const VITE_APP_FILE_HOST = import.meta.env.VITE_APP_FILE_HOST;

export interface IAICreateTitleRef {}

export interface IAICreateTitleProps {
  type: AiCreateType;
  // 提示信息
  tips?: string;
  // 用于生成文字的视频
  videoFile?: IVideoFile;
  onAiCreateFinish: (text: string) => void;
  // 字数限制
  max: number;
}

/**
 * AI生成标题和描述
 */
const AICreateTitle = memo(
  forwardRef(
    (
      { type, tips, videoFile, onAiCreateFinish, max }: IAICreateTitleProps,
      ref: ForwardedRef<IAICreateTitleRef>,
    ) => {
      const [loading, setLoading] = useState(false);
      const { getVideo, setVideo } = useAICreateTitleStore(
        useShallow((state) => ({
          getVideo: state.getVideo,
          setVideo: state.setVideo,
        })),
      );

      return (
        <div className={styles.aICreateTitle}>
          <Button
            loading={loading}
            type="link"
            onClick={async () => {
              if (!videoFile) return message.warning('您必须上传一个视频！');
              if (videoFile.duration > 40)
                return message.warning('视频超过40秒，不支持生成！');
              if (loading) return;
              setLoading(true);
              const videoId = videoFile.size + videoFile.filename;
              let videoOssUrl = '';
              videoOssUrl = getVideo(videoId);
              // 上传
              if (!videoOssUrl) {
                const { name } = await toolsApi.uploadFileTemp(videoFile.file);
                if (name) {
                  videoOssUrl = VITE_APP_FILE_HOST + name;
                  setVideo(videoId, videoOssUrl);
                } else {
                  setLoading(false);
                  return message.error('网络繁忙，请稍后重试！');
                }
              }
              const res = await toolsApi.apiVideoAiTitle(
                videoOssUrl,
                type,
                max,
              );
              onAiCreateFinish(res);
              setLoading(false);
            }}
          >
            {type === AiCreateType.TITLE ? 'AI生成标题' : 'AI生成描述'}
            {tips && (
              <Tooltip title={tips}>
                <ExclamationCircleOutlined />
              </Tooltip>
            )}
          </Button>
        </div>
      );
    },
  ),
);
AICreateTitle.displayName = 'AICreateTitle';

export default AICreateTitle;
