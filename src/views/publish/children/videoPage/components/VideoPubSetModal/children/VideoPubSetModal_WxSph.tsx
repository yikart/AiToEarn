import React, { ForwardedRef, forwardRef, memo, useState } from 'react';
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/videoPubSetModal.type';
import { Input, Radio, Select } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { VisibleTypeEnum } from '@@/publish/PublishEnum';

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
      const [topicSearch, setTopicSearch] = useState('');

      return (
        <>
          <h1>描述</h1>
          <TextArea
            value={currChooseAccount?.pubParams.describe}
            placeholder="填写更全面的描述信息，让更多人看到你吧！"
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

          <h1>话题</h1>
          <Select
            allowClear
            mode="multiple"
            style={{ width: '100%' }}
            maxCount={10}
            placeholder="请输入并选择话题"
            labelInValue
            onSearch={setTopicSearch}
            filterOption={false}
            options={
              topicSearch
                ? [
                    {
                      label: topicSearch,
                      value: topicSearch,
                    },
                  ]
                : []
            }
            value={currChooseAccount.pubParams!.topics}
            onChange={(newValue) => {
              setOnePubParams(
                {
                  topics: (newValue as any[]).map((v) => {
                    return {
                      label: v.label,
                      value: v.value,
                    };
                  }),
                },
                currChooseAccount.id,
              );
            }}
          />
          <p className="videoPubSetModal_con-tips">
            您可添加10个标签，按回车键确认
          </p>

          <h1>权限设置</h1>
          <Radio.Group
            options={[
              {
                label: '公开（所有人可见）',
                value: VisibleTypeEnum.Public,
              },
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
