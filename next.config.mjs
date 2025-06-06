/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    includePaths: ['./app', '*.scss'],
    prependData: `@import "@/app/styles/mixin.scss";`,
  },
  reactStrictMode: false,
  experimental: {
    forceSwcTransforms: true,
  },
};

const CorsHeaders = [
  { key: "Access-Control-Allow-Credentials", value: "true" },
  { key: "Access-Control-Allow-Origin", value: "*" },
  {
    key: "Access-Control-Allow-Methods",
    value: "*",
  },
  {
    key: "Access-Control-Allow-Headers",
    value: "*",
  },
  {
    key: "Access-Control-Max-Age",
    value: "86400",
  },
];

nextConfig.headers = async () => {
  return [
    {
      source: "/api/:path*",
      headers: CorsHeaders,
    },
  ];
};

nextConfig.rewrites = async () => {
  const ret = [
    {
      source: `${process.env.NEXT_PUBLIC_API_URL_PROXY}:path*`,
      destination: `${process.env.NEXT_PUBLIC_API_URL}:path*`,
    },
    {
      source: `${process.env.NEXT_PUBLIC_API_PROXY}:path*`,
      destination: `https://open.kuaishou.com/:path*`,
    },
    {
      source: `${process.env.NEXT_PUBLIC_API_UPLOAD_PROXY}:path*`,
      destination: `https://upload.kuaishouzt.com/:path*`,
    },
  ];

  return {
    beforeFiles: ret,
  };
};

export default nextConfig;
