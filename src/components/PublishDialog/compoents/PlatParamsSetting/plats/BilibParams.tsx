import { ForwardedRef, forwardRef, memo, useEffect } from "react";
import {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type";
import PubParmasTextarea from "@/components/PublishDialog/compoents/PubParmasTextarea";
import usePlatParamsCommon from "@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon";
import CommonTitleInput from "@/components/PublishDialog/compoents/PlatParamsSetting/common/CommonTitleInput";
import { usePublishDialogData } from "@/components/PublishDialog/usePublishDialogData";
import { useShallow } from "zustand/react/shallow";
import styles from "../platParamsSetting.module.scss";
import { Input, Radio, Select } from "antd";
import { useTransClient } from "@/app/i18n/client";

const BilibParams = memo(
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { t } = useTransClient("publish");
      const { pubParmasTextareaCommonParams, setOnePubParams } =
        usePlatParamsCommon(pubItem);
      const { getBilibiliPartitions, bilibiliPartitions } =
        usePublishDialogData(
          useShallow((state) => ({
            getBilibiliPartitions: state.getBilibiliPartitions,
            bilibiliPartitions: state.bilibiliPartitions,
          })),
        );

      useEffect(() => {
        getBilibiliPartitions();
      }, [getBilibiliPartitions]);

      // 初始化Bilibili参数
      useEffect(() => {
        const option = pubItem.params.option;
        if (!option.bilibili) {
          option.bilibili = {};
        }
        if (!option.bilibili.copyright) {
          option.bilibili.copyright = 1;
          setOnePubParams(
            {
              option,
            },
            pubItem.account.id,
          );
        }
      }, [pubItem.account.id]);

      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={
              <>
                <CommonTitleInput pubItem={pubItem} />
                <div
                  className={styles.commonTitleInput}
                  style={{ marginTop: "10px" }}
                >
                  <div className="platParamsSetting-label">{t("form.partition")}</div>
                  <Select
                    style={{ width: "100%" }}
                    options={bilibiliPartitions} 
                    value={pubItem.params.option.bilibili?.tid}
                    onChange={(value) => {
                      const option = pubItem.params.option;
                      option.bilibili!.tid = value;
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                    showSearch={true}
                    placeholder={t("form.partitionPlaceholder")}
                    fieldNames={{
                      label: "name",
                      value: "id",
                    }}
                  />
                </div>

                <div
                  className={styles.commonTitleInput}
                  style={{ marginTop: "10px" }}
                >
                  <div className="platParamsSetting-label">{t("form.type")}</div>
                  <Radio.Group
                    value={pubItem.params.option.bilibili?.copyright}
                    options={[
                      { value: 1, label: t("form.original") },
                      { value: 2, label: t("form.reprint") },
                    ]}
                    onChange={(e) => {
                      const option = pubItem.params.option;
                      const value = e.target.value;
                      option.bilibili!.copyright = value;
                      if (value === 1) {
                        option.bilibili!.source = "";
                      }
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                  />
                </div>

                {pubItem.params.option.bilibili?.copyright === 2 && (
                  <div
                    className={styles.commonTitleInput}
                    style={{ marginTop: "10px" }}
                  >
                    <div className="platParamsSetting-label">{t("form.source")}</div>
                    <Input placeholder={t("form.sourcePlaceholder")} />
                  </div>
                )}
              </>
            }
          />
        </>
      );
    },
  ),
);

export default BilibParams;
