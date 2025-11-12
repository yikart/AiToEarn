import { ForwardedRef, forwardRef, memo, useEffect } from "react";
import { IPlatsParamsProps, IPlatsParamsRef } from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type";
import PubParmasTextarea from "@/components/PublishDialog/compoents/PubParmasTextarea";
import usePlatParamsCommon from "@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon";
import styles from "../platParamsSetting.module.scss";
import { Input } from "antd";
import { useTransClient } from "@/app/i18n/client";

/**
 * 微信公众号平台参数
 * - 独立参数：title（与通用 title 区分，使用 option.wxGzh.title 保存）
 */
const WxGzhParams = memo(
  forwardRef(({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
    const { t } = useTransClient("publish");
    const { pubParmasTextareaCommonParams, setOnePubParams } = usePlatParamsCommon(pubItem);

    // 初始化 wxGzh 参数对象
    // useEffect(() => {
    //   const option = pubItem.params.option;
    //   if (!option.wxGzh) {
    //     option.wxGzh = {};
    //     setOnePubParams({ option }, pubItem.account.id);
    //   }
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [pubItem.account.id]);

    return (
      <>
        <PubParmasTextarea
          {...pubParmasTextareaCommonParams}
          extend={<>
            <div className={styles.commonTitleInput} style={{ marginTop: "10px" }}>
              <div className="platParamsSetting-label">{t("form.title")}</div>
              <Input
                value={pubItem.params.title}
                placeholder={t("form.titlePlaceholder")}
                onChange={(e) => {
                  setOnePubParams({ title: e.target.value }, pubItem.account.id);
                }}
              />
            </div>
          </>}
        />
      </>
    );
  })
);

export default WxGzhParams;


