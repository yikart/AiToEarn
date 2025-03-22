import { ForwardedRef, forwardRef, memo, useState } from 'react';
import styles from '../../image.module.scss';
import { PubType } from '../../../../../../../commont/publish/PublishEnum';
import SupportPlat from '../../../../components/SupportPlat/SupportPlat';
import { ChooseAccountChunk } from '../../../../components/CommonComponents/CommonComponents';
import { Steps } from 'antd';
import ChooseAccountModule from '../../../../components/ChooseAccountModule/ChooseAccountModule';
import { useShallow } from 'zustand/react/shallow';
import { useImagePageStore } from '../../useImagePageStore';

export interface IImageRightSettingRef {}

export interface IImageRightSettingProps {}

const ImageRightSetting = memo(
  forwardRef(
    ({}: IImageRightSettingProps, ref: ForwardedRef<IImageRightSettingRef>) => {
      const [chooseAccountOpen, setChooseAccountOpen] = useState(false);
      const { imageTextData, addAccount } = useImagePageStore(
        useShallow((state) => ({
          imageTextData: state.imageTextData,
          addAccount: state.addAccount,
        })),
      );

      return (
        <div className={styles.imageRightSetting}>
          <ChooseAccountModule
            open={chooseAccountOpen}
            onClose={setChooseAccountOpen}
            platChooseProps={{
              choosedAccounts: imageTextData.imageAccounts
                .map((v) => v.account)
                .filter((v) => v !== undefined),
              pubType: PubType.ImageText,
            }}
            onPlatConfirm={(aList) => {
              addAccount(aList);
            }}
          />

          <SupportPlat
            pubType={PubType.ImageText}
            style={{ marginTop: '15px' }}
          />

          <h2 className="imageRightSetting-title">发布账户</h2>
          <ChooseAccountChunk
            onClick={() => {
              setChooseAccountOpen(true);
            }}
          />

          <Steps
            direction="vertical"
            size="small"
            items={[
              {
                title: '选择发布账号',
                description: '选择将要推文的账号',
              },
              {
                title: '调整发文规则',
                description:
                  '完成账号选择后，撰写推文，按需调整各个平台发文规则',
              },
            ]}
          />
        </div>
      );
    },
  ),
);
ImageRightSetting.displayName = 'ImageRightSetting';

export default ImageRightSetting;
