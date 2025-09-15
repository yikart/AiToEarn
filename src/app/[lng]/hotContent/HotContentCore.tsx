"use client";
import styles from "./hotContent.module.scss";
import HotContentSidebar from "@/app/[lng]/hotContent/components/HotContentSidebar";

export const HotContentCore = () => {
  return (
    <div className={styles.hotContent}>
      <HotContentSidebar />
    </div>
  );
};
