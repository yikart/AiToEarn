import React, { useEffect } from "react";
import { Avatar, Select, SelectProps, Spin } from "antd";
import styles from "./commonComponents.module.scss";
import { describeNumber } from "@/utils";
import { IUsersItem } from "@/app/plat/plat.type";
import useDebounceFetcher from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/components/useDebounceFetcher";
import { AccountInfo } from "@/app/[lng]/publish/videoPage/videoPage";

export interface CommonUserSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, "options" | "children"> {
  account?: AccountInfo;
  tips?: string;
  title?: string;
  children?: React.ReactNode;
  onAccountChange?: (account: AccountInfo) => void;
}

// 通用用户选择器
export default function CommonUserSelect({
  account,
  children,
  onAccountChange,
  ...props
}: CommonUserSelectProps<IUsersItem>) {
  if (!account || !onAccountChange) return "";

  const { fetching, options, debounceFetcher, setOptions } =
    useDebounceFetcher<IUsersItem>(async (keywords) => {
      return await getList(keywords);
    });

  const getList = async (keywords?: string) => {
    // TODO 获取用户列表
    // const res = await icpGetUsers({
    //   page: 1,
    //   keyword: keywords || "",
    //   account: account!,
    // });
    // const data = await accountFailureDispose(res, account!, onAccountChange);
    // setOptions(data);
    // return data;
    return [];
  };

  useEffect(() => {
    if (props.showSearch === false) {
      getList();

      // TODO 登录完成
      // return onAccountLoginFinish((newAccount) => {
      //   account = newAccount;
      //   getList();
      // });
    }
  }, []);

  return (
    <>
      <h1>{props.title || "@用户选择"}</h1>
      <Select
        {...props}
        showSearch={
          props.hasOwnProperty("showSearch") ? props.showSearch : true
        }
        allowClear
        style={{ width: "100%" }}
        mode="multiple"
        placeholder="输入关键词搜索"
        labelInValue
        filterOption={false}
        onSearch={
          (props.hasOwnProperty("showSearch") ? props.showSearch : true)
            ? debounceFetcher
            : undefined
        }
        notFoundContent={fetching ? <Spin size="small" /> : null}
        fieldNames={{
          label: "name",
          value: "id",
        }}
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
      />
      {children}
      {props.tips && <p className={styles.tips}>{props.tips}</p>}
    </>
  );
}
