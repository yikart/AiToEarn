import React, { useEffect, useRef } from 'react';
import { Select, SelectProps, Spin } from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { icpGetLocationData } from '@/icp/publish';
import { AccountStatus } from '@@/AccountEnum';
import { ipcUpdateAccountStatus } from '@/icp/account';
import { ILocationDataItem } from '../../../../../../../../electron/main/plat/plat.type';
import useDebounceFetcher from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/useDebounceFetcher';
import { IVideoChooseItem } from '@/views/publish/children/videoPage/videoPage';
import styles from './videoPubSetModalCommon.module.scss';
// @ts-ignore
import { icpGetLocation } from '@/icp/view';
import { VideoPubRestartLogin } from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalCommon';

interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  currChooseAccount: IVideoChooseItem;
}

// 话题选择器
export default function LocationSelect({
  currChooseAccount,
  ...props
}: DebounceSelectProps<ILocationDataItem>) {
  const { setOnePubParams, updateAccounts } = useVideoPageStore(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      updateAccounts: state.updateAccounts,
    })),
  );
  const { fetching, options, debounceFetcher } =
    useDebounceFetcher<ILocationDataItem>(async (keywords) => {
      if (location.current.length === 0) await getLocation();
      const locationData = await icpGetLocationData({
        account: currChooseAccount.account!,
        keywords,
        latitude: location.current[1],
        longitude: location.current[0],
      });
      if (locationData.status !== 200 && locationData.status !== 201) {
        if (locationData.status === 401 || locationData.data === undefined) {
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
  // 位置 0=经度 1=纬度
  const location = useRef<number[]>([]);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    const res = await icpGetLocation();
    location.current = res.gcj02;
  };

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
        options={options.map((v) => {
          return {
            value: v.id,
            label: v.name,
            ...v,
          };
        })}
        optionRender={({ data }) => {
          return (
            <div className={styles.locationSelect}>
              <p className="location-name">{data.name}</p>
              <p className="location-simpleAddress">{data.simpleAddress}</p>
            </div>
          );
        }}
        value={currChooseAccount.pubParams!.location as any}
        onChange={(newValue) => {
          setOnePubParams(
            {
              location: newValue || null,
            },
            currChooseAccount.id,
          );
        }}
      />
      <VideoPubRestartLogin currChooseAccount={currChooseAccount} />
    </>
  );
}
