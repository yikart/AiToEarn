import { PageParams } from "@/app/globals";
import * as React from "react";
import { getMetadata } from "@/utils/general";
import { AppChatCore } from "@/app/[lng]/appChat/AppChatCore";

export async function generateMetadata({ params }: PageParams) {
  return await getMetadata(
    {
      title: "Chat",
    },
    "en",
  );
}

export default function Page({ params }: PageParams) {
  return <AppChatCore />;
}
