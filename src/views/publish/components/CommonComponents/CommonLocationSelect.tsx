import React, { useEffect, useRef } from 'react';
import { Select, SelectProps, Spin } from 'antd';
import { icpGetLocationData } from '@/icp/publish';
import { AccountStatus } from '@@/AccountEnum';
import { ipcUpdateAccountStatus } from '@/icp/account';
import { ILocationDataItem } from '@/../electron/main/plat/plat.type';
import useDebounceFetcher from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/useDebounceFetcher';
import styles from './commonComponents.module.scss';
import { icpGetLocation } from '@/icp/view';
import { AccountInfo } from '../../../account/comment';

interface CommonLocationSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  account?: AccountInfo;
  onAccountChange?: (account: AccountInfo) => void;
  children?: React.ReactNode;
}

// 通用位置选择器
export default function CommonLocationSelect({
  children,
  account,
  onAccountChange,
  ...props
}: CommonLocationSelectProps<ILocationDataItem>) {
  if (!account || !onAccountChange) return '';

  const { fetching, options, debounceFetcher } =
    useDebounceFetcher<ILocationDataItem>(async (keywords) => {
      if (location.current.loca.length === 0) await getLocation();
      const locationData = await icpGetLocationData({
        account: account!,
        keywords,
        latitude: location.current.loca[1],
        longitude: location.current.loca[0],
        cityName: location.current.city,
      });
      if (locationData.status !== 200 && locationData.status !== 201) {
        if (locationData.status === 401 || locationData.data === undefined) {
          account!.status = AccountStatus.DISABLE;
          onAccountChange(account);
          await ipcUpdateAccountStatus(account!.id, AccountStatus.DISABLE);
        }
        return [];
      }
      return locationData.data || [];
    });
  // 位置 0=经度 1=纬度
  const location = useRef<{
    loca: number[];
    city: string;
  }>({
    loca: [],
    city: '',
  });

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    const res = await icpGetLocation();
    location.current.loca = res.gcj02;
    location.current.city = res.city;
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
        options={options?.map((v) => {
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
      />
      {children}
    </>
  );
}
