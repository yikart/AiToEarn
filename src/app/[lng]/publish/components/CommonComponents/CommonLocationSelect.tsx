import React, { useEffect, useRef } from "react";
import { Select, SelectProps, Spin } from "antd";
import styles from "./commonComponents.module.scss";
import useDebounceFetcher from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/components/useDebounceFetcher";
import {
  AccountInfo,
  ILocationDataItem,
} from "@/app/[lng]/publish/videoPage/videoPage.type";

interface CommonLocationSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, "options" | "children"> {
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
  if (!account || !onAccountChange) return "";

  const { fetching, options, debounceFetcher } =
    useDebounceFetcher<ILocationDataItem>(async (keywords) => {
      // TODO 位置获取
      // if (location.current.loca.length === 0) await getLocation();
      // const locationData = await icpGetLocationData({
      //   account: account!,
      //   keywords,
      //   latitude: location.current.loca[1],
      //   longitude: location.current.loca[0],
      //   cityName: location.current.city,
      // });
      // return await accountFailureDispose(
      //   locationData,
      //   account,
      //   onAccountChange,
      // );
      return undefined;
    });
  // 位置 0=经度 1=纬度
  const location = useRef<{
    loca: number[];
    city: string;
  }>({
    loca: [],
    city: "",
  });

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    // 当前经纬度获取
    // const res = await icpGetLocation();
    // location.current.loca = res.gcj02;
    // location.current.city = res.city;
  };

  return (
    <>
      <h1>位置</h1>
      <Select
        showSearch
        allowClear
        style={{ width: "100%" }}
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
