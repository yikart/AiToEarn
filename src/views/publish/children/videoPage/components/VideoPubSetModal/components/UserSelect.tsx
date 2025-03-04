import React, { useEffect } from 'react';
import { Avatar, Select, SelectProps, Spin } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { IUsersItem } from '../../../../../../../../electron/main/plat/plat.type';
import useDebounceFetcher from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/useDebounceFetcher';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import styles from './videoPubSetModalCommon.module.scss';
// @ts-ignore
import { VideoPubRestartLogin } from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon';
import { icpGetUsers } from '../../../../../../../icp/publish';
import { AccountStatus } from '../../../../../../../../commont/AccountEnum';
import { ipcUpdateAccountStatus } from '../../../../../../../icp/account';
import { describeNumber } from '../../../../../../../utils';

interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  currChooseAccount: IVideoChooseItem;
  tips?: string;
}

// 话题选择器
export default function UserSelect({
  currChooseAccount,
  ...props
}: DebounceSelectProps<IUsersItem>) {
  const { setOnePubParams, updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
    })),
  );
  const { fetching, options, debounceFetcher } = useDebounceFetcher<IUsersItem>(
    async (keywords) => {
      const res = await icpGetUsers({
        page: 1,
        keyword: keywords,
        account: currChooseAccount.account!,
      });
      if (res.status !== 200 && res.status !== 201) {
        if (res.status === 401) {
          currChooseAccount.account!.status = AccountStatus.DISABLE;
          updateAccounts({ accounts: [currChooseAccount.account!] });
          await ipcUpdateAccountStatus(
            currChooseAccount.account!.id,
            AccountStatus.DISABLE,
          );
        }
        return [];
      }
      console.log(res);
      return res.data || [];
    },
  );

  useEffect(() => {}, []);

  return (
    <>
      <h1>@好友</h1>
      <Select
        showSearch
        allowClear
        style={{ width: '100%' }}
        mode="multiple"
        placeholder="输入关键词搜索"
        labelInValue
        filterOption={false}
        onSearch={debounceFetcher}
        notFoundContent={fetching ? <Spin size="small" /> : null}
        fieldNames={{
          label: 'name',
          value: 'id',
        }}
        {...props}
        options={options}
        optionRender={({ data }) => {
          return (
            <div className={styles.usersSelect}>
              <Avatar src={data.image} />
              <div className="usersSelect-con">
                <div className="usersSelect-con-name">{data.name}</div>
                {(data.unique_id || data.follower_count) && (
                  <div className="usersSelect-con-footer">
                    <div className="usersSelect-con-footer-follower">
                      粉丝数：{describeNumber(data.follower_count || 0)}
                    </div>
                    {data.unique_id && (
                      <div className="usersSelect-con-footer-unique">
                        抖音号：{data.unique_id}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }}
        value={
          currChooseAccount.pubParams!.mentionedUserInfo?.map((v) => {
            return {
              ...v,
              id: v.value,
              name: v.label,
            };
          }) as any
        }
        onChange={(_, value) => {
          setOnePubParams(
            {
              mentionedUserInfo: value
                ? (value as IUsersItem[]).map((v) => {
                    return {
                      value: v.id,
                      label: v.name,
                    };
                  })
                : undefined,
            },
            currChooseAccount.id,
          );
        }}
      />
      {props.tips && <p className="videoPubSetModal_con-tips">{props.tips}</p>}
      <VideoPubRestartLogin currChooseAccount={currChooseAccount} />
    </>
  );
}
