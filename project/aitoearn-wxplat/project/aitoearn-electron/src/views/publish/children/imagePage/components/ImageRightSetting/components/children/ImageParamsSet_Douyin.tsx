import React, { forwardRef, memo } from 'react';
import { ImageRightSettingChildProps } from '../ImageParamsSet.type';
import {
  ImgTextDescTextArea,
  ImgTextLocationSelect,
  ImgTextMixSelect,
  ImgTextPubPermission,
  ImgTextPubRestartLogin,
  ImgTextScheduledTimeSelect,
  ImgTextTitleInput,
  ImgTextTopicSelect,
  ImgTextUserSelect,
} from '../ImageRightSettingCommon';
import { useShallow } from 'zustand/react/shallow';
import {
  CommonActivitySelect,
  CommonHotspotSelect,
} from '../../../../../../components/CommonComponents/DouyinCommonComponents';
import { PlatType } from '../../../../../../../../../commont/AccountEnum';
import { ILableValue } from '../../../../../../../../../electron/db/models/workData';
import { useImagePlatParams } from './hooks/useImagePlatParams';
import { useImagePageStore } from '../../../../useImagePageStore';
import { AccountPlatInfoMap } from '../../../../../../../account/comment';

const HotspotSelect = () => {
  const { imageAccountItem } = useImagePlatParams();
  const { setOnePubParams } = useImagePageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );

  return (
    <CommonHotspotSelect
      account={imageAccountItem.account}
      value={
        imageAccountItem.pubParams!.diffParams![PlatType.Douyin]!.hotPoint
      }
      onChange={(newValue) => {
        const newDiffParams = imageAccountItem.pubParams.diffParams!;
        newDiffParams[PlatType.Douyin]!.hotPoint = newValue as ILableValue;
        setOnePubParams(
          {
            diffParams: newDiffParams,
          },
          imageAccountItem.account.id,
        );
      }}
    />
  );
};

const ActivitySelect = () => {
  const { imageAccountItem } = useImagePlatParams();
  const { setOnePubParams } = useImagePageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
    })),
  );
  const { topicMax } = AccountPlatInfoMap.get(
    imageAccountItem.account.type,
  )!.commonPubParamsConfig;

  return (
    <CommonActivitySelect
      account={imageAccountItem.account}
      maxCount={topicMax - imageAccountItem.pubParams!.topics!.length}
      value={
        imageAccountItem.pubParams!.diffParams![PlatType.Douyin]!.activitys
      }
      onChange={(newValue) => {
        const newDiffParams = imageAccountItem.pubParams.diffParams!;
        newDiffParams[PlatType.Douyin]!.activitys =
          newValue as ILableValue[];
        setOnePubParams(
          {
            diffParams: newDiffParams,
          },
          imageAccountItem.account.id,
        );
      }}
    >
      <ImgTextPubRestartLogin />
    </CommonActivitySelect>
  );
};

const ImageParamsSet_Douyin = memo(
  forwardRef(({}: ImageRightSettingChildProps, _) => {
    const { imageAccountItem } = useImagePlatParams();
    const { topicMax } = AccountPlatInfoMap.get(
      imageAccountItem.account.type,
    )!.commonPubParamsConfig;
    return (
      <>
        <ImgTextTitleInput placeholder="添加作品标题" />

        <ImgTextDescTextArea placeholder="添加作品简介" />

        <ImgTextTopicSelect
          maxCount={
            topicMax -
            imageAccountItem.pubParams!.diffParams![PlatType.Douyin]!
              .activitys!.length
          }
          tips="最多可添加5个话题（包含活动奖励）"
        />

        <ActivitySelect />

        <ImgTextUserSelect maxCount={100} tips="您可以添加100个好友" />

        <HotspotSelect />

        <ImgTextLocationSelect />

        <ImgTextMixSelect />

        <ImgTextPubPermission />

        <ImgTextScheduledTimeSelect />
      </>
    );
  }),
);
ImageParamsSet_Douyin.displayName = 'ImageParamsSet_Douyin';

export default ImageParamsSet_Douyin;
