import { ipcRenderer, contextBridge, shell } from "electron";

contextBridge.exposeInMainWorld('electron', {

    invoke: ipcRenderer.invoke,
    /*
    openExternal: (url) => shell.openExternal(url),

    //electron handlers
    storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
    storeGet: (key) => ipcRenderer.invoke('store-get', key),

    //file/metadata handlers
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

    deleteMap: (mapName) => ipcRenderer.invoke('delete-map', mapName),
    deleteMaps: () => ipcRenderer.invoke('delete-maps'),
    selectFile: () => ipcRenderer.invoke('dialog:select-file'),
    selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),

    // match handlers
    writeMatch: (num, match) => ipcRenderer.invoke('write-match', num, match),
    getMatches: () => ipcRenderer.invoke('get-matches'),
    deleteMatch: (matchName) => ipcRenderer.invoke('delete-match', matchName),
    deleteMatches: () => ipcRenderer.invoke('delete-matches'),
    readMatch: (matchJson) => ipcRenderer.invoke('read-match', matchJson),
    importMatch: (sourceFile, num) => ipcRenderer.invoke('import-match', sourceFile, num),

    // python script handlers
    runPythonScript: (args, directoryPath) => ipcRenderer.invoke('run-python-script', args, directoryPath),
    sendTCPInterrupt: () => ipcRenderer.invoke('tcp-send-interrupt'),
    disconnectTCP: () => ipcRenderer.invoke('tcp-disconnect'),

    onTcpData: (callback) => {
        const handler = (_, data) => callback(data);
        ipcRenderer.on('stream-tcp-data', handler);
        return () => ipcRenderer.removeListener('stream-tcp-data', handler);
    },

    onTcpJson: (callback) => {
        const handler = (_, data) => callback(data);
        ipcRenderer.on('stream-tcp-message', handler);
        return () => ipcRenderer.removeListener('stream-tcp-message', handler);
    },

    onTcpStatus: (callback) => {
        const handler = (_, status) => callback(status);
        ipcRenderer.on('stream-tcp-status', handler);
        return () => ipcRenderer.removeListener('stream-tcp-status', handler);
    },

    onStreamOutput: (callback) => {
        const handler = (_, chunk) => callback(chunk);
        ipcRenderer.on('stream-output', handler);
        return () => ipcRenderer.removeListener('stream-output', handler);
    },

    onStreamOutputFull: (callback) => {
        const handler = (_, fullOutput) => callback(fullOutput);
        ipcRenderer.on('stream-output-full', handler);
        return () => ipcRenderer.removeListener('stream-output-full', handler);
    },

    onStreamError: (callback) => {
        const handler = (_, chunk) => callback(chunk);
        ipcRenderer.on('stream-error', handler);
        return () => ipcRenderer.removeListener('stream-error', handler);
    },

    onStreamErrorFull: (callback) => {
        const handler = (_, fullError) => callback(fullError);
        ipcRenderer.on('stream-error-full', handler);
        return () => ipcRenderer.removeListener('stream-error-full', handler);
    },
    */
});
