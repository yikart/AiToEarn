/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://apitest.aiearn.ai",
  generateRobotsTxt: true,
  sitemapSize: 7000,
  alternateRefs: [
    {
      href: "https://apitest.aiearn.ai",
      hreflang: "en",
    },
    {
      href: "https://apitest.aiearn.ai",
      hreflang: "zh-CN",
    },
  ],
};
