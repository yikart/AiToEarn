import { PageParams } from "@/app/globals";
import { getMetadata } from "@/utils/general";
import { HotContentCore } from "@/app/[lng]/hotContent/HotContentCore";

export async function generateMetadata({ params }: PageParams) {
  return await getMetadata(
    {
      title: "热门内容",
    },
    "en",
  );
}

export default function Page() {
  return <HotContentCore />;
}
