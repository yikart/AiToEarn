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
  const { t } = useTransClient('share');
  const label = ariaLabel || t('share');
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="w-8 h-8"
      aria-label={label}
    >
      <Share2 className="w-5 h-5" />
    </Button>
  );
};

export default ShareButton;


