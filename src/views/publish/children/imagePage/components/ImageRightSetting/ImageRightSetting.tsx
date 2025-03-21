import { ForwardedRef, forwardRef, memo } from 'react';
import styles from '../../image.module.scss';
import { PubType } from '../../../../../../../commont/publish/PublishEnum';
import SupportPlat from '../../../../components/SupportPlat/SupportPlat';

export interface IImageRightSettingRef {}

export interface IImageRightSettingProps {}

const ImageRightSetting = memo(
  forwardRef(
    ({}: IImageRightSettingProps, ref: ForwardedRef<IImageRightSettingRef>) => {
      return (
        <div className={styles.imageRightSetting}>
          <SupportPlat
            pubType={PubType.ImageText}
            style={{ marginTop: '15px' }}
          />

          <h2 className="imageRightSetting-title">发布账户</h2>
        </div>
      );
    },
  ),
);
ImageRightSetting.displayName = 'ImageRightSetting';

export default ImageRightSetting;
