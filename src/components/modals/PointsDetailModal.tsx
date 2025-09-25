"use client";

import { memo } from "react";
import { Modal } from "antd";
import styles from "./outsideCloseModal.module.css";
import IncomePage from "@/app/[lng]/income/page";

interface PointsDetailModalProps {
  open: boolean;
  onClose: () => void;
}

const PointsDetailModal = memo(({ open, onClose }: PointsDetailModalProps) => {
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
      {/* 复用收入/积分详情页内容 */}
      <IncomePage />
    </Modal>
  );
});

export default PointsDetailModal;


