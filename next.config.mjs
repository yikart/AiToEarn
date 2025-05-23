/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    includePaths: ['./app', '*.scss'],
    prependData: `@import "@/app/styles/mixin.scss";`,
  }
};

export default nextConfig;
