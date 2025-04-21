// vite.config.ts
import { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "file:///E:/work/yika/katuantuan/AttAiToEarn/node_modules/vite/dist/node/index.js";
import react from "file:///E:/work/yika/katuantuan/AttAiToEarn/node_modules/@vitejs/plugin-react/dist/index.mjs";
import electron from "file:///E:/work/yika/katuantuan/AttAiToEarn/node_modules/vite-plugin-electron/dist/simple.mjs";

// package.json
var package_default = {
  name: "aiToEarn",
  version: "0.7.0-alpha.1",
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
import svgr from "file:///E:/work/yika/katuantuan/AttAiToEarn/node_modules/vite-plugin-svgr/dist/index.js";
import { createSvgIconsPlugin } from "file:///E:/work/yika/katuantuan/AttAiToEarn/node_modules/vite-plugin-svg-icons/dist/index.mjs";
var __vite_injected_original_dirname = "E:\\work\\yika\\katuantuan\\AttAiToEarn";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcd29ya1xcXFx5aWthXFxcXGthdHVhbnR1YW5cXFxcQXR0QWlUb0Vhcm5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXHdvcmtcXFxceWlrYVxcXFxrYXR1YW50dWFuXFxcXEF0dEFpVG9FYXJuXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi93b3JrL3lpa2Eva2F0dWFudHVhbi9BdHRBaVRvRWFybi92aXRlLmNvbmZpZy50c1wiOy8qXHJcbiAqIEBBdXRob3I6IG5ldmluXHJcbiAqIEBEYXRlOiAyMDI1LTAxLTE3IDE5OjI1OjI5XHJcbiAqIEBMYXN0RWRpdFRpbWU6IDIwMjUtMDItMjcgMTY6NDE6NDlcclxuICogQExhc3RFZGl0b3JzOiBuZXZpblxyXG4gKiBARGVzY3JpcHRpb246XHJcbiAqL1xyXG5pbXBvcnQgeyBybVN5bmMgfSBmcm9tICdub2RlOmZzJztcclxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCBlbGVjdHJvbiBmcm9tICd2aXRlLXBsdWdpbi1lbGVjdHJvbi9zaW1wbGUnO1xyXG5pbXBvcnQgcGtnIGZyb20gJy4vcGFja2FnZS5qc29uJztcclxuaW1wb3J0IHN2Z3IgZnJvbSBcInZpdGUtcGx1Z2luLXN2Z3JcIjtcclxuaW1wb3J0IHsgY3JlYXRlU3ZnSWNvbnNQbHVnaW4gfSBmcm9tIFwidml0ZS1wbHVnaW4tc3ZnLWljb25zXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCB9KSA9PiB7XHJcbiAgcm1TeW5jKCdkaXN0LWVsZWN0cm9uJywgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xyXG5cclxuICBjb25zdCBpc1NlcnZlID0gY29tbWFuZCA9PT0gJ3NlcnZlJztcclxuICBjb25zdCBpc0J1aWxkID0gY29tbWFuZCA9PT0gJ2J1aWxkJztcclxuICBjb25zdCBzb3VyY2VtYXAgPSBpc1NlcnZlIHx8ICEhcHJvY2Vzcy5lbnYuVlNDT0RFX0RFQlVHO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgICdAJzogcGF0aC5qb2luKF9fZGlybmFtZSwgJ3NyYycpLFxyXG4gICAgICAgICdAQCc6IHBhdGguam9pbihfX2Rpcm5hbWUsICdjb21tb250JyksXHJcbiAgICAgICAgYnVmZmVyOiAnYnVmZmVyJyxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBjc3M6IHtcclxuICAgICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xyXG4gICAgICAgIHNjc3M6IHtcclxuICAgICAgICAgIGFwaTogJ21vZGVybi1jb21waWxlcicsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIHJlYWN0KCksXHJcbiAgICAgIGVsZWN0cm9uKHtcclxuICAgICAgICBtYWluOiB7XHJcbiAgICAgICAgICAvLyBTaG9ydGN1dCBvZiBgYnVpbGQubGliLmVudHJ5YFxyXG4gICAgICAgICAgZW50cnk6ICdlbGVjdHJvbi9tYWluL2luZGV4LnRzJyxcclxuICAgICAgICAgIG9uc3RhcnQoYXJncykge1xyXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuVlNDT0RFX0RFQlVHKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAvKiBGb3IgYC52c2NvZGUvLmRlYnVnLnNjcmlwdC5tanNgICovICdbc3RhcnR1cF0gRWxlY3Ryb24gQXBwJyxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGFyZ3Muc3RhcnR1cCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgdml0ZToge1xyXG4gICAgICAgICAgICBidWlsZDoge1xyXG4gICAgICAgICAgICAgIHNvdXJjZW1hcCxcclxuICAgICAgICAgICAgICBtaW5pZnk6IGlzQnVpbGQsXHJcbiAgICAgICAgICAgICAgb3V0RGlyOiAnZGlzdC1lbGVjdHJvbi9tYWluJyxcclxuICAgICAgICAgICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbDogT2JqZWN0LmtleXMoXHJcbiAgICAgICAgICAgICAgICAgICdkZXBlbmRlbmNpZXMnIGluIHBrZyA/IHBrZy5kZXBlbmRlbmNpZXMgOiB7fSxcclxuICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwcmVsb2FkOiB7XHJcbiAgICAgICAgICAvLyBTaG9ydGN1dCBvZiBgYnVpbGQucm9sbHVwT3B0aW9ucy5pbnB1dGAuXHJcbiAgICAgICAgICAvLyBQcmVsb2FkIHNjcmlwdHMgbWF5IGNvbnRhaW4gV2ViIGFzc2V0cywgc28gdXNlIHRoZSBgYnVpbGQucm9sbHVwT3B0aW9ucy5pbnB1dGAgaW5zdGVhZCBgYnVpbGQubGliLmVudHJ5YC5cclxuICAgICAgICAgIGlucHV0OiAnZWxlY3Ryb24vcHJlbG9hZC9pbmRleC50cycsXHJcbiAgICAgICAgICB2aXRlOiB7XHJcbiAgICAgICAgICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgICAgICAgc291cmNlbWFwOiBzb3VyY2VtYXAgPyAnaW5saW5lJyA6IHVuZGVmaW5lZCwgLy8gIzMzMlxyXG4gICAgICAgICAgICAgIG1pbmlmeTogaXNCdWlsZCxcclxuICAgICAgICAgICAgICBvdXREaXI6ICdkaXN0LWVsZWN0cm9uL3ByZWxvYWQnLFxyXG4gICAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsOiBPYmplY3Qua2V5cyhcclxuICAgICAgICAgICAgICAgICAgJ2RlcGVuZGVuY2llcycgaW4gcGtnID8gcGtnLmRlcGVuZGVuY2llcyA6IHt9LFxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIFBsb3lmaWxsIHRoZSBFbGVjdHJvbiBhbmQgTm9kZS5qcyBBUEkgZm9yIFJlbmRlcmVyIHByb2Nlc3MuXHJcbiAgICAgICAgLy8gSWYgeW91IHdhbnQgdXNlIE5vZGUuanMgaW4gUmVuZGVyZXIgcHJvY2VzcywgdGhlIGBub2RlSW50ZWdyYXRpb25gIG5lZWRzIHRvIGJlIGVuYWJsZWQgaW4gdGhlIE1haW4gcHJvY2Vzcy5cclxuICAgICAgICAvLyBTZWUgXHVEODNEXHVEQzQ5IGh0dHBzOi8vZ2l0aHViLmNvbS9lbGVjdHJvbi12aXRlL3ZpdGUtcGx1Z2luLWVsZWN0cm9uLXJlbmRlcmVyXHJcbiAgICAgICAgcmVuZGVyZXI6IHt9LFxyXG4gICAgICB9KSxcclxuICAgICAgc3Zncih7IHN2Z3JPcHRpb25zOiB7IGljb246IHRydWUgfSB9KSxcclxuICAgICAgY3JlYXRlU3ZnSWNvbnNQbHVnaW4oe1xyXG4gICAgICAgIGljb25EaXJzOiBbcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIFwic3JjL2Fzc2V0cy9zdmdzXCIpXSxcclxuICAgICAgfSlcclxuICAgIF0sXHJcbiAgICBzZXJ2ZXI6XHJcbiAgICAgIHByb2Nlc3MuZW52LlZTQ09ERV9ERUJVRyAmJlxyXG4gICAgICAoKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocGtnLmRlYnVnLmVudi5WSVRFX0RFVl9TRVJWRVJfVVJMKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgaG9zdDogdXJsLmhvc3RuYW1lLFxyXG4gICAgICAgICAgcG9ydDogK3VybC5wb3J0LFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0pKCksXHJcbiAgICBjbGVhclNjcmVlbjogZmFsc2UsXHJcbiAgfTtcclxufSk7XHJcbiIsICJ7XHJcbiAgXCJuYW1lXCI6IFwiYWlUb0Vhcm5cIixcclxuICBcInZlcnNpb25cIjogXCIwLjcuMC1hbHBoYS4xXCIsXHJcbiAgXCJtYWluXCI6IFwiZGlzdC1lbGVjdHJvbi9tYWluL2luZGV4LmpzXCIsXHJcbiAgXCJkZXNjcmlwdGlvblwiOiBcIlx1ODI3QVx1NTQ5NiB3aW5cdTYyNTNcdTUzMDVcdTRGN0ZcdTc1MjhcdTdCQTFcdTc0MDZcdTU0NThcdTc2ODRcdTdFQzhcdTdBRUZcIixcclxuICBcImF1dGhvclwiOiBcIlx1ODI3QVx1NTQ5NlwiLFxyXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxyXG4gIFwicHJpdmF0ZVwiOiB0cnVlLFxyXG4gIFwiZW5naW5lc1wiOiB7XHJcbiAgICBcIm5vZGVcIjogXCIyMC54LnhcIlxyXG4gIH0sXHJcbiAgXCJkZWJ1Z1wiOiB7XHJcbiAgICBcImVudlwiOiB7XHJcbiAgICAgIFwiVklURV9ERVZfU0VSVkVSX1VSTFwiOiBcImh0dHA6Ly8xMjcuMC4wLjE6Nzc3Ny9cIlxyXG4gICAgfVxyXG4gIH0sXHJcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXHJcbiAgXCJzY3JpcHRzXCI6IHtcclxuICAgIFwiZGV2XCI6IFwiY2hjcCA2NTAwMSAmJiB2aXRlXCIsXHJcbiAgICBcImRldjptYWNcIjogXCJ2aXRlXCIsXHJcbiAgICBcImJ1aWxkXCI6IFwidHNjICYmIHZpdGUgYnVpbGQgJiYgZWxlY3Ryb24tYnVpbGRlclwiLFxyXG4gICAgXCJidWlsZDpub3RzY1wiOiBcInZpdGUgYnVpbGQgJiYgZWxlY3Ryb24tYnVpbGRlclwiLFxyXG4gICAgXCJwcmV2aWV3XCI6IFwidml0ZSBwcmV2aWV3XCIsXHJcbiAgICBcInByZXRlc3RcIjogXCJ2aXRlIGJ1aWxkIC0tbW9kZT10ZXN0XCIsXHJcbiAgICBcInRlc3RcIjogXCJ2aXRlc3QgcnVuXCIsXHJcbiAgICBcInJlYnVpbGRcIjogXCJlbGVjdHJvbi1yZWJ1aWxkIC1mIC13IGJldHRlci1zcWxpdGUzXCIsXHJcbiAgICBcImxpbnRcIjogXCJucG0gcnVuIGxpbnQ6ZXNsaW50ICYmIG5wbSBydW4gbGludDpwcmV0dGllciAmJiBucG0gcnVuIGxpbnQ6c3R5bGVsaW50XCIsXHJcbiAgICBcImxpbnQ6ZXNsaW50XCI6IFwiZXNsaW50IC0tY2FjaGUgLS1tYXgtd2FybmluZ3MgMCAgXFxcIntzcmMsbW9ja3MsZWxlY3Ryb259LyoqLyoue3Z1ZSx0cyx0c3h9XFxcIiAtLWZpeFwiLFxyXG4gICAgXCJsaW50OnByZXR0aWVyXCI6IFwicHJldHRpZXIgLS13cml0ZSAgXFxcIntzcmMsZWxlY3Ryb259LyoqLyoue2pzLGpzb24sdHN4LGNzcyxsZXNzLHNjc3MsdnVlLGh0bWwsbWR9XFxcIlwiLFxyXG4gICAgXCJsaW50OnN0eWxlbGludFwiOiBcInN0eWxlbGludCAtLWNhY2hlIC0tZml4IFxcXCIqKi8qLnt2dWUsbGVzcyxwb3N0Y3NzLGNzcyxzY3NzfVxcXCIgLS1jYWNoZSAtLWNhY2hlLWxvY2F0aW9uIG5vZGVfbW9kdWxlcy8uY2FjaGUvc3R5bGVsaW50L1wiXHJcbiAgfSxcclxuICBcImRlcGVuZGVuY2llc1wiOiB7XHJcbiAgICBcIkBhbnQtZGVzaWduL2NvbG9yc1wiOiBcIl43LjIuMFwiLFxyXG4gICAgXCJAYW50LWRlc2lnbi9pY29uc1wiOiBcIl41LjYuMVwiLFxyXG4gICAgXCJAZmZtcGVnLWluc3RhbGxlci9mZm1wZWdcIjogXCJeMS4xLjBcIixcclxuICAgIFwiQGZmcHJvYmUtaW5zdGFsbGVyL2ZmcHJvYmVcIjogXCJeMi4xLjJcIixcclxuICAgIFwiQHR5cGVzL2Zvcm0tZGF0YVwiOiBcIl4yLjUuMlwiLFxyXG4gICAgXCJhbnRkXCI6IFwiXjUuMjMuMVwiLFxyXG4gICAgXCJhbnRkLWltZy1jcm9wXCI6IFwiXjQuMjQuMFwiLFxyXG4gICAgXCJheGlvc1wiOiBcIl4xLjcuOVwiLFxyXG4gICAgXCJiZXR0ZXItc3FsaXRlM1wiOiBcIl4xMS44LjFcIixcclxuICAgIFwiY29vcmR0cmFuc2Zvcm1cIjogXCJeMi4xLjJcIixcclxuICAgIFwiY3JjMzJcIjogXCJeMC4yLjJcIixcclxuICAgIFwiY3JvcHBlcmpzXCI6IFwiXjEuNi4yXCIsXHJcbiAgICBcImNyeXB0b1wiOiBcIl4xLjAuMVwiLFxyXG4gICAgXCJjcnlwdG8tanNcIjogXCJeNC4yLjBcIixcclxuICAgIFwiZGF5anNcIjogXCJeMS4xMS4xM1wiLFxyXG4gICAgXCJkb3RlbnZcIjogXCJeMTYuNC43XCIsXHJcbiAgICBcImVjaGFydHNcIjogXCJeNS42LjBcIixcclxuICAgIFwiZWxlY3Ryb24tbG9nXCI6IFwiXjUuMy4wXCIsXHJcbiAgICBcImVsZWN0cm9uLXNlcnZlXCI6IFwiXjIuMS4xXCIsXHJcbiAgICBcImVsZWN0cm9uLXN0b3JlXCI6IFwiXjEwLjAuMFwiLFxyXG4gICAgXCJlbGVjdHJvbi11cGRhdGVyXCI6IFwiXjYuMy45XCIsXHJcbiAgICBcImV2ZW50c1wiOiBcIl4zLjMuMFwiLFxyXG4gICAgXCJmZnByb2JlLXN0YXRpY1wiOiBcIl4zLjEuMFwiLFxyXG4gICAgXCJmbHVlbnQtZmZtcGVnXCI6IFwiXjIuMS4zXCIsXHJcbiAgICBcImZvcm0tZGF0YVwiOiBcIl40LjAuMlwiLFxyXG4gICAgXCJmc1wiOiBcIl4wLjAuMS1zZWN1cml0eVwiLFxyXG4gICAgXCJpbWFnZS1zaXplXCI6IFwiXjEuMi4wXCIsXHJcbiAgICBcImxvZGFzaFwiOiBcIl40LjE3LjIxXCIsXHJcbiAgICBcIm1pbWUtdHlwZXNcIjogXCJeMi4xLjM1XCIsXHJcbiAgICBcIm1vbWVudFwiOiBcIl4yLjMwLjFcIixcclxuICAgIFwibm9kZS1jYWNoZVwiOiBcIl41LjEuMlwiLFxyXG4gICAgXCJub2RlLXNjaGVkdWxlXCI6IFwiXjIuMS4xXCIsXHJcbiAgICBcIm9zXCI6IFwiXjAuMS4yXCIsXHJcbiAgICBcInAtcXVldWVcIjogXCJeOC4xLjBcIixcclxuICAgIFwicGF0aFwiOiBcIl4wLjEyLjdcIixcclxuICAgIFwicXNcIjogXCJeNi4xNC4wXCIsXHJcbiAgICBcInJlYWN0LWludGVyc2VjdGlvbi1vYnNlcnZlclwiOiBcIl45LjE2LjBcIixcclxuICAgIFwicmVhY3QtbWFzb25yeS1jc3NcIjogXCJeMS4wLjE2XCIsXHJcbiAgICBcInJlYWN0LXJvdXRlci1kb21cIjogXCI2XCIsXHJcbiAgICBcInJlYWN0LXNvcnRhYmxlanNcIjogXCJeNi4xLjRcIixcclxuICAgIFwicmVmbGVjdC1tZXRhZGF0YVwiOiBcIl4wLjIuMlwiLFxyXG4gICAgXCJzaGFycFwiOiBcIl4wLjMzLjVcIixcclxuICAgIFwic29ydGFibGVqc1wiOiBcIl4xLjE1LjZcIixcclxuICAgIFwidHlwZW9ybVwiOiBcIl4wLjMuMjBcIixcclxuICAgIFwidW5pbnN0YWxsXCI6IFwiXjAuMC4wXCIsXHJcbiAgICBcInV1aWRcIjogXCJeMTEuMC41XCIsXHJcbiAgICBcInZpdGVcIjogXCJeNi4yLjNcIixcclxuICAgIFwidml0ZS1wbHVnaW4tZWxlY3Ryb24tcmVuZGVyZXJcIjogXCJeMC4xNC42XCIsXHJcbiAgICBcInZpdGUtcGx1Z2luLXN2Zy1pY29uc1wiOiBcIl4yLjAuMVwiLFxyXG4gICAgXCJ4bWwyanNcIjogXCJeMC42LjJcIixcclxuICAgIFwienVzdGFuZFwiOiBcIl41LjAuM1wiXHJcbiAgfSxcclxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XHJcbiAgICBcIkBlbGVjdHJvbi9yZWJ1aWxkXCI6IFwiXjMuNy4xXCIsXHJcbiAgICBcIkBwbGF5d3JpZ2h0L3Rlc3RcIjogXCJeMS40OC4yXCIsXHJcbiAgICBcIkB0eXBlcy9mbHVlbnQtZmZtcGVnXCI6IFwiXjIuMS4yN1wiLFxyXG4gICAgXCJAdHlwZXMvZm9ybS1kYXRhXCI6IFwiXjIuMi4xXCIsXHJcbiAgICBcIkB0eXBlcy9sb2Rhc2hcIjogXCJeNC4xNy4xNVwiLFxyXG4gICAgXCJAdHlwZXMvbWltZS10eXBlc1wiOiBcIl4yLjEuNFwiLFxyXG4gICAgXCJAdHlwZXMvbm9kZS1zY2hlZHVsZVwiOiBcIl4yLjEuN1wiLFxyXG4gICAgXCJAdHlwZXMvcXNcIjogXCJeNi45LjE4XCIsXHJcbiAgICBcIkB0eXBlcy9yZWFjdFwiOiBcIl4xOC4zLjEyXCIsXHJcbiAgICBcIkB0eXBlcy9yZWFjdC1kb21cIjogXCJeMTguMy4xXCIsXHJcbiAgICBcIkB0eXBlcy9zb3J0YWJsZWpzXCI6IFwiXjEuMTUuOFwiLFxyXG4gICAgXCJAdHlwZXMveG1sMmpzXCI6IFwiXjAuNC4xNFwiLFxyXG4gICAgXCJAdHlwZXNjcmlwdC1lc2xpbnQvZXNsaW50LXBsdWdpblwiOiBcIl44LjAuMFwiLFxyXG4gICAgXCJAdHlwZXNjcmlwdC1lc2xpbnQvcGFyc2VyXCI6IFwiXjguMC4wXCIsXHJcbiAgICBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI6IFwiXjQuMy4zXCIsXHJcbiAgICBcImF1dG9wcmVmaXhlclwiOiBcIl4xMC40LjIwXCIsXHJcbiAgICBcImVsZWN0cm9uXCI6IFwiXjMzLjIuMFwiLFxyXG4gICAgXCJlbGVjdHJvbi1idWlsZGVyXCI6IFwiXjI2LjAuMTJcIixcclxuICAgIFwiZWxlY3Ryb24tbm90YXJpemVcIjogXCJeMS4yLjJcIixcclxuICAgIFwiZXNsaW50XCI6IFwiXjguNDIuMFwiLFxyXG4gICAgXCJlc2xpbnQtY29uZmlnLXByZXR0aWVyXCI6IFwiXjkuMS4wXCIsXHJcbiAgICBcImVzbGludC1wbHVnaW4tcHJldHRpZXJcIjogXCJeNS4yLjFcIixcclxuICAgIFwiZXNsaW50LXBsdWdpbi1yZWFjdFwiOiBcIl43LjM3LjRcIixcclxuICAgIFwiZXNsaW50LXBsdWdpbi11bnVzZWQtaW1wb3J0c1wiOiBcIl40LjEuNFwiLFxyXG4gICAgXCJwb3N0Y3NzXCI6IFwiXjguNC40OVwiLFxyXG4gICAgXCJwb3N0Y3NzLWltcG9ydFwiOiBcIl4xNi4xLjBcIixcclxuICAgIFwicHJldHRpZXJcIjogXCJeMy4wLjBcIixcclxuICAgIFwicmVhY3RcIjogXCJeMTguMy4xXCIsXHJcbiAgICBcInJlYWN0LWRvbVwiOiBcIl4xOC4zLjFcIixcclxuICAgIFwic2Fzc1wiOiBcIl4xLjgzLjRcIixcclxuICAgIFwic2Fzcy1sb2FkZXJcIjogXCJeMTYuMC40XCIsXHJcbiAgICBcInRhaWx3aW5kY3NzXCI6IFwiXjMuNC4xNVwiLFxyXG4gICAgXCJ0eXBlc2NyaXB0XCI6IFwiXjUuNC4yXCIsXHJcbiAgICBcInZpdGVcIjogXCJeNS40LjExXCIsXHJcbiAgICBcInZpdGUtcGx1Z2luLWVsZWN0cm9uXCI6IFwiXjAuMjkuMFwiLFxyXG4gICAgXCJ2aXRlLXBsdWdpbi1lbGVjdHJvbi1yZW5kZXJlclwiOiBcIl4wLjE0LjZcIixcclxuICAgIFwidml0ZS1wbHVnaW4tc3ZnLWljb25zXCI6IFwiXjIuMC4xXCIsXHJcbiAgICBcInZpdGUtcGx1Z2luLXN2Z3JcIjogXCJeNC4zLjBcIixcclxuICAgIFwidml0ZXN0XCI6IFwiXjIuMS41XCJcclxuICB9XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQU9BLFNBQVMsY0FBYztBQUN2QixPQUFPLFVBQVU7QUFDakIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sY0FBYzs7O0FDWHJCO0FBQUEsRUFDRSxNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsRUFDWCxNQUFRO0FBQUEsRUFDUixhQUFlO0FBQUEsRUFDZixRQUFVO0FBQUEsRUFDVixTQUFXO0FBQUEs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
