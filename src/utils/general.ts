import { Metadata } from "next";
import { useTranslation } from "@/app/i18n";

export async function getPageTitle(name: string, lng: string) {
  const { t } = await useTranslation(lng);
  return `${name} —— ${t("title")}`;
}

/**
 * 拦截 Metadata
 * @param props
 * @param lng
 */
export async function getMetadata(
  props: Metadata,
  lng: string,
): Promise<Metadata> {
  const title = await getPageTitle(
    typeof props.title === "string" ? props.title : "",
    lng,
  );
  return {
    ...props,
    title,
  };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
