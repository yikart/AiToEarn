/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  sassOptions: {
    includePaths: ['./app', '*.scss'],
    prependData: `@import "@/app/styles/mixin.scss";`,
  },
  reactStrictMode: false,
  experimental: {
    forceSwcTransforms: true,
  },
  output: 'standalone',
  productionBrowserSourceMaps: process.env.NEXT_PUBLIC_EVN === 'dev',
  rewrites: async () => {
    // 存在 NEXT_PUBLIC_PROXY_URL 则代理，本地直连用
    // 如：NEXT_PUBLIC_PROXY_URL = http://localhost:8080
    if (process.env.NEXT_PUBLIC_PROXY_URL) {
      return [
        {
          source: `/api/:path*`,
          destination: `${process.env.NEXT_PUBLIC_PROXY_URL}/api/:path*`,
        },
      ];
    }
    return [];
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

export default nextConfig;
