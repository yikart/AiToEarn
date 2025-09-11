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
  // rewrites: async () => ({
  //   beforeFiles: [
  //     {
  //       source: `/api/:path*`,
  //       destination: "http://127.0.0.1:8000/api/:path*",
  //     },
  //   ],
  // }),
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
