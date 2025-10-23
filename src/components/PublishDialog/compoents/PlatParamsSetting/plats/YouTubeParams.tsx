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
        getYouTubeCategories,
        youTubeCategories
      } = usePublishDialogData(
        useShallow((state) => ({
          getYouTubeCategories: state.getYouTubeCategories,
          youTubeCategories: state.youTubeCategories,
        })),
      );

      useEffect(() => {
        getYouTubeCategories(pubItem.account.id);
      }, [getYouTubeCategories, pubItem.account.id]);

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
        if (!option.youtube.license) {
          option.youtube.license = 'youtube';
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


      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={
              <>
                <CommonTitleInput pubItem={pubItem} />

                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
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
                      placeholder={t("form.categoryPlaceholder")}
                    />
                  </div>

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

                </div>

                <div
                  className={styles.commonTitleInput}
                  style={{ marginTop: "10px" }}
                >
                  <div className="platParamsSetting-label">{t("form.license" as any)}</div>
                  <Select
                    style={{ width: "100%" }}
                    options={[
                      { value: "youtube", label: t("form.standardYouTubeLicense" as any) },
                      { value: "creativeCommon", label: t("form.creativeCommonsLicense" as any) },
                    ]}
                    value={pubItem.params.option.youtube?.license}
                    onChange={(value) => {
                      const option = pubItem.params.option;
                      if (!option.youtube) {
                        option.youtube = {};
                      }
                      option.youtube.license = value;
                      setOnePubParams(
                        {
                          option,
                        },
                        pubItem.account.id,
                      );
                    }}
                    placeholder={t("form.licensePlaceholder" as any)}
                  />
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

                  <div style={{ width: '40px' }}> </div>
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