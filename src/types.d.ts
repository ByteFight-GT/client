declare global {
  interface Window {
    electron: any;
    settings: {
      get: () => Promise<any[] | null>,
      set: (settings: any[] | null) => Promise<void>
    }
  }
}
