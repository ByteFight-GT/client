import { app, BrowserWindow, net, protocol } from 'electron';
import ElectronUpdater from "electron-updater"
import path from 'path';
import { promises as fs } from 'fs';
import * as remoteMain from '@electron/remote/main/index.js';
remoteMain.initialize();

import { setupAllHandlers } from './setup.ts';
import { closePython, closeTCPClient } from './runner.ts';

// no __dir name in modules... sad
import { fileURLToPath, pathToFileURL } from 'url';
import { initSettings } from './settings.ts';
import { initMaps } from './maps.ts';
import { initBots } from './bots.ts';
import { initMatches } from './matches.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.whenReady().then(() => {
    ElectronUpdater.autoUpdater.checkForUpdatesAndNotify();
})

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'app',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            stream: true,
        },
    },
]);

let win;
let store;

const userDataPath = app.getPath('userData');
const matchPath = path.join(userDataPath, 'match_runs');

async function initMetadata() {

    if(!store.has('numMatches')){
        store.set("numMatches", 0)
    }
    if(!store.has('pythonpath')){
        store.set("pythonpath", '')
    }
   
    store.set("matchDir", matchPath);

    try {
        await fs.access(matchPath);
    } catch {
        await fs.mkdir(matchPath, { recursive: true });
        console.log('Directory created successfully!');

    }
}

function registerAppProtocol() {
    protocol.handle('app', (request) => {
        const url = new URL(request.url);
        let relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '');

        if (relativePath.endsWith('/')) {
            relativePath = relativePath.slice(0, -1);
        }
        if (!relativePath) {
            relativePath = 'index.html';
        }
        if (!path.extname(relativePath)) {
            relativePath += '.html';
        }

        const appPath = path.normalize(app.getAppPath());
        const resolvedPath = path.normalize(path.join(appPath, relativePath));
        if (
            resolvedPath !== appPath &&
            !resolvedPath.startsWith(appPath + path.sep)
        ) {
            return new Response('Not Found', { status: 404 });
        }

        return net.fetch(pathToFileURL(resolvedPath).toString());
    });
}

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../build/preload.js'),
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, '../public/logo.png'),
    });

    remoteMain.enable(win.webContents);

    // In your main Electron process (main.js or main.ts)
    if (!app.isPackaged) {
        win.loadURL('http://localhost:3000')  // URL served by your dev server (like React's dev server)
    } else {
        win.loadURL('app://-/');
    }

    if (!app.isPackaged) {
        win.webContents.openDevTools()
    }
}

app.on('ready', async () => {
    registerAppProtocol();

    // Initialize store
    const Store = (await import('electron-store')).default;
    store = new Store();

    // initialize stuff
    await initSettings(); // settings goes first!
    await Promise.all([
        initMaps(),
        initMatches(),
        initMetadata(),
        initBots(),
    ]);

    // Setup all IPC handlers
    setupAllHandlers(store);

    createWindow();
});

app.on('before-quit', async (event) => {

    event.preventDefault(); // otherwise writing out will never occur

    console.log("Exiting python");
    // Cleanup Python process
    closeTCPClient();
    closePython();

    app.exit(0);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});