"use client";
import styles from "./hotContent.module.scss";
import HotContentSidebar from "@/app/[lng]/hotContent/components/HotContentSidebar";
import HotContent from "@/app/[lng]/hotContent/components/HotContent";
import { useHotContent } from "@/app/[lng]/hotContent/useHotContent";
import { useShallow } from "zustand/react/shallow";
import { HotType } from "@/app/[lng]/hotContent/hotContent.enum";
import HotEvent from "@/app/[lng]/hotContent/components/HotEvent";
import HotFeatures from "@/app/[lng]/hotContent/components/HotFeatures";
import HotTitle from "@/app/[lng]/hotContent/components/HotTitle";
import { Spin } from "antd";
import { RankingContentsResponse } from "@/api/hot";

export const HotContentCore = ({
  defaultHotContentData,
}: {
  defaultHotContentData?: RankingContentsResponse;
}) => {
  const { hotType, pageLoading } = useHotContent(
    useShallow((state) => ({
      hotType: state.hotType,
      pageLoading: state.pageLoading,
    })),
  );

  return (
    <Spin
      spinning={pageLoading}
      size="large"
      wrapperClassName={styles.hotContent}
    >
      <div className="hotContent-wrapper">
        <HotContentSidebar />

        <div className="hotContent-content">
          {hotType === HotType.hotContent ? (
            <HotContent defaultHotContentData={defaultHotContentData} />
          ) : hotType === HotType.hotEvent ? (
            <HotEvent />
          ) : hotType === HotType.hotFeatures ? (
            <HotFeatures />
          ) : (
            <HotTitle />
          )}
        </div>
      </div>
    </Spin>
  );
};
