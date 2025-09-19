const glob = require("glob");

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_HOST_URL,
  generateRobotsTxt: true,
  sitemapSize: 7000,

  transform: async (config, path) => {
    if (path.includes("[lng]")) {
      return null;
    }
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },

  additionalPaths: async () => {
    const languages = ["en", "zh-CN"];

    // 找到所有 page 文件，然后过滤
    const allPageFiles = glob.sync("src/app/**/page.{js,tsx}", {
      cwd: process.cwd(),
      ignore: ["**/node_modules/**"],
    });

    // 过滤出 [lng] 目录下的文件
    const pageFiles = allPageFiles.filter((file) => file.includes("[lng]"));

    // 转换为路由路径
    const routes = pageFiles.map((file) => {
      let route = file
        .replace(/\\/g, "/") // 将反斜杠转为正斜杠
        .replace("/page.tsx", "") // 移除 page.tsx
        .replace("src/app/[lng]", ""); // 移除前缀

      return route || "/";
    });

    const result = [];
    for (const lang of languages) {
      for (const routePath of routes) {
        result.push({
          loc: `/${lang}/${routePath}`,
          changefreq: "daily",
          priority: routePath === "/" ? 1.0 : 0.8,
          alternateRefs: languages.map((alternateLang) => ({
            href: `https://apitest.aiearn.ai/${alternateLang}${routePath === "/" ? "" : routePath}`,
            hreflang: alternateLang,
          })),
        });
      }
    }

    // 添加额外的静态页面
    const extraRoute = [
      "https://blog.aitoearn.ai/",
      "https://docs.aitoearn.ai/",
    ];
    for (const url of extraRoute) {
      result.push({
        loc: url,
        changefreq: "daily",
        priority: 0.7,
      });
    }

    return result;
  },
};
