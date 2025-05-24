"use client";

import Link from "next/link";

export default function Page() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <span style={{ fontSize: "60px" }}>404</span>
      <Link href="/" style={{ marginTop: "20px" }}>
        Back to Home
      </Link>
    </div>
  );
}
