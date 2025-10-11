import { ForwardedRef, forwardRef, memo, useEffect } from "react";
import {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type";
import PubParmasTextarea from "@/components/PublishDialog/compoents/PubParmasTextarea";
import usePlatParamsCommon from "@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon";
import CommonTitleInput from "@/components/PublishDialog/compoents/PlatParamsSetting/common/CommonTitleInput";
import styles from "../platParamsSetting.module.scss";
import { Radio } from "antd";
import { useTransClient } from "@/app/i18n/client";

const FacebookParams = memo(
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { t } = useTransClient("publish");
      const { pubParmasTextareaCommonParams, setOnePubParams } =
        usePlatParamsCommon(pubItem);

      // 初始化Facebook参数
      useEffect(() => {
        const option = pubItem.params.option;
        if (!option.facebook || !option.facebook.content_category) {
          setOnePubParams(
            {
              option: {
                ...option,
                facebook: {
                  ...option.facebook,
                  content_category: "post",
                },
              },
            },
            pubItem.account.id,
          );
        }
      }, [pubItem.account.id, setOnePubParams]);

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
                  <div className="platParamsSetting-label">
                    {t("form.type")}
                  </div>
                  <Radio.Group
                    value={
                      pubItem.params.option.facebook?.content_category ||
                      "video"
                    }
                    onChange={(e) => {
                      const option = pubItem.params.option;
                      setOnePubParams(
                        {
                          option: {
                            ...option,
                            facebook: {
                              ...option.facebook,
                              content_category: e.target.value,
                            },
                          },
                        },
                        pubItem.account.id,
                      );
                    }}
                  >
                    <Radio value="post">Post</Radio>
                    <Radio value="reel">Reel</Radio>
                    <Radio value="story">Story</Radio>
                  </Radio.Group>
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
