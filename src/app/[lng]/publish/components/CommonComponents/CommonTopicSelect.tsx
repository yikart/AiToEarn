import React from "react";
import { SelectProps } from "antd";
import { Select, Spin } from "antd";
import styles from "./commonComponents.module.scss";
import useDebounceFetcher from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/components/useDebounceFetcher";
import { AccountInfo } from "@/app/[lng]/publish/videoPage/videoPage";

export interface CommonTopicSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, "options" | "children"> {
  tips?: string;
  account?: AccountInfo;
  onAccountChange?: (account: AccountInfo) => void;
  children?: React.ReactNode;
}

export type CommonTopicSelectValueType = {
  label: string;
  value: string | number;
};

// 通用话题选择器
export default function CommonTopicSelect({
  tips,
  children,
  account,
  onAccountChange,
  ...props
}: CommonTopicSelectProps<CommonTopicSelectValueType>) {
  if (!account || !onAccountChange) return "";

  const { fetching, options, debounceFetcher } =
    useDebounceFetcher<CommonTopicSelectValueType>(
      async (keyword: string): Promise<CommonTopicSelectValueType[]> => {
        // TODO 话题获取
        // const topics = await icpGetTopic(account!, keyword);
        //
        // const res = await accountFailureDispose(
        //   topics,
        //   account,
        //   onAccountChange,
        // );
        // return res!.map((v) => {
        //   return {
        //     label: v.name,
        //     value: v.name,
        //   };
        // }) as CommonTopicSelectValueType[];
        return [];
      },
    );

  return (
    <>
      <h1>话题</h1>
      <Select
        allowClear
        mode="multiple"
        style={{ width: "100%" }}
        placeholder="输入关键字搜索"
        labelInValue
        filterOption={false}
        onSearch={debounceFetcher}
        notFoundContent={fetching ? <Spin size="small" /> : null}
        {...props}
        options={options}
      />
      {children}
      <p className={styles.tips}>{tips}</p>
    </>
  );
}
