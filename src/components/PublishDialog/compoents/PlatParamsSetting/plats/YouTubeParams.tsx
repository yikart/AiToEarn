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
import { useTransClient } from "@/app/i18n/client";

const YouTubeParams = memo(
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { t } = useTransClient("publish");
      const { pubParmasTextareaCommonParams, setOnePubParams } =
        usePlatParamsCommon(pubItem);
      const { 
        getYouTubeRegions, 
        getYouTubeCategories, 
        youTubeRegions, 
        youTubeCategories 
      } = usePublishDialogData(
        useShallow((state) => ({
          getYouTubeRegions: state.getYouTubeRegions,
          getYouTubeCategories: state.getYouTubeCategories,
          youTubeRegions: state.youTubeRegions,
          youTubeCategories: state.youTubeCategories,
        })),
      );

      useEffect(() => {
        getYouTubeRegions();
      }, [getYouTubeRegions]);

      // 初始化YouTube参数
      useEffect(() => {
        const option = pubItem.params.option;
        if (!option.youtube) {
          option.youtube = {};
        }
        if (!option.youtube.privacyStatus) {
          option.youtube.privacyStatus = 'public';
          setOnePubParams(
            {
              option,
            },
            pubItem.account.id,
          );
        }
      }, [pubItem.account.id]);

      // 当国区变化时，重新获取视频分类
      useEffect(() => {
        const regionCode = pubItem.params.option.youtube?.regionCode;
        if (regionCode) {
          getYouTubeCategories(regionCode);
        }
      }, [pubItem.params.option.youtube?.regionCode, getYouTubeCategories]);

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
                  <div className="platParamsSetting-label">{t("form.privacyStatus")}</div>
                  <Radio.Group
                    value={pubItem.params.option.youtube?.privacyStatus}
                    options={[
                      { value: "public", label: t("form.public") },
                      { value: "unlisted", label: t("form.unlisted") },
                      { value: "private", label: t("form.private") },
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
                  <div className="platParamsSetting-label">{t("form.region")}</div>
                  <Select
                    style={{ width: "100%" }}
                    options={youTubeRegions.map((item) => ({
                      label: item,
                      value: item,
                    }))}
                    value={pubItem.params.option.youtube?.regionCode}
                    onChange={(value) => {
                      const option = pubItem.params.option;
                      if (!option.youtube) {
                        option.youtube = {};
                      }
                      option.youtube.regionCode = value;
                      // 清空之前选择的视频分类
                      option.youtube.categoryId = undefined;
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                    showSearch={true}
                    placeholder={t("form.regionPlaceholder")}
                  />
                </div>

                <div
                  className={styles.commonTitleInput}
                  style={{ marginTop: "10px" }}
                >
                  <div className="platParamsSetting-label">{t("form.category")}</div>
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
                    placeholder={pubItem.params.option.youtube?.regionCode ? t("form.categoryPlaceholder") : t("form.categoryPlaceholderDisabled")}
                    disabled={!pubItem.params.option.youtube?.regionCode}
                    fieldNames={{
                      label: "etag",
                      value: "etag",
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