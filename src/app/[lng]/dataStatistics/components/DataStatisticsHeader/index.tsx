import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./dataStatisticsHeader.module.scss";
import AccountCount from "../../svgs/accountCount.svg";
import { Swiper, SwiperSlide } from "swiper/react";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import { Input, Select } from "antd";
import { useDataStatisticsStore } from "@/app/[lng]/dataStatistics/useDataStatistics";

export interface IDataStatisticsHeaderRef {}

export interface IDataStatisticsHeaderProps {}

const DataStatisticsHeader = memo(
  forwardRef(
    (
      {}: IDataStatisticsHeaderProps,
      ref: ForwardedRef<IDataStatisticsHeaderRef>,
    ) => {
      const { accountList, accountGroupList } = useAccountStore(
        useShallow((state) => ({
          accountList: state.accountList,
          accountGroupList: state.accountGroupList,
        })),
      );
      const { choosedGroupIds, setChoosedGroupIds } = useDataStatisticsStore(
        useShallow((state) => ({
          setChoosedGroupIds: state.setChoosedGroupIds,
          choosedGroupIds: state.choosedGroupIds,
        })),
      );

      return (
        <div className={styles.dataStatisticsHeader}>
          <div className="dataStatisticsHeader-top">
            <h2>账号数据</h2>
            <div className="dataStatisticsHeader-top-options">
              <Select
                mode="multiple"
                value={choosedGroupIds}
                style={{ width: "220px" }}
                options={accountGroupList}
                fieldNames={{ value: "id", label: "name" }}
                placeholder="选择空间"
                maxTagCount={1}
                onChange={(value) => {
                  setChoosedGroupIds(value);
                }}
              />
              <Input.Search style={{ width: '300px' }} placeholder="请输入账号名称" />
            </div>
          </div>

          <div className="dataStatisticsHeader-accounts">
            <div className="dataStatisticsHeader-accountCount">
              <div className="dataStatisticsHeader-accountCount-title">
                <AccountCount />
                累计账号数
              </div>
              <div className="dataStatisticsHeader-accountCount-number">4</div>
            </div>

            <Swiper>
              <SwiperSlide></SwiperSlide>
            </Swiper>
          </div>
        </div>
      );
    },
  ),
);

export default DataStatisticsHeader;
