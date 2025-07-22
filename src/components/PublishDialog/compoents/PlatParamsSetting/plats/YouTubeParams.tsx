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
import { Radio, Select } from "antd";
import { YouTubeCategoryItem } from "@/components/PublishDialog/publishDialog.type";

const YouTubeParams = memo(
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { pubParmasTextareaCommonParams, setOnePubParams } =
        usePlatParamsCommon(pubItem);
      const { getYouTubeCategories, youTubeCategories } =
        usePublishDialogData(
          useShallow((state) => ({
            getYouTubeCategories: state.getYouTubeCategories,
            youTubeCategories: state.youTubeCategories,
          })),
        );

      useEffect(() => {
        getYouTubeCategories();
      }, [getYouTubeCategories]);

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
                  <div className="platParamsSetting-label">隐私状态</div>
                  <Radio.Group
                    value={pubItem.params.option.youtube?.privacyStatus}
                    options={[
                      { value: "public", label: "公开" },
                      { value: "unlisted", label: "不公开" },
                      { value: "private", label: "私人" },
                    ]}
                    onChange={(e) => {
                      const option = pubItem.params.option;
                      if (!option.youtube) {
                        option.youtube = {};
                      }
                      option.youtube.privacyStatus = e.target.value;
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                  />
                </div>

                <div
                  className={styles.commonTitleInput}
                  style={{ marginTop: "10px" }}
                >
                  <div className="platParamsSetting-label">视频分类</div>
                  <Select
                    style={{ width: "100%" }}
                    options={youTubeCategories}
                    value={pubItem.params.option.youtube?.categoryId}
                    onChange={(value) => {
                      const option = pubItem.params.option;
                      if (!option.youtube) {
                        option.youtube = {};
                      }
                      option.youtube.categoryId = value;
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                    showSearch={true}
                    placeholder="请选择视频分类"
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

export default YouTubeParams; 