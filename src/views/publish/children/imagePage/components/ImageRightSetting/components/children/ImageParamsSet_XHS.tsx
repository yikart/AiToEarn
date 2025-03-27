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

const ImageParamsSet_XHS = memo(
  forwardRef(({}: ImageRightSettingChildProps, _) => {
    return (
      <>
        <ImgTextTitleInput placeholder="填写标题，可能会有更多赞哦" />

        <ImgTextDescTextArea placeholder="填写更全面的描述信息，让更多人看到你吧！" />

        <ImgTextTopicSelect />

        <ImgTextUserSelect />

        <ImgTextLocationSelect />

        <ImgTextScheduledTimeSelect />
      </>
    );
  }),
);
ImageParamsSet_XHS.displayName = 'ImageParamsSet_XHS';

export default ImageParamsSet_XHS;
