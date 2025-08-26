import { useParams } from "next/navigation";
import { fallbackLng } from "@/app/i18n/settings";

export function useGetClientLng() {
  const lng = useParams()?.lng || fallbackLng;
  return lng as string;
}
