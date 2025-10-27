# electron-auto-update

[English](README.md) | 简体中文

使用`electron-updater`实现electron程序的更新检测、下载和安装等功能。

```sh
npm i electron-updater
```

### 主要逻辑

1. ##### 更新地址、更新信息脚本的配置

   在`electron-builder.json5`添加`publish`字段,用来配置更新地址和使用哪种策略作为更新服务

    ``` json5
    {
      "publish": {
        "provider": "generic",    // 提供者、提供商
        "channel": "latest",      // 生成yml文件的名称
        "url": "https://foo.com/" //更新地址
      }
    }
    ```

更多见 : [electron-builder.json5...](xxx)

2. ##### Electron更新逻辑

   - 检测更新是否可用；

   - 检测服务端的软件版本；

   - 检测更新是否可用；

   - 下载服务端新版软件（当更新可用）；
   - 安装方式；

  更多见 : [update...](https://github.com/electron-vite/electron-vite-react/blob/main/electron/main/update.ts)

3. ##### Electron更新UI页面

    主要功能是：用户触发上述(2.)更新逻辑的UI页面。用户可以通过点击页面触发electron更新的不同功能。
    更多见 : [components/update.ts...](https://github.com/electron-vite/electron-vite-react/tree/main/src/components/update/index.tsx)

---

这里建议更新触发以用户操作触发（本项目的以用户点击 **更新检测** 后触发electron更新功能）

关于更多使用`electron-updater`进行electron更新，见文档：[auto-update](https://www.electron.build/.html)
