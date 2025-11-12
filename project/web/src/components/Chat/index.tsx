import { ForwardedRef, forwardRef, memo, useEffect, useState } from "react";
import * as React from "react";
import { useGetClientLng } from "@/hooks/useSystem";

export interface IChatRef {}

export interface IChatProps {
  defaultMask?: string;
}

const Chat = memo(
  forwardRef(({ defaultMask }: IChatProps, ref: ForwardedRef<IChatRef>) => {
    const [iframeUrl, setIframeUrl] = useState("");
    const lng = useGetClientLng();

    useEffect(() => {
      const base = location.origin.includes("localhost")
        ? "https://aitoearn.ai"
        : location.origin;

      const params = new URLSearchParams();
      if (defaultMask) params.set("mask", defaultMask);
      if (lng) params.set("lang", lng);

      const qs = params.toString();
      setIframeUrl(
        `${base}/chat${qs ? `?${qs}` : ""}${defaultMask ? "#/new-chat" : "#/chat"}`,
      );
    }, [defaultMask, lng]);

    return (
      <iframe
        src={iframeUrl}
        style={{ height: "100%", border: "none", width: "100%" }}
      />
    );
  }),
);

export default Chat;
