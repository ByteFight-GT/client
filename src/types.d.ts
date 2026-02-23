export {};

declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      openUrl: (url: string) => void;
      registerTcpListener: (channel: string, fn: (data: any) => void) => () => void;
    };
  }
}
