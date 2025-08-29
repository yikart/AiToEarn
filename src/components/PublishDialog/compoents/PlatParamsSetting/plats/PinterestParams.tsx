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
import { useTransClient } from "@/app/i18n/client";

const PinterestParams = memo( 
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { t } = useTransClient("publish");
      const { pubParmasTextareaCommonParams, setOnePubParams } =
        usePlatParamsCommon(pubItem);
      const { getPinterestBoards, pinterestBoards } =
        usePublishDialogData(
          useShallow((state) => ({
            getPinterestBoards: state.getPinterestBoards,
            pinterestBoards: state.pinterestBoards,
          })),
        );

      useEffect(() => {
        getPinterestBoards();
      }, [getPinterestBoards]);

      // 初始化Pinterest参数
      useEffect(() => {
        const option = pubItem.params.option;
        if (!option.pinterest) {
          option.pinterest = {};
        }
        setOnePubParams(
          {
            option,
          },
          pubItem.account.id,
        );
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
                  <div className="platParamsSetting-label">{t("form.board")}</div>
                  <Select
                    style={{ width: "100%" }}
                    options={pinterestBoards} 
                    value={pubItem.params.option.pinterest?.boardId}
                    onChange={(value) => {
                      const option = pubItem.params.option;
                      option.pinterest!.boardId = value;
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                    showSearch={true}
                    placeholder={t("form.boardPlaceholder")}
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

export default PinterestParams;
