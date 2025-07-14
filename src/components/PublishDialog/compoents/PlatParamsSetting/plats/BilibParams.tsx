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

const BilibParams = memo(
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
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
                  <div className="platParamsSetting-label">分区</div>
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
                    placeholder="请选择分区"
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
                  <div className="platParamsSetting-label">类型</div>
                  <Radio.Group
                    value={pubItem.params.option.bilibili?.copyright}
                    options={[
                      { value: 1, label: "原创" },
                      { value: 2, label: "转载" },
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
                    <div className="platParamsSetting-label">转载来源</div>
                    <Input placeholder="转载视频请注明来源、时间、地点(例：转自https://www.xxxx.com/yyyy)" />
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
