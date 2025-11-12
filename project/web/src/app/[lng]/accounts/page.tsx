import AccountPageCore from "@/app/[lng]/accounts/accountCore";
import { PageParams } from "@/app/globals";
import { useTranslation } from "@/app/i18n";
import { getMetadata } from "@/utils/general";

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

interface AccountsPageProps {
  searchParams: {
    platform?: string;
    spaceId?: string;
  };
}

export default function Page({ searchParams }: AccountsPageProps) {
  return <AccountPageCore searchParams={searchParams} />;
}
