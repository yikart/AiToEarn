import { PageParams } from "@/app/globals";
import { useTranslation } from "@/app/i18n";
import { getMetadata } from "@/utils/general";
import { DataStatisticsCore } from "@/app/[lng]/dataStatistics/DataStatisticsCore";

export async function generateMetadata({ params }: PageParams) {
  const { lng } = await params;
  const { t } = await useTranslation(lng, "account");
  return await getMetadata(
    {
      title: t("title"),
      description: t("describe"),
    },
    lng,
  );
}

export default function Page() {
  return <DataStatisticsCore />;
}
