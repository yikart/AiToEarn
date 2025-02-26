import React, { ForwardedRef, forwardRef, memo } from 'react';
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/videoPubSetModal.type';
import { Input, Radio } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { VisibleTypeEnum } from '@@/publish/PublishEnum';
import TopicSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/TopicSelect';

const { TextArea } = Input;

const VideoPubSetModal_KWAI = memo(
  forwardRef(
    (
      { currChooseAccount }: IVideoPubSetModalChildProps,
      ref: ForwardedRef<IVideoPubSetModalChildRef>,
    ) => {
      const { setOnePubParams } = useVideoPageStore(
        useShallow((state) => ({
          setOnePubParams: state.setOnePubParams,
          videoListChoose: state.videoListChoose,
        })),
      );

      return (
        <>
          <h1>标题</h1>
          <Input
            value={currChooseAccount.pubParams.title}
            showCount
            maxLength={30}
            placeholder="好的标题可以获得更多浏览"
            variant="filled"
            onChange={(e) => {
              setOnePubParams(
                {
                  title: e.target.value,
                },
                currChooseAccount.id,
              );
            }}
          />

          <h1>描述</h1>
          <TextArea
            value={currChooseAccount?.pubParams.describe}
            placeholder="添加作品简介"
            variant="filled"
            showCount
            maxLength={1000}
            onChange={(e) => {
              setOnePubParams(
                {
                  describe: e.target.value,
                },
                currChooseAccount!.id,
              );
            }}
          />

          <TopicSelect
            maxCount={5}
            currChooseAccount={currChooseAccount}
            tips="最多可添加5个话题（包含活动奖励）"
          />

          <h1>谁可以看</h1>
          <Radio.Group
            options={[
              {
                label: '公开（所有人可见）',
                value: VisibleTypeEnum.Public,
              },
              { label: '好友可见', value: VisibleTypeEnum.Friend },
              {
                label: '私密（仅自己可见）',
                value: VisibleTypeEnum.Private,
              },
            ]}
            onChange={(e) => {
              setOnePubParams(
                {
                  visibleType: e.target.value,
                },
                currChooseAccount!.id,
              );
            }}
            value={currChooseAccount?.pubParams.visibleType}
          />
        </>
      );
    },
  ),
);
VideoPubSetModal_KWAI.displayName = 'VideoPubSetModal_KWAI';

export default VideoPubSetModal_KWAI;
