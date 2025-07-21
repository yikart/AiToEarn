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
import { Select } from "antd";

const FacebookParams = memo(
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { pubParmasTextareaCommonParams, setOnePubParams } =
        usePlatParamsCommon(pubItem);
      const { getFacebookPages, facebookPages } =
        usePublishDialogData(
          useShallow((state) => ({
            getFacebookPages: state.getFacebookPages,
            facebookPages: state.facebookPages,
          })),
        );

      useEffect(() => {
        getFacebookPages();
      }, [getFacebookPages]);

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
                  <div className="platParamsSetting-label">页面</div>
                  <Select
                    style={{ width: "100%" }}
                    options={facebookPages}
                    value={pubItem.params.option.facebook?.pageId}
                    onChange={(value) => {
                      const option = pubItem.params.option;
                      option.facebook!.pageId = value;
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                    showSearch={true}
                    placeholder="请选择页面"
                    fieldNames={{
                      label: "name",
                      value: "id",
                    }}
                  />
                </div>
              </>
            }
          />
        </>
      );
    },
  ),
);

export default FacebookParams; 