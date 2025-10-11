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
import http from "@/utils/request";

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
          const response = await http.get<TikTokCreatorInfo>(`plat/tiktok/creator/info/${pubItem.account.id}`);
          if (response && response.code === 0) {
            setCreatorInfo(response.data as TikTokCreatorInfo);
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
          console.log('Initializing TikTok options:', option.tiktok);
          setOnePubParams({ option }, pubItem.account.id);
        } else {
          console.log('TikTok options already exist:', option.tiktok);
        }
        fetchCreatorInfo();
      }, [pubItem.account.id, pubItem.account.account]);

      // 隐私级别选项映射
      const getPrivacyLevelLabel = (value: string) => {
        switch (value) {
          case 'PUBLIC_TO_EVERYONE':
            return t('tiktok.privacy.public' as any);
          case 'MUTUAL_FOLLOW_FRIENDS':
            return t('tiktok.privacy.friends' as any);
          case 'SELF_ONLY':
            return t('tiktok.privacy.private' as any);
          default:
            return value;
        }
      };

      // 获取合规声明文本和链接
      const getComplianceContent = () => {
        const { brand_organic_toggle, brand_content_toggle } = pubItem.params.option.tiktok || {};
        
        // 根据选择确定链接
        const linkUrl = brand_content_toggle 
          ? 'https://www.tiktok.com/legal/page/global/bc-policy/en'
          : 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en';
        
        // 根据选择确定文本
        let text = '';
        if (brand_organic_toggle && brand_content_toggle) {
          text = t('tiktok.compliance.both' as any);
        } else if (brand_content_toggle) {
          text = t('tiktok.compliance.branded' as any);
        } else if (brand_organic_toggle) {
          text = t('tiktok.compliance.organic' as any);
        } else {
          text = t('tiktok.compliance.default' as any);
        }
        
        // 返回整个文本作为可点击的链接
        return (
          // <></>
          <a 
            href={linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: '#1890ff', 
              textDecoration: 'underline',
              cursor: 'pointer',
              display: 'block',
              width: '100%'
            }}
          >
            {text}
          </a>
        );
      };

      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={
              <>
                {/* <CommonTitleInput pubItem={pubItem}  /> */}
                
                {/* Creator Info Display */}
                {creatorInfo && (
                  <div className={styles.commonTitleInput} style={{ marginTop: "10px" }}>
                                         <div className="platParamsSetting-label">{t('tiktok.creatorInfo' as any)}</div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px',
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
                                         <div className="platParamsSetting-label">{t('tiktok.privacy.title' as any)}</div>
                    <Select
                      style={{ width: "100%", marginLeft: '3px' }}
                      value={pubItem.params.option.tiktok?.privacy_level}
                      onChange={(value) => {
                        const option = pubItem.params.option;
                        option.tiktok!.privacy_level = value;
                        setOnePubParams({ option }, pubItem.account.id);
                      }}
                                             placeholder={t('tiktok.privacy.placeholder' as any)}
                      options={creatorInfo.privacy_level_options.map(level => ({
                        value: level,
                        label: getPrivacyLevelLabel(level)
                      }))}
                    />
                  </div>
                )}

                {/* Allow users to interact */}
                <div className={styles.commonTitleInput} style={{ marginTop: "10px" }}>
                                     <div className="platParamsSetting-label">{t('tiktok.interactions.title' as any)}</div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginLeft: '3px' }}>
                    <Checkbox
                      checked={!pubItem.params.option.tiktok?.comment_disabled}
                      disabled={creatorInfo?.comment_disabled}
                      onChange={(e) => {
                        const option = pubItem.params.option;
                        option.tiktok!.comment_disabled = !e.target.checked;
                        setOnePubParams({ option }, pubItem.account.id);
                      }}
                    >
                                             {t('tiktok.interactions.comment' as any)}
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
                                             {t('tiktok.interactions.duet' as any)}
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
                                             {t('tiktok.interactions.stitch' as any)}
                    </Checkbox>
                  </div>
                </div>

                {/* Commercial Content Disclosure */}
                <div className={styles.commonTitleInput} style={{ marginTop: "10px" }}>
                                     <div className="platParamsSetting-label">{t('tiktok.commercial.title' as any)}</div>
                  <div style={{ marginBottom: '0px' }}>
                    {/* <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      当前状态: {JSON.stringify({
                        brand_organic_toggle: pubItem.params.option.tiktok?.brand_organic_toggle,
                        brand_content_toggle: pubItem.params.option.tiktok?.brand_content_toggle,
                        switch_checked: pubItem.params.option.tiktok?.brand_organic_toggle || pubItem.params.option.tiktok?.brand_content_toggle
                      })}
                    </div> */}
                    <Switch
                      checked={pubItem.params.option.tiktok?.brand_organic_toggle || pubItem.params.option.tiktok?.brand_content_toggle}
                      size="small"
                      style={{ marginTop: '2px', marginLeft: '3px' }}
                      onChange={(checked) => {
                        console.log('TikTok Switch changed:', checked);
                        const option = { ...pubItem.params.option };
                        if (!option.tiktok) {
                          option.tiktok = {
                            privacy_level: '',
                            comment_disabled: false,
                            duet_disabled: false,
                            stitch_disabled: false,
                            brand_organic_toggle: false,
                            brand_content_toggle: false,
                          };
                        }
                        
                        if (!checked) {
                          // 关闭时，清空所有商业内容选项
                          option.tiktok.brand_organic_toggle = false;
                          option.tiktok.brand_content_toggle = false;
                        } else {
                          // 开启时，默认选择"您的品牌"选项
                          option.tiktok.brand_organic_toggle = true;
                          option.tiktok.brand_content_toggle = false;
                        }
                        console.log('TikTok options after change:', option.tiktok);
                        setOnePubParams({ option }, pubItem.account.id);
                      }}
                    />
                                         <span style={{ marginLeft: '8px', fontSize: '11px' }}>{t('tiktok.commercial.toggle' as any)}</span>
                  </div>
                  
                
                </div>

                {(pubItem.params.option.tiktok?.brand_organic_toggle || pubItem.params.option.tiktok?.brand_content_toggle) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', fontSize: '12px' }}>
                      <Checkbox
                        checked={pubItem.params.option.tiktok?.brand_organic_toggle}
                        onChange={(e) => {
                          const option = { ...pubItem.params.option };
                          if (!option.tiktok) {
                            option.tiktok = {
                              privacy_level: '',
                              comment_disabled: false,
                              duet_disabled: false,
                              stitch_disabled: false,
                              brand_organic_toggle: false,
                              brand_content_toggle: false,
                            };
                          }
                          option.tiktok.brand_organic_toggle = e.target.checked;
                          setOnePubParams({ option }, pubItem.account.id);
                        }}
                      >
                                                 {t('tiktok.commercial.yourBrand' as any)}
                      </Checkbox>
                      <Checkbox
                        checked={pubItem.params.option.tiktok?.brand_content_toggle}
                        onChange={(e) => {
                          const option = { ...pubItem.params.option };
                          if (!option.tiktok) {
                            option.tiktok = {
                              privacy_level: '',
                              comment_disabled: false,
                              duet_disabled: false,
                              stitch_disabled: false,
                              brand_organic_toggle: false,
                              brand_content_toggle: false,
                            };
                          }
                          option.tiktok.brand_content_toggle = e.target.checked;
                          setOnePubParams({ option }, pubItem.account.id);
                        }}
                      >
                      {t('tiktok.commercial.brandedContent' as any)} 11
                      </Checkbox>

                      {/* Compliance Declaration */}
                      <div className={styles.commonTitleInput} style={{ marginTop: "10px" }}>
                        <Alert
                          description={getComplianceContent()}
                          type="info"
                          showIcon
                          style={{ fontSize: '12px', padding: '3px 6px' }}
                        />
                      </div>
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

export default TikTokParams;
