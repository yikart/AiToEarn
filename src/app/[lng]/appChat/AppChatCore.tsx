"use client";

import * as React from "react";
import { useEffect, useState } from "react";

export const AppChatCore = () => {
  const [iframeUrl, setIframeUrl] = useState("");

  useEffect(() => {
    setIframeUrl(
      `${
        location.origin.includes("localhost")
          ? "https://dev.aitoearn.ai"
          : location.origin
      }/chat/#/new-chat?mask=100000`,
    );
  }, []);

  return <iframe src={iframeUrl} style={{ height: "100%", border: "none" }} />;
};
