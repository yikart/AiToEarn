import { forwardRef, memo } from 'react';
import { ImageRightSettingChildProps } from '../ImageParamsSet.type';
import {
  ImgTextDescTextArea,
  ImgTextLocationSelect,
  ImgTextScheduledTimeSelect,
  ImgTextTitleInput,
  ImgTextTopicSelect,
  ImgTextUserSelect,
} from '../ImageRightSettingCommon';

const ImageParamsSet_Douyin = memo(
  forwardRef(({}: ImageRightSettingChildProps, _) => {
    return (
      <>
        <ImgTextTitleInput placeholder="添加作品标题" />

        <ImgTextDescTextArea placeholder="添加作品简介" />

        <ImgTextTopicSelect tips="最多可添加5个话题（包含活动奖励）" />

        <ImgTextUserSelect />

        <ImgTextLocationSelect />

        <ImgTextScheduledTimeSelect />
      </>
    );
  }),
);
ImageParamsSet_Douyin.displayName = 'ImageParamsSet_Douyin';

export default ImageParamsSet_Douyin;
