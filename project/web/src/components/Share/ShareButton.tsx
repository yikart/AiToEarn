/**
 * ShareButton - 小型分享图标按钮
 */
"use client";

import React from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransClient } from "@/app/i18n/client";

interface ShareButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
}

export const ShareButton = ({ onClick, ariaLabel }: ShareButtonProps) => {
  const { t } = useTransClient("share");
  const label = ariaLabel || t("share");
  return (
    <button
      onClick={() => onClick}
      className="ml-1 text-sm text-muted-foreground sm:inline flex items-center"
      aria-label={t("task.rate") || "Rate"}
    >
      <Button variant="ghost" size="icon" onClick={onClick} className="w-8 h-8">
        <Share2 className="w-5 h-5" />
      </Button>
      {t("task.rate") || "评分"}
    </button>
  );
};

export default ShareButton;
