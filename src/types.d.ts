export {};

declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      openUrl: (url: string) => void;
      openPathInExplorer: (filePath: string) => void;
      registerTcpListener: (channel: string, fn: (data: any) => void) => () => void;
    };
  }

  type ValueType<T> = T[keyof T];
}
