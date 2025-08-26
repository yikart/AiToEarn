"use client";

import { usePathname } from "next/navigation";
import LyaoutHeader from "@/app/layout/LyaoutHeader";

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // 检查是否是根页面（/zh-CN 或 /en 等）或 websit 下的页面
  const shouldHideHeader = (pathname: string) => {
    // 移除语言前缀，获取实际路径
    const pathWithoutLang = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/';
    
    // 如果是根页面或 websit 下的页面，则隐藏 LyaoutHeader
    return pathWithoutLang === '/' || pathWithoutLang.startsWith('/websit');
  };
  
  if (shouldHideHeader(pathname)) {
    return null;
  }
  
  return <LyaoutHeader />;
} 