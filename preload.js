/**
 * PsyFlow Preload Script
 * Secure IPC communication bridge
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Add bridges to native OS features here if needed in the future
    // For now we keep it clean as we primarily load the Express UI
});
