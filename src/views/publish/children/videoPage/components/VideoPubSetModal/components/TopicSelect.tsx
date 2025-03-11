import React from 'react';
import { SelectProps } from 'antd';
import { Select, Spin } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import { icpGetTopic } from '@/icp/publish';
import { AccountStatus } from '@@/AccountEnum';
import { ipcUpdateAccountStatus } from '@/icp/account';
import useDebounceFetcher from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/useDebounceFetcher';
import { VideoPubRestartLogin } from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon';

interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  tips: string;
  currChooseAccount: IVideoChooseItem;
}

type ValueType = {
  label: string;
  value: string | number;
};

// 话题选择器
export default function TopicSelect({
  currChooseAccount,
  tips,
  ...props
}: DebounceSelectProps<ValueType>) {
  const { fetching, options, debounceFetcher } = useDebounceFetcher<ValueType>(
    async (keyword: string): Promise<ValueType[]> => {
      const topics = await icpGetTopic(currChooseAccount.account!, keyword);
      if (topics.status !== 200 && topics.status !== 201) {
        if (topics.status === 401) {
          currChooseAccount.account!.status = AccountStatus.DISABLE;
          updateAccounts({ accounts: [currChooseAccount.account!] });
          await ipcUpdateAccountStatus(
            currChooseAccount.account!.id,
            AccountStatus.DISABLE,
          );
        }
        return [];
      }
      return topics.data!.map((v) => {
        return {
          label: v.name,
          value: v.name,
        };
      }) as ValueType[];
    },
  );

  const { setOnePubParams, updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
    })),
  );

  return (
    <>
      <h1>话题</h1>
      <Select
        allowClear
        mode="multiple"
        style={{ width: '100%' }}
        placeholder="输入关键字搜索"
        labelInValue
        filterOption={false}
        onSearch={debounceFetcher}
        notFoundContent={fetching ? <Spin size="small" /> : null}
        {...props}
        options={options}
        value={currChooseAccount.pubParams!.topics!.map((v) => {
          return {
            value: v,
            label: v,
          };
        })}
        onChange={(newValue) => {
          setOnePubParams(
            {
              topics: (newValue as ValueType[]).map((v) => v.label),
              diffParams: {
                ...currChooseAccount.pubParams.diffParams,
              },
            },
            currChooseAccount.id,
          );
        }}
      />
      <VideoPubRestartLogin currChooseAccount={currChooseAccount} />
      <p className="videoPubSetModal_con-tips">{tips}</p>
    </>
  );
}
