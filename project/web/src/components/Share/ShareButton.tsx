/**
 * ShareButton - 小型分享图标按钮
 */
"use client";

import React from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
}

export const ShareButton = ({ onClick, ariaLabel = "share" }: ShareButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="w-8 h-8"
      aria-label={ariaLabel}
    >
      <Share2 className="w-5 h-5" />
    </Button>
  );
};

export default ShareButton;


