"use client";

import { memo, useMemo, useState } from "react";
import { Modal, Button } from "antd";
import PointsDetailModal from "@/components/modals/PointsDetailModal";
import styles from "./outsideCloseModal.module.css";
import PricingPage from "@/app/[lng]/pricing/page";
import { useUserStore } from "@/store/user";

interface VipContentModalProps {
  open: boolean;
  onClose: () => void;
}

const VipContentModal = memo(({ open, onClose }: VipContentModalProps) => {
  const { lang } = useUserStore();
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const modalWidth = useMemo(() => 960, []);

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
      {/* 渲染定价页内容（隐藏 FAQ） */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="link" onClick={() => setPointsModalVisible(true)}>
            积分详情
          </Button>
        </div>
        <PricingPage hideFaq />
      </div>

      <PointsDetailModal open={pointsModalVisible} onClose={() => setPointsModalVisible(false)} />
    </Modal>
  );
});

export default VipContentModal;


