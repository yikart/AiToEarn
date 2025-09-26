"use client";

import { memo, useMemo, useState } from "react";
import { Modal, Button, Tag, message } from "antd";
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
  const modalWidth = useMemo(() => "76%" as const, []);
  const [rechargeVisible, setRechargeVisible] = useState(false);

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
             style={{background: 'transparent'}}>
          <div className={vipStyles.titleBlock}>
            <h2 className={vipStyles.title}>
              1元试用7天会员 <span className={vipStyles.highlight}>立得200积分</span>
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
        {/* <div className={vipStyles.switchRow}>
          <div className={`${vipStyles.switchBtn} ${vipStyles.active}`}>连续包年 <Tag color="#2bd3ff" style={{marginLeft: 6}}>5折</Tag></div>
          <div className={vipStyles.switchBtn}>连续包月 <Tag color="#2bd3ff" style={{marginLeft: 6}}>6折</Tag></div>
          <div className={vipStyles.switchBtn}>单月购买</div>
        </div> */}

        {/* 价格区域 */}
        <div className={vipStyles.grid}>
          {/* 左侧免费卡片 */}
          <div className={vipStyles.freeCard}>
            <div className={vipStyles.freeTitle}>免费</div>
            <div className={vipStyles.freePrice}><span>¥</span>0<span className={vipStyles.unit}>每月</span></div>
            <div className={vipStyles.freeForever}>永久</div>
            <Button disabled className={vipStyles.freeBtn}>当前计划</Button>
            <div className={vipStyles.freeItem}>每天赠送积分</div>
          </div>

          {/* 基础会员 */}
          <div className={vipStyles.planCard}>
            <div className={vipStyles.planHead}>✚ 基础会员</div>
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

          {/* 标准会员 */}
          <div className={vipStyles.planCard}>
            <div className={vipStyles.planHead}>✚ 标准会员</div>
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

          {/* 高级会员 */}
          <div className={`${vipStyles.planCard} ${vipStyles.premium}`}
               >
            <div className={vipStyles.planHead}>✚ 高级会员 <Tag color="#5b7cff">最划算</Tag></div>
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
          </div>
        </div>
      </div>

      {/* 积分详情弹窗（复用组件） */}
      <PointsDetailModal open={pointsModalVisible} onClose={() => setPointsModalVisible(false)} />

      <PointsRechargeModal open={rechargeVisible} onClose={() => setRechargeVisible(false)} />
    </Modal>
  );
});

export default VipContentModal;


