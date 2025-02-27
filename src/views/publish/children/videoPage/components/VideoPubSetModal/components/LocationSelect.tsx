import React, { useEffect } from 'react';
import { Button, SelectProps } from 'antd';
import { Select, Spin } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { icpGetLocationData } from '@/icp/publish';
import { AccountStatus } from '@@/AccountEnum';
import { ipcUpdateAccountStatus } from '@/icp/account';
import { ILocationDataItem } from '../../../../../../../../electron/main/plat/plat.type';
import useDebounceFetcher from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/useDebounceFetcher';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import styles from './locationSelect.module.scss';

interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  currChooseAccount: IVideoChooseItem;
}

// 话题选择器
export default function LocationSelect({
  currChooseAccount,
  ...props
}: DebounceSelectProps<ILocationDataItem>) {
  const { setOnePubParams, updateAccounts, accountRestart } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
      accountRestart: state.accountRestart,
    })),
  );
  const { fetching, options, debounceFetcher } =
    useDebounceFetcher<ILocationDataItem>(async (keywords) => {
      const locationData = await icpGetLocationData({
        account: currChooseAccount.account!,
        keywords,
        latitude: 40.043624478084524,
        longitude: 116.24432699979916,
      });
      if (locationData.status !== 200 && locationData.status !== 201) {
        if (locationData.status === 401) {
          currChooseAccount.account!.status = AccountStatus.DISABLE;
          updateAccounts({ accounts: [currChooseAccount.account!] });
          await ipcUpdateAccountStatus(
            currChooseAccount.account!.id,
            AccountStatus.DISABLE,
          );
        }
        return [];
      }
      return locationData.data!;
    });

  useEffect(() => {
    // getLocation().then((res) => {
    //   console.log(res);
    // });
  }, []);

  return (
    <>
      <h1>位置</h1>
      <Select
        showSearch
        allowClear
        style={{ width: '100%' }}
        placeholder="请选择关联位置"
        labelInValue
        filterOption={false}
        onSearch={debounceFetcher}
        notFoundContent={fetching ? <Spin size="small" /> : null}
        {...props}
        options={options}
        optionRender={({ data }) => {
          return (
            <div className={styles.locationSelect}>
              <p className="location-name">{data.name}</p>
              <p className="location-simpleAddress">{data.simpleAddress}</p>
            </div>
          );
        }}
        // value={currChooseAccount.pubParams!.topics} TODO 参数选择接入
        onChange={(newValue) => {
          console.log(newValue);
        }}
      />

      {currChooseAccount.account?.status === AccountStatus.DISABLE && (
        <div className="videoPubSetModal_con-accountDisable">
          账户已失效，
          <Button
            type="link"
            onClick={() => {
              accountRestart(currChooseAccount.account!.type);
            }}
          >
            重新登录
          </Button>
          后可获取
        </div>
      )}
    </>
  );
}
