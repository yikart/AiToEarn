"use client";

import { usePathname } from "next/navigation";
import LyaoutHeader from "@/app/layout/LyaoutHeader";
import HomeHeader from "@/app/layout/HomeHeader";
import { homeHeaderRouterData } from "@/app/layout/routerData";
import { removeLocalePrefix } from "@/app/layout/layout.utils";

export default function ConditionalHeader() {
  const pathname = usePathname();

  if (
    homeHeaderRouterData.value.some(
      (v) => v.href === removeLocalePrefix(pathname),
    )
  ) {
    return <HomeHeader />;
  }

  return <LyaoutHeader />;
}
