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
      source: `/xhsXS/:path*`,
      destination: `http://116.62.154.231:7879/:path*`,
    },
    {
      source: `/xiaohongshu/:path*`,
      destination: `https://edith.xiaohongshu.com/api/:path*`,
    },
    {
      source: `/platapiProxy/:path*`,
      destination: `https://platapi.yikart.cn/api/:path*`
    }
  ];

  return {
    beforeFiles: ret,
  };
};

export default nextConfig;
