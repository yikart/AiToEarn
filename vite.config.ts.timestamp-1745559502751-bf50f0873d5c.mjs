// vite.config.ts
import { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "file:///E:/work/yika/aitoearn/AttAiToEarn/node_modules/vite/dist/node/index.js";
import react from "file:///E:/work/yika/aitoearn/AttAiToEarn/node_modules/@vitejs/plugin-react/dist/index.mjs";
import electron from "file:///E:/work/yika/aitoearn/AttAiToEarn/node_modules/vite-plugin-electron/dist/simple.mjs";

// package.json
var package_default = {
  name: "aiToEarn",
  version: "0.7.0-alpha.3",
  main: "dist-electron/main/index.js",
  description: "\u827A\u5496 win\u6253\u5305\u4F7F\u7528\u7BA1\u7406\u5458\u7684\u7EC8\u7AEF",
  author: "\u827A\u5496",
  license: "MIT",
  private: true,
  engines: {
    node: "20.x.x"
  },
  debug: {
    env: {
      VITE_DEV_SERVER_URL: "http://127.0.0.1:7777/"
    }
  },
  type: "module",
  postinstall: "electron-builder install-app-deps",
  scripts: {
    dev: "chcp 65001 && vite",
    "dev:mac": "vite",
    build: "tsc && vite build && electron-builder",
    "build:notsc": "vite build && electron-builder",
    preview: "vite preview",
    pretest: "vite build --mode=test",
    test: "vitest run",
    rebuild: "electron-rebuild -f -w better-sqlite3",
    lint: "npm run lint:eslint && npm run lint:prettier && npm run lint:stylelint",
    "lint:eslint": 'eslint --cache --max-warnings 0  "{src,mocks,electron}/**/*.{vue,ts,tsx}" --fix',
    "lint:prettier": 'prettier --write  "{src,electron}/**/*.{js,json,tsx,css,less,scss,vue,html,md}"',
    "lint:stylelint": 'stylelint --cache --fix "**/*.{vue,less,postcss,css,scss}" --cache --cache-location node_modules/.cache/stylelint/'
  },
  dependencies: {
    "@ant-design/colors": "^7.2.0",
    "@ant-design/icons": "^5.6.1",
    "@ffmpeg-installer/ffmpeg": "^1.1.0",
    "@ffprobe-installer/ffprobe": "^2.1.2",
    "@types/form-data": "^2.5.2",
    antd: "^5.23.1",
    "antd-img-crop": "^4.24.0",
    axios: "^1.7.9",
    "better-sqlite3": "^11.8.1",
    build: "^0.1.4",
    coordtransform: "^2.1.2",
    crc32: "^0.2.2",
    cropperjs: "^1.6.2",
    crypto: "^1.0.1",
    "crypto-js": "^4.2.0",
    dayjs: "^1.11.13",
    dotenv: "^16.4.7",
    echarts: "^5.6.0",
    "electron-log": "^5.3.0",
    "electron-serve": "^2.1.1",
    "electron-store": "^10.0.0",
    "electron-updater": "^6.3.9",
    events: "^3.3.0",
    "ffprobe-static": "^3.1.0",
    "fluent-ffmpeg": "^2.1.3",
    "form-data": "^4.0.2",
    fs: "^0.0.1-security",
    "image-size": "^1.2.0",
    lodash: "^4.17.21",
    "mime-types": "^2.1.35",
    moment: "^2.30.1",
    "node-cache": "^5.1.2",
    "node-schedule": "^2.1.1",
    os: "^0.1.2",
    "p-queue": "^8.1.0",
    path: "^0.12.7",
    qs: "^6.14.0",
    "react-intersection-observer": "^9.16.0",
    "react-masonry-css": "^1.0.16",
    "react-router-dom": "6",
    "react-sortablejs": "^6.1.4",
    "reflect-metadata": "^0.2.2",
    sharp: "^0.33.5",
    sortablejs: "^1.15.6",
    typeorm: "^0.3.20",
    uninstall: "^0.0.0",
    uuid: "^11.0.5",
    vite: "^6.2.3",
    "vite-plugin-electron-renderer": "^0.14.6",
    "vite-plugin-svg-icons": "^2.0.1",
    xml2js: "^0.6.2",
    zustand: "^5.0.3"
  },
  devDependencies: {
    "@electron/rebuild": "^3.7.1",
    "@playwright/test": "^1.48.2",
    "@types/fluent-ffmpeg": "^2.1.27",
    "@types/form-data": "^2.2.1",
    "@types/lodash": "^4.17.15",
    "@types/mime-types": "^2.1.4",
    "@types/node-schedule": "^2.1.7",
    "@types/qs": "^6.9.18",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/sortablejs": "^1.15.8",
    "@types/xml2js": "^0.4.14",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "@vitejs/plugin-react": "^4.3.3",
    autoprefixer: "^10.4.20",
    electron: "^33.2.0",
    "electron-builder": "^26.0.12",
    "electron-notarize": "^1.2.2",
    eslint: "^8.42.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.2.1",
    "eslint-plugin-react": "^7.37.4",
    "eslint-plugin-unused-imports": "^4.1.4",
    postcss: "^8.4.49",
    "postcss-import": "^16.1.0",
    prettier: "^3.0.0",
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    sass: "^1.83.4",
    "sass-loader": "^16.0.4",
    tailwindcss: "^3.4.15",
    typescript: "^5.4.2",
    vite: "^5.4.11",
    "vite-plugin-electron": "^0.29.0",
    "vite-plugin-electron-renderer": "^0.14.6",
    "vite-plugin-svg-icons": "^2.0.1",
    "vite-plugin-svgr": "^4.3.0",
    vitest: "^2.1.5"
  }
};

// vite.config.ts
import svgr from "file:///E:/work/yika/aitoearn/AttAiToEarn/node_modules/vite-plugin-svgr/dist/index.js";
import { createSvgIconsPlugin } from "file:///E:/work/yika/aitoearn/AttAiToEarn/node_modules/vite-plugin-svg-icons/dist/index.mjs";
var __vite_injected_original_dirname = "E:\\work\\yika\\aitoearn\\AttAiToEarn";
var vite_config_default = defineConfig(({ command }) => {
  rmSync("dist-electron", { recursive: true, force: true });
  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;
  return {
    resolve: {
      alias: {
        "@": path.join(__vite_injected_original_dirname, "src"),
        "@@": path.join(__vite_injected_original_dirname, "commont"),
        buffer: "buffer"
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler"
        }
      }
    },
    plugins: [
      react(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`
          entry: "electron/main/index.ts",
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log(
                /* For `.vscode/.debug.script.mjs` */
                "[startup] Electron App"
              );
            } else {
              args.startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/main",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in package_default ? package_default.dependencies : {}
                )
              }
            }
          }
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: "electron/preload/index.ts",
          vite: {
            build: {
              sourcemap: sourcemap ? "inline" : void 0,
              // #332
              minify: isBuild,
              outDir: "dist-electron/preload",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in package_default ? package_default.dependencies : {}
                )
              }
            }
          }
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: {}
      }),
      svgr({ svgrOptions: { icon: true } }),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), "src/assets/svgs")]
      })
    ],
    server: process.env.VSCODE_DEBUG && (() => {
      const url = new URL(package_default.debug.env.VITE_DEV_SERVER_URL);
      return {
        host: url.hostname,
        port: +url.port
      };
    })(),
    clearScreen: false
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcd29ya1xcXFx5aWthXFxcXGFpdG9lYXJuXFxcXEF0dEFpVG9FYXJuXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFx3b3JrXFxcXHlpa2FcXFxcYWl0b2Vhcm5cXFxcQXR0QWlUb0Vhcm5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L3dvcmsveWlrYS9haXRvZWFybi9BdHRBaVRvRWFybi92aXRlLmNvbmZpZy50c1wiOy8qXHJcbiAqIEBBdXRob3I6IG5ldmluXHJcbiAqIEBEYXRlOiAyMDI1LTAxLTE3IDE5OjI1OjI5XHJcbiAqIEBMYXN0RWRpdFRpbWU6IDIwMjUtMDItMjcgMTY6NDE6NDlcclxuICogQExhc3RFZGl0b3JzOiBuZXZpblxyXG4gKiBARGVzY3JpcHRpb246XHJcbiAqL1xyXG5pbXBvcnQgeyBybVN5bmMgfSBmcm9tICdub2RlOmZzJztcclxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCBlbGVjdHJvbiBmcm9tICd2aXRlLXBsdWdpbi1lbGVjdHJvbi9zaW1wbGUnO1xyXG5pbXBvcnQgcGtnIGZyb20gJy4vcGFja2FnZS5qc29uJztcclxuaW1wb3J0IHN2Z3IgZnJvbSBcInZpdGUtcGx1Z2luLXN2Z3JcIjtcclxuaW1wb3J0IHsgY3JlYXRlU3ZnSWNvbnNQbHVnaW4gfSBmcm9tIFwidml0ZS1wbHVnaW4tc3ZnLWljb25zXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCB9KSA9PiB7XHJcbiAgcm1TeW5jKCdkaXN0LWVsZWN0cm9uJywgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xyXG5cclxuICBjb25zdCBpc1NlcnZlID0gY29tbWFuZCA9PT0gJ3NlcnZlJztcclxuICBjb25zdCBpc0J1aWxkID0gY29tbWFuZCA9PT0gJ2J1aWxkJztcclxuICBjb25zdCBzb3VyY2VtYXAgPSBpc1NlcnZlIHx8ICEhcHJvY2Vzcy5lbnYuVlNDT0RFX0RFQlVHO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgICdAJzogcGF0aC5qb2luKF9fZGlybmFtZSwgJ3NyYycpLFxyXG4gICAgICAgICdAQCc6IHBhdGguam9pbihfX2Rpcm5hbWUsICdjb21tb250JyksXHJcbiAgICAgICAgYnVmZmVyOiAnYnVmZmVyJyxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBjc3M6IHtcclxuICAgICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xyXG4gICAgICAgIHNjc3M6IHtcclxuICAgICAgICAgIGFwaTogJ21vZGVybi1jb21waWxlcicsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIHJlYWN0KCksXHJcbiAgICAgIGVsZWN0cm9uKHtcclxuICAgICAgICBtYWluOiB7XHJcbiAgICAgICAgICAvLyBTaG9ydGN1dCBvZiBgYnVpbGQubGliLmVudHJ5YFxyXG4gICAgICAgICAgZW50cnk6ICdlbGVjdHJvbi9tYWluL2luZGV4LnRzJyxcclxuICAgICAgICAgIG9uc3RhcnQoYXJncykge1xyXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuVlNDT0RFX0RFQlVHKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAvKiBGb3IgYC52c2NvZGUvLmRlYnVnLnNjcmlwdC5tanNgICovICdbc3RhcnR1cF0gRWxlY3Ryb24gQXBwJyxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGFyZ3Muc3RhcnR1cCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgdml0ZToge1xyXG4gICAgICAgICAgICBidWlsZDoge1xyXG4gICAgICAgICAgICAgIHNvdXJjZW1hcCxcclxuICAgICAgICAgICAgICBtaW5pZnk6IGlzQnVpbGQsXHJcbiAgICAgICAgICAgICAgb3V0RGlyOiAnZGlzdC1lbGVjdHJvbi9tYWluJyxcclxuICAgICAgICAgICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbDogT2JqZWN0LmtleXMoXHJcbiAgICAgICAgICAgICAgICAgICdkZXBlbmRlbmNpZXMnIGluIHBrZyA/IHBrZy5kZXBlbmRlbmNpZXMgOiB7fSxcclxuICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwcmVsb2FkOiB7XHJcbiAgICAgICAgICAvLyBTaG9ydGN1dCBvZiBgYnVpbGQucm9sbHVwT3B0aW9ucy5pbnB1dGAuXHJcbiAgICAgICAgICAvLyBQcmVsb2FkIHNjcmlwdHMgbWF5IGNvbnRhaW4gV2ViIGFzc2V0cywgc28gdXNlIHRoZSBgYnVpbGQucm9sbHVwT3B0aW9ucy5pbnB1dGAgaW5zdGVhZCBgYnVpbGQubGliLmVudHJ5YC5cclxuICAgICAgICAgIGlucHV0OiAnZWxlY3Ryb24vcHJlbG9hZC9pbmRleC50cycsXHJcbiAgICAgICAgICB2aXRlOiB7XHJcbiAgICAgICAgICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgICAgICAgc291cmNlbWFwOiBzb3VyY2VtYXAgPyAnaW5saW5lJyA6IHVuZGVmaW5lZCwgLy8gIzMzMlxyXG4gICAgICAgICAgICAgIG1pbmlmeTogaXNCdWlsZCxcclxuICAgICAgICAgICAgICBvdXREaXI6ICdkaXN0LWVsZWN0cm9uL3ByZWxvYWQnLFxyXG4gICAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsOiBPYmplY3Qua2V5cyhcclxuICAgICAgICAgICAgICAgICAgJ2RlcGVuZGVuY2llcycgaW4gcGtnID8gcGtnLmRlcGVuZGVuY2llcyA6IHt9LFxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIFBsb3lmaWxsIHRoZSBFbGVjdHJvbiBhbmQgTm9kZS5qcyBBUEkgZm9yIFJlbmRlcmVyIHByb2Nlc3MuXHJcbiAgICAgICAgLy8gSWYgeW91IHdhbnQgdXNlIE5vZGUuanMgaW4gUmVuZGVyZXIgcHJvY2VzcywgdGhlIGBub2RlSW50ZWdyYXRpb25gIG5lZWRzIHRvIGJlIGVuYWJsZWQgaW4gdGhlIE1haW4gcHJvY2Vzcy5cclxuICAgICAgICAvLyBTZWUgXHVEODNEXHVEQzQ5IGh0dHBzOi8vZ2l0aHViLmNvbS9lbGVjdHJvbi12aXRlL3ZpdGUtcGx1Z2luLWVsZWN0cm9uLXJlbmRlcmVyXHJcbiAgICAgICAgcmVuZGVyZXI6IHt9LFxyXG4gICAgICB9KSxcclxuICAgICAgc3Zncih7IHN2Z3JPcHRpb25zOiB7IGljb246IHRydWUgfSB9KSxcclxuICAgICAgY3JlYXRlU3ZnSWNvbnNQbHVnaW4oe1xyXG4gICAgICAgIGljb25EaXJzOiBbcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIFwic3JjL2Fzc2V0cy9zdmdzXCIpXSxcclxuICAgICAgfSlcclxuICAgIF0sXHJcbiAgICBzZXJ2ZXI6XHJcbiAgICAgIHByb2Nlc3MuZW52LlZTQ09ERV9ERUJVRyAmJlxyXG4gICAgICAoKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocGtnLmRlYnVnLmVudi5WSVRFX0RFVl9TRVJWRVJfVVJMKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgaG9zdDogdXJsLmhvc3RuYW1lLFxyXG4gICAgICAgICAgcG9ydDogK3VybC5wb3J0LFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0pKCksXHJcbiAgICBjbGVhclNjcmVlbjogZmFsc2UsXHJcbiAgfTtcclxufSk7XHJcbiIsICJ7XHJcbiAgXCJuYW1lXCI6IFwiYWlUb0Vhcm5cIixcclxuICBcInZlcnNpb25cIjogXCIwLjcuMC1hbHBoYS4zXCIsXHJcbiAgXCJtYWluXCI6IFwiZGlzdC1lbGVjdHJvbi9tYWluL2luZGV4LmpzXCIsXHJcbiAgXCJkZXNjcmlwdGlvblwiOiBcIlx1ODI3QVx1NTQ5NiB3aW5cdTYyNTNcdTUzMDVcdTRGN0ZcdTc1MjhcdTdCQTFcdTc0MDZcdTU0NThcdTc2ODRcdTdFQzhcdTdBRUZcIixcclxuICBcImF1dGhvclwiOiBcIlx1ODI3QVx1NTQ5NlwiLFxyXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxyXG4gIFwicHJpdmF0ZVwiOiB0cnVlLFxyXG4gIFwiZW5naW5lc1wiOiB7XHJcbiAgICBcIm5vZGVcIjogXCIyMC54LnhcIlxyXG4gIH0sXHJcbiAgXCJkZWJ1Z1wiOiB7XHJcbiAgICBcImVudlwiOiB7XHJcbiAgICAgIFwiVklURV9ERVZfU0VSVkVSX1VSTFwiOiBcImh0dHA6Ly8xMjcuMC4wLjE6Nzc3Ny9cIlxyXG4gICAgfVxyXG4gIH0sXHJcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXHJcbiAgXCJwb3N0aW5zdGFsbFwiOiBcImVsZWN0cm9uLWJ1aWxkZXIgaW5zdGFsbC1hcHAtZGVwc1wiLFxyXG4gIFwic2NyaXB0c1wiOiB7XHJcbiAgICBcImRldlwiOiBcImNoY3AgNjUwMDEgJiYgdml0ZVwiLFxyXG4gICAgXCJkZXY6bWFjXCI6IFwidml0ZVwiLFxyXG4gICAgXCJidWlsZFwiOiBcInRzYyAmJiB2aXRlIGJ1aWxkICYmIGVsZWN0cm9uLWJ1aWxkZXJcIixcclxuICAgIFwiYnVpbGQ6bm90c2NcIjogXCJ2aXRlIGJ1aWxkICYmIGVsZWN0cm9uLWJ1aWxkZXJcIixcclxuICAgIFwicHJldmlld1wiOiBcInZpdGUgcHJldmlld1wiLFxyXG4gICAgXCJwcmV0ZXN0XCI6IFwidml0ZSBidWlsZCAtLW1vZGU9dGVzdFwiLFxyXG4gICAgXCJ0ZXN0XCI6IFwidml0ZXN0IHJ1blwiLFxyXG4gICAgXCJyZWJ1aWxkXCI6IFwiZWxlY3Ryb24tcmVidWlsZCAtZiAtdyBiZXR0ZXItc3FsaXRlM1wiLFxyXG4gICAgXCJsaW50XCI6IFwibnBtIHJ1biBsaW50OmVzbGludCAmJiBucG0gcnVuIGxpbnQ6cHJldHRpZXIgJiYgbnBtIHJ1biBsaW50OnN0eWxlbGludFwiLFxyXG4gICAgXCJsaW50OmVzbGludFwiOiBcImVzbGludCAtLWNhY2hlIC0tbWF4LXdhcm5pbmdzIDAgIFxcXCJ7c3JjLG1vY2tzLGVsZWN0cm9ufS8qKi8qLnt2dWUsdHMsdHN4fVxcXCIgLS1maXhcIixcclxuICAgIFwibGludDpwcmV0dGllclwiOiBcInByZXR0aWVyIC0td3JpdGUgIFxcXCJ7c3JjLGVsZWN0cm9ufS8qKi8qLntqcyxqc29uLHRzeCxjc3MsbGVzcyxzY3NzLHZ1ZSxodG1sLG1kfVxcXCJcIixcclxuICAgIFwibGludDpzdHlsZWxpbnRcIjogXCJzdHlsZWxpbnQgLS1jYWNoZSAtLWZpeCBcXFwiKiovKi57dnVlLGxlc3MscG9zdGNzcyxjc3Msc2Nzc31cXFwiIC0tY2FjaGUgLS1jYWNoZS1sb2NhdGlvbiBub2RlX21vZHVsZXMvLmNhY2hlL3N0eWxlbGludC9cIlxyXG4gIH0sXHJcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xyXG4gICAgXCJAYW50LWRlc2lnbi9jb2xvcnNcIjogXCJeNy4yLjBcIixcclxuICAgIFwiQGFudC1kZXNpZ24vaWNvbnNcIjogXCJeNS42LjFcIixcclxuICAgIFwiQGZmbXBlZy1pbnN0YWxsZXIvZmZtcGVnXCI6IFwiXjEuMS4wXCIsXHJcbiAgICBcIkBmZnByb2JlLWluc3RhbGxlci9mZnByb2JlXCI6IFwiXjIuMS4yXCIsXHJcbiAgICBcIkB0eXBlcy9mb3JtLWRhdGFcIjogXCJeMi41LjJcIixcclxuICAgIFwiYW50ZFwiOiBcIl41LjIzLjFcIixcclxuICAgIFwiYW50ZC1pbWctY3JvcFwiOiBcIl40LjI0LjBcIixcclxuICAgIFwiYXhpb3NcIjogXCJeMS43LjlcIixcclxuICAgIFwiYmV0dGVyLXNxbGl0ZTNcIjogXCJeMTEuOC4xXCIsXHJcbiAgICBcImJ1aWxkXCI6IFwiXjAuMS40XCIsXHJcbiAgICBcImNvb3JkdHJhbnNmb3JtXCI6IFwiXjIuMS4yXCIsXHJcbiAgICBcImNyYzMyXCI6IFwiXjAuMi4yXCIsXHJcbiAgICBcImNyb3BwZXJqc1wiOiBcIl4xLjYuMlwiLFxyXG4gICAgXCJjcnlwdG9cIjogXCJeMS4wLjFcIixcclxuICAgIFwiY3J5cHRvLWpzXCI6IFwiXjQuMi4wXCIsXHJcbiAgICBcImRheWpzXCI6IFwiXjEuMTEuMTNcIixcclxuICAgIFwiZG90ZW52XCI6IFwiXjE2LjQuN1wiLFxyXG4gICAgXCJlY2hhcnRzXCI6IFwiXjUuNi4wXCIsXHJcbiAgICBcImVsZWN0cm9uLWxvZ1wiOiBcIl41LjMuMFwiLFxyXG4gICAgXCJlbGVjdHJvbi1zZXJ2ZVwiOiBcIl4yLjEuMVwiLFxyXG4gICAgXCJlbGVjdHJvbi1zdG9yZVwiOiBcIl4xMC4wLjBcIixcclxuICAgIFwiZWxlY3Ryb24tdXBkYXRlclwiOiBcIl42LjMuOVwiLFxyXG4gICAgXCJldmVudHNcIjogXCJeMy4zLjBcIixcclxuICAgIFwiZmZwcm9iZS1zdGF0aWNcIjogXCJeMy4xLjBcIixcclxuICAgIFwiZmx1ZW50LWZmbXBlZ1wiOiBcIl4yLjEuM1wiLFxyXG4gICAgXCJmb3JtLWRhdGFcIjogXCJeNC4wLjJcIixcclxuICAgIFwiZnNcIjogXCJeMC4wLjEtc2VjdXJpdHlcIixcclxuICAgIFwiaW1hZ2Utc2l6ZVwiOiBcIl4xLjIuMFwiLFxyXG4gICAgXCJsb2Rhc2hcIjogXCJeNC4xNy4yMVwiLFxyXG4gICAgXCJtaW1lLXR5cGVzXCI6IFwiXjIuMS4zNVwiLFxyXG4gICAgXCJtb21lbnRcIjogXCJeMi4zMC4xXCIsXHJcbiAgICBcIm5vZGUtY2FjaGVcIjogXCJeNS4xLjJcIixcclxuICAgIFwibm9kZS1zY2hlZHVsZVwiOiBcIl4yLjEuMVwiLFxyXG4gICAgXCJvc1wiOiBcIl4wLjEuMlwiLFxyXG4gICAgXCJwLXF1ZXVlXCI6IFwiXjguMS4wXCIsXHJcbiAgICBcInBhdGhcIjogXCJeMC4xMi43XCIsXHJcbiAgICBcInFzXCI6IFwiXjYuMTQuMFwiLFxyXG4gICAgXCJyZWFjdC1pbnRlcnNlY3Rpb24tb2JzZXJ2ZXJcIjogXCJeOS4xNi4wXCIsXHJcbiAgICBcInJlYWN0LW1hc29ucnktY3NzXCI6IFwiXjEuMC4xNlwiLFxyXG4gICAgXCJyZWFjdC1yb3V0ZXItZG9tXCI6IFwiNlwiLFxyXG4gICAgXCJyZWFjdC1zb3J0YWJsZWpzXCI6IFwiXjYuMS40XCIsXHJcbiAgICBcInJlZmxlY3QtbWV0YWRhdGFcIjogXCJeMC4yLjJcIixcclxuICAgIFwic2hhcnBcIjogXCJeMC4zMy41XCIsXHJcbiAgICBcInNvcnRhYmxlanNcIjogXCJeMS4xNS42XCIsXHJcbiAgICBcInR5cGVvcm1cIjogXCJeMC4zLjIwXCIsXHJcbiAgICBcInVuaW5zdGFsbFwiOiBcIl4wLjAuMFwiLFxyXG4gICAgXCJ1dWlkXCI6IFwiXjExLjAuNVwiLFxyXG4gICAgXCJ2aXRlXCI6IFwiXjYuMi4zXCIsXHJcbiAgICBcInZpdGUtcGx1Z2luLWVsZWN0cm9uLXJlbmRlcmVyXCI6IFwiXjAuMTQuNlwiLFxyXG4gICAgXCJ2aXRlLXBsdWdpbi1zdmctaWNvbnNcIjogXCJeMi4wLjFcIixcclxuICAgIFwieG1sMmpzXCI6IFwiXjAuNi4yXCIsXHJcbiAgICBcInp1c3RhbmRcIjogXCJeNS4wLjNcIlxyXG4gIH0sXHJcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xyXG4gICAgXCJAZWxlY3Ryb24vcmVidWlsZFwiOiBcIl4zLjcuMVwiLFxyXG4gICAgXCJAcGxheXdyaWdodC90ZXN0XCI6IFwiXjEuNDguMlwiLFxyXG4gICAgXCJAdHlwZXMvZmx1ZW50LWZmbXBlZ1wiOiBcIl4yLjEuMjdcIixcclxuICAgIFwiQHR5cGVzL2Zvcm0tZGF0YVwiOiBcIl4yLjIuMVwiLFxyXG4gICAgXCJAdHlwZXMvbG9kYXNoXCI6IFwiXjQuMTcuMTVcIixcclxuICAgIFwiQHR5cGVzL21pbWUtdHlwZXNcIjogXCJeMi4xLjRcIixcclxuICAgIFwiQHR5cGVzL25vZGUtc2NoZWR1bGVcIjogXCJeMi4xLjdcIixcclxuICAgIFwiQHR5cGVzL3FzXCI6IFwiXjYuOS4xOFwiLFxyXG4gICAgXCJAdHlwZXMvcmVhY3RcIjogXCJeMTguMy4xMlwiLFxyXG4gICAgXCJAdHlwZXMvcmVhY3QtZG9tXCI6IFwiXjE4LjMuMVwiLFxyXG4gICAgXCJAdHlwZXMvc29ydGFibGVqc1wiOiBcIl4xLjE1LjhcIixcclxuICAgIFwiQHR5cGVzL3htbDJqc1wiOiBcIl4wLjQuMTRcIixcclxuICAgIFwiQHR5cGVzY3JpcHQtZXNsaW50L2VzbGludC1wbHVnaW5cIjogXCJeOC4wLjBcIixcclxuICAgIFwiQHR5cGVzY3JpcHQtZXNsaW50L3BhcnNlclwiOiBcIl44LjAuMFwiLFxyXG4gICAgXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiOiBcIl40LjMuM1wiLFxyXG4gICAgXCJhdXRvcHJlZml4ZXJcIjogXCJeMTAuNC4yMFwiLFxyXG4gICAgXCJlbGVjdHJvblwiOiBcIl4zMy4yLjBcIixcclxuICAgIFwiZWxlY3Ryb24tYnVpbGRlclwiOiBcIl4yNi4wLjEyXCIsXHJcbiAgICBcImVsZWN0cm9uLW5vdGFyaXplXCI6IFwiXjEuMi4yXCIsXHJcbiAgICBcImVzbGludFwiOiBcIl44LjQyLjBcIixcclxuICAgIFwiZXNsaW50LWNvbmZpZy1wcmV0dGllclwiOiBcIl45LjEuMFwiLFxyXG4gICAgXCJlc2xpbnQtcGx1Z2luLXByZXR0aWVyXCI6IFwiXjUuMi4xXCIsXHJcbiAgICBcImVzbGludC1wbHVnaW4tcmVhY3RcIjogXCJeNy4zNy40XCIsXHJcbiAgICBcImVzbGludC1wbHVnaW4tdW51c2VkLWltcG9ydHNcIjogXCJeNC4xLjRcIixcclxuICAgIFwicG9zdGNzc1wiOiBcIl44LjQuNDlcIixcclxuICAgIFwicG9zdGNzcy1pbXBvcnRcIjogXCJeMTYuMS4wXCIsXHJcbiAgICBcInByZXR0aWVyXCI6IFwiXjMuMC4wXCIsXHJcbiAgICBcInJlYWN0XCI6IFwiXjE4LjMuMVwiLFxyXG4gICAgXCJyZWFjdC1kb21cIjogXCJeMTguMy4xXCIsXHJcbiAgICBcInNhc3NcIjogXCJeMS44My40XCIsXHJcbiAgICBcInNhc3MtbG9hZGVyXCI6IFwiXjE2LjAuNFwiLFxyXG4gICAgXCJ0YWlsd2luZGNzc1wiOiBcIl4zLjQuMTVcIixcclxuICAgIFwidHlwZXNjcmlwdFwiOiBcIl41LjQuMlwiLFxyXG4gICAgXCJ2aXRlXCI6IFwiXjUuNC4xMVwiLFxyXG4gICAgXCJ2aXRlLXBsdWdpbi1lbGVjdHJvblwiOiBcIl4wLjI5LjBcIixcclxuICAgIFwidml0ZS1wbHVnaW4tZWxlY3Ryb24tcmVuZGVyZXJcIjogXCJeMC4xNC42XCIsXHJcbiAgICBcInZpdGUtcGx1Z2luLXN2Zy1pY29uc1wiOiBcIl4yLjAuMVwiLFxyXG4gICAgXCJ2aXRlLXBsdWdpbi1zdmdyXCI6IFwiXjQuMy4wXCIsXHJcbiAgICBcInZpdGVzdFwiOiBcIl4yLjEuNVwiXHJcbiAgfVxyXG59Il0sCiAgIm1hcHBpbmdzIjogIjtBQU9BLFNBQVMsY0FBYztBQUN2QixPQUFPLFVBQVU7QUFDakIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sY0FBYzs7O0FDWHJCO0FBQUEsRUFDRSxNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsRUFDWCxNQUFRO0FBQUEsRUFDUixhQUFlO0FBQUEsRUFDZixRQUFVO0FBQUEsRUFDVixTQUFXO0FBQUEsRUFDWCxTQUFXO0FBQUEsRUFDWCxTQUFXO0FBQUEsSUFDVCxNQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsT0FBUztBQUFBLElBQ1AsS0FBTztBQUFBLE1BQ0wscUJBQXVCO0FBQUEsSUFDekI7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFRO0FBQUEsRUFDUixhQUFlO0FBQUEsRUFDZixTQUFXO0FBQUEsSUFDVCxLQUFPO0FBQUEsSUFDUCxXQUFXO0FBQUEsSUFDWCxPQUFTO0FBQUEsSUFDVCxlQUFlO0FBQUEsSUFDZixTQUFXO0FBQUEsSUFDWCxTQUFXO0FBQUEsSUFDWCxNQUFRO0FBQUEsSUFDUixTQUFXO0FBQUEsSUFDWCxNQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsSUFDZixpQkFBaUI7QUFBQSxJQUNqQixrQkFBa0I7QUFBQSxFQUNwQjtBQUFBLEVBQ0EsY0FBZ0I7QUFBQSxJQUNkLHNCQUFzQjtBQUFBLElBQ3RCLHFCQUFxQjtBQUFBLElBQ3JCLDRCQUE0QjtBQUFBLElBQzVCLDhCQUE4QjtBQUFBLElBQzlCLG9CQUFvQjtBQUFBLElBQ3BCLE1BQVE7QUFBQSxJQUNSLGlCQUFpQjtBQUFBLElBQ2pCLE9BQVM7QUFBQSxJQUNULGtCQUFrQjtBQUFBLElBQ2xCLE9BQVM7QUFBQSxJQUNULGdCQUFrQjtBQUFBLElBQ2xCLE9BQVM7QUFBQSxJQUNULFdBQWE7QUFBQSxJQUNiLFFBQVU7QUFBQSxJQUNWLGFBQWE7QUFBQSxJQUNiLE9BQVM7QUFBQSxJQUNULFFBQVU7QUFBQSxJQUNWLFNBQVc7QUFBQSxJQUNYLGdCQUFnQjtBQUFBLElBQ2hCLGtCQUFrQjtBQUFBLElBQ2xCLGtCQUFrQjtBQUFBLElBQ2xCLG9CQUFvQjtBQUFBLElBQ3BCLFFBQVU7QUFBQSxJQUNWLGtCQUFrQjtBQUFBLElBQ2xCLGlCQUFpQjtBQUFBLElBQ2pCLGFBQWE7QUFBQSxJQUNiLElBQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxJQUNkLFFBQVU7QUFBQSxJQUNWLGNBQWM7QUFBQSxJQUNkLFFBQVU7QUFBQSxJQUNWLGNBQWM7QUFBQSxJQUNkLGlCQUFpQjtBQUFBLElBQ2pCLElBQU07QUFBQSxJQUNOLFdBQVc7QUFBQSxJQUNYLE1BQVE7QUFBQSxJQUNSLElBQU07QUFBQSxJQUNOLCtCQUErQjtBQUFBLElBQy9CLHFCQUFxQjtBQUFBLElBQ3JCLG9CQUFvQjtBQUFBLElBQ3BCLG9CQUFvQjtBQUFBLElBQ3BCLG9CQUFvQjtBQUFBLElBQ3BCLE9BQVM7QUFBQSxJQUNULFlBQWM7QUFBQSxJQUNkLFNBQVc7QUFBQSxJQUNYLFdBQWE7QUFBQSxJQUNiLE1BQVE7QUFBQSxJQUNSLE1BQVE7QUFBQSxJQUNSLGlDQUFpQztBQUFBLElBQ2pDLHlCQUF5QjtBQUFBLElBQ3pCLFFBQVU7QUFBQSxJQUNWLFNBQVc7QUFBQSxFQUNiO0FBQUEsRUFDQSxpQkFBbUI7QUFBQSxJQUNqQixxQkFBcUI7QUFBQSxJQUNyQixvQkFBb0I7QUFBQSxJQUNwQix3QkFBd0I7QUFBQSxJQUN4QixvQkFBb0I7QUFBQSxJQUNwQixpQkFBaUI7QUFBQSxJQUNqQixxQkFBcUI7QUFBQSxJQUNyQix3QkFBd0I7QUFBQSxJQUN4QixhQUFhO0FBQUEsSUFDYixnQkFBZ0I7QUFBQSxJQUNoQixvQkFBb0I7QUFBQSxJQUNwQixxQkFBcUI7QUFBQSxJQUNyQixpQkFBaUI7QUFBQSxJQUNqQixvQ0FBb0M7QUFBQSxJQUNwQyw2QkFBNkI7QUFBQSxJQUM3Qix3QkFBd0I7QUFBQSxJQUN4QixjQUFnQjtBQUFBLElBQ2hCLFVBQVk7QUFBQSxJQUNaLG9CQUFvQjtBQUFBLElBQ3BCLHFCQUFxQjtBQUFBLElBQ3JCLFFBQVU7QUFBQSxJQUNWLDBCQUEwQjtBQUFBLElBQzFCLDBCQUEwQjtBQUFBLElBQzFCLHVCQUF1QjtBQUFBLElBQ3ZCLGdDQUFnQztBQUFBLElBQ2hDLFNBQVc7QUFBQSxJQUNYLGtCQUFrQjtBQUFBLElBQ2xCLFVBQVk7QUFBQSxJQUNaLE9BQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLE1BQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxJQUNmLGFBQWU7QUFBQSxJQUNmLFlBQWM7QUFBQSxJQUNkLE1BQVE7QUFBQSxJQUNSLHdCQUF3QjtBQUFBLElBQ3hCLGlDQUFpQztBQUFBLElBQ2pDLHlCQUF5QjtBQUFBLElBQ3pCLG9CQUFvQjtBQUFBLElBQ3BCLFFBQVU7QUFBQSxFQUNaO0FBQ0Y7OztBRGxIQSxPQUFPLFVBQVU7QUFDakIsU0FBUyw0QkFBNEI7QUFkckMsSUFBTSxtQ0FBbUM7QUFpQnpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsUUFBUSxNQUFNO0FBQzNDLFNBQU8saUJBQWlCLEVBQUUsV0FBVyxNQUFNLE9BQU8sS0FBSyxDQUFDO0FBRXhELFFBQU0sVUFBVSxZQUFZO0FBQzVCLFFBQU0sVUFBVSxZQUFZO0FBQzVCLFFBQU0sWUFBWSxXQUFXLENBQUMsQ0FBQyxRQUFRLElBQUk7QUFFM0MsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLEtBQUssa0NBQVcsS0FBSztBQUFBLFFBQy9CLE1BQU0sS0FBSyxLQUFLLGtDQUFXLFNBQVM7QUFBQSxRQUNwQyxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILHFCQUFxQjtBQUFBLFFBQ25CLE1BQU07QUFBQSxVQUNKLEtBQUs7QUFBQSxRQUNQO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLFNBQVM7QUFBQSxRQUNQLE1BQU07QUFBQTtBQUFBLFVBRUosT0FBTztBQUFBLFVBQ1AsUUFBUSxNQUFNO0FBQ1osZ0JBQUksUUFBUSxJQUFJLGNBQWM7QUFDNUIsc0JBQVE7QUFBQTtBQUFBLGdCQUNnQztBQUFBLGNBQ3hDO0FBQUEsWUFDRixPQUFPO0FBQ0wsbUJBQUssUUFBUTtBQUFBLFlBQ2Y7QUFBQSxVQUNGO0FBQUEsVUFDQSxNQUFNO0FBQUEsWUFDSixPQUFPO0FBQUEsY0FDTDtBQUFBLGNBQ0EsUUFBUTtBQUFBLGNBQ1IsUUFBUTtBQUFBLGNBQ1IsZUFBZTtBQUFBLGdCQUNiLFVBQVUsT0FBTztBQUFBLGtCQUNmLGtCQUFrQixrQkFBTSxnQkFBSSxlQUFlLENBQUM7QUFBQSxnQkFDOUM7QUFBQSxjQUNGO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsUUFDQSxTQUFTO0FBQUE7QUFBQTtBQUFBLFVBR1AsT0FBTztBQUFBLFVBQ1AsTUFBTTtBQUFBLFlBQ0osT0FBTztBQUFBLGNBQ0wsV0FBVyxZQUFZLFdBQVc7QUFBQTtBQUFBLGNBQ2xDLFFBQVE7QUFBQSxjQUNSLFFBQVE7QUFBQSxjQUNSLGVBQWU7QUFBQSxnQkFDYixVQUFVLE9BQU87QUFBQSxrQkFDZixrQkFBa0Isa0JBQU0sZ0JBQUksZUFBZSxDQUFDO0FBQUEsZ0JBQzlDO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBSUEsVUFBVSxDQUFDO0FBQUEsTUFDYixDQUFDO0FBQUEsTUFDRCxLQUFLLEVBQUUsYUFBYSxFQUFFLE1BQU0sS0FBSyxFQUFFLENBQUM7QUFBQSxNQUNwQyxxQkFBcUI7QUFBQSxRQUNuQixVQUFVLENBQUMsS0FBSyxRQUFRLFFBQVEsSUFBSSxHQUFHLGlCQUFpQixDQUFDO0FBQUEsTUFDM0QsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUNBLFFBQ0UsUUFBUSxJQUFJLGlCQUNYLE1BQU07QUFDTCxZQUFNLE1BQU0sSUFBSSxJQUFJLGdCQUFJLE1BQU0sSUFBSSxtQkFBbUI7QUFDckQsYUFBTztBQUFBLFFBQ0wsTUFBTSxJQUFJO0FBQUEsUUFDVixNQUFNLENBQUMsSUFBSTtBQUFBLE1BQ2I7QUFBQSxJQUNGLEdBQUc7QUFBQSxJQUNMLGFBQWE7QUFBQSxFQUNmO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
