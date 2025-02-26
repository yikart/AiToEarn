import React, { useMemo, useRef, useState } from 'react';
import type { SelectProps } from 'antd';
import { Select, Spin } from 'antd';
import lodash from 'lodash';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import { icpGetTopic } from '@/icp/publish';
import { AccountStatus, AccountType } from '@@/AccountEnum';
import { ipcUpdateAccountStatus } from '@/icp/account';

export interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  debounceTimeout?: number;
  tips: string;
  currChooseAccount: IVideoChooseItem;
}

// 话题选择器
export default function TopicSelect<
  ValueType extends {
    key?: string;
    label: React.ReactNode;
    value: string | number;
  } = any,
>({
  debounceTimeout = 300,
  currChooseAccount,
  tips,
  ...props
}: DebounceSelectProps<ValueType>) {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState<ValueType[]>([]);
  const fetchRef = useRef(0);

  const { setOnePubParams, updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
    })),
  );

  const fetchOptions = async (keyword: string): Promise<ValueType[]> => {
    const topics = await icpGetTopic(currChooseAccount.account!, keyword);
    if (topics.status !== 200) {
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
  };

  const debounceFetcher = useMemo(() => {
    const loadOptions = (value: string) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setFetching(true);

      fetchOptions(value).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          return;
        }

        setOptions(newOptions);
        setFetching(false);
      });
    };

    return lodash.debounce(loadOptions, debounceTimeout);
  }, [fetchOptions, debounceTimeout]);

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
        value={currChooseAccount.pubParams!.topics as ValueType[]}
        onChange={(newValue) => {
          // 小红书话题特殊处理
          if (currChooseAccount.account?.type === AccountType.Xhs) {
            currChooseAccount.pubParams.diffParams![
              AccountType.Xhs
            ]!.topicsDetail =
              (newValue as any[]).map((v) => {
                return {
                  topicId: `${v.value}`,
                  topicName: v.label,
                };
              }) || [];
          }
          setOnePubParams(
            {
              topics: (newValue as any[]).map((v) => {
                return {
                  label: v.label,
                  value: v.value,
                };
              }),
              diffParams: {
                ...currChooseAccount.pubParams.diffParams,
              },
            },
            currChooseAccount.id,
          );
        }}
      />

      <p className="videoPubSetModal_con-tips">{tips}</p>
    </>
  );
}
