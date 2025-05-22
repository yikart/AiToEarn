import { languages, fallbackLng } from "../i18n/settings";
import { useTranslation } from "../i18n";
import { PageParams } from "../../../@types/next";

export default async function Page({ params }: { params: PageParams }) {
  let { lng } = await params;
  console.log(lng);
  if (languages.indexOf(lng) < 0) lng = fallbackLng;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = await useTranslation(lng, "footer");

  return <>{t("helpLocize")}</>;
}
