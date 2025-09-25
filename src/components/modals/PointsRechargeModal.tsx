"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Button, InputNumber, Typography, Space, message } from "antd";
import styles from "./outsideCloseModal.module.css";
import { createPaymentOrderApi, PaymentType } from "@/api/vip";
import { useUserStore } from "@/store/user";

interface PointsRechargeModalProps {
  open: boolean;
  onClose: () => void;
}

const PointsRechargeModal = memo(({ open, onClose }: PointsRechargeModalProps) => {
  const [rechargeAmount, setRechargeAmount] = useState<number>(8);
  const [buyLoading, setBuyLoading] = useState(false);
  const userStore = useUserStore();
  const modalWidth = useMemo(() => 520, []);
  const sliderTrackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const amountToPercent = (amount: number) => ((amount - 1) / 49) * 100; // 1..50
  const percentToAmount = (percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    const val = 1 + Math.round((clamped / 100) * 49);
    return val;
  };

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    setRechargeAmount(percentToAmount(percent));
  };

  const onMouseDownHandle = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDragging(true);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging || !sliderTrackRef.current) return;
      const rect = sliderTrackRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setRechargeAmount(percentToAmount(percent));
    };
    const onUp = () => setDragging(false);
    if (dragging) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  return (
    <Modal
      title={<span style={{fontWeight:700}}>购买积分</span>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={modalWidth}
      centered
      className={styles.outsideCloseModal}
      destroyOnClose
    >
      <Space direction="vertical" size={16} style={{width:'100%'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span style={{color:'#6b7280'}}>当前积分</span>
          <span style={{fontWeight:700}}>{userStore.userInfo?.score || 0}</span>
        </div>
        <div>
          <Typography.Text type="secondary">每1000积分售价15美元</Typography.Text>
          {/* Slider */}
          <div style={{ marginTop: 12 }}>
            <div
              ref={sliderTrackRef}
              onClick={handleSliderClick}
              style={{
                position: 'relative',
                height: 8,
                background: '#e5e7eb',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${amountToPercent(rechargeAmount)}%`,
                  background: 'var(--theColor5)',
                  borderRadius: 6
                }}
              />
              <div
                onMouseDown={onMouseDownHandle}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `calc(${amountToPercent(rechargeAmount)}% - 10px)`,
                  width: 20,
                  height: 20,
                  background: '#ffffff',
                  border: '2px solid var(--theColor5)',
                  borderRadius: '50%',
                  transform: 'translateY(-50%)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  cursor: 'grab'
                }}
              />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6b7280', marginTop:6 }}>
              <span>1K</span>
              <span>50K</span>
            </div>
          </div>
          <div style={{marginTop:12, display:'flex', alignItems:'center', gap:12}}>
            <InputNumber min={1} max={50} value={rechargeAmount} onChange={(v) => setRechargeAmount(Number(v) || 1)} />
            <span>* 1000 积分</span>
          </div>
        </div>
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <span>购买积分</span>
          <span style={{fontWeight:700}}>{rechargeAmount * 1000}</span>
        </div>
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <span>总价</span>
          <span style={{fontWeight:700}}>${(rechargeAmount * 15).toFixed(2)}</span>
        </div>
        <Button type="primary" block loading={buyLoading} onClick={async () => {
          try {
            setBuyLoading(true);
            if (!userStore.userInfo?.id) {
              message.error('请先登录');
              return;
            }
            const res: any = await createPaymentOrderApi({
              mode: 'payment',
              payment: PaymentType.POINTS,
              flagTrialPeriodDays: 0,
              metadata: { userId: userStore.userInfo.id },
              success_url: userStore.lang === 'zh-CN' ? '/zh-CN/profile' : '/en/profile'
            });
            if (res?.code === 0 && res.data?.url) {
              window.open(res.data.url, '_blank');
            } else {
              message.error(res?.message || res?.msg || '创建支付订单失败');
            }
          } catch (e) {
            message.error('创建支付订单失败');
          } finally {
            setBuyLoading(false);
          }
        }}>立即购买</Button>
      </Space>
    </Modal>
  );
});

export default PointsRechargeModal;


