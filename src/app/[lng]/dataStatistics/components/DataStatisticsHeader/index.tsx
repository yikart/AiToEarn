import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./dataStatisticsHeader.module.scss";
import AccountCount from "../../svgs/accountCount.svg";
import { Swiper, SwiperSlide } from "swiper/react";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import { Button, Input, Select, Skeleton, Tag, Tooltip } from "antd";
import { useDataStatisticsStore } from "@/app/[lng]/dataStatistics/useDataStatistics";
import {
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import AvatarPlat from "@/components/AvatarPlat";

export interface IDataStatisticsHeaderRef {}

export interface IDataStatisticsHeaderProps {}

const DataStatisticsHeader = memo(
  forwardRef(
    (
      {}: IDataStatisticsHeaderProps,
      ref: ForwardedRef<IDataStatisticsHeaderRef>,
    ) => {
      const { accountGroupList } = useAccountStore(
        useShallow((state) => ({
          accountGroupList: state.accountGroupList,
        })),
      );
      const { choosedGroupIds, setChoosedGroupIds, filteredAccountList } =
        useDataStatisticsStore(
          useShallow((state) => ({
            setChoosedGroupIds: state.setChoosedGroupIds,
            choosedGroupIds: state.choosedGroupIds,
            filteredAccountList: state.filteredAccountList,
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
              <Input.Search
                style={{ width: "300px" }}
                placeholder="请输入账号名称"
              />
            </div>
          </div>

          <div className="dataStatisticsHeader-accounts">
            <div className="dataStatisticsHeader-accountCount">
              <div className="dataStatisticsHeader-accountCount-title">
                <AccountCount />
                累计账号数
              </div>
              <div className="dataStatisticsHeader-accountCount-number">4</div>
              <Tag bordered={false} icon={<CheckCircleOutlined />}>
                在线 <b>1</b>
              </Tag>
              <br />
              <Tag bordered={false} icon={<WarningOutlined />}>
                离线 <b>3</b>
              </Tag>
            </div>

            <div className="dataStatisticsHeader-accounts-swiper">
              <Button className="swiper-prev" icon={<LeftOutlined />} />

              {accountGroupList.length === 0 ? (
                <Skeleton active />
              ) : (
                <Swiper
                  modules={[Navigation]}
                  slidesPerView={4}
                  slidesPerGroup={4}
                  navigation={{
                    prevEl: ".swiper-prev",
                    nextEl: ".swiper-next",
                  }}
                >
                  {filteredAccountList.map((account) => {
                    return (
                      <SwiperSlide key={account.id}>
                        <div className="accounts-swiper-item">
                          <div className="accounts-swiper-item-info">
                            <AvatarPlat account={account} size="large" />
                            <Tooltip title={account.nickname}>
                              <div className="accounts-swiper-item-info-name">
                                {account.nickname}
                              </div>
                            </Tooltip>
                          </div>

                          <div className="accounts-swiper-item-fans">
                            粉丝数 <span>{account.fansCount}</span>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              )}

              <Button className="swiper-next" icon={<RightOutlined />} />
            </div>
          </div>
        </div>
      );
    },
  ),
);

export default DataStatisticsHeader;
