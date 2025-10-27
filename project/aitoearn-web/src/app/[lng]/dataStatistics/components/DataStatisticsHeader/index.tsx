import { ForwardedRef, forwardRef, memo, useState } from "react";
import styles from "./dataStatisticsHeader.module.scss";
import AccountCount from "../../svgs/accountCount.svg";
import { Swiper, SwiperSlide } from "swiper/react";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import { Button, Empty, Input, Select, Skeleton, Tag, Tooltip } from "antd";
import { useDataStatisticsStore } from "@/app/[lng]/dataStatistics/useDataStatistics";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LeftOutlined,
  RightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import AvatarPlat from "@/components/AvatarPlat";
import AddAccountModal from "@/app/[lng]/accounts/components/AddAccountModal";
import { useTransClient } from "@/app/i18n/client";

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
      const {
        choosedGroupIds,
        setChoosedGroupIds,
        filteredAccountList,
        setAccountSearchValue,
      } = useDataStatisticsStore(
        useShallow((state) => ({
          setChoosedGroupIds: state.setChoosedGroupIds,
          choosedGroupIds: state.choosedGroupIds,
          filteredAccountList: state.filteredAccountList,
          setAccountSearchValue: state.setAccountSearchValue,
        })),
      );
      const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
      const { t } = useTransClient("dataStatistics");

      return (
        <div className={styles.dataStatisticsHeader}>
          {/* 添加账号弹窗 */}
          <AddAccountModal
            open={addAccountModalOpen}
            onClose={() => setAddAccountModalOpen(false)}
            onAddSuccess={() => setAddAccountModalOpen(false)}
            // targetGroupId={targetSpaceId}
            // showSpaceSelector={!targetSpaceId}
            // autoTriggerPlatform={targetPlatform}
          />

          <div className="dataStatisticsHeader-top">
            <h2>{t("accountData")}</h2>
            <div className="dataStatisticsHeader-top-options">
              <Select
                mode="multiple"
                value={choosedGroupIds}
                style={{ width: "220px" }}
                options={accountGroupList}
                fieldNames={{ value: "id", label: "name" }}
                placeholder={t("selectSpace")}
                maxTagCount={1}
                onChange={(value) => {
                  setChoosedGroupIds(value);
                }}
              />
              <Input.Search
                style={{ width: "300px" }}
                placeholder={t("inputAccountName")}
                allowClear
                onSearch={(value) => {
                  setAccountSearchValue(value);
                }}
              />
            </div>
          </div>

          <div className="dataStatisticsHeader-accounts">
            {filteredAccountList.length === 0 ? (
              <>
                <Empty
                  style={{ width: "100%", height: "100%" }}
                  description={t("noAccount")}
                />
              </>
            ) : (
              <>
                <div className="dataStatisticsHeader-accountCount">
                  <div className="dataStatisticsHeader-accountCount-title">
                    <AccountCount />
                    {t("totalAccount")}
                  </div>
                  <div className="dataStatisticsHeader-accountCount-number">
                    {filteredAccountList.length}
                  </div>
                  <Tag bordered={false} icon={<CheckCircleOutlined />}>
                    {t("online")}{" "}
                    <b>
                      {filteredAccountList.filter((v) => v.status === 1).length}
                    </b>
                  </Tag>
                  <br />
                  <Tag bordered={false} icon={<WarningOutlined />}>
                    {t("offline")}{" "}
                    <b>
                      {filteredAccountList.filter((v) => v.status === 0).length}
                    </b>
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

                              {account.status === 1 ? (
                                <div className="accounts-swiper-item-fans">
                                  {t("fansCount")}{" "}
                                  <span>{account.fansCount}</span>
                                </div>
                              ) : (
                                <div className="accounts-swiper-item-offline">
                                  <span>
                                    <ExclamationCircleOutlined />
                                    {t("loginFailed")}
                                  </span>
                                  <a
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setAddAccountModalOpen(true);
                                    }}
                                  >
                                    {t("relogin")}
                                  </a>
                                </div>
                              )}
                            </div>
                          </SwiperSlide>
                        );
                      })}
                    </Swiper>
                  )}

                  <Button className="swiper-next" icon={<RightOutlined />} />
                </div>
              </>
            )}
          </div>
        </div>
      );
    },
  ),
);

export default DataStatisticsHeader;
