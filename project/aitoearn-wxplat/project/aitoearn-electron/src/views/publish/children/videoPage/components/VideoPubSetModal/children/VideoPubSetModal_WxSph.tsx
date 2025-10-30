import React, { ForwardedRef, forwardRef, memo, useState } from 'react';
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/videoPubSetModal.type';
import { Checkbox, Input, Select, Spin } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import LocationSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/LocationSelect';
import { AccountStatus, PlatType } from '@@/AccountEnum';
import useDebounceFetcher from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/useDebounceFetcher';
import {
  DescTextArea,
  ScheduledTimeSelect,
  TitleInput,
  VideoPubMixSelect,
  VideoPubRestartLogin,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon';
import { getSphActivity } from '@/icp/publish';
import { ipcUpdateAccountStatus } from '@/icp/account';
import { WxSphEventList } from '../../../../../../../../electron/plat/shipinhao/wxShp.type';
import UserSelect from '../components/UserSelect';
import useVideoPubSetModal from './hooks/useVideoPubSetModal';

const WXSphActivity = ({}: IVideoPubSetModalChildProps) => {
  const { setOnePubParams, updateAccounts, currChooseAccount } =
    useVideoPageStore(
      useShallow((state) => ({
        setOnePubParams: state.setOnePubParams,
        updateAccounts: state.updateAccounts,
        currChooseAccount: state.currChooseAccount!,
      })),
    );

  const { fetching, options, debounceFetcher } =
    useDebounceFetcher<WxSphEventList>(async (keywords) => {
      const res = await getSphActivity(currChooseAccount.account!, keywords);
      if (res.data.errCode === 300334 || res.data.errCode === 300333) {
        currChooseAccount.account!.status = AccountStatus.DISABLE;
        updateAccounts({ accounts: [currChooseAccount.account!] });
        await ipcUpdateAccountStatus(
          currChooseAccount.account!.id,
          AccountStatus.DISABLE,
        );
        return [];
      }
      return res?.data?.data?.eventList || [];
    });

  return (
    <>
      <h1>参与活动</h1>
      <Select
        showSearch
        allowClear
        style={{ width: '100%' }}
        placeholder="输入关键词搜索活动"
        labelInValue
        filterOption={false}
        onSearch={debounceFetcher}
        notFoundContent={fetching ? <Spin size="small" /> : null}
        options={options?.map((v) => {
          return {
            ...v,
            label: v.eventName,
            value: v.eventTopicId,
          };
        })}
        value={
          currChooseAccount.pubParams!.diffParams![PlatType.WxSph]!.activity
        }
        onChange={(_, value) => {
          const newDiffParams = currChooseAccount.pubParams.diffParams!;
          newDiffParams[PlatType.WxSph]!.activity = value as WxSphEventList;
          setOnePubParams({
            diffParams: newDiffParams,
          });
        }}
      />
      <VideoPubRestartLogin />
    </>
  );
};

const VideoPubSetModal_WxSph = memo(
  forwardRef(
    (
      {}: IVideoPubSetModalChildProps,
      ref: ForwardedRef<IVideoPubSetModalChildRef>,
    ) => {
      const { setOnePubParams, platInfo, currChooseAccount } =
        useVideoPubSetModal();
      const { topicMax } = platInfo.commonPubParamsConfig;
      const [topicSearch, setTopicSearch] = useState('');

      return (
        <>
          <TitleInput
            title="短标题"
            tips="短标题会出现在搜索、话题、活动、地点、订阅号消息、发现页红点等场景"
            placeholder="概况视频的主要内容。字数建议6-16个字符"
          />

          <DescTextArea
            placeholder="填写更全面的描述信息，让更多人看到你吧！"
            maxLength={1000}
          />

          <h1>话题</h1>
          <Select
            allowClear
            mode="multiple"
            style={{ width: '100%' }}
            maxCount={topicMax}
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
              setOnePubParams({
                topics: newValue,
              });
            }}
          />
          <p className="videoPubSetModal_con-tips">
            您可添加{topicMax}个标签，按回车键确认
          </p>

          <UserSelect
            maxCount={10}
            tips="您可以添加10个视频号"
            title="@视频号"
          />

          <LocationSelect />

          <WXSphActivity />

          <VideoPubMixSelect />

          <h1>扩展链接</h1>
          <Input
            placeholder="粘贴链接"
            value={
              currChooseAccount?.pubParams.diffParams![PlatType.WxSph]!
                .extLink
            }
            onChange={(e) => {
              const newDiffParams = currChooseAccount.pubParams.diffParams!;
              newDiffParams[PlatType.WxSph]!.extLink = e.target.value;
              setOnePubParams({
                diffParams: newDiffParams,
              });
            }}
          />

          <h1>声明原创</h1>
          <Checkbox
            checked={
              currChooseAccount?.pubParams.diffParams![PlatType.WxSph]!
                .isOriginal
            }
            onChange={(e) => {
              const newDiffParams = currChooseAccount.pubParams.diffParams!;
              newDiffParams[PlatType.WxSph]!.isOriginal = e.target.checked;
              setOnePubParams({
                diffParams: newDiffParams,
              });
            }}
          >
            声明后，作品将展示原创标记，有机会获得广告收入
          </Checkbox>

          <ScheduledTimeSelect />
        </>
      );
    },
  ),
);
VideoPubSetModal_WxSph.displayName = 'VideoPubSetModal_WxSph';

export default VideoPubSetModal_WxSph;
