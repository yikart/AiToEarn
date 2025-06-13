"use client";

import { useState } from "react";
import { CrownOutlined, TrophyOutlined, GiftOutlined, StarOutlined, RocketOutlined, DollarOutlined, HistoryOutlined, ThunderboltOutlined } from "@ant-design/icons";
import styles from "./vip.module.css";

export default function VipPage() {
  const [selectedPlan, setSelectedPlan] = useState('month'); // 'month' or 'year'

  // 会员权益数据 (8个)
  const vipBenefits = [
    { icon: <CrownOutlined />, name: "专属标识" },
    { icon: <TrophyOutlined />, name: "高级功能" },
    { icon: <GiftOutlined />, name: "会员礼包" },
    { icon: <StarOutlined />, name: "优先支持" },
    { icon: <DollarOutlined />, name: "优惠折扣" },
    { icon: <HistoryOutlined />, name: "无限时长" },
    { icon: <ThunderboltOutlined />, name: "极速体验" },
    { icon: <RocketOutlined />, name: "更多特权" }, // 重新排序，因为 RocketOutlined 之前已经用过
  ];

  const handleActivate = () => {
    // 这里可以添加实际的开通逻辑，例如跳转到支付页面或调用支付接口
    alert(`您选择了${selectedPlan === 'month' ? '月度会员' : '年度会员'}，即将开通。`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.vipCard}>
        <div className={styles.vipContent}>
          <div className={styles.vipHeader}>
            <span className={styles.vipIcon}><CrownOutlined /></span>
            <h2 className={styles.vipTitle}>PLUS会员</h2>
          </div>
          <p className={styles.vipDescription}>
            开通会员解锁全部功能，立享8种权益
          </p>
          <div className={styles.benefitsGrid}>
            {vipBenefits.map((benefit, index) => (
              <div key={index} className={styles.benefitItem}>
                <div className={styles.benefitIcon}>{benefit.icon}</div>
                <p className={styles.benefitName}>{benefit.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h3 className={styles.title}>选择开通时长</h3>
      <div className={styles.priceOptions}>
        <div 
          className={`${styles.priceCard} ${selectedPlan === 'month' ? styles.selected : ''}`}
          onClick={() => setSelectedPlan('month')}
        >
          <span className={styles.badge}>最多选择</span>
          <h4>月度会员</h4>
          <div>
            <span className={styles.originalPrice}>¥198</span>
            <span className={styles.discount}>6折</span>
          </div>
          <p className={styles.currentPrice}>¥<span>128</span></p>
        </div>
        <div 
          className={`${styles.priceCard} ${selectedPlan === 'year' ? styles.selected : ''}`}
          onClick={() => setSelectedPlan('year')}
        >
          <span className={styles.badge}>最高优惠</span>
          <h4>年度会员</h4>
          <div>
            <span className={styles.originalPrice}>¥1938</span>
            <span className={styles.discount}>5折</span>
          </div>
          <p className={styles.currentPrice}>¥<span>998</span></p>
        </div>
      </div>
      
      <p className={styles.subscriptionInfo}>自动续订，随时取消</p>

      <button className={styles.activateButton} onClick={handleActivate}>
        立即开通
      </button>
    </div>
  );
} 