import React, { ForwardedRef, forwardRef, memo } from 'react';
import styles from '../../image.module.scss';
import { ChooseChunk } from '../../../../components/CommonComponents/CommonComponents';
import localUpload from '../../../videoPage/images/localUpload.png';
import ImgChoose from '../../../../../../components/Choose/ImgChoose';
import { Button, Input } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useShallow } from 'zustand/react/shallow';
import { useImagePageStore } from '../../useImagePageStore';

const { TextArea } = Input;

export interface IImageLeftSettingRef {}

export interface IImageLeftSettingProps {}

const ImageLeftSetting = memo(
  forwardRef(
    ({}: IImageLeftSettingProps, ref: ForwardedRef<IImageLeftSettingRef>) => {
      const { setAllPubParams, commonPubParams, setCommonPubParams } =
        useImagePageStore(
          useShallow((state) => ({
            setAllPubParams: state.setAllPubParams,
            commonPubParams: state.commonPubParams,
            setCommonPubParams: state.setCommonPubParams,
          })),
        );

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
                <Button
                  icon={<ArrowRightOutlined />}
                  onClick={() => {
                    setAllPubParams({
                      title: commonPubParams.title,
                      describe: commonPubParams.describe,
                    });
                  }}
                >
                  同步至右侧
                </Button>
              </div>
            </div>

            <div className="imageLeftSetting-commonPar-item">
              <label>一键设置标题：</label>
              <Input
                value={commonPubParams.title}
                placeholder="请输入标题"
                showCount
                variant="filled"
                onChange={(e) => {
                  setCommonPubParams({
                    title: e.target.value,
                  });
                }}
              />
            </div>

            <div
              className="imageLeftSetting-commonPar-item"
              style={{ alignItems: 'baseline' }}
            >
              <label>一键设置简介：</label>
              <TextArea
                value={commonPubParams.describe}
                maxLength={1000}
                placeholder="请输入简介"
                showCount
                variant="filled"
                onChange={(e) => {
                  setCommonPubParams({
                    describe: e.target.value,
                  });
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
