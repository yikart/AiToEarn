import { ForwardedRef, forwardRef, memo, useEffect, useState } from "react";
import {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type";
import PubParmasTextarea from "@/components/PublishDialog/compoents/PubParmasTextarea";
import usePlatParamsCommon from "@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon";
import CommonTitleInput from "@/components/PublishDialog/compoents/PlatParamsSetting/common/CommonTitleInput";
import styles from "../platParamsSetting.module.scss";
import { Select, Checkbox, Switch, Alert } from "antd";
import { useTransClient } from "@/app/i18n/client";
import { apiRequest } from "@/utils/request";

// TikTok Creator Info 接口类型
interface TikTokCreatorInfo {
  max_video_post_duration_sec: number;
  privacy_level_options: string[];
  stitch_disabled: boolean;
  comment_disabled: boolean;
  creator_avatar_url: string;
  creator_nickname: string;
  creator_username: string;
  duet_disabled: boolean;
}

const TikTokParams = memo(
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { t } = useTransClient("publish");
      const { pubParmasTextareaCommonParams, setOnePubParams } =
        usePlatParamsCommon(pubItem);
      
      const [creatorInfo, setCreatorInfo] = useState<TikTokCreatorInfo | null>(null);
      const [loading, setLoading] = useState(false);

      // 获取 TikTok Creator Info
      const fetchCreatorInfo = async () => {
        try {
          setLoading(true);
          const response = await apiRequest.get(`/api/plat/tiktok/creator/info/${pubItem.account.account}`);
          if (response.data.code === 0) {
            setCreatorInfo(response.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch TikTok creator info:', error);
        } finally {
          setLoading(false);
        }
      };

      // 初始化 TikTok 参数
      useEffect(() => {
        const option = pubItem.params.option;
        if (!option.tiktok) {
          option.tiktok = {
            privacy_level: '',
            comment_disabled: false,
            duet_disabled: false,
            stitch_disabled: false,
            brand_organic_toggle: false,
            brand_content_toggle: false,
          };
          setOnePubParams({ option }, pubItem.account.id);
        }
        fetchCreatorInfo();
      }, [pubItem.account.id, pubItem.account.account]);

      // 隐私级别选项映射
      const getPrivacyLevelLabel = (value: string) => {
        switch (value) {
          case 'PUBLIC_TO_EVERYONE':
            return t('tiktok.privacy.public');
          case 'MUTUAL_FOLLOW_FRIENDS':
            return t('tiktok.privacy.friends');
          case 'SELF_ONLY':
            return t('tiktok.privacy.private');
          default:
            return value;
        }
      };

      // 获取合规声明文本
      const getComplianceText = () => {
        const { brand_organic_toggle, brand_content_toggle } = pubItem.params.option.tiktok || {};
        
        if (brand_organic_toggle && brand_content_toggle) {
          return t('tiktok.compliance.both');
        } else if (brand_content_toggle) {
          return t('tiktok.compliance.branded');
        } else if (brand_organic_toggle) {
          return t('tiktok.compliance.organic');
        } else {
          return t('tiktok.compliance.default');
        }
      };

      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={
              <>
                <CommonTitleInput pubItem={pubItem} />
                
                {/* Creator Info Display */}
                {creatorInfo && (
                  <div className={styles.commonTitleInput} style={{ marginTop: "10px" }}>
                    <div className="platParamsSetting-label">{t('tiktok.creatorInfo')}</div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px',
                      background: '#f5f5f5',
                      borderRadius: '4px'
                    }}>
                      <img 
                        src={creatorInfo.creator_avatar_url} 
                        alt="Creator Avatar"
                        style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                      />
                      <span style={{ fontWeight: 500 }}>{creatorInfo.creator_nickname}</span>
                      <span style={{ color: '#666' }}>(@{creatorInfo.creator_username})</span>
                    </div>
                  </div>
                )}

                {/* Privacy Level Selection */}
                {creatorInfo && (
                  <div className={styles.commonTitleInput} style={{ marginTop: "10px" }}>
                    <div className="platParamsSetting-label">{t('tiktok.privacy.title')}</div>
                    <Select
                      style={{ width: "100%" }}
                      value={pubItem.params.option.tiktok?.privacy_level}
                      onChange={(value) => {
                        const option = pubItem.params.option;
                        option.tiktok!.privacy_level = value;
                        setOnePubParams({ option }, pubItem.account.id);
                      }}
                      placeholder={t('tiktok.privacy.placeholder')}
                      options={creatorInfo.privacy_level_options.map(level => ({
                        value: level,
                        label: getPrivacyLevelLabel(level)
                      }))}
                    />
                  </div>
                )}

                {/* Allow users to interact */}
                <div className={styles.commonTitleInput} style={{ marginTop: "10px" }}>
                  <div className="platParamsSetting-label">{t('tiktok.interactions.title')}</div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                    <Checkbox
                      checked={!pubItem.params.option.tiktok?.comment_disabled}
                      disabled={creatorInfo?.comment_disabled}
                      onChange={(e) => {
                        const option = pubItem.params.option;
                        option.tiktok!.comment_disabled = !e.target.checked;
                        setOnePubParams({ option }, pubItem.account.id);
                      }}
                    >
                      {t('tiktok.interactions.comment')}
                    </Checkbox>
                    <Checkbox
                      checked={!pubItem.params.option.tiktok?.duet_disabled}
                      disabled={creatorInfo?.duet_disabled}
                      onChange={(e) => {
                        const option = pubItem.params.option;
                        option.tiktok!.duet_disabled = !e.target.checked;
                        setOnePubParams({ option }, pubItem.account.id);
                      }}
                    >
                      {t('tiktok.interactions.duet')}
                    </Checkbox>
                    <Checkbox
                      checked={!pubItem.params.option.tiktok?.stitch_disabled}
                      disabled={creatorInfo?.stitch_disabled}
                      onChange={(e) => {
                        const option = pubItem.params.option;
                        option.tiktok!.stitch_disabled = !e.target.checked;
                        setOnePubParams({ option }, pubItem.account.id);
                      }}
                    >
                      {t('tiktok.interactions.stitch')}
                    </Checkbox>
                  </div>
                </div>

                {/* Commercial Content Disclosure */}
                <div className={styles.commonTitleInput} style={{ marginTop: "10px" }}>
                  <div className="platParamsSetting-label">{t('tiktok.commercial.title')}</div>
                  <div style={{ marginBottom: '8px' }}>
                    <Switch
                      checked={pubItem.params.option.tiktok?.brand_organic_toggle || pubItem.params.option.tiktok?.brand_content_toggle}
                      onChange={(checked) => {
                        const option = pubItem.params.option;
                        if (!checked) {
                          option.tiktok!.brand_organic_toggle = false;
                          option.tiktok!.brand_content_toggle = false;
                        }
                        setOnePubParams({ option }, pubItem.account.id);
                      }}
                    />
                    <span style={{ marginLeft: '8px', fontSize: '11px' }}>{t('tiktok.commercial.toggle')}</span>
                  </div>
                  
                  {(pubItem.params.option.tiktok?.brand_organic_toggle || pubItem.params.option.tiktok?.brand_content_toggle) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <Checkbox
                        checked={pubItem.params.option.tiktok?.brand_organic_toggle}
                        onChange={(e) => {
                          const option = pubItem.params.option;
                          option.tiktok!.brand_organic_toggle = e.target.checked;
                          setOnePubParams({ option }, pubItem.account.id);
                        }}
                      >
                        {t('tiktok.commercial.yourBrand')}
                      </Checkbox>
                      <Checkbox
                        checked={pubItem.params.option.tiktok?.brand_content_toggle}
                        onChange={(e) => {
                          const option = pubItem.params.option;
                          option.tiktok!.brand_content_toggle = e.target.checked;
                          setOnePubParams({ option }, pubItem.account.id);
                        }}
                      >
                        {t('tiktok.commercial.brandedContent')}
                      </Checkbox>
                    </div>
                  )}
                </div>

                {/* Compliance Declaration */}
                <div className={styles.commonTitleInput} style={{ marginTop: "10px" }}>
                  <Alert
                    message={getComplianceText()}
                    type="info"
                    showIcon
                    style={{ fontSize: '12px' }}
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

export default TikTokParams;
