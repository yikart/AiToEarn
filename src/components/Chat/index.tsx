import { ForwardedRef, forwardRef, memo, useEffect, useState } from "react";
import * as React from "react";

export interface IChatRef {}

export interface IChatProps {
  defaultMask?: string;
}

const Chat = memo(
  forwardRef(({ defaultMask }: IChatProps, ref: ForwardedRef<IChatRef>) => {
    const [iframeUrl, setIframeUrl] = useState("");

    useEffect(() => {
      setIframeUrl(
        `${
          location.origin.includes("localhost")
            ? "https://dev.aitoearn.ai"
            : location.origin
        }/chat/#/new-chat?mask=${defaultMask}`,
      );
    }, []);

    return (
      <iframe
        src={iframeUrl}
        style={{ height: "100%", border: "none", width: "100%" }}
      />
    );
  }),
);

export default Chat;
