import { useParams } from "next/navigation";
import { fallbackLng, languages } from "@/app/i18n/settings";

export function useGetClientLng() {
  const params = useParams();
  const lng = params?.lng;
  
  // 确保返回的语言在支持的语言列表中
  if (lng && languages.includes(lng as string)) {
    return lng as string;
  }
  
  return fallbackLng;
}
