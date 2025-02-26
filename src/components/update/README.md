# electron-updater

English | [简体中文](README.zh-CN.md)

> Use `electron-updater` to realize the update detection, download and installation of the electric program.

```sh
npm i electron-updater
```

### Main logic

1. ##### Configuration of the update the service address and update information script:

   Add a `publish` field to `electron-builder.json5` for configuring the update address and which strategy to use as the update service.

   ``` json5
   {
      "publish": {
         "provider": "generic",
         "channel": "latest",
         "url": "https://foo.com/"
      }
   }
   ```

   For more information, please refer to : [electron-builder.json5...](https://github.com/electron-vite/electron-vite-react/blob/2f2880a9f19de50ff14a0785b32a4d5427477e55/electron-builder.json5#L38)

2. ##### The update logic of Electron:

   - Checking if an update is available;
   - Checking the version of the software on the server;
   - Checking if an update is available;
   - Downloading the new version of the software from the server (when an update is available);
   - Installation method;

   For more information, please refer to  : [update...](https://github.com/electron-vite/electron-vite-react/blob/main/electron/main/update.ts)

3. ##### Updating UI pages in Electron:

   The main function is to provide a UI page for users to trigger the update logic mentioned in (2.) above. Users can click on the page to trigger different update functions in Electron.
   
   For more information, please refer to : [components/update...](https://github.com/electron-vite/electron-vite-react/blob/main/src/components/update/index.tsx)

---

Here it is recommended to trigger updates through user actions (in this project, Electron update function is triggered after the user clicks on the "Check for updates" button).

For more information on using `electron-updater` for Electron updates, please refer to the documentation : [auto-update](https://www.electron.build/.html)
