import React, { ForwardedRef, forwardRef, memo } from 'react';
import styles from '../../image.module.scss';
import { ChooseChunk } from '../../../../components/CommonComponents/CommonComponents';
import localUpload from '../../../videoPage/images/localUpload.png';
import ImgChoose from '../../../../../../components/Choose/ImgChoose';
import { Button, Input } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export interface IImageLeftSettingRef {}

export interface IImageLeftSettingProps {}

const ImageLeftSetting = memo(
  forwardRef(
    ({}: IImageLeftSettingProps, ref: ForwardedRef<IImageLeftSettingRef>) => {
      return (
        <div className={styles.imageLeftSetting}>
          <div className="imageLeftSetting-upload">
            <ImgChoose
              onMultipleChoose={(e) => {
                console.log(e);
              }}
            >
              <ChooseChunk
                text="本地上传"
                imgUrl={localUpload}
                color="linear-gradient(to right, rgb(255, 142, 28), rgb(255, 124, 24))"
                hoverColor="rgb(255, 142, 28)"
                style={{ marginRight: '15px', width: '260px', height: '180px' }}
              />
            </ImgChoose>
          </div>

          <div className="imageLeftSetting-commonPar">
            <div className="imageLeftSetting-commonPar-titles">
              <label>通用发布设置</label>
              <div className="imageLeftSetting-commonPar-titles-operate">
                <Button icon={<ArrowRightOutlined />}>同步至右侧</Button>
              </div>
            </div>

            <div className="imageLeftSetting-commonPar-item">
              <label>一键设置标题：</label>
              <Input
                placeholder="请输入标题"
                showCount
                variant="filled"
                onChange={(e) => {
                  console.log(e.target.value);
                }}
              />
            </div>

            <div
              className="imageLeftSetting-commonPar-item"
              style={{ alignItems: 'baseline' }}
            >
              <label>一键设置简介：</label>
              <TextArea
                maxLength={1000}
                placeholder="请输入简介"
                showCount
                variant="filled"
                onChange={(e) => {
                  console.log(e.target.value);
                }}
              />
            </div>
          </div>
        </div>
      );
    },
  ),
);
ImageLeftSetting.displayName = 'ImageLeftSetting';

export default ImageLeftSetting;
