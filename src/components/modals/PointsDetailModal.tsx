"use client";

import { memo, useEffect, useState } from "react";
import { Modal, Tabs, Spin, Popover } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import styles from "./outsideCloseModal.module.css";
import { getPointsRecordsApi } from "@/api/apiReq";
import { useUserStore } from "@/store/user";

interface PointsDetailModalProps {
  open: boolean;
  onClose: () => void;
}

type PointsRecord = {
  _id: string;
  amount: number; // 正数获得 负数消耗
  desc?: string;
  createdAt: string | Date;
};

const PointsDetailModal = memo(({ open, onClose }: PointsDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [activeKey, setActiveKey] = useState<string>('all');
  const { userInfo } = useUserStore();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res: any = await getPointsRecordsApi({ page: 1, pageSize: 50 });
      const list = res?.data?.list || [];
      setRecords(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchRecords();
  }, [open]);

  const filtered = records.filter((r) => {
    if (activeKey === 'all') return true;
    if (activeKey === 'spend') return r.amount < 0;
    if (activeKey === 'earn') return r.amount > 0;
    return true;
  });

  // 剩余积分以用户信息中的 score 为准
  const remain = Math.floor((userInfo?.score as number) || 0);
  const subscribed = 0;
  const recharged = records.filter(r => r.amount > 0 && (r as any).source === 'recharge').reduce((s, r) => s + r.amount, 0);
  const gifted = records.filter(r => r.amount > 0 && (r as any).source === 'gift').reduce((s, r) => s + r.amount, 0);

  const endOfToday = (() => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return d.toLocaleString();
  })();

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      className={styles.outsideCloseModal}
      destroyOnClose
      centered
    >
      <div style={{ background: '#fff', borderRadius: 12 }}>
        {/* 头部汇总 */}
        <div style={{ padding: '16px 20px 0 20px' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>积分详情</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, color: '#111827', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, justifyContent: 'center', flexDirection:'column'  }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>剩余积分</div>
              <div style={{ fontWeight: 700 }}>{remain}</div>
            </div>
            <div style={{ color: '#6b7280' }}>=</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' , flexDirection:'column'}}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>订阅积分</div>
              <div style={{ fontWeight: 700 }}>{subscribed}</div>
            </div>
            <div style={{ color: '#6b7280' }}>+</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' , flexDirection:'column'}}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>充值积分</div>
              <div style={{ fontWeight: 700 }}>{recharged}</div>
            </div>
            <div style={{ color: '#6b7280' }}>+</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flex: 1 , justifyContent: 'flex-end', flexDirection:'column'}}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>赠送积分</div>
              <div style={{ fontWeight: 700 }}>{gifted } &nbsp;
              <Popover
                trigger="hover"
                placement="bottomRight"
                content={
                  <div style={{ padding: 8 }}>
                    <div style={{ border: '1px solid #eef2f7', borderRadius: 10, padding: 12, minWidth: 260 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: '#6b7280' }}>剩余积分</span>
                        <span style={{ fontWeight: 700 }}>{remain}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>积分有效期</span>
                        <span style={{ fontWeight: 700 }}>{endOfToday}</span>
                      </div>
                    </div>
                  </div>
                }
              >
                <InfoCircleOutlined style={{ color: '#9ca3af' }} />
              </Popover>
              </div>
              
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '12px 16px 0 16px' }}>
          <Tabs
            items={[
              { key: 'all', label: '全部' },
              { key: 'spend', label: '消耗' },
              { key: 'earn', label: '获得' },
            ]}
            activeKey={activeKey}
            onChange={setActiveKey}
          />
        </div>

        {/* 列表 */}
        <div style={{ padding: '0 20px 16px 20px', minHeight: 360, maxHeight: '60vh', overflowY: 'auto' }}>
          <Spin spinning={loading}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>没有内容了</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {filtered.map((r) => (
                  <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', border: '1px solid #eef2f7', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{r.desc || '积分变动'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: r.amount >= 0 ? '#10b981' : '#ef4444' }}>
                      {r.amount >= 0 ? `+${r.amount}` : r.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Spin>
        </div>

        <div style={{ padding: '8px 20px 16px 20px', color: '#9ca3af', fontSize: 12 }}>
          仅展示近1个月明细，数据更新可能有延时 积分规则
        </div>
      </div>
    </Modal>
  );
});

export default PointsDetailModal;


