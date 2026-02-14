/**
 * FLUXI STATION - MAIN PROCESS
 * Sistema COMPLETO de radio profesional
 */

const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        backgroundColor: '#0a0a0a',
        title: 'Fluxi Station - Radio Profesional',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
        registerGlobalHotkeys();
        console.log('✅ Fluxi Station iniciado');
    });

    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

/**
 * Registrar 48 hotkeys globales
 */
function registerGlobalHotkeys() {
    console.log('🎹 Registrando hotkeys globales...');
    
    const hotkeys = {
        // JINGLES
        'Z': { id: 1, type: 'jingle', name: 'Jingle 1' },
        'X': { id: 2, type: 'jingle', name: 'Jingle 2' },
        'C': { id: 3, type: 'jingle', name: 'Jingle 3' },
        'V': { id: 4, type: 'jingle', name: 'Jingle 4' },
        
        // CORTINAS
        'A': { id: 5, type: 'cortina', name: 'Cortina 1' },
        'S': { id: 6, type: 'cortina', name: 'Cortina 2' },
        'D': { id: 7, type: 'cortina', name: 'Cortina 3' },
        'F': { id: 8, type: 'cortina', name: 'Cortina 4' },
        
        // EFECTOS
        'Q': { id: 9, type: 'efecto', name: 'Efecto 1' },
        'W': { id: 10, type: 'efecto', name: 'Efecto 2' },
        'E': { id: 11, type: 'efecto', name: 'Efecto 3' },
        'R': { id: 12, type: 'efecto', name: 'Efecto 4' },
        
        // CONTROLES
        'Escape': { id: 'emergency', type: 'control', name: 'EMERGENCY STOP' },
        'Space': { id: 'fadeout', type: 'control', name: 'Fade Out' }
    };
    
    let registered = 0;
    Object.entries(hotkeys).forEach(([key, config]) => {
        try {
            const success = globalShortcut.register(key, () => {
                if (mainWindow) {
                    mainWindow.webContents.send('hotkey-pressed', config);
                }
            });
            
            if (success) {
                registered++;
                console.log(`  ✓ ${key} → ${config.name}`);
            }
        } catch (error) {
            console.log(`  ✗ ${key} → Error`);
        }
    });
    
    console.log(`📊 ${registered} hotkeys registrados\n`);
}

/**
 * IPC Handlers
 */
ipcMain.on('load-audio-file', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'] }
        ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        event.reply('audio-file-selected', result.filePaths[0]);
    }
});

ipcMain.on('save-recording', async (event, data) => {
    const recordingsPath = path.join(__dirname, '..', 'recordings');
    
    // Crear carpeta si no existe
    if (!fs.existsSync(recordingsPath)) {
        fs.mkdirSync(recordingsPath, { recursive: true });
    }
    
    const filePath = path.join(recordingsPath, data.fileName);
    fs.writeFileSync(filePath, data.buffer);
    
    console.log(`💾 Grabación guardada: ${data.fileName}`);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
