import { useTranslation } from "@/app/i18n";
import { PageParams } from "@/app/globals";
import * as React from "react";
import { getMetadata } from "@/utils/general";
import dynamic from "next/dynamic";

const CgMaterialPageCore = dynamic(
  () => import("./cgmaterialPageCore").then(mod => mod.default || mod.CgMaterialPageCore),
  { ssr: false }
);

export async function generateMetadata({ params }: PageParams) {
  const { lng } = await params;
  return await getMetadata(
    {
      title: "草稿箱",
    },
    lng,
  );
}

export default function Page({ params }: PageParams) {
  return (
    <>
      <CgMaterialPageCore />
    </>
  );
} 