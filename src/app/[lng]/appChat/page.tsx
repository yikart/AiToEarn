import { PageParams } from "@/app/globals";
import * as React from "react";
import { getMetadata } from "@/utils/general";

export async function generateMetadata({ params }: PageParams) {
  return await getMetadata(
    {
      title: "Chat",
    },
    "en",
  );
}

export default function Page({ params }: PageParams) {
  return (
    <iframe
      src="https://aitoearn.ai/chat"
      style={{ height: "100%", border: "none" }}
    />
  );
}
