/// <reference types="vite/client" />

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer & {
    setStoreValue: (key: string, value: any) => void;
    getStoreValue: (key: string) => any;
  };
}
