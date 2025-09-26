"use client";

import { memo, useMemo, useState, useEffect } from "react";
import { Modal, Button, Tag, message } from "antd";
import { useRouter } from "next/navigation";
import { createPaymentOrderApi, PaymentType } from "@/api/vip";
import { useTransClient } from "@/app/i18n/client";
import styles from "./outsideCloseModal.module.css";
import vipStyles from "./vipContentModal.module.css";
import PointsDetailModal from "@/components/modals/PointsDetailModal";
import { useUserStore } from "@/store/user";
import PointsRechargeModal from "@/components/modals/PointsRechargeModal";

interface VipContentModalProps {
  open: boolean;
  onClose: () => void;
}

const VipContentModal = memo(({ open, onClose }: VipContentModalProps) => {
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const userStore = useUserStore();
  const router = useRouter();
  const { t } = useTransClient('vip');
  const modalWidth = useMemo(() => "66%" as const, []);
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'year' | 'month' | 'once'>('year');
  const [loading, setLoading] = useState(false);
  const [canUseTrial, setCanUseTrial] = useState(false);
  
  const handleTabClick = (tab: 'year' | 'month' | 'once') => {
    setActiveTab(tab);
  };

  // 检查用户是否可以享受免费试用
  useEffect(() => {
    if (userStore.userInfo) {
      // 如果用户没有vipInfo，说明从未开过会员，可以享受免费试用
      const hasVipInfo = userStore.userInfo.vipInfo && Object.keys(userStore.userInfo.vipInfo).length > 0;
      setCanUseTrial(!hasVipInfo);
    }
  }, [userStore.userInfo]);

  // 开通会员逻辑
  const handleActivate = async (planType: 'year' | 'month' | 'once') => {
    try {
      setLoading(true);
      
      // 检查用户是否已登录
      if (!userStore.userInfo?.id) {
        message.error(t('pleaseLoginFirst'));
        router.push('/login');
        return;
      }

      // 根据选择的计划映射到支付类型
      let paymentType;
      let paymentMethod;
      let flagTrialPeriodDays = 0; // 默认不给免费试用

      switch (planType) {
        case 'once':
          paymentType = PaymentType.ONCE_MONTH;
          paymentMethod = 'payment';
          break;
        case 'month':
          paymentType = PaymentType.MONTH;
          paymentMethod = 'subscription';
          // 如果是订阅模式且用户从未开过会员，给免费试用
          flagTrialPeriodDays = canUseTrial ? 1 : 0;
          break;
        case 'year':
          paymentType = PaymentType.YEAR;
          paymentMethod = 'subscription';
          // 如果是订阅模式且用户从未开过会员，给免费试用
          flagTrialPeriodDays = canUseTrial ? 1 : 0;
          break;
        default:
          paymentType = PaymentType.MONTH;
          paymentMethod = 'subscription';
          flagTrialPeriodDays = canUseTrial ? 1 : 0;
      }
      
      // 创建支付订单
      const response: any = await createPaymentOrderApi({
        success_url: userStore.lang === 'zh-CN' ? "/zh-CN/profile" : "/en/profile",
        mode: paymentMethod,
        payment: paymentType,
        flagTrialPeriodDays,
        metadata: {
          userId: userStore.userInfo.id
        }
      });
      
      if (response?.code === 0) {
        message.success(t('paymentOrderCreated'));
        // 直接跳转到支付页面
        if (response.data?.url) {
          window.open(response.data.url, '_blank');
        } else {
          message.error(t('paymentLinkNotFound'));
        }
      } else {
        message.error(response?.message || response?.msg || t('createPaymentOrderFailed'));
      }
    } catch (error) {
      console.error('创建支付订单失败:', error);
      message.error(t('createPaymentOrderError'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={modalWidth}
      className={styles.outsideCloseModal}
      destroyOnClose
      centered
    >
      <div className={vipStyles.wrapper}>
        {/* 顶部区域 */}
        <div className={vipStyles.header}
          style={{ background: 'transparent' }}>
          <div className={vipStyles.titleBlock}>
            <h2 className={vipStyles.title}>
              免费试用7天会员 <span className={vipStyles.highlight}>立得100积分</span>
            </h2>
            <div className={vipStyles.links}>
              <span>选择合适你的套餐，或直接</span>
              <span className={vipStyles.linkButton}
                onClick={() => setRechargeVisible(true)}
              >购买积分</span>
            </div>
          </div>
          <div className={vipStyles.headerRight}>
            <Button className={vipStyles.pointsBtn} onClick={() => setPointsModalVisible(true)}>积分详情</Button>
          </div>
        </div>

        {/* 顶部选项卡 */}
        <div className={vipStyles.switchRow}>
          <div onClick={() => handleTabClick('year')} className={`${vipStyles.switchBtn} ${activeTab === 'year' ? vipStyles.active : ''}`}>连续包年 <Tag style={{ marginLeft: 6, border: '1px solid rgba(184,221,255,.08)' }}>省50%</Tag></div>
          <div onClick={() => handleTabClick('month')} className={`${vipStyles.switchBtn} ${activeTab === 'month' ? vipStyles.active : ''}`}>连续包月 <Tag style={{ marginLeft: 6, border: '1px solid rgba(184,221,255,.08)' }}>省25%</Tag></div>
          <div onClick={() => handleTabClick('once')} className={`${vipStyles.switchBtn} ${activeTab === 'once' ? vipStyles.active : ''}`}>单月购买</div>
        </div>

        {/* 价格区域 */}
        <div className={vipStyles.grid}>


          {activeTab === 'year' && (
            <>

              {/* 左侧免费卡片 */}
              <div className={vipStyles.freeCard}>
                <div className={vipStyles.freeTitle}>免费</div>
                <div className={vipStyles.freePrice}><span>¥</span>0<span className={vipStyles.unit}>每月</span></div>
                <div className={vipStyles.freeForever}>永久</div>
                <Button disabled className={vipStyles.freeBtn}>当前计划</Button>
                <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> 60积分每月</div>
                <ul className={vipStyles.featureList}>
                  <li>发布赠送积分</li>
                  <li>最高60 积分</li>
                  <li>每月最高可生成60个视频</li>
                  <li>每月最高可生成120张图片</li>
                  <li>存储空间500M</li>
                </ul>
              </div>

              {/* 高级会员 */}
              <div className={`${vipStyles.planCard} ${vipStyles.premium}`} >
                <div className={vipStyles.planHead}>年度会员 <Tag color="#5b7cff">最划算</Tag></div>
                <div className={vipStyles.planPriceLine}><span className={vipStyles.currency}>$</span><span className={vipStyles.bigNum}>144</span><span className={vipStyles.unit}>每年</span></div>
                <div className={vipStyles.planDesc}>7天免费试用 · <span style={{textDecoration: 'line-through'}}>$300/年</span> · 包年可随时取消</div>
                 <Button 
                   className={vipStyles.primaryBtn}
                   onClick={() => handleActivate('year')}
                   loading={loading}
                 >
                   $144/年 省50%
                 </Button>
                <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> 8,400积分</div>
                <div className={vipStyles.subDesc}>最多生成16,800张图和8,400个视频</div>
                <ul className={vipStyles.featureList}>
                  <li>每天赠送积分</li>
                  <li>内容安全审核</li>
                  <li>多模型一站式支持</li>
                  <li>文字转视频，图文转视频</li>
                  <li>AI动画生成，AI图像生成</li>
                  <li>无水印输出，更快的生成速度</li>
                  <li>存储空间5G</li>
                </ul>
              </div>
            </>
          )}


          {activeTab === 'month' && (
            <>
              {/* 左侧免费卡片 */}
              <div className={vipStyles.freeCard}>
                <div className={vipStyles.freeTitle}>免费</div>
                <div className={vipStyles.freePrice}><span>¥</span>0<span className={vipStyles.unit}>每月</span></div>
                <div className={vipStyles.freeForever}>永久</div>
                <Button disabled className={vipStyles.freeBtn}>当前计划</Button>
                <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> 60积分每月</div>
                <ul className={vipStyles.featureList}>
                  <li>发布赠送积分</li>
                  <li>最高60 积分</li>
                  <li>每月最高可生成60个视频</li>
                  <li>每月最高可生成120张图片</li>
                  <li>存储空间500M</li>
                </ul>
              </div>

               {/* 月度会员 */}
               <div className={`${vipStyles.planCard} ${vipStyles.premium}`} >
                 <div className={vipStyles.planHead}>月度会员 </div>
                 <div className={vipStyles.planPriceLine}><span className={vipStyles.currency}>$</span><span className={vipStyles.bigNum}>228</span><span className={vipStyles.unit}>每年</span></div>
                 <div className={vipStyles.planDesc}>7天免费试用 · <span style={{textDecoration: 'line-through'}}>$25/月</span> · 包月可随时取消</div>
                 <Button 
                   className={vipStyles.primaryBtn}
                   onClick={() => handleActivate('month')}
                   loading={loading}
                 >
                   $19/月 省25%
                 </Button>
                <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> 8,400积分</div>
                <div className={vipStyles.subDesc}>最多生成16,800张图和8,400个视频</div>
                <ul className={vipStyles.featureList}>
                  <li>每天赠送积分</li>
                  <li>内容安全审核</li>
                  <li>多模型一站式支持</li>
                  <li>文字转视频，图文转视频</li>
                  <li>AI动画生成，AI图像生成</li>
                  <li>无水印输出，更快的生成速度</li>
                  <li>存储空间5G</li>
                </ul>
              </div>
            </>
          )}

          {activeTab === 'once' && (
            <>
              {/* 左侧免费卡片 */}
              <div className={vipStyles.freeCard}>
                <div className={vipStyles.freeTitle}>免费</div>
                <div className={vipStyles.freePrice}><span>¥</span>0<span className={vipStyles.unit}>每月</span></div>
                <div className={vipStyles.freeForever}>永久</div>
                <Button disabled className={vipStyles.freeBtn}>当前计划</Button>
                <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> 60积分每月</div>
                <ul className={vipStyles.featureList}>
                  <li>发布赠送积分</li>
                  <li>最高60 积分</li>
                  <li>每月最高可生成60个视频</li>
                  <li>每月最高可生成120张图片</li>
                  <li>存储空间500M</li>
                </ul>
              </div>

               {/* 一次性月度会员 */}
               <div className={`${vipStyles.planCard} ${vipStyles.premium}`} >
                 <div className={vipStyles.planHead}>一次性月度会员 </div>
                 <div className={vipStyles.planPriceLine}><span className={vipStyles.currency}>$</span><span className={vipStyles.bigNum}>25</span><span className={vipStyles.unit}>每月</span></div>
                 <Button 
                   className={vipStyles.primaryBtn}
                   onClick={() => handleActivate('once')}
                   loading={loading}
                 >
                   $25/月
                 </Button>
                <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> 700积分</div>
                <div className={vipStyles.subDesc}>最多生成1400张图和700个视频</div>
                <ul className={vipStyles.featureList}>
                  <li>每天赠送积分</li>
                  <li>内容安全审核</li>
                  <li>多模型一站式支持</li>
                  <li>文字转视频，图文转视频</li>
                  <li>AI动画生成，AI图像生成</li>
                  <li>无水印输出，更快的生成速度</li>
                  <li>存储空间3G</li>
                </ul>
              </div>
            </>
          )}

          {/* <div className={vipStyles.freeCard}>
            <div className={vipStyles.freeTitle}>免费</div>
            <div className={vipStyles.freePrice}><span>¥</span>0<span className={vipStyles.unit}>每月</span></div>
            <div className={vipStyles.freeForever}>永久</div>
            <Button disabled className={vipStyles.freeBtn}>当前计划</Button>
            <div className={vipStyles.freeItem}>发布赠送积分</div>
          </div>

          <div className={vipStyles.planCard}>
            <div className={vipStyles.planHead}>一次性月度会员</div>
            <div className={vipStyles.planPriceLine}><span className={vipStyles.currency}>¥</span><span className={vipStyles.bigNum}>1</span><span className={vipStyles.unit}>天</span></div>
            <div className={vipStyles.planDesc}>1元试用7天，首年5折¥329 · 次年¥659自动续费</div>
            <Button className={vipStyles.primaryBtn}>¥1 试用7天</Button>
            <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> 1,080积分每月</div>
            <div className={vipStyles.subDesc}>最多生成4320张图和216个视频</div>
            <ul className={vipStyles.featureList}>
              <li>每天赠送积分</li>
              <li>生成类视频无限次加速</li>
              <li>生成作品去除品牌水印</li>
              <li>视频内置罩</li>
              <li>内容安全审核</li>
              <li>视频更流畅（可补帧到最高60FPS）</li>
            </ul>
          </div>

          <div className={vipStyles.planCard}>
            <div className={vipStyles.planHead}>✚ 月度会员</div>
            <div className={vipStyles.planPriceLine}><span className={vipStyles.currency}>¥</span><span className={vipStyles.bigNum}>949</span><span className={vipStyles.unit}>每年</span></div>
            <div className={vipStyles.planDesc}>首年5折¥949 · 次年续费金额¥1,899 · 包年可随时取消</div>
            <Button className={vipStyles.primaryBtn}>¥949 首年5折</Button>
            <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> 4,000积分每月</div>
            <div className={vipStyles.subDesc}>最多生成16000张图和800个视频</div>
            <ul className={vipStyles.featureList}>
              <li>每天赠送积分</li>
              <li>生成类视频无限次加速</li>
              <li>生成作品去除品牌水印</li>
              <li>视频内置罩</li>
              <li>内容安全审核</li>
              <li>视频更流畅（可补帧到最高60FPS）</li>
            </ul>
          </div>

          <div className={`${vipStyles.planCard} ${vipStyles.premium}`} >
            <div className={vipStyles.planHead}>✚ 年度会员 <Tag color="#5b7cff">最划算</Tag></div>
            <div className={vipStyles.planPriceLine}><span className={vipStyles.currency}>¥</span><span className={vipStyles.bigNum}>2,599</span><span className={vipStyles.unit}>每年</span></div>
            <div className={vipStyles.planDesc}>首年5折¥2,599 · 次年续费金额¥5,199 · 包年可随时取消</div>
            <Button className={vipStyles.primaryBtn}>¥2,599 首年5折</Button>
            <div className={vipStyles.benefitBox}><span className={vipStyles.dot} /> 15,000积分每月</div>
            <div className={vipStyles.subDesc}>最多生成60000张图和3000个视频</div>
            <ul className={vipStyles.featureList}>
              <li>每天赠送积分</li>
              <li>生成类视频无限次加速（最快）</li>
              <li>生成作品去除品牌水印</li>
              <li>视频内置罩</li>
              <li>内容安全审核</li>
              <li>视频更流畅（可补帧到最高60FPS）</li>
            </ul>
          </div> */}




        </div>
      </div>

      {/* 积分详情弹窗（复用组件） */}
      <PointsDetailModal open={pointsModalVisible} onClose={() => setPointsModalVisible(false)} />

      <PointsRechargeModal open={rechargeVisible} onClose={() => setRechargeVisible(false)} />
    </Modal>
  );
});

export default VipContentModal;


