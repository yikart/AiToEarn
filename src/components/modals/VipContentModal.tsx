"use client";

import { memo, useMemo } from "react";
import { Modal } from "antd";
import styles from "./outsideCloseModal.module.css";
import VipPage from "@/app/[lng]/vip/page";
import { useUserStore } from "@/store/user";

interface VipContentModalProps {
  open: boolean;
  onClose: () => void;
}

const VipContentModal = memo(({ open, onClose }: VipContentModalProps) => {
  const { lang } = useUserStore();
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
      {/* 直接渲染 VIP 页面核心内容 */}
      {/* VipPage 内部使用 i18n，依赖 store 的 lang 即可 */}
      <VipPage />
    </Modal>
  );
});

export default VipContentModal;


