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
import { Radio, Select, Checkbox } from "antd";
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
        let needsUpdate = false;
        
        if (!option.youtube.privacyStatus) {
          option.youtube.privacyStatus = 'public';
          needsUpdate = true;
        }
        if ((option.youtube as any).notifySubscribers === undefined) {
          (option.youtube as any).notifySubscribers = true;
          needsUpdate = true;
        }
        if ((option.youtube as any).embeddable === undefined) {
          (option.youtube as any).embeddable = true;
          needsUpdate = true;
        }
        if ((option.youtube as any).selfDeclaredMadeForKids === undefined) {
          (option.youtube as any).selfDeclaredMadeForKids = false;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
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

                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px'}}>


                <div
                  className={styles.commonTitleInput}
                  style={{ marginTop: "10px", flex: 1 }}
                >
                  <div className="platParamsSetting-label">{t("form.privacyStatus")}</div>
                  <Select
                    value={pubItem.params.option.youtube?.privacyStatus}
                    options={[
                      { value: "public", label: t("form.public") },
                      { value: "unlisted", label: t("form.unlisted") },
                      { value: "private", label: t("form.private") },
                    ]}
                    onChange={(value) => {
                      const option = pubItem.params.option;
                      if (!option.youtube) {
                        option.youtube = {};
                      }
                      option.youtube.privacyStatus = value;
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                    style={{ width: "100%" }}
                    placeholder="请选择隐私状态"
                  />
                </div>

                <div
                  className={styles.commonTitleInput}
                  style={{ marginTop: "10px", flex: 1 }}
                >
                  <div className="platParamsSetting-label">{t("form.category")}</div>
                  <Select
                    style={{ width: "100%" }}
                    options={youTubeCategories.map((item) => ({
                      label: item.snippet.title,
                      value: item.id,
                    }))}
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
                  />
                </div>

                </div>

                {/* YouTube 复选框选项 */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '20px',
                  flexWrap: 'wrap'
                }}>

                  <div style={{width: '40px'}}> </div>
                  <Checkbox
                    checked={(pubItem.params.option.youtube as any)?.notifySubscribers}
                    onChange={(e) => {
                      const option = pubItem.params.option;
                      if (!option.youtube) {
                        option.youtube = {};
                      }
                      (option.youtube as any).notifySubscribers = e.target.checked;
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                  >
                    Notify Subscribers
                  </Checkbox>

                  <Checkbox
                    checked={(pubItem.params.option.youtube as any)?.embeddable}
                    onChange={(e) => {
                      const option = pubItem.params.option;
                      if (!option.youtube) {
                        option.youtube = {};
                      }
                      (option.youtube as any).embeddable = e.target.checked;
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                  >
                    Allow Embedding
                  </Checkbox>

                  <Checkbox
                    checked={(pubItem.params.option.youtube as any)?.selfDeclaredMadeForKids}
                    onChange={(e) => {
                      const option = pubItem.params.option;
                      if (!option.youtube) {
                        option.youtube = {};
                      }
                      (option.youtube as any).selfDeclaredMadeForKids = e.target.checked;
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                  >
                    Made for Kids
                  </Checkbox>
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