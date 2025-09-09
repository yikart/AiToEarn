"use client";

import { useTranslation } from "@/app/i18n";
import { PageParams } from "@/app/globals";
import * as React from "react";
import { getMetadata } from "@/utils/general";
import { TaskPageCore } from "./taskPageCore";

export async function generateMetadata({ params }: PageParams) {
  const { lng } = await params;
  const { t } = await useTranslation(lng, "common");

  return getMetadata(
    {
      title: t("tasks"),
    },
    lng,
  );
}

export default function TaskPage() {
  return <TaskPageCore />;
}
