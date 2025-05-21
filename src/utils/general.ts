import { APP_TITLE } from "@/constant";
import { Metadata } from "next";

export function getPageTitle(name: string) {
  return `${name} —— ${APP_TITLE}`;
}

/**
 * 拦截 Metadata
 * @param props
 */
export function getMetadata(props: Metadata): Metadata {
  return {
    ...props,
    title: getPageTitle(typeof props.title === "string" ? props.title : ""),
  };
}
