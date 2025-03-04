import React, { ForwardedRef, forwardRef, memo, useState } from 'react';
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/videoPubSetModal.type';
import { Checkbox, Input, Select, Spin, Tooltip } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import LocationSelect from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/LocationSelect';
import { AccountStatus, AccountType } from '@@/AccountEnum';
import { QuestionCircleOutlined } from '@ant-design/icons';
import useDebounceFetcher from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/useDebounceFetcher';
import {
  ScheduledTimeSelect,
  VideoPubRestartLogin,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon';
import { getSphActivity } from '@/icp/publish';
import { ipcUpdateAccountStatus } from '@/icp/account';
import { WxSphEventList } from '../../../../../../../../electron/plat/shipinhao/wxShp.type';
import UserSelect from '../components/UserSelect';

const { TextArea } = Input;

const WXSphActivity = ({ currChooseAccount }: IVideoPubSetModalChildProps) => {
  const { setOnePubParams, updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
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
          currChooseAccount.pubParams!.diffParams![AccountType.WxSph]!.activity
        }
        onChange={(_, value) => {
          const newDiffParams = currChooseAccount.pubParams.diffParams!;
          newDiffParams[AccountType.WxSph]!.activity = value as WxSphEventList;
          setOnePubParams(
            {
              diffParams: newDiffParams,
            },
            currChooseAccount.id,
          );
        }}
      />
      <VideoPubRestartLogin currChooseAccount={currChooseAccount} />
    </>
  );
};

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
          <h1>
            短标题
            <Tooltip title="短标题会出现在搜索、话题、活动、地点、订阅号消息、发现页红点等场景">
              <QuestionCircleOutlined style={{ marginLeft: '2px' }} />
            </Tooltip>
          </h1>
          <Input
            value={currChooseAccount.pubParams.title}
            showCount
            maxLength={16}
            placeholder="概况视频的主要内容。字数建议6-16个字符"
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

          <UserSelect
            currChooseAccount={currChooseAccount}
            maxCount={10}
            tips="您可以添加10个视频号"
            title="@视频号"
          />

          <LocationSelect currChooseAccount={currChooseAccount} />

          <WXSphActivity currChooseAccount={currChooseAccount} />

          <h1>扩展链接</h1>
          <Input
            placeholder="粘贴链接"
            value={
              currChooseAccount?.pubParams.diffParams![AccountType.WxSph]!
                .extLink
            }
            onChange={(e) => {
              const newDiffParams = currChooseAccount.pubParams.diffParams!;
              newDiffParams[AccountType.WxSph]!.extLink = e.target.value;
              setOnePubParams(
                {
                  diffParams: newDiffParams,
                },
                currChooseAccount.id,
              );
            }}
          />

          <h1>声明原创</h1>
          <Checkbox
            checked={
              currChooseAccount?.pubParams.diffParams![AccountType.WxSph]!
                .isOriginal
            }
            onChange={(e) => {
              const newDiffParams = currChooseAccount.pubParams.diffParams!;
              newDiffParams[AccountType.WxSph]!.isOriginal = e.target.checked;
              setOnePubParams(
                {
                  diffParams: newDiffParams,
                },
                currChooseAccount.id,
              );
            }}
          >
            声明后，作品将展示原创标记，有机会获得广告收入
          </Checkbox>

          <ScheduledTimeSelect currChooseAccount={currChooseAccount} />
        </>
      );
    },
  ),
);
VideoPubSetModal_KWAI.displayName = 'VideoPubSetModal_KWAI';

export default VideoPubSetModal_KWAI;
